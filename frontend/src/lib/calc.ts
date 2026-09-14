/**
 * Evaluates the arithmetic a user can type into an amount field — "250+40",
 * "3*99.5", "(120+30)/2" — without going anywhere near eval().
 *
 * A hand-written recursive-descent parser over a fixed token set: digits,
 * + - * / and parentheses. Anything else fails to parse and returns null, so
 * the caller can fall back to showing a validation message.
 */

const TOKEN_RE = /\d+(?:\.\d+)?|\.\d+|[+\-*/()]|\s+/y;

function tokenize(input: string): string[] | null {
  const tokens: string[] = [];
  TOKEN_RE.lastIndex = 0;
  while (TOKEN_RE.lastIndex < input.length) {
    const match = TOKEN_RE.exec(input);
    if (!match) return null; // unsupported character
    const token = match[0];
    if (token.trim() !== "") tokens.push(token);
  }
  return tokens;
}

/** Returns the value of `input`, or null if it is empty or not valid arithmetic. */
export function evaluateAmount(input: string): number | null {
  const parsed = tokenize(input.trim());
  if (!parsed || parsed.length === 0) return null;
  const tokens = parsed; // narrowed for the closures below

  let pos = 0;
  let failed = false;
  const peek = () => tokens[pos];

  // expression := term (('+' | '-') term)*
  function expression(): number {
    let value = term();
    while (!failed && (peek() === "+" || peek() === "-")) {
      const op = tokens[pos++];
      const rhs = term();
      value = op === "+" ? value + rhs : value - rhs;
    }
    return value;
  }

  // term := factor (('*' | '/') factor)*
  function term(): number {
    let value = factor();
    while (!failed && (peek() === "*" || peek() === "/")) {
      const op = tokens[pos++];
      const rhs = factor();
      value = op === "*" ? value * rhs : value / rhs;
    }
    return value;
  }

  // factor := ('+' | '-') factor | '(' expression ')' | number
  function factor(): number {
    const token = peek();
    if (token === undefined) {
      failed = true; // trailing operator, e.g. "12+"
      return 0;
    }
    if (token === "+" || token === "-") {
      pos++;
      const value = factor();
      return token === "-" ? -value : value;
    }
    if (token === "(") {
      pos++;
      const value = expression();
      if (peek() !== ")") {
        failed = true;
        return 0;
      }
      pos++;
      return value;
    }
    if (/^[\d.]/.test(token)) {
      pos++;
      return Number(token);
    }
    failed = true;
    return 0;
  }

  const result = expression();
  if (failed || pos !== tokens.length || !Number.isFinite(result)) return null;

  // Money: collapse float noise (0.1 + 0.2) to two decimals.
  return Math.round(result * 100) / 100;
}

/** True when the input is more than a plain number, i.e. worth previewing. */
export function isArithmetic(input: string): boolean {
  return /[+\-*/()]/.test(input.trim().replace(/^[+-]/, ""));
}
