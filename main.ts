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
  console.log("'keyjay repl' - Open console")
  console.log("'keyjay run [PATH]' - Run 'main.kj' or file at PATH if supplied.")
  console.log("'keyjay compile [PATH]' - Compile 'main.kj' or file at PATH if supplied.")
} else if (action) {
  throw `Unknown action ${action}! Use 'keyjay help' to get help.`;
} else {
  throw `No action supplied. Use 'keyjay help' to get help.`;
}


async function compile(filename: string) {
  const parser = new Parser();

  // @ts-ignore
  const input = await Deno.readTextFile(filename);
  const program = parser.produceAST(input);
  var code = '/*' + filename + '*/';
  code += 'import{evaluate}from"https://raw.githubusercontent.com/J0J0HA/keyjay/master/runtime/interpreter.ts";';
  code += 'import{createGlobalEnv}from"https://raw.githubusercontent.com/J0J0HA/keyjay/master/runtime/environment.ts";';
  code += 'var a=JSON.parse(\'' + JSON.stringify(program) + '\');';
  code += 'var b=createGlobalEnv("' + filename + '");';
  code += 'evaluate(a,b);\n';
  // @ts-ignore
  const tempFilePath = await Deno.makeTempFile({
    prefix: "kjcompile_",
    suffix: ".ts",
  });
  // @ts-ignore
  await Deno.writeTextFile(tempFilePath, code);
  const cmd = ["deno", "compile", "-A", "--no-check", "--output", filename + ".exe", tempFilePath];
  // @ts-ignore
  const p = await Deno.run({ cmd });
  await p.status();
  console.log("Finished compiling");
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
