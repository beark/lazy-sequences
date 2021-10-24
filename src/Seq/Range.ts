import { enumFrom } from "../common"

/* @internal */
export class RangeIterable implements Iterable<number> {
    constructor(
        private readonly start: number,
        private readonly stop: number,
        private readonly step: number,
    ) {}

    [Symbol.iterator]() {
        return range(this.start, this.stop, this.step)
    }
}

/* @internal */
export class EnumFromIterable implements Iterable<number> {
    constructor(
        private readonly start: number,
        private readonly step: number,
    ) {}

    [Symbol.iterator]() {
        return enumFrom(this.start, this.step)
    }
}

function* range(start: number, stop: number, step: number) {
    for (let i = start; i <= stop; i += step) {
        yield i
    }
}
