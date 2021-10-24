/* @internal */
export class DropAsyncIterable<T> implements AsyncIterable<T> {
    constructor(private readonly n: number, private readonly xs: AsyncIterable<T>) {}

    [Symbol.asyncIterator]() {
        return dropAsync(this.n, this.xs)
    }
}

/* @internal */
export class DropWhileAsyncIterable<T> implements AsyncIterable<T> {
    constructor(private readonly p: (x: T) => boolean, private readonly xs: AsyncIterable<T>) {}

    [Symbol.asyncIterator]() {
        return dropWhileAsync(this.p, this.xs)
    }
}

async function* dropAsync<T>(n: number, xs: AsyncIterable<T>) {
    for await (const x of xs) {
        if (n > 0) {
            --n
        } else {
            yield x
        }
    }
}

async function* dropWhileAsync<T>(p: (x: T) => boolean, xs: AsyncIterable<T>) {
    let dropping = true
    for await (const x of xs) {
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
