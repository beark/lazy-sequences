/* @internal */
export class TakeIterable<T> implements Iterable<T> {
    constructor(private readonly n: number, private readonly xs: Iterable<T>) {}

    [Symbol.iterator]() {
        return take(this.n, this.xs)
    }
}

/* @internal */
export class TakeWhileIterable<T> implements Iterable<T> {
    constructor(
        private readonly p: (x: T) => boolean,
        private readonly xs: Iterable<T>,
    ) {}

    [Symbol.iterator]() {
        return takeWhile(this.p, this.xs)
    }
}

function* take<T>(n: number, xs: Iterable<T>) {
    for (const x of xs) {
        if (n <= 0) {
            return
        }

        yield x
        --n
    }
}

function* takeWhile<T>(f: (x: T) => boolean, xs: Iterable<T>) {
    for (const x of xs) {
        if (f(x)) {
            yield x
        } else {
            return
        }
    }
}
