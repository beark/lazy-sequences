/* @internal */
export class CycleIterable<T> implements Iterable<T> {
    constructor(private xs: Iterable<T>) {}

    [Symbol.iterator]() {
        return cycle(this.xs)
    }
}

function* cycle<T>(xs: Iterable<T>) {
    while (true) {
        for (const x of xs) {
            yield x
        }
    }
}
