/* @internal */
export class ConcatIterable<T> implements Iterable<T> {
    constructor(
        private readonly xs: Iterable<T>,
        private readonly ys: Iterable<T>,
    ) {}

    [Symbol.iterator]() {
        return concatIters(this.xs, this.ys)
    }
}

function* concatIters<T>(xs: Iterable<T>, ys: Iterable<T>) {
    for (const x of xs) {
        yield x
    }

    for (const y of ys) {
        yield y
    }
}
