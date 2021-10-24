/* @internal */
export class CycleAsyncIterable<T> implements AsyncIterable<T> {
    constructor(private readonly xs: AsyncIterable<T>) {}

    [Symbol.asyncIterator]() {
        return cycleAsync(this.xs)
    }
}

async function* cycleAsync<T>(xs: AsyncIterable<T>) {
    let cont = false
    for await (const x of xs) {
        yield x
        cont = true
    }

    while (cont) {
        for await (const x of xs) {
            yield x
        }
    }
}
