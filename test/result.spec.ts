import { assert, describe, it, expect } from "vitest";
import { is_ok, is_err, fn, map, or_else } from "../result";

describe("Result", () => {
  it("should return the value", async () => {
    const result = await fn(async () => "hello")();
    assert(result.ok, "result should be ok");
    expect(result.value).toBe("hello");
  });

  it("should return the error", async () => {
    const result = await fn(async () => {
      throw new Error("hello");
    })();
    assert(!result.ok, "result should not be ok");
    expect(result.error).toBeInstanceOf(Error);
    expect(result.error.message).toBe("hello");
  });

  it("should map values", async () => {
    const mapper = map(
      fn(async (a: number, b: string, c: { foo: number }) => {
        return a + b.length + c.foo;
      }),
      fn(async (a) => a + 1),
      fn(async (a) => `${a}!`),
    );
    const result = await mapper(1, "hello", { foo: 2 });

    assert(result.ok, "result should be ok");
    expect(result.value).toBe("9!");
  });

  it("should map errors", async () => {
    const mapper = map(
      fn(async (a: number, b: string, c: { foo: number }) => {
        return a + b.length + c.foo;
      }),
      fn(async (_) => {
        throw new Error("boom");
      }),
      fn(async (a) => `${a}!`),
    );
    class Err extends Error {}
    const final = fn(mapper, (_: Error) => {
      return new Err();
    });
    const result = await final(1, "hello", { foo: 2 });

    assert(!result.ok, "result should not be ok");
    expect(result.error).toBeInstanceOf(Err);
  });

  it("should fall back to a default", async () => {
    const final = fn(async (_a: number, _b: string, _c: { foo: number }): Promise<string> => {
      throw new Error("boom");
    });
    const result = await or_else(final(1, "hello", { foo: 2 }), "9!");
    expect(result).toEqual("9!");
  });

  it("should type narrow is_ok and is_err", async () => {
    const result = await fn(async () => "hello")();
    assert(is_ok(result));
    expect(result.value).toBe("hello");

    const error = await fn(async () => {
      throw new Error("boom");
    })();
    assert(is_err(error));
    expect(error.error).toBeInstanceOf(Error);
  });
});
