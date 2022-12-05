import {
  AssignmentExpr,
  MemberExpr,
  BinaryExpr,
  UnaryExpr,
  CallExpr,
  Expr,
  ReturnStmt,
  ComparisonExpr,
  Identifier,
  ObjectLiteral,
  ListLiteral,
// @ts-ignore
} from "../../frontend/ast.ts";
// @ts-ignore
import Environment from "../environment.ts";
// @ts-ignore
import { evaluate } from "../interpreter.ts";
// @ts-ignore
import { NumberVal, StringVal, ObjectVal, BooleanVal, RuntimeVal, MK_BOOL, MK_NONE, MK_LIST, NativeFunctionVal, FunctionVal, ListVal } from "../values.ts";
// @ts-ignore
import gtype from "../types.ts";

function eval_numnum_binary_expr(
  lhs: NumberVal,
  rhs: NumberVal,
  operator: string,
): NumberVal {
  let result: number;
  if (operator == "+") {
    result = lhs.value + rhs.value;
  } else if (operator == "-") {
    result = lhs.value - rhs.value;
  } else if (operator == "*") {
    result = lhs.value * rhs.value;
  } else if (operator == "/") {
    // TODO: Division by zero checks
    result = lhs.value / rhs.value;
  } else if (operator == "/") {
    result = lhs.value % rhs.value;
  } else {
    throw `type number does not support operator ${operator} with type number`;
  }

  return { value: result, type: "number" } as NumberVal;
}

function eval_strstr_binary_expr(
  lhs: StringVal,
  rhs: StringVal,
  operator: string,
): StringVal {
  let result: string;
  if (operator == "+") {
    result = lhs.value + rhs.value;
  } else {
    throw `type string does not support operator ${operator} with type string`;
  }

  return { value: result, type: "string" } as StringVal;
}

function eval_strnum_binary_expr(
  lhs: StringVal,
  rhs: NumberVal,
  operator: string,
): StringVal {
  let result: string;
  if (operator == "+") {
    result = lhs.value + rhs.value;
  } else if (operator == "*") {
    result = lhs.value.repeat(rhs.value);
  } else {
    throw `type string does not support operator ${operator} with type number`;
  }

  return { value: result, type: "string" } as StringVal;
}

/**
 * Evaulates expressions following the binary operation type.
 */
 export function eval_binary_expr(
  binop: BinaryExpr,
  env: Environment,
): RuntimeVal {
  const lhs = evaluate(binop.left, env);
  const rhs = evaluate(binop.right, env);

  // Only currently support numeric operations
  if (lhs.type == "number" && rhs.type == "number") {
    return eval_numnum_binary_expr(
      lhs as NumberVal,
      rhs as NumberVal,
      binop.operator,
    );
  } else if (lhs.type == "string" && rhs.type == "string") {
    return eval_strstr_binary_expr(
      lhs as StringVal,
      rhs as StringVal,
      binop.operator,
    );
  } else if (lhs.type == "string" && rhs.type == "number") {
    return eval_strnum_binary_expr(
      lhs as StringVal,
      rhs as NumberVal,
      binop.operator,
    );
  } else {
    throw `type ${lhs.type} does not support binary operators with type ${rhs.type}`;
  }
}

export function eval_unary_expr(
  unop: UnaryExpr,
  env: Environment,
): RuntimeVal {
  const expr = evaluate(unop.expr, env);

  if (unop.operator == "!") {
    const type = gtype(expr.type);
    return MK_BOOL(!type.asBool.value(self).value);
  } else {
    throw `type ${expr.type} could not handle unary operator ${unop.operator}`;
  }
}


export function eval_comparison_expr(
  comparison: ComparisonExpr,
  env: Environment,
): BooleanVal {
  let result: boolean;
  const lhs = evaluate(comparison.left, env);
  const rhs = evaluate(comparison.right, env);
  if (comparison.operator == "==") {
    result = (lhs.value === rhs.value);
  } else if (comparison.operator == "!=") {
    result = (lhs.value !== rhs.value);
  } else if (comparison.operator == ">=") {
    result = (lhs.value >= rhs.value); // only nums later !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
  } else if (comparison.operator == "<=") {
    result = (lhs.value <= rhs.value);
  }  else if (comparison.operator == ">") {
    result = (lhs.value > rhs.value); // only nums later !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
  } else if (comparison.operator == "<") {
    result = (lhs.value < rhs.value);
  } else {
    throw `comparison operator ${comparison.operator} is not allowed.`;
  }

  return { value: result, type: "boolean" } as BooleanVal;
}


export function eval_identifier(
  ident: Identifier,
  env: Environment,
): RuntimeVal {
  const val = env.lookupVar(ident.symbol);
  return val;
}

export function run_func(func: NativeFunctionVal | FunctionVal, args: Expr[], kwargs: {[id: string]: Expr}, env: Environment, self: RuntimeVal | undefined) {
  if (func.type == "function") {
    const funcenv = new Environment(env);
    if (self) {
      funcenv.declareVar("self", self, false);
    }
    for (const arg in func.args) {
      funcenv.declareVar(func.args[arg].identifier, evaluate(kwargs[func.args[arg].identifier] || args[arg] || func.args[arg].value || "none", env), false)
    }
    for (const stmt of func.body) {
      if (stmt.kind == "ReturnStmt") {
        return evaluate((stmt as ReturnStmt).expr, funcenv);
      }
      evaluate(stmt, funcenv);
    }
    return MK_NONE();
  }
  
  if (func.type == "nativecode") {
    var newargs: RuntimeVal[] = [];
    var newkwargs: {[id: string]: RuntimeVal} = {};
    for (const arg in args) {
      newargs.push(evaluate(args[arg] || "none", env))
    }
    for (const arg in kwargs) {
      newkwargs[arg] = evaluate(kwargs[arg] || "none", env)
    }
    if (self) {
      return func.value(self, ...newargs, newkwargs);
    } else {
      return func.value(...newargs, newkwargs);
    }
  }
  // @ts-ignore
  throw `Type ${func?.type || "<unknown>"} does not support function calls.`;
}

export function eval_call_expr(
  call: CallExpr,
  env: Environment,
): RuntimeVal {
  const func = evaluate(call.caller, env) as NativeFunctionVal | FunctionVal;
  // @ts-ignore
  return run_func(func, call.args, call.kwargs, env, call.caller.object ? evaluate(call.caller?.object, env) : null);
}

export function eval_assignment(
  node: AssignmentExpr,
  env: Environment,
): RuntimeVal {
  if (node.assigne.kind !== "Identifier") {
    throw `Invalid LHS inaide assignment expr ${JSON.stringify(node.assigne)}`;
  }

  const varname = (node.assigne as Identifier).symbol;
  return env.assignVar(varname, evaluate(node.value, env));
}

export function eval_object_expr(
  obj: ObjectLiteral,
  env: Environment,
): RuntimeVal {
  const object = { type: "object", value: new Map() } as ObjectVal;
  for (const { key, value } of obj.value) {
    const runtimeVal = (value == undefined)
    ? env.lookupVar(key)
    : evaluate(value, env);
    object.value.set(key, runtimeVal);
  }

  return object;
}


export function eval_list_expr(
  list: ListLiteral,
  env: Environment,
): RuntimeVal {
  const kjlist = { type: "list", value: [] } as ListVal;
  for (const value of list.value) {
    kjlist.value.push(evaluate(value, env));
  }

  return kjlist;
}


export function eval_member_expr (
  expr: MemberExpr,
  env: Environment,
): RuntimeVal {
  const org = evaluate(expr.object, env);
  const prop = expr.computed ? evaluate(expr.property, env).value : (expr.property as Identifier).symbol;

  if ((!expr.computed) && gtype(org.type)?.[prop]) {
    return gtype(org.type)[prop] as RuntimeVal;
  } else if (org.value?.has(prop)) {
    return org.value.get(prop) as RuntimeVal;
  } else if (expr.computed && org.value?.[prop]) {
    return org.value?.[prop] as RuntimeVal;
  } else {
    throw `No such property '${prop}'`;
  }
}