/* @internal */
export class IntersperseIterable<T> implements Iterable<T> {
    constructor(private readonly xs: Iterable<T>, private readonly sep: T) {}

    [Symbol.iterator]() {
        return intersperse(this.xs, this.sep)
    }
}

/* @internal */
export class IntercalateIterable<T> implements Iterable<T> {
    constructor(
        private readonly xs: Iterable<T>,
        private readonly sep: Iterable<T>,
    ) {}

    [Symbol.iterator]() {
        return intercalate(this.xs, this.sep)
    }
}

function* intersperse<T>(it: Iterable<T>, sep: T) {
    let first = true
    for (const x of it) {
        if (!first) {
            yield sep
        }

        yield x
        first = false
    }
}

function* intercalate<T>(it: Iterable<T>, sep: Iterable<T>) {
    let first = true
    for (const x of it) {
        if (!first) {
            for (const y of sep) {
                yield y
            }
        }

        yield x
        first = false
    }
}
