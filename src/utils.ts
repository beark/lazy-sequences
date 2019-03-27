/* @internal */
export function isIterable(x: any): x is Iterable<any> {
    return typeof x[Symbol.iterator] === "function"
}
