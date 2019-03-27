// tslint:disable
if (typeof (Symbol as any).asyncIterator === "undefined") {
    ;(Symbol as any).asyncIterator =
        // @ts-ignore
        Symbol.asyncIterator || Symbol("asyncIterator")
}

import { Seq } from "../Seq"
import { AsyncSeq } from "./index"

describe("export sanity", () => {
    it("constructing a Seq works", () => {
        const s = Seq.fromArray([1, 2, 3])
        expect(s.collect()).toEqual([1, 2, 3])
    })

    it("constructing an AsyncSeq works", async () => {
        const s = AsyncSeq.fromIterable([1, 2, 3])
        expect(await s.collect()).toEqual([1, 2, 3])
    })
})

describe("added methods", () => {
    it("AsyncSeq.collectSeq", async () => {
        const s = await AsyncSeq.fromIterable([1, 2, 3]).collectSeq()
        expect(s.collect()).toEqual([1, 2, 3])
    })
})
