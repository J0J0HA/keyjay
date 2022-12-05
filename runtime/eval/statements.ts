// @ts-ignore
import { Program, VarDeclaration, TypeRequest, FuncDeclaration, WhileLoop, ForLoop, IfStmt, ReturnStmt } from "../../frontend/ast.ts";
// @ts-ignore
import Environment from "../environment.ts";
// @ts-ignore
import { evaluate } from "../interpreter.ts";
// @ts-ignore
import { MK_NONE, MK_RET, RuntimeVal, MK_NUMBER, FunctionVal } from "../values.ts";
// @ts-ignore
import { run_func } from "./expressions.ts";
// @ts-ignore
import gtype from "../types.ts";

export function eval_program(program: Program, env: Environment): RuntimeVal {
  let lastEvaluated: RuntimeVal = MK_NONE();
  for (const statement of program.body) {
    lastEvaluated = evaluate(statement, env);
    if (lastEvaluated.type == "@internal:return") {
      console.log("\nProcess ended with:", lastEvaluated.value.value || 0)
      // @ts-ignore
      Deno.exit(lastEvaluated.value.value);
    }
  }
  return lastEvaluated;
}

export function eval_var_declaration(
  declaration: VarDeclaration,
  env: Environment,
): RuntimeVal {

  const value = declaration.value
    ? evaluate(declaration.value, env)
    : MK_NONE();

  return env.declareVar(declaration.identifier, value, declaration.constant);
}

export function eval_type_request(
  request: TypeRequest,
  env: Environment,
): RuntimeVal {
  return { type: "type", value: evaluate(request.expr, env).type };
}

export function eval_function_declaration(
  funcdecl: FuncDeclaration,
  env: Environment,
): RuntimeVal {
  env.declareVar(funcdecl.identifier, { type: "function", args: funcdecl.args, body: funcdecl.code } as FunctionVal, false)
  return env.lookupVar(funcdecl.identifier);
}

export function eval_if(
  ifstmt: IfStmt,
  env: Environment,
): RuntimeVal {
  const ifstmtenv = new Environment(env);
  const selfif = evaluate(ifstmt.expr, env);
  if (run_func(gtype(selfif.type).toBoolean, [], {}, env, selfif.value)) {
    for (const stmt of ifstmt.body) {
      if (stmt.kind == "ContinueStmt") {
        return MK_NONE();
      }
      if (stmt.kind == "BreakStmt") {
        return MK_NONE();
      }
      if (stmt.kind == "ReturnStmt") {
        return MK_RET(evaluate((stmt as ReturnStmt).expr, ifstmtenv));
      }
      evaluate(stmt, ifstmtenv);
    }
  }
  return MK_NONE()
}

export function eval_while_loop(
  loop: WhileLoop,
  env: Environment,
): RuntimeVal {
  const loopenv = new Environment(env);
  outer: while (run_func(gtype(evaluate(loop.expr, env).type).toBoolean, [], {}, env, evaluate(loop.expr, env)).value) {
    for (const stmt of loop.body) {
      if (stmt.kind == "ContinueStmt") {
        continue outer;
      }
      if (stmt.kind == "BreakStmt") {
        return MK_NONE();
      }
      if (stmt.kind == "ReturnStmt") {
        return MK_RET(evaluate((stmt as ReturnStmt).expr, loopenv));
      }
      evaluate(stmt, loopenv);
    }
  }
  return MK_NONE()
}

export function eval_for_loop(
  loop: ForLoop,
  env: Environment,
): RuntimeVal {
  const loopenv = new Environment(env);
  if (loop.operator.value == "in" && loop.expr) { // last only for making it compile
    loopenv.declareVar(loop.identifier.value, MK_NONE(), false)
    outer: for (const x in evaluate(loop.expr, env).value) {
      loopenv.assignVar(loop.identifier.value, MK_NUMBER(parseInt(x)), true)
      for (const stmt of loop.body) {
        if (stmt.kind == "ContinueStmt") {
          continue outer;
        }
        if (stmt.kind == "BreakStmt") {
          return MK_NONE();
        }
        if (stmt.kind == "ReturnStmt") {
          return MK_RET(evaluate((stmt as ReturnStmt).expr, loopenv));
        }
        evaluate(stmt, loopenv);
      }
    }
  } else if (loop.operator.value == "times") {
    outer: for (var x = 0; x < parseInt(loop.identifier.value); x +=1) {
      for (const stmt of loop.body) {
        if (stmt.kind == "ContinueStmt") {
          continue outer;
        }
        if (stmt.kind == "BreakStmt") {
          return MK_NONE();
        }
        if (stmt.kind == "ReturnStmt") {
          return MK_RET(evaluate((stmt as ReturnStmt).expr, loopenv));
        }
        evaluate(stmt, loopenv);
      }
    }
  } else {
    throw "Unknown for-Loop operator for interpreter";
  }
  return MK_NONE()
}