// https://github.com/tylerlaceby/guide-to-interpreters-series
// -----------------------------------------------------------
// ---------------          LEXER          -------------------
// ---  Responsible for producing tokens from the source   ---
// -----------------------------------------------------------

// Represents tokens that our language understands in parsing.
export enum TokenType {
  // Literal Types
  Number, // 123
  Identifier, // abc
  String, // "ab1"
  // Keywords
  Var, // var
  Const, // const
  Func, // func
  Return, // return
  For, // for
  While, // while
  Continue, // continue
  Break, // break
  If, // if
  In, // in
  Times, // in
  
  // Unary operators
  Exclamation, // !

  // Grouping * Operators
  BinaryOperator, // * / + - %
  ComparisonOperator, // == !=
  Equals, // =
  Comma, // ,
  Dot, // .
  Colon, // :
  Semicolon, // ;
  OpenParen, // (
  CloseParen, // )
  OpenBrace, // {
  CloseBrace, // }
  OpenBracket, // [
  CloseBracket, // ]
  EOF, // Signified the end of file
}

/**
 * Constant lookup for keywords and known identifiers + symbols.
 */
const KEYWORDS: Record<string, TokenType> = {
  var: TokenType.Var,
  const: TokenType.Const,
  func: TokenType.Func,
  return: TokenType.Return,
  continue: TokenType.Continue,
  break: TokenType.Break,
  if: TokenType.If,
  for: TokenType.For,
  while: TokenType.While,
  in: TokenType.In,
  times: TokenType.Times,
};

// Reoresents a single token from the source-code.
export interface Token {
  value: string; // contains the raw value as seen inside the source code.
  type: TokenType; // tagged structure.
  differ: boolean;
}

// Returns a token of a given type and value
function token(value = "", type: TokenType, differ: boolean): Token {
  return { value, type, differ };
}

/**
 * Returns whether the character passed in alphabetic -> [a-zA-Z]
 */
function isalpha(src: string) {
  return src.toUpperCase() != src.toLowerCase();
}

/**
 * Returns true if the character is whitespace like -> [\s, \t, \n]
 */
function isskippable(str: string) {
  return str == " " || str == "\n" || str == "\t" || str == "\r";
}

/**
 Return whether the character is a valid integer -> [0-9]
 */
function isint(str: string) {
  const c = str.charCodeAt(0);
  const bounds = ["0".charCodeAt(0), "9".charCodeAt(0)];
  return c >= bounds[0] && c <= bounds[1];
}

/**
 * Given a string representing source code: Produce tokens and handles
 * possible unidentified characters.
 *
 * - Returns a array of tokens.
 * - Does not modify the incoming string.
 */
export function tokenize(sourceCode: string): Token[] {
  const tokens = new Array<Token>();
  const src = sourceCode.split("");

  // produce tokens until the EOF is reached.
  var differ = false;
  var ignore = false;
  while (src.length > 0) {
    // BEGIN PARSING ONE CHARACTER TOKENS
    if (src.slice(0, 2).join("") == "<#") {
      ignore = false;
      differ = false;
      src.shift()
      src.shift()
    } else if (ignore) {
      src.shift()
      continue;
    } else if (src.slice(0, 2).join("") == "#>") {
      src.shift()
      src.shift()
      ignore = true;
    } else if (src[0] == "(") {
      tokens.push(token(src.shift(), TokenType.OpenParen, differ));
      differ = false;
    } else if (src[0] == ")") {
      tokens.push(token(src.shift(), TokenType.CloseParen, differ));
      differ = false;
    } else if (src[0] == "{") {
      tokens.push(token(src.shift(), TokenType.OpenBrace, differ));
      differ = false;
    } else if (src[0] == "}") {
      tokens.push(token(src.shift(), TokenType.CloseBrace, differ));
      differ = false;
    } else if (src[0] == "[") {
      tokens.push(token(src.shift(), TokenType.OpenBracket, differ));
      differ = false;
    } else if (src[0] == "]") {
      tokens.push(token(src.shift(), TokenType.CloseBracket, differ));
      differ = false;
    } // HANDLE UNARY OPERATORS
    else if (src[0] == "!") {
      tokens.push(token(src.shift(), TokenType.Exclamation, differ));
      differ = false;
    } // HANDLE BINARY OPERATORS
    else if (
      src[0] == "+" || src[0] == "-" || src[0] == "*" || src[0] == "/" ||
      src[0] == "%"
    ) {
      tokens.push(token(src.shift(), TokenType.BinaryOperator, differ));
      differ = false;
    } // Comparison
    else if (["==", "!=", ">=", "<="].includes(src.slice(0, 2).join(""))) {
      tokens.push(token(src.slice(0, 2).join(""), TokenType.ComparisonOperator, differ));
      differ = false;
      src.shift();
      src.shift();
    }
    else if ([">", "<"].includes(src[0])) {
      tokens.push(token(src.shift(), TokenType.ComparisonOperator, differ));
      differ = false;
    } // Handle Conditional & Assignment Tokens
      else if (src[0] == "=") {
      tokens.push(token(src.shift(), TokenType.Equals, differ));
      differ = false;
    } else if (src[0] == ";") {
      tokens.push(token(src.shift(), TokenType.Semicolon, differ));
      differ = false;
    } else if (src[0] == ":") {
      tokens.push(token(src.shift(), TokenType.Colon, differ));
      differ = false;
    } else if (src[0] == ",") {
      tokens.push(token(src.shift(), TokenType.Comma, differ));
      differ = false;
    } else if (src[0] == ".") {
      tokens.push(token(src.shift(), TokenType.Dot, differ));
      differ = false;
    } // HANDLE MULTICHARACTER KEYWORDS, TOKENS, IDENTIFIERS ETC...
    else if (src[0] == "\"") {
      var str = "";
      src.shift();
      while (src.length > 0 && src[0] != "\"") {
        str += src.shift();
      }
      if (src.length > 0) {
        src.shift();
      } else {
        throw "Reached end of file while reading String";
      }
      tokens.push(token(str, TokenType.String, differ));
      differ = false;
    } else {
      // Handle numeric literals -> Integers
      if (isint(src[0])) {
        let num = "";
        while (src.length > 0 && isint(src[0])) {
          num += src.shift();
        }

        // append new numeric token.
        tokens.push(token(num, TokenType.Number, differ));
        differ = false;
      } // Handle Identifier & Keyword Tokens.
      else if (isalpha(src[0])) {
        let ident = "";
        while (src.length > 0 && isalpha(src[0])) {
          ident += src.shift();
        }

        // CHECK FOR RESERVED KEYWORDS
        const reserved = KEYWORDS[ident];
        // If value is not undefined then the identifier is
        // reconized keyword
        if (typeof reserved == "number") {
          tokens.push(token(ident, reserved, differ));
          differ = false;
        } else {
          // Unreconized name must mean user defined symbol.
          tokens.push(token(ident, TokenType.Identifier, differ));
          differ = false;
        }
      } else if (isskippable(src[0])) {
        // Skip uneeded chars.
        src.shift();
        differ = true;
      } // Handle unreconized characters.
      // TODO: Impliment better errors and error recovery.
      else {
        console.error(
          "Unreconized character found in source: ",
          src[0].charCodeAt(0),
          src[0],
        );
        // @ts-ignore
        Deno.exit(1);
      }
    }
  }

  tokens.push({ type: TokenType.EOF, value: "EndOfFile", differ: false });
  return tokens;
}
