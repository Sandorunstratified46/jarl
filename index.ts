export type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };
type OkResult<T> = { ok: true; value: T };
type ErrResult<E> = { ok: false; error: E };

type MaybePromise<T> = T | Promise<T>;
type ResultFn<A extends unknown[], T, E> = (
  ...args: A
) => Promise<Result<T, E>>;

type UnaryResultFn = ResultFn<[unknown], unknown, Error>;

function normalizeError(err: unknown): Error {
  if (err instanceof Error) {
    return err;
  }

  try {
    const asJson = JSON.stringify(err);
    return new Error(asJson ?? String(err));
  } catch {
    return new Error(String(err));
  }
}

function isResult(value: unknown): value is Result<unknown, unknown> {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  if (!("ok" in value)) {
    return false;
  }

  return typeof (value as { ok: unknown }).ok === "boolean";
}

function fn<A extends unknown[], T>(
  inner: (...args: A) => MaybePromise<T | Result<T, Error>>,
): ResultFn<A, T, Error>;

function fn<A extends unknown[], T>(
  inner: (...args: A) => MaybePromise<T | Result<T, Error>>,
  mapError: (e: Error, ...args: A) => unknown,
): ResultFn<A, T, Error>;

function fn<A extends unknown[], T>(
  inner: (...args: A) => MaybePromise<T | Result<T, Error>>,
  mapError?: (e: Error, ...args: A) => unknown,
): ResultFn<A, T, Error> {
  return async (...args: A) => {
    try {
      const value = await inner(...args);

      if (isResult(value)) {
        if (value.ok) {
          return { ok: true as const, value: value.value as T };
        }

        const normalized = normalizeError(value.error);
        return {
          ok: false as const,
          error: mapError
            ? normalizeError(mapError(normalized, ...args))
            : normalized,
        };
      }

      return { ok: true as const, value };
    } catch (e) {
      const normalized = normalizeError(e);
      return {
        ok: false as const,
        error: mapError
          ? normalizeError(mapError(normalized, ...args))
          : normalized,
      };
    }
  };
}

function map<A extends unknown[], T, E extends Error>(
  first: ResultFn<A, T, E>,
): ResultFn<A, T, Error>;

function map<A extends unknown[], T, E extends Error, T1, E1 extends Error>(
  first: ResultFn<A, T, E>,
  m1: ResultFn<[T], T1, E1>,
): ResultFn<A, T1, Error>;

function map<
  A extends unknown[],
  T,
  E extends Error,
  T1,
  E1 extends Error,
  T2,
  E2 extends Error,
>(
  first: ResultFn<A, T, E>,
  m1: ResultFn<[T], T1, E1>,
  m2: ResultFn<[T1], T2, E2>,
): ResultFn<A, T2, Error>;

function map<
  A extends unknown[],
  T,
  E extends Error,
  T1,
  E1 extends Error,
  T2,
  E2 extends Error,
  T3,
  E3 extends Error,
>(
  first: ResultFn<A, T, E>,
  m1: ResultFn<[T], T1, E1>,
  m2: ResultFn<[T1], T2, E2>,
  m3: ResultFn<[T2], T3, E3>,
): ResultFn<A, T3, Error>;

function map<
  A extends unknown[],
  T,
  E extends Error,
  T1,
  E1 extends Error,
  T2,
  E2 extends Error,
  T3,
  E3 extends Error,
  T4,
  E4 extends Error,
>(
  first: ResultFn<A, T, E>,
  m1: ResultFn<[T], T1, E1>,
  m2: ResultFn<[T1], T2, E2>,
  m3: ResultFn<[T2], T3, E3>,
  m4: ResultFn<[T3], T4, E4>,
): ResultFn<A, T4, Error>;

function map<
  A extends unknown[],
  T,
  E extends Error,
  T1,
  E1 extends Error,
  T2,
  E2 extends Error,
  T3,
  E3 extends Error,
  T4,
  E4 extends Error,
  T5,
  E5 extends Error,
>(
  first: ResultFn<A, T, E>,
  m1: ResultFn<[T], T1, E1>,
  m2: ResultFn<[T1], T2, E2>,
  m3: ResultFn<[T2], T3, E3>,
  m4: ResultFn<[T3], T4, E4>,
  m5: ResultFn<[T4], T5, E5>,
): ResultFn<A, T5, Error>;

function map(
  first: ResultFn<unknown[], unknown, Error>,
  ...rest: UnaryResultFn[]
): ResultFn<unknown[], unknown, Error> {
  return async (...args: unknown[]) => {
    const firstResult = await first(...args);

    if (!firstResult.ok) {
      return {
        ok: false as const,
        error: normalizeError(firstResult.error),
      };
    }

    let value: unknown = firstResult.value;

    for (const step of rest) {
      const nextResult = await step(value);

      if (!nextResult.ok) {
        return {
          ok: false as const,
          error: normalizeError(nextResult.error),
        };
      }

      value = nextResult.value;
    }

    return {
      ok: true as const,
      value,
    };
  };
}

async function or_else<V, E>(
  p: Promise<Result<V, E>> | Result<V, E>,
  d: V,
): Promise<V> {
  try {
    const result = await p;
    if (result.ok) {
      return result.value;
    }
  } catch {}
  return d;
}

function err<E>(e: E): Result<never, E> {
  return { ok: false, error: e };
}

function ok<T>(t: T): Result<T, never> {
  return { ok: true, value: t };
}

function is_ok<T, E>(result: Result<T, E>): result is OkResult<T> {
  return result.ok;
}

function is_err<T, E>(result: Result<T, E>): result is ErrResult<E> {
  return !result.ok;
}

function value<T, E>(result: Result<T, E>): T {
  if (result.ok) {
    return result.value;
  }
  throw result.error;
}

async function pvalue<T, E>(p: Promise<Result<T, E>>): Promise<T> {
  return value(await p);
}

export { pvalue, value, err, fn, map, or_else, ok, is_ok, is_err };
