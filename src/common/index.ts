/* @internal */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isIterable(x: any): x is Iterable<unknown> {
    return typeof x[Symbol.iterator] === "function"
}

/* @internal */
export function* enumFrom(
    start: number,
    step: number,
): Generator<number, void, void> {
    for (let i = start; ; i += step) {
        yield i
    }
}

/**
 * A value of type `T` paired with an index of which position in a sequence it
 * occurs.
 */
export type IndexedValue<T> = {
    index: number
    value: T
}
