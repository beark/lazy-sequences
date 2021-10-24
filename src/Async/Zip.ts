import { isIterable } from "../common"

/* @internal */
export class ZipAsyncIterable<T, U> implements AsyncIterable<[T, U]> {
    constructor(
        private readonly xs: AsyncIterable<T>,
        private readonly ys: Iterable<U> | AsyncIterable<U>,
    ) {}

    [Symbol.asyncIterator](): AsyncIterator<[T, U]> {
        return new ZipAsyncIterator(
            this.xs[Symbol.asyncIterator](),
            isIterable(this.ys)
                ? this.ys[Symbol.iterator]()
                : this.ys[Symbol.asyncIterator](),
        )
    }
}

/* @internal */
export class ZipWithAsyncIterable<S, T, U> implements AsyncIterable<U> {
    constructor(
        private readonly f: (x: S, y: T) => U,
        private readonly xs: AsyncIterable<S>,
        private readonly ys: AsyncIterable<T> | Iterable<T>,
    ) {}

    [Symbol.asyncIterator](): AsyncIterator<U> {
        return new ZipWithAsyncIterator(
            this.f,
            this.xs[Symbol.asyncIterator](),
            isIterable(this.ys)
                ? this.ys[Symbol.iterator]()
                : this.ys[Symbol.asyncIterator](),
        )
    }
}

class ZipAsyncIterator<T, U> implements AsyncIterator<[T, U]> {
    constructor(
        private readonly xs: AsyncIterator<T>,
        private readonly ys: AsyncIterator<U> | Iterator<U>,
    ) {}

    async next(): Promise<IteratorResult<[T, U]>> {
        const r1 = await this.xs.next()
        const r2 = await this.ys.next()

        if (!r1.done && !r2.done) {
            return {
                done: false,
                value: [r1.value, r2.value],
            }
        } else {
            return { done: true, value: undefined }
        }
    }
}

class ZipWithAsyncIterator<S, T, U> implements AsyncIterator<U> {
    constructor(
        private readonly f: (x: S, y: T) => U,
        private readonly xs: AsyncIterator<S>,
        private readonly ys: Iterator<T> | AsyncIterator<T>,
    ) {}

    async next(): Promise<IteratorResult<U>> {
        const r1 = await this.xs.next()
        const r2 = await this.ys.next()

        if (!r1.done && !r2.done) {
            return {
                done: false,
                value: this.f(r1.value, r2.value),
            }
        } else {
            return { done: true, value: undefined }
        }
    }
}
