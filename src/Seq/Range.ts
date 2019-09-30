import { enumFrom } from "../common"

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

function* range(start: number, stop: number, step: number) {
    for (let i = start; i <= stop; i += step) {
        yield i
    }
}
