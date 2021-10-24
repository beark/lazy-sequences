/* @internal */
export class DropIterable<T> implements Iterable<T> {
    constructor(private readonly n: number, private readonly xs: Iterable<T>) {}

    [Symbol.iterator]() {
        return drop(this.n, this.xs)
    }
}

/* @internal */
export class DropWhileIterable<T> implements Iterable<T> {
    constructor(
        private readonly p: (x: T) => boolean,
        private readonly xs: Iterable<T>,
    ) {}

    [Symbol.iterator]() {
        return dropWhile(this.p, this.xs)
    }
}

function* drop<T>(n: number, xs: Iterable<T>) {
    if (n === Infinity) {
        return
    }

    for (const x of xs) {
        if (n > 0) {
            --n
        } else {
            yield x
        }
    }
}

function* dropWhile<T>(p: (x: T) => boolean, xs: Iterable<T>) {
    let dropping = true
    for (const x of xs) {
        if (dropping) {
            if (p(x)) {
                continue
            } else {
                dropping = false
                yield x
            }
        } else {
            yield x
        }
    }
}
