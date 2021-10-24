/* @internal */
export class ZipIterable<T, U> implements Iterable<[T, U]> {
    constructor(
        private readonly iter1: Iterable<T>,
        private readonly iter2: Iterable<U>,
    ) {}

    [Symbol.iterator]() {
        return new ZipIterator(
            this.iter1[Symbol.iterator](),
            this.iter2[Symbol.iterator](),
        )
    }
}

/* @internal */
export class ZipWithIterable<S, T, U> implements Iterable<U> {
    constructor(
        private readonly f: (x: S, y: T) => U,
        private readonly iter1: Iterable<S>,
        private readonly iter2: Iterable<T>,
    ) {}

    [Symbol.iterator]() {
        return new ZipWithIterator(
            this.f,
            this.iter1[Symbol.iterator](),
            this.iter2[Symbol.iterator](),
        )
    }
}

class ZipIterator<T, U> implements Iterator<[T, U], void> {
    constructor(
        private readonly it1: Iterator<T>,
        private readonly it2: Iterator<U>,
    ) {}

    next(): IteratorResult<[T, U]> {
        const r1 = this.it1.next()
        const r2 = this.it2.next()

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

class ZipWithIterator<S, T, U> implements Iterator<U, void> {
    constructor(
        private readonly f: (x: S, y: T) => U,
        private readonly it1: Iterator<S>,
        private readonly it2: Iterator<T>,
    ) {}

    next(): IteratorResult<U> {
        const r1 = this.it1.next()
        const r2 = this.it2.next()

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
