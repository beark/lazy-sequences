/* @internal */
export class IterateIterable<T> implements Iterable<T> {
    constructor(private readonly f: (x: T) => T, private readonly x: T) {}

    [Symbol.iterator]() {
        return iterate(this.f, this.x)
    }
}

function* iterate<T>(f: (x: T) => T, x: T) {
    while (true) {
        yield x
        x = f(x)
    }
}
