/* @internal */
export class FilterIterable<T> implements Iterable<T> {
    constructor(private p: (x: T) => boolean, private xs: Iterable<T>) {}

    [Symbol.iterator]() {
        return filter(this.p, this.xs)
    }
}

function* filter<T>(p: (x: T) => boolean, xs: Iterable<T>) {
    for (const x of xs) {
        if (p(x)) {
            yield x
        }
    }
}
