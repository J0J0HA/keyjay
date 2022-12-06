// deno-lint-ignore-file no-explicit-any
import { MK_BOOL } from "../runtime/values";
import {
  AssignmentExpr,
  BinaryExpr,
  ComparisonExpr,
  CallExpr,
  Expr,
  Identifier,
  MemberExpr,
  NumericLiteral,
  StringLiteral,
  ObjectLiteral,
  ListLiteral,
  Program,
  Property,
  KJElement,
  Stmt,
  WhileLoop,
  ForLoop,
  ContinueStmt,
  BreakStmt,
  IfStmt,
  VarDeclaration,
  FuncDeclaration,
  FuncDeclarationArgument,
  UnaryExpr,
  ReturnStmt,
} from "./ast";
import { Token, tokenize, TokenType } from "./lexer";

/**
 * Frontend for producing a valid AST from sourcode
 */
export default class Parser {
  private tokens: Token[] = [];

  /*
   * Determines if the parsing is complete and the END OF FILE Is reached.
   */
  private not_eof(): boolean {
    return this.tokens[0].type != TokenType.EOF;
  }

  /**
   * Returns the currently available token
   */
  private at() {
    return this.tokens[0] as Token;
  }

  /**
   * Returns the previous token and then advances the tokens array to the next value.
   */
  private eat() {
    const prev = this.tokens.shift() as Token;
    return prev;
  }

  /**
   * Returns the previous token and then advances the tokens array to the next value.
   *  Also checks the type of expected token and throws if the values dnot match.
   */
  private expect(type: TokenType, want: string, err?: string) {
    const prev = this.tokens.shift() as Token;
    if (!prev || prev.type != type) {
      // @ts-ignore
      throw `Parser Error: Got ${prev.value} (${prev.type}), expected ${want} (${type}) ${err || ""}`
    }

    return prev;
  }

  public produceAST(sourceCode: string): Program {
    this.tokens = tokenize(sourceCode);
    const program: Program = {
      kind: "Program",
      body: [],
    };

    // Parse until end of file
    while (this.not_eof()) {
      program.body.push(this.parse_stmt());
    }

    return program;
  }

  // Handle complex statement types
  private parse_stmt(): Stmt {
    // skip to parse_expr
    switch (this.at().type) {
      case TokenType.Var:
      case TokenType.Const:
        return this.parse_var_declaration();
      case TokenType.Func:
        return this.parse_func_declaration();
      case TokenType.While:
        return this.parse_while_loop();
      case TokenType.For:
        return this.parse_for_loop();
      case TokenType.If:
        return this.parse_if();
      case TokenType.Return:
        return this.parse_return();
      case TokenType.Continue:
        return this.parse_continue();
      case TokenType.Break:
        return this.parse_break();
      default:
        return this.parse_expr();
    }
  }

  private parse_for_loop(): Stmt {
    this.eat();
    const identifier = this.eat();
    const operator = this.eat();
    if (operator.type == TokenType.In) {
      const expr = this.parse_expr();
      this.expect(TokenType.OpenBrace, "{", "after for expr");
      var body: Expr[] = [];
      while (this.not_eof() && this.at().value != "}") {
        body.push(this.parse_stmt());
      }
      this.expect(TokenType.CloseBrace, "}", "after while body");
      return { kind: "ForLoop", identifier, operator, expr, body } as ForLoop;
    } else if (operator.type == TokenType.Times) {
      this.expect(TokenType.OpenBrace, "{", "after for-expr");
      var body: Expr[] = [];
      while (this.not_eof() && this.at().value != "}") {
        body.push(this.parse_stmt());
      }
      this.expect(TokenType.CloseBrace, "}", "after for-expr");
      return { kind: "ForLoop", identifier, operator, body } as ForLoop;
    }
    throw "Expected in or times keyword after for keyword.";
  }

  private parse_while_loop(): Stmt {
    this.eat();
    const expr = this.parse_expr();
    this.expect(TokenType.OpenBrace, "{", "after while condition");
    var body: Expr[] = [];
    while (this.not_eof() && this.at().value != "}") {
      body.push(this.parse_stmt());
    }
    this.expect(TokenType.CloseBrace, "}", "after while body");
    return { kind: "WhileLoop", expr, body } as WhileLoop;
  }


  private parse_if(): Stmt {
    this.eat();
    const expr = this.parse_expr();
    this.expect(TokenType.OpenBrace, "{", "after if condition");
    var body: Stmt[] = [];
    while (this.not_eof() && this.at().value != "}") {
      body.push(this.parse_stmt());
    }
    this.expect(TokenType.CloseBrace, "}", "after if body");
    return { kind: "IfStmt", expr, body } as IfStmt
  }

  // VAR IDENT;
  // ( VAR | CONST ) IDENT = EXPR;
  private parse_var_declaration(): Stmt {
    const isConstant = this.eat().type == TokenType.Const;
    const identifier = this.expect(
      TokenType.Identifier,
      "identifier name", "following var or const keyword"
    ).value;

    if (this.at().type == TokenType.Semicolon) {
      this.eat(); // expect semicolon
      if (isConstant) {
        throw "Parser Error: Expected Expression, got ;";
      }

      return {
        kind: "VarDeclaration",
        identifier,
        constant: false,
      } as VarDeclaration;
    }

    this.expect(
      TokenType.Equals,
      "=", "following identifier in var declaration",
    );

    const declaration = {
      kind: "VarDeclaration",
      value: this.parse_expr(),
      identifier,
      constant: isConstant,
    } as VarDeclaration;

    this.expect(
      TokenType.Semicolon,
      ";", "at the end of variable declaration",
    );

    return declaration;
  }

  private parse_func_declaration(): Stmt {
    this.eat();
    const identifier = this.expect(
      TokenType.Identifier,
      "identifier name", "following func keyword",
    ).value;

    var args = this.parse_declaration_args();

    this.expect(
      TokenType.OpenBrace,
      "{", "following function args in declaration",
    ).value;

    const declaration = {
      kind: "FuncDeclaration",
      args,
      code: [],
      identifier,
    } as FuncDeclaration;

    while (this.not_eof() && this.at().value != "}") {
      declaration.code.push(this.parse_stmt());
    }


    this.expect(
      TokenType.CloseBrace,
      "}", "after function body",
    );

    return declaration;
  }

  private parse_continue(): Stmt {
    this.eat();
    const ret = {
      kind: "ContinueStmt"
    } as ContinueStmt;

    this.expect(
      TokenType.Semicolon,
      "Continue must end with semicolon.",
    );

    return ret;
  }


  private parse_break(): Stmt {
    this.eat();
    const ret = {
      kind: "BreakStmt"
    } as BreakStmt;

    this.expect(
      TokenType.Semicolon,
      ";", "after break keyword",
    );

    return ret;
  }

  private parse_return(): Stmt {
    this.eat();
    const ret = {
      kind: "ReturnStmt",
      expr: this.parse_expr()
    } as ReturnStmt;

    this.expect(
      TokenType.Semicolon,
      ";", "after return keyword",
    );

    return ret;
  }

  // Handle expressions
  private parse_expr(): Expr {
    return this.parse_assignment_expr();
  }

  private parse_assignment_expr(): Expr {
    const left = this.parse_object_expr();

    if (this.at().type == TokenType.Equals) {
      this.eat(); // advance past equals
      const value = this.parse_expr();
      return { value, assigne: left, kind: "AssignmentExpr" } as AssignmentExpr;
    }

    return left;
  }

  private parse_object_expr(): Expr {
    // { Prop[] }
    if (this.at().type !== TokenType.OpenBrace) {
      return this.parse_list_expr();
    }

    this.eat(); // advance past open brace.
    const value = new Array<Property>();

    while (this.not_eof() && this.at().type != TokenType.CloseBrace) {
      const key =
        this.expect(TokenType.Identifier, "Object literal key exprected").value;

      // Allows shorthand key: pair -> { key, }
      if (this.at().type == TokenType.Comma) {
        this.eat(); // advance past comma
        value.push({ key, kind: "Property" } as Property);
        continue;
      } // Allows shorthand key: pair -> { key }
      else if (this.at().type == TokenType.CloseBrace) {
        value.push({ key, kind: "Property" });
        continue;
      }

      // { key: val }
      this.expect(
        TokenType.Colon,
        ":", "following identifier in object expr"
      );
      const actvalue = this.parse_expr();

      value.push({ kind: "Property", value: actvalue, key });
      if (this.at().type != TokenType.CloseBrace) {
        this.expect(
          TokenType.Comma,
          ", or }", "following property",
        );
      }
    }

    this.expect(TokenType.CloseBrace, "}", "after object literal");
    return { kind: "ObjectLiteral", value } as ObjectLiteral;
  }


  private parse_list_expr(): Expr {
    // { Prop[] }
    if (this.at().type !== TokenType.OpenBracket) {
      return this.parse_logical_expr();
    }

    this.eat(); // advance past open brace.
    const value = new Array<KJElement>();

    while (this.not_eof() && this.at().type != TokenType.CloseBracket) {
      value.push(this.parse_expr() as KJElement);
      if (this.at().type == TokenType.Comma) {
        this.eat();
      }
    }

    this.expect(TokenType.CloseBracket, "]", "after list literal");
    return { kind: "ListLiteral", value } as ListLiteral;
  }

  private parse_logical_expr(): Expr {
    return this.parse_comparison_expr();
  }

  private parse_comparison_expr(): Expr {
    let left = this.parse_additive_expr();

    while (this.at().value == "==" || this.at().value == "!=" || this.at().value == ">=" || this.at().value == "<=" || this.at().value == "<" || this.at().value == ">") {
      const operator = this.eat().value;
      const right = this.parse_expr();
      left = {
        kind: "ComparisonExpr",
        left,
        right,
        operator,
      } as ComparisonExpr;
    }

    return left;
  }

  // Handle Addition & Subtraction Operations
  private parse_additive_expr(): Expr {
    let left = this.parse_multiplicitave_expr();

    while (this.at().value == "+" || this.at().value == "-") {
      const operator = this.eat().value;
      const right = this.parse_expr();
      left = {
        kind: "BinaryExpr",
        left,
        right,
        operator,
      } as BinaryExpr;
    }

    return left;
  }

  // Handle Multiplication, Division & Modulo Operations
  private parse_multiplicitave_expr(): Expr {
    let left = this.parse_call_member_expr();

    while (
      this.at().value == "/" || this.at().value == "*" || this.at().value == "%"
    ) {
      const operator = this.eat().value;
      const right = this.parse_call_member_expr();
      left = {
        kind: "BinaryExpr",
        left,
        right,
        operator,
      } as BinaryExpr;
    }

    return left;
  }

  // foo.x()()
  // foo.buzz().bar()
  private parse_call_member_expr(): Expr {
    const member = this.parse_member_expr();

    if (this.at().type == TokenType.OpenParen && !this.at().differ) {
      return this.parse_call_expr(member);
    }

    return member;
  }

  private parse_call_expr(caller: Expr): Expr {
    const args = this.parse_args();
    let call_expr: Expr = {
      kind: "CallExpr",
      caller,
      args: args[0],
      kwargs: args[1],
    } as CallExpr;

    if (this.at().type == TokenType.OpenParen && !this.at().differ) {
      call_expr = this.parse_call_expr(call_expr);
    }

    if (this.at().type == TokenType.Dot && !this.at().differ) {
      this.eat()
      const member = this.parse_member_expr();
      if (this.at().type == TokenType.OpenParen && !this.at().differ) {
        call_expr = this.parse_call_expr({
          kind: "MemberExpr",
          object: call_expr,
          property: member,
          computed: false,
        } as MemberExpr);
      } else {
        return {
          kind: "MemberExpr",
          object: call_expr,
          property: member,
          computed: false,
        } as MemberExpr;
      }
    }

    return call_expr;
  }

  private parse_args(): [Expr[], { [id: string]: Expr }] {
    this.expect(TokenType.OpenParen, "(");
    const args: [Expr[], { [id: string]: Expr }] = this.at().type == TokenType.CloseParen ? [[], {}] : this.parse_arguments_list();

    this.expect(
      TokenType.CloseParen,
      "Missing closing parenthesis after arguments list",
    );
    return args;
  }

  private parse_arguments_list(): [Expr[], { [id: string]: Expr }] {
    const args: Expr[] = [];
    const kwargs: { [id: string]: Expr } = {};

    do {
      if (this.tokens[1].value == "=") {
        const key = this.expect(TokenType.Identifier, "identifier", "for keyword argument");
        this.eat();
        const value = this.parse_expr();
        kwargs[key.value] = value;
      } else {
        args.push(this.parse_expr());
      }
    } while (this.at().type == TokenType.Comma && this.eat())
    return [args, kwargs];
  }

  private parse_declaration_args(): FuncDeclarationArgument[] {
    this.expect(TokenType.OpenParen, "(");
    const args = this.at().type == TokenType.CloseParen
      ? []
      : this.parse_declaration_arguments_list();

    this.expect(
      TokenType.CloseParen,
      ")", "after arguments list",
    );
    return args;
  }

  private parse_declaration_arguments_list(): FuncDeclarationArgument[] {
    const args = [this.parse_declaration_argument()];

    while (this.at().type == TokenType.Comma && this.eat()) {
      args.push(this.parse_declaration_argument());
    }

    return args;
  }

  private parse_declaration_argument(): FuncDeclarationArgument {
    const identifier = this.expect(TokenType.Identifier, "identifier", "in function declaration arguments").value;
    var value;

    if (this.at().type == TokenType.Equals && this.eat()) {
      value = this.parse_expr();
    }

    return {
      kind: "FuncDeclarationArgument",
      identifier,
      value,
    } as FuncDeclarationArgument;;
  }

  private parse_member_expr(): Expr {
    let object = this.parse_unary_operator();

    while (
      this.at().type == TokenType.Dot || this.at().type == TokenType.OpenBracket
    ) {
      const operator = this.eat();
      let property: Expr;
      let computed: boolean;

      // non-computed values aka obj.expr
      if (operator.type == TokenType.Dot) {
        computed = false;
        // get identifier
        property = this.parse_unary_operator();
        if (property.kind != "Identifier") {
          throw `Cannot use dot operator without right hand side being a identifier`;
        }
      } else { // this allows obj[computedValue]
        computed = true;
        property = this.parse_expr();
        this.expect(
          TokenType.CloseBracket,
          "]", "in computed value",
        );
      }

      object = {
        kind: "MemberExpr",
        object,
        property,
        computed,
      } as MemberExpr;
    }

    return object;
  }

  private parse_unary_operator(): Stmt {
    // skip to parse_expr
    switch (this.at().value) {
      case "!":
        return {
          kind: "UnaryExpr",
          operator: this.eat().value,
          expr: this.parse_expr()
        } as UnaryExpr;
      default:
        return this.parse_primary_expr();
    }
  }

  // Orders Of Prescidence
  // Assignment
  // Object
  // AdditiveExpr
  // MultiplicitaveExpr
  // Call
  // Member
  // PrimaryExpr

  // Parse Literal Values & Grouping Expressions
  private parse_primary_expr(): Expr {
    const tk = this.at().type;

    // Determine which token we are currently at and return literal value
    switch (tk) {
      // User defined values.
      case TokenType.Identifier:
        return { kind: "Identifier", symbol: this.eat().value } as Identifier;

      // Constants and Numeric Constants
      case TokenType.Number:
        return {
          kind: "NumericLiteral",
          value: parseFloat(this.eat().value),
        } as NumericLiteral;

      case TokenType.String:
        return {
          kind: "StringLiteral",
          value: this.eat().value,
        } as StringLiteral;

      // Grouping Expressions
      case TokenType.OpenParen: {
        this.eat(); // eat the opening paren
        const value = this.parse_expr();
        this.expect(
          TokenType.CloseParen,
          "Unexpected token found inside parenthesised expression. Expected closing parenthesis.",
        ); // closing paren
        return value;
      }

      case TokenType.OpenBracket: {
        this.eat(); // eat the opening paren
        const value = this.parse_expr();
        this.expect(
          TokenType.CloseBracket,
          "]", "inside list declaration",
        ); // closing paren
        return value;
      }

      // Unidentified Tokens and Invalid Code Reached
      default:
        console.error(this.at());
        throw `Unexpected token found during parsing!`;
    }
  }
}
