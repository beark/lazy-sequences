/* @internal */
export class JoinIterable<T> implements Iterable<T> {
    constructor(private readonly xss: Iterable<Iterable<T>>) {}

    [Symbol.iterator]() {
        return join(this.xss)
    }
}

function* join<T>(xss: Iterable<Iterable<T>>) {
    for (const xs of xss) {
        for (const x of xs) {
            yield x
        }
    }
}
