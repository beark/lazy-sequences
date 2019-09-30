/* @internal */
export class MapIterable<T, U> implements Iterable<U> {
    constructor(private f: (x: T) => U, private xs: Iterable<T>) {}

    [Symbol.iterator]() {
        return map(this.f, this.xs)
    }
}

function* map<T, U>(f: (x: T) => U, xs: Iterable<T>) {
    for (const x of xs) {
        yield f(x)
    }
}
