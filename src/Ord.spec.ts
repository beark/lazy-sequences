import { compareOn, comparing } from "./Ord"

describe("Ord", () => {
    const a: ObjectType = {
        a: 4,
        b: "abc",
    }

    const b: ObjectType = {
        a: 4,
        b: "def",
    }

    const c: ObjectType = {
        a: 4,
        b: "abc",
    }

    const d: ObjectType = {
        a: 1,
        b: "abc",
    }

    const nestedA: NestedObjectType = {
        x: a,
        y: 0,
    }

    const nestedB: NestedObjectType = {
        x: b,
        y: 1,
    }

    describe("comparing", () => {
        const getA = (t: ObjectType) => t.a
        const getB = (t: ObjectType) => t.b

        it("thenBy", () => {
            const cmp = comparing(getA).thenBy(comparing(getB))
            expect(cmp(a, b)).toBeLessThan(0)
            expect(cmp(b, a)).toBeGreaterThan(0)
            expect(cmp(a, c)).toBe(0)
            expect(cmp(a, d)).toBeGreaterThan(0)
        })

        it("desc", () => {
            const cmp = comparing(getA)
                .thenBy(comparing(getB))
                .desc()

            expect(cmp(a, b)).toBeGreaterThan(0)
            expect(cmp(b, a)).toBeLessThan(0)
            expect(cmp(a, c)).toBe(0)
            expect(cmp(a, d)).toBeLessThan(0)
        })
    })

    describe("compareOn", () => {
        const compareA = compareOn<ObjectType>("a")
        const compareB = compareOn<ObjectType>("b")
        const compareY = compareOn<NestedObjectType>("y")

        expect(compareA(a, b)).toBe(0)
        expect(compareA(a, d)).toBeGreaterThan(0)
        expect(compareA(d, a)).toBeLessThan(0)
        expect(compareB(a, b)).toBeLessThan(0)
        expect(compareY(nestedA, nestedB)).toBeLessThan(0)
    })
})

type ObjectType = {
    a: number
    b: string
}

type NestedObjectType = {
    x: ObjectType
    y: number
}
