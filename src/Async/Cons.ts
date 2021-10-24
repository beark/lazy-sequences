/* @internal */
export class ConsAsyncIterable<T> implements AsyncIterable<T> {
    constructor(private readonly x: T | Promise<T>, private readonly xs: AsyncIterable<T>) {}

    [Symbol.asyncIterator]() {
        return consAsync(this.x, this.xs)
    }
}

async function* consAsync<T>(x: T | Promise<T>, xs: AsyncIterable<T>) {
    yield await x

    for await (const y of xs) {
        yield y
    }
}
