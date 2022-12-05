// @ts-ignore
import Parser from "./frontend/parser.ts";
// @ts-ignore
import Environment, { createGlobalEnv } from "./runtime/environment.ts";
// @ts-ignore
import gtype from "./runtime/types.ts";
// @ts-ignore
import { evaluate } from "./runtime/interpreter.ts";


// Start service
// @ts-ignore
const action = Deno.args[0];
if (action == "repl") {
  repl();
} else if (action == "run") {
  // @ts-ignore
  var filename = Deno.args[1] || "./main.kj"
  if (filename == ".") {
    filename = "./main.kj";
  }
  run(filename);
} else if (action == "compile") {
  // @ts-ignore
  var filename = Deno.args[1] || "./main.kj"
  if (filename == ".") {
    filename = "./main.kj";
  }
  compile(filename);
} else if (action == "help") {
  console.log("'coati repl' - Open console")
  console.log("'coati run [PATH]' - Run 'main.kj' or PATH if supplied.")
} else if (action) {
  throw `Unknown action ${action}! Use 'coati help' to get help.`;
} else {
  throw `No action supplied. Use 'coati help' to get help.`;
}


async function compile(filename: string) {
  const parser = new Parser();

  // @ts-ignore
  const input = await Deno.readTextFile(filename);
  const program = parser.produceAST(input);
  console.log(program)
  var code = '// @ts-ignore\n';
  code += 'import{evaluate}from"./runtime/interpreter.ts";';
  code += 'import{createGlobalEnv}from"./runtime/environment.ts";';
  code += 'const program=JSON.parse(\'' + JSON.stringify(program) + '\');';
  code += 'const env=createGlobalEnv("' + filename + '");';
  code += 'evaluate(program,env);\n';
  // @ts-ignore
  await Deno.writeTextFile("./__temp_compiling_keyjay__.ts", code);
}

async function run(filename: string) {
  const parser = new Parser();
  const env = createGlobalEnv(filename);

  // @ts-ignore
  const input = await Deno.readTextFile(filename);
  const program = parser.produceAST(input);

  evaluate(program, env);
}

function repl() {
  const parser = new Parser();
  const env = createGlobalEnv("<repl>");

  // INITIALIZE REPL
  console.log("\nKeyJay TypeScript v0.1 Repl");

  // Continue Repl Until User Stops Or Types `exit`
  while (true) {
    const input = prompt(">");
    // Check for no user input or exit keyword.
    if (!input) {
      continue;
    }
    if (input.includes("exit")) {
      // @ts-ignore
      Deno.exit(1);
    }
    
    
    // Produce AST From sourc-code
    const program = parser.produceAST(input);
    
    const result = evaluate(program, env);
    console.log(gtype(result.type).repr.value(result).value);
  }
}
