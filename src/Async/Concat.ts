import { isIterable } from "../common"

/* @internal */
export class ConcatAsyncIterable<T> implements AsyncIterable<T> {
    constructor(
        private xs: AsyncIterable<T>,
        private ys: AsyncIterable<T> | Iterable<T>,
    ) {}

    [Symbol.asyncIterator]() {
        return concatItersAsync(this.xs, this.ys)
    }
}

async function* concatItersAsync<T>(
    xs: AsyncIterable<T>,
    ys: AsyncIterable<T> | Iterable<T>,
) {
    yield* xs

    if (isIterable(ys)) {
        for (const y of ys) {
            yield y
        }
    } else {
        for await (const y of ys) {
            yield y
        }
    }
}
