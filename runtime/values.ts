// @ts-ignore
import { Stmt, Expr, FuncDeclarationArgument } from "../frontend/ast.ts";

export type ValueType = 
      "none"
    | "number"
    | "boolean"
    | "object"
    | "list"
    | "string"
    | "type"
    | "function"
    | "nativecode"
    | "@internal:return";

export interface RuntimeVal {
  type: ValueType;
  value: any;
}

/**
 * Defines a value of undefined meaning
 */
export interface NoneVal extends RuntimeVal {
  type: "none";
  value: null;
}

export function MK_NONE() {
  return { type: "none", value: null } as NoneVal;
}

export interface BooleanVal extends RuntimeVal {
  type: "boolean";
  value: boolean;
}

export function MK_BOOL(b = true) {
  return { type: "boolean", value: b } as BooleanVal;
}

export interface FunctionVal extends RuntimeVal {
  type: "function";
  body: Stmt[];
  args: FuncDeclarationArgument[];
}

export interface NativeFunctionVal extends RuntimeVal {
  type: "nativecode";
  value: any;
  env?: boolean;
}

/**
 * Runtime value that has access to the raw native javascript number.
 */
 export interface NumberVal extends RuntimeVal {
  type: "number";
  value: number;
}

export function MK_NUMBER(n: number = 0) {
  return { type: "number", value: n } as NumberVal;
}

export interface StringVal extends RuntimeVal {
  type: "string";
  value: string;
}

export function MK_STRING(s: string = "") {
  return { type: "string", value: s } as StringVal;
}


export interface TypeVal extends RuntimeVal {
  type: "type";
  value: string;
}

export function MK_TYPE(t: string = "null") {
  return { type: "type", value: t } as TypeVal;
}

/**
 * Runtime value that has access to the raw native javascript number.
 */
export interface ObjectVal extends RuntimeVal {
  type: "object";
  value: Map<string, RuntimeVal>;
}

export function MK_OBJ(o: {[id: string]: RuntimeVal} = {}) {
  var value = new Map();
  for (const key in o) {
    value.set(key, o[key] )
  }
  return { type: "object", value } as ObjectVal;
}

export interface ListVal extends RuntimeVal {
  type: "list";
  value: RuntimeVal[];
}

export function MK_LIST(l: RuntimeVal[] = []) {
  return { type: "list", value: l } as ListVal;
}

export interface ReturnVal extends RuntimeVal {
  type: "@internal:return";
  value: RuntimeVal;
}

export function MK_RET(v: RuntimeVal = MK_NONE()) {
  return { type: "@internal:return", value: v } as ReturnVal;
}
