import * as i from "./values";
import { evaluate } from "./interpreter";

export default function gtype(name: string) {
  return types[name] || basics;
}

const basics: {[id: string]: i.NativeFunctionVal} = {
  "type": {
    type: "nativecode",
    value: function (self: i.RuntimeVal) {
      return i.MK_TYPE(self.type);
    }
  } as i.NativeFunctionVal,
  "asNum": {
    type: "nativecode",
    value: function (self: i.RuntimeVal) {
      throw `Type ${self.type} has no function provided to handle .asNum()`;
    }
  } as i.NativeFunctionVal,
  "asStr": {
    type: "nativecode",
    value: function (self: i.RuntimeVal) {
      return gtype(self.type).repr.value(self);
    }
  } as i.NativeFunctionVal,
  "asBool": {
    type: "nativecode",
    value: function (self: i.RuntimeVal) {
      throw `Type ${self.type} has no function provided to handle .asBool()`;
    }
  } as i.NativeFunctionVal,
  "repr": {
    type: "nativecode",
    value: function (self: i.RuntimeVal) {
      return i.MK_STRING(`<unknown type ${self.type}>`);
    }
  },
  "measure": {
    type: "nativecode",
    value: function (self: i.RuntimeVal) {
      throw `Type ${self.type} has no function provided to handle .measure()`;
    }
  }
};

export const types: {[id: string]: {[id: string]: i.NativeFunctionVal}} = {
    "none": {
      ...basics,
      "asStr": {
        type: "nativecode",
        value: function (self: i.RuntimeVal) {
          return i.MK_STRING("none");
        }
      } as i.NativeFunctionVal,
      "asNum": {
        type: "nativecode",
        value: function (self: i.RuntimeVal) {
          return i.MK_NUMBER(0);
        }
      } as i.NativeFunctionVal,
      "asBool": {
        type: "nativecode",
        value: function (self: i.RuntimeVal) {
          return i.MK_BOOL(false);
        }
      } as i.NativeFunctionVal,
      "repr": {
        type: "nativecode",
        value: function (self: i.RuntimeVal) {
          return i.MK_STRING(`none`);
        }
      }
    },
    "boolean": {
        ...basics,
      "asStr": {
        type: "nativecode",
        value: function (self: i.RuntimeVal) {
          return i.MK_STRING(self.value ? "true" : "false");
        }
      } as i.NativeFunctionVal,
      "asNum": {
        type: "nativecode",
        value: function (self: i.RuntimeVal) {
          return i.MK_NUMBER(self.value ? 0 : 1);
        }
      } as i.NativeFunctionVal,
      "asBool": {
        type: "nativecode",
        value: function (self: i.RuntimeVal) {
          return i.MK_BOOL(self.value);
        }
      } as i.NativeFunctionVal,
      "repr": {
        type: "nativecode",
        value: function (self: i.RuntimeVal) {
          return i.MK_STRING(`${self.value ? "true" : "false"}`);
        }
      }
    },
    "number": {
      ...basics,
      "asStr": {
        type: "nativecode",
        value: function (self: i.RuntimeVal) {
          return i.MK_STRING(self.value);
        }
      } as i.NativeFunctionVal,
      "asNum": {
        type: "nativecode",
        value: function (self: i.RuntimeVal) {
          return self;
        }
      } as i.NativeFunctionVal,
      "asBool": {
        type: "nativecode",
        value: function (self: i.RuntimeVal) {
          return i.MK_BOOL((self.value != 0) ? true : false);
        }
      } as i.NativeFunctionVal,
      "repr": {
        type: "nativecode",
        value: function (self: i.RuntimeVal) {
          return i.MK_STRING(`${self.value}`);
        }
      },
      "measure": {
        type: "nativecode",
        value: function (self: i.RuntimeVal) {
          return i.MK_NUMBER(self.value);
        }
      } as i.NativeFunctionVal,
    },
    "string": {
      ...basics,
      "asNum": {
        type: "nativecode",
        value: function (self: i.RuntimeVal) {
          return i.MK_NUMBER(parseInt(self.value));
        }
      } as i.NativeFunctionVal,
      "asStr": {
        type: "nativecode",
        value: function (self: i.RuntimeVal) {
          return self;
        }
      } as i.NativeFunctionVal,
      "asBool": {
        type: "nativecode",
        value: function (self: i.RuntimeVal) {
          return i.MK_BOOL((self.value == "") ? true : false);
        }
      } as i.NativeFunctionVal,
      "repr": {
        type: "nativecode",
        value: function (self: i.RuntimeVal) {
          return i.MK_STRING(`"${self.value}"`);
        }
      },
      "measure": {
        type: "nativecode",
        value: function (self: i.RuntimeVal) {
          return i.MK_NUMBER(self.value.length);
        }
      } as i.NativeFunctionVal,
    },
    "object": {
      ...basics,
      "asJson": {
        type: "nativecode",
        value: function (self: i.RuntimeVal) {
          var props: string[] = [];
          for (const prop of self.value) {
            const val = gtype(prop[1].type).repr.value(prop[1]).value;
            props.push("\"" + prop[0] + "\": " + (val || "null"))
          }
          return i.MK_STRING(`\{${props.join(', ')}\}`);
        }
      },
      "repr": {
        type: "nativecode",
        value: function (self: i.RuntimeVal) {
          var props: string[] = [];
          for (const prop of Array.from(self.value.entries())) {
            // @ts-ignore
            props.push(prop[0] + ": " + gtype(prop[1].type).repr.value(prop[1]).value)
          }
          return i.MK_STRING(`\{${props.join(', ')}\}`);
        }
      },
      "measure": {
        type: "nativecode",
        value: function (self: i.RuntimeVal) {
          return i.MK_NUMBER(self.value.length);
        }
      } as i.NativeFunctionVal,
    },
    "list": {
      ...basics,
      "repr": {
        type: "nativecode",
        value: function (self: i.RuntimeVal) {
          var props: string[] = [];
          for (const item of self.value) {
            props.push(gtype(item.type).repr.value(item).value)
          }
          return i.MK_STRING(`[${props.join(', ')}]`);
        }
      },
      "measure": {
        type: "nativecode",
        value: function (self: i.RuntimeVal) {
          return i.MK_NUMBER(self.value.length);
        }
      } as i.NativeFunctionVal,
    },
    "function": {
      ...basics,
      "repr": {
        type: "nativecode",
        value: function (self: i.RuntimeVal) {
          return i.MK_STRING(`<function>`);
        }
      }
    },
    "nativecode": {
      ...basics,
      "repr": {
        type: "nativecode",
        value: function (self: i.RuntimeVal) {
          return i.MK_STRING(`<native code>`);
        }
      }
    }
  }