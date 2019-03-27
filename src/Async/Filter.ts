/* @internal */
export class FilterAsyncIterable<T> implements AsyncIterable<T> {
    constructor(private p: (x: T) => boolean, private xs: AsyncIterable<T>) {}

    [Symbol.asyncIterator]() {
        return filterAsync(this.p, this.xs)
    }
}

async function* filterAsync<T>(p: (x: T) => boolean, xs: AsyncIterable<T>) {
    for await (const x of xs) {
        if (p(x)) {
            yield x
        }
    }
}
