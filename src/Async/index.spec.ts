if (typeof (Symbol as any).asyncIterator === "undefined") {
    ;(Symbol as any).asyncIterator =
        Symbol.asyncIterator || Symbol("asyncIterator")
}

import Seq from "../"
import AsyncSeq from "./"

describe("export sanity", () => {
    it("constructing a Seq works", () => {
        const s = new Seq([1, 2, 3])
        expect(s.collect()).toEqual([1, 2, 3])
    })

    it("constructing an AsyncSeq works", async () => {
        const s = AsyncSeq.from([1, Promise.resolve(2), 3])
        expect(await s.collect()).toEqual([1, 2, 3])
    })
})

describe("added methods", () => {
    it("AsyncSeq.collectSeq", async () => {
        const s = await AsyncSeq.from([1, 2, 3]).collectSeq()
        expect(s.collect()).toEqual([1, 2, 3])
    })
})
