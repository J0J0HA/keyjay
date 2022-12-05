# KJ / KeyJay
Programming language interpreted via TypeScript, other implementations planned.  
## Commands
* `keyjay help` - View help
* `keyjay repl` - Start Repl
* `keyjay run` - Run `./main.kj`
* `keyjay run PATH` - Run File located at `PATH`
* `keyjay compile` - Compile `./main.kj`
* `keyjay compile PATH` - Compile File located at PATH
## Compiling
The compiling is no traditional compiling. Even if compiled, the code is still being interpreted.  
If you compile your code, it gets tokenized and parsed. The AST Nodes given by the parser are stored in a temporary TypeScript file with a little script to start the execution.  
Then this TypeScript file is being compiled and the result is stored in a `.exe`.  
Though, you just get a compiled interpreter with pre-parsed code.
