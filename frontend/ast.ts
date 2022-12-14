// deno-lint-ignore-file no-empty-interface
// https://github.com/tylerlaceby/guide-to-interpreters-series
// -----------------------------------------------------------
// --------------          AST TYPES        ------------------
// ---     Defines the structure of our languages AST      ---
// -----------------------------------------------------------

// @ts-ignore
import { Token } from "./lexer";

export type NodeType =
  // STATEMENTS
  | "Program"
  | "VarDeclaration"
  | "FuncDeclaration"
  | "ReturnStmt"
  | "ForLoop"
  | "WhileLoop"
  | "ContinueStmt"
  | "BreakStmt"
  | "IfStmt"
  // ARGS (Where to put?)
  | "FuncDeclarationArgument"
  // EXPRESSIONS
  | "AssignmentExpr"
  | "MemberExpr"
  | "CallExpr"
  // Literals
  | "Property"
  | "KJElement"
  | "ObjectLiteral"
  | "ListLiteral"
  | "NumericLiteral"
  | "StringLiteral"
  | "Identifier"
  | "BinaryExpr"
  | "ComparisonExpr"
  | "LogicalExpr"
  | "UnaryExpr";

/**
 * Statements do not result in a value at runtime.
 They contain one or more expressions internally */
export interface Stmt {
  kind: NodeType;
}

/**
 * Defines a block which contains many statements.
 * -  Only one program will be contained in a file.
 */
 export interface Program extends Stmt {
  kind: "Program";
  body: Stmt[];
}

export interface VarDeclaration extends Stmt {
  kind: "VarDeclaration";
  constant: boolean;
  identifier: string;
  value?: Expr;
}

export interface FuncDeclaration extends Stmt {
  kind: "FuncDeclaration";
  args: FuncDeclarationArgument[];
  code: Stmt[];
  identifier: string;
}

export interface FuncDeclarationArgument extends Stmt {
  kind: "FuncDeclarationArgument";
  identifier: string;
  value?: Expr;
}

/**  Expressions will result in a value at runtime unlike Statements */
export interface Expr extends Stmt {}

export interface AssignmentExpr extends Expr {
  kind: "AssignmentExpr";
  assigne: Expr;
  value: Expr;
}

/**
 * A operation with two sides seperated by a operator.
 * Both sides can be ANY Complex Expression.
 * - Supported Operators -> + | - | / | * | %
 */
 export interface BinaryExpr extends Expr {
  kind: "BinaryExpr";
  left: Expr;
  right: Expr;
  operator: string; // needs to be of type BinaryOperator
}

export interface UnaryExpr extends Expr {
  kind: "UnaryExpr";
  expr: Expr;
  operator: string; // needs to be of type BinaryOperator
}

export interface CallExpr extends Expr {
  kind: "CallExpr";
  args: Expr[];
  kwargs: {[id: string]: Expr};
  caller: Expr;
}

export interface ComparisonExpr extends Expr {
  kind: "ComparisonExpr";
  left: Expr;
  right: Expr;
  operator: string;
}

export interface LogicalExpr extends Expr {
  kind: "LogicalExpr";
  left: Expr;
  right: Expr;
  operator: string;
}

export interface MemberExpr extends Expr {
  kind: "MemberExpr";
  object: Expr;
  property: Expr;
  computed: boolean;
}

// LITERAL / PRIMARY EXPRESSION TYPES
/**
 * Represents a user-defined variable or symbol in source.
 */
export interface Identifier extends Expr {
  kind: "Identifier";
  symbol: string;
}

/**
 * Represents a numeric constant inside the soure code.
 */
 export interface NumericLiteral extends Expr {
  kind: "NumericLiteral";
  value: number;
}

export interface StringLiteral extends Expr {
  kind: "StringLiteral";
  value: string;
}

export interface Property extends Expr {
  kind: "Property";
  key: string;
  value?: Expr;
}

export interface KJElement extends Expr {
  kind: "KJElement";
  value: Expr;
}

export interface ObjectLiteral extends Expr {
  kind: "ObjectLiteral";
  value: Property[];
}

export interface ListLiteral extends Expr {
  kind: "ListLiteral";
  value: Expr[];
}


export interface ReturnStmt extends Stmt {
  kind: "ReturnStmt";
  expr: Expr;
}

export interface ContinueStmt extends Stmt {
  kind: "ContinueStmt";
}

export interface BreakStmt extends Stmt {
  kind: "BreakStmt";
}

export interface IfStmt extends Stmt {
  kind: "IfStmt";
  expr: Expr;
  body: Stmt[];
}

interface Loop extends Stmt {
  kind: "ForLoop" | "WhileLoop";
}

export interface WhileLoop extends Loop {
  kind: "WhileLoop";
  expr: Expr;
  body: Stmt[];
}


export interface ForLoop extends Loop {
  kind: "ForLoop";
  identifier: Token;
  expr?: Expr;
  operator: Token;
  body: Stmt[];
}