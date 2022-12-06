import Parser from "./frontend/parser";
import Environment, { createGlobalEnv } from "./runtime/environment";
import gtype from "./runtime/types";
import { evaluate } from "./runtime/interpreter";
import * as fs from 'fs';
import * as os from 'os';
import * as ts from "typescript";
const unzip = require('unzipper');
const pkg = require("pkg-api");
const fetch = require("sync-fetch");
const prompt = require("readline-sync").question;
import * as path from 'path';

function tmpdir(): [string, CallableFunction] {
  const charSet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  var randomString = '';
  for (var i = 0; i < 6; i++) {
    var randomPoz = Math.floor(Math.random() * charSet.length);
    randomString += charSet.substring(randomPoz,randomPoz+1);
  }
  const dir = path.join(os.tmpdir(), "keyjay-compile_" + randomString);
  fs.mkdirSync(dir);
  return [dir, (function filenameof(name) {
    return path.join(dir, name);
  })]
}

// Start service
const action = process.argv[2];
var offset = 0;
if (action == "--trace-uncaught") {
  const action = process.argv[3];
  offset = 1;
}
if (action == "repl") {
  repl();
} else if (action == "run") {
  var filename = process.argv[3 + offset] || "./main.kj"
  if (filename == ".") {
    filename = "./main.kj";
  }
  run(filename);
} else if (action == "compile") {
  var filename = process.argv[3 + offset] || "./main.kj"
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


function compile(filename: string) {
  const parser = new Parser();

  const input = fs.readFileSync(filename, "utf-8").toString();
  const prog = parser.produceAST(input);
  var code = '/*' + filename + '*/';
  code += 'import{evaluate}from"./runtime/interpreter";';
  code += 'import{createGlobalEnv}from"./runtime/environment";';
  code += 'var a=JSON.parse(\'' + JSON.stringify(prog) + '\');';
  code += 'var b=createGlobalEnv("' + filename + '");';
  code += 'evaluate(a,b);\n';
  const fn = tmpdir()[1];
  fs.writeFileSync(fn("main.ts"), code);
  fs.writeFileSync(fn("environment.zip"), fetch("https://github.com/J0J0HA/keyjay/raw/master/keyjaycode.zip").buffer());
  fs.createReadStream(fn("environment.zip")).pipe(unzip.Extract({ path: fn(".")}));
  const result = ts.transpileModule(code, {});
  fs.writeFileSync(fn("package.json"), '{"main": "' + prompt("ID: ") + '"}');
  fs.writeFileSync(fn("main.js"), result.outputText);
  pkg(fn("main.js"), { targets: "node18-win-x64,node18-macos-x64,node18-linux-x64", output: filename.replace(/\.[^/.]+$/, "")}).then(() => console.log("Finished compiling"));
}

async function run(filename: string) {
  const parser = new Parser();
  const env = createGlobalEnv(filename);

  const input = fs.readFileSync(filename, "utf-8").toString();
  const program = parser.produceAST(input);

  evaluate(program, env);
}

async function repl() {
  const parser = new Parser();
  const env = createGlobalEnv("<repl>");

  // INITIALIZE REPL
  console.log("\nKeyJay TypeScript 0.0.2 Repl");

  // Continue Repl Until User Stops Or Types `exit`
  while (true) {
    const input = prompt("> ", (answ: any) => { console.log("!", answ) });

    // Check for exit keyword.
    if (!input) {
      continue;
    }
    if (input.includes("exit")) {
      process.exit(1);
    }


    // Produce AST From sourc-code
    const program = parser.produceAST(input);

    const result = evaluate(program, env);
    console.log(gtype(result.type).repr.value(result).value);
  }
}
