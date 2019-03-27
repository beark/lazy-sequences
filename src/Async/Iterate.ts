/* @internal */
export class IterateAsyncIterable<T> implements AsyncIterable<T> {
    constructor(private f: (x: T) => Promise<T> | T, private x: T) {}

    [Symbol.asyncIterator]() {
        return iterateAsync(this.f, this.x)
    }
}

/* @internal */
export class AsyncFromIterable<T> implements AsyncIterable<T> {
    constructor(private xs: Iterable<T | Promise<T>>) {}

    [Symbol.asyncIterator]() {
        return fromIterableAsync(this.xs)
    }
}

async function* iterateAsync<T>(f: (x: T) => Promise<T> | T, x: T) {
    while (true) {
        yield x
        x = await f(x)
    }
}

async function* fromIterableAsync<T>(xs: Iterable<T | Promise<T>>) {
    for (const x of xs) {
        yield await x
    }
}
