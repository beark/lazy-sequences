/* @internal */
export class RangeIterable implements Iterable<number> {
    constructor(
        private start: number,
        private stop: number,
        private step: number,
    ) {}

    [Symbol.iterator]() {
        return range(this.start, this.stop, this.step)
    }
}

/* @internal */
export class EnumFromIterable implements Iterable<number> {
    constructor(private start: number, private step: number) {}

    [Symbol.iterator]() {
        return enumFrom(this.start, this.step)
    }
}

/* @internal */
export function* enumFrom(start: number, step: number) {
    for (let i = start; ; i += step) {
        yield i
    }
}

function* range(start: number, stop: number, step: number) {
    for (let i = start; i <= stop; i += step) {
        yield i
    }
}
