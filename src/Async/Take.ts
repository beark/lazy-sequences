/* @internal */
export class TakeAsyncIterable<T> implements AsyncIterable<T> {
    constructor(private readonly n: number, private readonly xs: AsyncIterable<T>) {}

    [Symbol.asyncIterator]() {
        return takeAsync(this.n, this.xs)
    }
}

/* @internal */
export class TakeWhileAsyncIterable<T> implements AsyncIterable<T> {
    constructor(private readonly p: (x: T) => boolean, private readonly xs: AsyncIterable<T>) {}

    [Symbol.asyncIterator]() {
        return takeWhileAsync(this.p, this.xs)
    }
}

async function* takeAsync<T>(n: number, xs: AsyncIterable<T>) {
    for await (const x of xs) {
        if (n <= 0) {
            return
        }

        yield x
        --n
    }
}

async function* takeWhileAsync<T>(f: (x: T) => boolean, xs: AsyncIterable<T>) {
    for await (const x of xs) {
        if (f(x)) {
            yield x
        } else {
            return
        }
    }
}
