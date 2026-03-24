# jarl
Just Another Result Library

## Usage

```ts
import { fn, map, is_ok, is_err, or_else } from "./index";

const divide = fn(async (a: number, b: number): Promise<number> => {
  return a / b;
});

const result = await divide(10, 2);
console.log("result", result);

if (is_ok(result)) {
  console.log(result.value); // 5
}

const double = fn((x: number) => x * 2);
const result_doubled = await map(divide, double)(10, 2);
console.log("doubled with map", result_doubled);

const failure = fn((x: number) => {
  throw new Error("hoobastank");
});

const failed = await failure(10);

// or_else is async, so its forced to be async.  I may separate this in the
// future, but this library is to prevent me having to do error handling.  Therefore,
// i am using or_else always with async functions.
console.log("error", is_err(failed), await or_else(failed, 69));
```
