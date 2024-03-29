

# Not discontinued!
**This project is neither finished nor discontinued!**  
It may seems so, since the last commit is very long ago, but this or a new version of it is still in development.  
If you want a feature to be added or have any errors, feel free to create an issue, I will look into it.  
Please note that not all errors will be fixed, because this repository is not matching with the current state of development.


# KJ / KeyJay
Programming language interpreted via TypeScript, other implementations planned.  
## Platforms
| Name | Executable |
|-|-|
| Windows | `keyjay.exe` |
| Linux | `keyjay` |
| MacOS | `keyjay-mac` |
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

/!\ Compiling does not support imports yet!

## Change Log
### 1.1.3
* Fixed Compiling issues
* Now supports and `&`, or `|` and xor `!|`
* Now can import global packages with import
* Changed name for local imports to importf
* Fixed true/false switch
* Added `.measure()` to types to support `<`, `>`, `<=`, `>=` for non-numbers
* Started fixing error msgs
* Various fixes
* Now allowing _ in vernames
### 0.0.2
* Changed from deno to typical TypeScript
* Rewrote Compiling (Now equal to `tsc main.ts && pkg main.js`)
### 0.0.1
* Initial Release
* Support Lexing, Paring and Interpreting
* Support Compiling
