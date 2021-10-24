/* @internal */
export class IntersperseAsyncIterable<T> implements AsyncIterable<T> {
    constructor(private readonly xs: AsyncIterable<T>, private readonly sep: T) {}

    [Symbol.asyncIterator]() {
        return intersperseAsync(this.xs, this.sep)
    }
}

/* @internal */
export class IntercalateAsyncIterable<T> implements AsyncIterable<T> {
    constructor(private readonly xs: AsyncIterable<T>, private readonly sep: Iterable<T>) {}

    [Symbol.asyncIterator]() {
        return intercalateAsync(this.xs, this.sep)
    }
}

async function* intersperseAsync<T>(it: AsyncIterable<T>, sep: T) {
    let first = true
    for await (const x of it) {
        if (!first) {
            yield sep
        }

        yield x
        first = false
    }
}

async function* intercalateAsync<T>(it: AsyncIterable<T>, sep: Iterable<T>) {
    let first = true
    for await (const x of it) {
        if (!first) {
            for (const y of sep) {
                yield y
            }
        }

        yield x
        first = false
    }
}
