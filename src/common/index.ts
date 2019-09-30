/* @internal */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isIterable(x: any): x is Iterable<any> {
    return typeof x[Symbol.iterator] === "function"
}

/* @internal */
export function* enumFrom(start: number, step: number) {
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
