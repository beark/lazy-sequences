import { isIterable } from "../common"

/* @internal */
export class ZipAsyncIterable<T, U> implements AsyncIterable<[T, U]> {
    constructor(
        private xs: AsyncIterable<T>,
        private ys: Iterable<U> | AsyncIterable<U>,
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
        private f: (x: S, y: T) => U,
        private xs: AsyncIterable<S>,
        private ys: AsyncIterable<T> | Iterable<T>,
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
        private xs: AsyncIterator<T>,
        private ys: AsyncIterator<U> | Iterator<U>,
    ) {}

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async next(value?: any): Promise<IteratorResult<[T, U]>> {
        const r1 = await this.xs.next(value)
        const r2 = await this.ys.next(value)

        if (!r1.done && !r2.done) {
            return {
                done: false,
                value: [r1.value, r2.value],
            }
        } else {
            return { done: true } as IteratorResult<[T, U]>
        }
    }
}

class ZipWithAsyncIterator<S, T, U> implements AsyncIterator<U> {
    constructor(
        private f: (x: S, y: T) => U,
        private xs: AsyncIterator<S>,
        private ys: Iterator<T> | AsyncIterator<T>,
    ) {}

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async next(value?: any): Promise<IteratorResult<U>> {
        const r1 = await this.xs.next(value)
        const r2 = await this.ys.next(value)

        if (!r1.done && !r2.done) {
            return {
                done: false,
                value: this.f(r1.value, r2.value),
            }
        } else {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return { done: true } as any
        }
    }
}
