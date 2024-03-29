/* @internal */
export class MapAsyncIterable<T, U> implements AsyncIterable<U> {
    constructor(private readonly f: (x: T) => U, private readonly xs: AsyncIterable<T>) {}

    [Symbol.asyncIterator]() {
        return mapAsync(this.f, this.xs)
    }
}

async function* mapAsync<T, U>(f: (x: T) => U, xs: AsyncIterable<T>) {
    for await (const x of xs) {
        yield f(x)
    }
}
