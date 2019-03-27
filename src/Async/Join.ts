/* @internal */
export class JoinAsyncIterable<T> implements AsyncIterable<T> {
    constructor(private xss: AsyncIterable<AsyncIterable<T> | Iterable<T>>) {}

    [Symbol.asyncIterator]() {
        return joinAsync(this.xss)
    }
}

async function* joinAsync<T>(
    xss: AsyncIterable<Iterable<T> | AsyncIterable<T>>,
) {
    for await (const xs of xss) {
        for await (const x of xs) {
            yield x
        }
    }
}
