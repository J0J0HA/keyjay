// @ts-ignore
import gtype from "./types.ts";
// @ts-ignore
import { MK_BOOL, MK_TYPE, MK_OBJ, MK_STRING, MK_NUMBER, MK_NONE, MK_LIST, RuntimeVal, NativeFunctionVal } from "./values.ts";

export function createGlobalEnv(path: string) {
  const env = new Environment();
  // Create Default Global Enviornment
  env.declareVar("system", MK_OBJ({
    impl: MK_STRING("TypeScript"),
    name: MK_STRING("KeyJay"),
    version: MK_STRING("v0.1"),
    path: MK_STRING(path)
  }), true);
  env.declareVar("print", {
    type: "nativecode",
    value: function (arg: RuntimeVal): RuntimeVal {
      console.log(gtype(arg.type)?.asStr?.value?.(arg)?.value || gtype(arg.type)?.repr?.value?.(arg)?.value || `<unknown type ${arg.type}>`)
      return MK_NONE();
    }
  } as NativeFunctionVal, true)
  env.declareVar("range", { 
    type: "nativecode",
    value: function (kjmin: RuntimeVal, kjmax: RuntimeVal) {
      var kjlist: RuntimeVal[] = [];
      if (!kjmax) {
        kjmax = kjmin.value;
        kjmin = MK_NUMBER(0);
      }
      if (!(kjmin?.type == "number" && kjmax?.type == "number")) {
        throw `Invalid types ${kjmin.type} and ${kjmax.type} to get range. both must be number.`;
      }
      const nmin = kjmin.value;
      const nmax = kjmax.value;
      for (var x = nmin; x < nmin + nmax; x +=1) {
        kjlist.push(MK_NUMBER(x))
      }
      return MK_LIST(kjlist);
    }
  } as NativeFunctionVal, true)
  env.declareVar("input", {
    type: "nativecode",
    value: function (arg: RuntimeVal) {
      const ret = prompt(gtype(arg.type || "none").asStr.value(arg).value);
      if (!ret) {
        return MK_NONE();
      } else {
        return MK_STRING(ret);
      }
    }
  } as NativeFunctionVal, true)
  env.declareVar("type", MK_OBJ({
    function: MK_TYPE("function"),
    nativecode: MK_TYPE("nativecode"),
    boolean: MK_TYPE("boolean"),
    number: MK_TYPE("number"),
    string: MK_TYPE("string"),
    object: MK_TYPE("object"),
    type: MK_TYPE("type"),
    none: MK_TYPE("none")
  }), true);
  env.declareVar("true", MK_BOOL(true), true);
  env.declareVar("false", MK_BOOL(false), true);
  env.declareVar("none", MK_NONE(), true);

  return env;
}

export default class Environment {
  private parent?: Environment;
  private variables: Map<string, RuntimeVal>;
  private constants: Set<string>;

  constructor(parentENV?: Environment) {
    const global = parentENV ? true : false;
    this.parent = parentENV;
    this.variables = new Map();
    this.constants = new Set();
  }

  public declareVar(
    varname: string,
    value: RuntimeVal,
    constant: boolean,
  ): RuntimeVal {
    if (this.variables.has(varname)) {
      throw `Cannot declare variable ${varname}. As it already is defined.`;
    }

    this.variables.set(varname, value);
    if (constant) {
      this.constants.add(varname);
    }
    return value;
  }

  public assignVar(varname: string, value: RuntimeVal, ignoreconst: boolean = false): RuntimeVal {
    const env = this.resolve(varname);

    // Cannot assign to constant
    if (env.constants.has(varname) && !ignoreconst) {
      throw `Cannot reasign to variable ${varname} as it was declared constant.`;
    }

    env.variables.set(varname, value);
    return value;
  }

  public lookupVar(varname: string): RuntimeVal {
    const env = this.resolve(varname);
    return env.variables.get(varname) as RuntimeVal;
  }

  public resolve(varname: string): Environment {
    if (this.variables.has(varname)) {
      return this;
    }

    if (this.parent == undefined) {
      throw `Cannot resolve '${varname}' as it does not exist.`;
    }

    return this.parent.resolve(varname);
  }
}
