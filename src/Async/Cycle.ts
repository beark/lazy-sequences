/* @internal */
export class CycleAsyncIterable<T> implements AsyncIterable<T> {
    constructor(private xs: AsyncIterable<T>) {}

    [Symbol.asyncIterator]() {
        return cycleAsync(this.xs)
    }
}

async function* cycleAsync<T>(xs: AsyncIterable<T>) {
    while (true) {
        for await (const x of xs) {
            // tslint:disable-next-line
            yield x
        }
    }
}
