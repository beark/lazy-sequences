/* @internal */
export class ZipIterable<T, U> implements Iterable<[T, U]> {
    constructor(private iter1: Iterable<T>, private iter2: Iterable<U>) {}

    [Symbol.iterator](): Iterator<[T, U]> {
        return new ZipIterator(
            this.iter1[Symbol.iterator](),
            this.iter2[Symbol.iterator](),
        )
    }
}

/* @internal */
export class ZipWithIterable<S, T, U> implements Iterable<U> {
    constructor(
        private f: (x: S, y: T) => U,
        private iter1: Iterable<S>,
        private iter2: Iterable<T>,
    ) {}

    [Symbol.iterator](): Iterator<U> {
        return new ZipWithIterator(
            this.f,
            this.iter1[Symbol.iterator](),
            this.iter2[Symbol.iterator](),
        )
    }
}

class ZipIterator<T, U> implements Iterator<[T, U]> {
    constructor(private it1: Iterator<T>, private it2: Iterator<U>) {}

    next(value?: any): IteratorResult<[T, U]> {
        const r1 = this.it1.next(value)
        const r2 = this.it2.next(value)

        if (!r1.done && !r2.done) {
            return {
                done: false,
                value: [r1.value, r2.value],
            }
        } else {
            return { done: true } as any
        }
    }
}

class ZipWithIterator<S, T, U> implements Iterator<U> {
    constructor(
        private f: (x: S, y: T) => U,
        private it1: Iterator<S>,
        private it2: Iterator<T>,
    ) {}

    next(value?: any): IteratorResult<U> {
        const r1 = this.it1.next(value)
        const r2 = this.it2.next(value)

        if (!r1.done && !r2.done) {
            return {
                done: false,
                value: this.f(r1.value, r2.value),
            }
        } else {
            return { done: true } as any
        }
    }
}
