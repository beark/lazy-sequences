/* @internal */
export class ConsIterable<T> implements Iterable<T> {
    constructor(private readonly x: T, private readonly xs: Iterable<T>) {}

    [Symbol.iterator]() {
        return cons(this.x, this.xs)
    }
}

function* cons<T>(x: T, xs: Iterable<T>) {
    yield x

    for (const y of xs) {
        yield y
    }
}
