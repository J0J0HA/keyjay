import { NumberVal, RuntimeVal, StringVal } from "./values";
import {
  AssignmentExpr,
  MemberExpr,
  BinaryExpr,
  UnaryExpr,
  CallExpr,
  ComparisonExpr,
  Identifier,
  NumericLiteral,
  StringLiteral,
  ObjectLiteral,
  ListLiteral,
  Program,
  Stmt,
  WhileLoop,
  ForLoop,
  ReturnStmt,
  IfStmt,
  VarDeclaration,
  FuncDeclaration,
  LogicalExpr,
// @ts-ignore
} from "../frontend/ast";
// @ts-ignore
import Environment from "./environment";
// @ts-ignore
import { MK_RET } from "./values";
// @ts-ignore
import { eval_program, eval_var_declaration, eval_type_request, eval_function_declaration, eval_while_loop, eval_for_loop, eval_if } from "./eval/statements";
import {
  eval_assignment,
  eval_binary_expr,
  eval_unary_expr,
  eval_comparison_expr,
  eval_identifier,
  eval_object_expr,
  eval_list_expr,
  eval_member_expr,
  eval_call_expr,
  eval_logical_expr,
// @ts-ignore
} from "./eval/expressions";

export function evaluate(astNode: Stmt, env: Environment): RuntimeVal {
  switch (astNode.kind) {
    case "NumericLiteral":
      return {
        value: ((astNode as NumericLiteral).value),
        type: "number",
      } as NumberVal;
    case "StringLiteral":
      return {
        value: ((astNode as StringLiteral).value),
        type: "string",
      } as StringVal;
    case "Identifier":
      return eval_identifier(astNode as Identifier, env);
    case "MemberExpr":
      return eval_member_expr(astNode as MemberExpr, env);
    case "ObjectLiteral":
      return eval_object_expr(astNode as ObjectLiteral, env);
    case "ListLiteral":
      return eval_list_expr(astNode as ListLiteral, env);
    case "AssignmentExpr":
      return eval_assignment(astNode as AssignmentExpr, env);
    case "CallExpr":
      return eval_call_expr(astNode as CallExpr, env);
    case "ForLoop":
      return eval_for_loop(astNode as ForLoop, env);
    case "WhileLoop":
      return eval_while_loop(astNode as WhileLoop, env);
    case "IfStmt":
      return eval_if(astNode as IfStmt, env);
    case "BinaryExpr":
      return eval_binary_expr(astNode as BinaryExpr, env);
    case "UnaryExpr":
      return eval_unary_expr(astNode as UnaryExpr, env);
    case "ComparisonExpr":
      return eval_comparison_expr(astNode as ComparisonExpr, env);
    case "LogicalExpr":
      return eval_logical_expr(astNode as LogicalExpr, env);
    case "Program":
      return eval_program(astNode as Program, env);
    case "FuncDeclaration":
      return eval_function_declaration(astNode as FuncDeclaration, env);
    case "ReturnStmt":
      return MK_RET(evaluate((astNode as ReturnStmt).expr, env));
    case "ContinueStmt":
      throw "continue is only allowed in loop body.";
    // Handle statements
    case "VarDeclaration":
      return eval_var_declaration(astNode as VarDeclaration, env);
    // Handle unimplimented ast types as error.
    default:
      console.error("This AST Node has not yet been setup for interpretation: ", astNode);
      throw "This AST Node has not yet been setup for interpretation";
  }
}
