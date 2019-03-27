if (typeof (Symbol as any).asyncIterator === "undefined") {
    ;(Symbol as any).asyncIterator =
        // @ts-ignore
        Symbol.asyncIterator || Symbol("asyncIterator")
}

import { AsyncSeq } from "./AsyncSeq"

describe("AsyncSeq", () => {
    describe("all", () => {
        it("sanity", () => {
            const xs = AsyncSeq.fromIterable([1, 2, 3, 4])
            const ys = AsyncSeq.fromIterable([1, 2, 0, 4])
            const zs = AsyncSeq.fromIterable([0, 2, 3, 4])

            expect(xs.all(x => x > 0)).resolves.toBe(true)
            expect(ys.all(x => x > 0)).resolves.toBe(false)
            expect(zs.all(x => x > 0)).resolves.toBe(false)
        })

        it("short-circuits", async () => {
            const xs = AsyncSeq.iterate(x => 2 * x, 1)

            expect(await xs.all(x => x < 10)).toBeFalsy()
        })
    })

    describe("any", () => {
        it("sanity", () => {
            const xs = AsyncSeq.fromIterable([0, 0, 0, 4])
            const ys = AsyncSeq.fromIterable([0, 2, 0, 0])
            const zs = AsyncSeq.fromIterable([0, 0, 0, 0])

            expect(xs.any(x => x > 0)).resolves.toBe(true)
            expect(ys.any(x => x > 0)).resolves.toBe(true)
            expect(zs.any(x => x > 0)).resolves.toBe(false)
        })

        it("short-circuits", async () => {
            const xs = AsyncSeq.iterate(x => 2 * x, 1)

            expect(await xs.any(x => x < 8)).toBeTruthy()
        })
    })

    describe("collect", () => {
        it("sanity: roundtrips", () => {
            expect(AsyncSeq.fromIterable([1, 2, 3]).collect()).resolves.toEqual(
                [1, 2, 3],
            )
            expect(
                AsyncSeq.fromIterable(["a", "b", "c"]).collect(),
            ).resolves.toEqual(["a", "b", "c"])
        })
    })

    it("sanity: finite generators create finite sequences", () => {
        const xs = AsyncSeq.fromIterable([0, 1, 2])

        expect(xs.collect()).resolves.toEqual([0, 1, 2])
    })

    describe("cons", () => {
        it("sanity: adds an element ot a sequence", () => {
            const xs = AsyncSeq.fromIterable([0, 1, 2, 3])
            const ys = AsyncSeq.cons(10, xs).collect()

            expect(ys).resolves.toEqual([10, 0, 1, 2, 3])
        })
    })

    describe("cycle", () => {
        it("repeats a sequence", () => {
            const xs = AsyncSeq.cycle(AsyncSeq.fromIterable([1]))
                .take(3)
                .collect()
            const ys = AsyncSeq.cycle(AsyncSeq.fromIterable([2, 3]))
                .take(5)
                .collect()

            expect(xs).resolves.toEqual([1, 1, 1])
            expect(ys).resolves.toEqual([2, 3, 2, 3, 2])
        })
    })

    describe("drop", () => {
        it("does nothing on an empty sequence", () => {
            const xs = AsyncSeq.fromIterable([])
                .drop(10)
                .collect()
            expect(xs).resolves.toEqual([])
        })

        it("does nothing when dropping 0 elements", () => {
            const xs = AsyncSeq.fromIterable([1, 2, 3])
                .drop(0)
                .collect()
            expect(xs).resolves.toEqual([1, 2, 3])
        })

        it("drops n elements from a non-empty sequence", () => {
            const xs = AsyncSeq.fromIterable([1, 2, 3, 4, 5, 6])
                .drop(3)
                .collect()
            expect(xs).resolves.toEqual([4, 5, 6])
        })
    })

    describe("dropWhile", () => {
        it("does nothing on an empty sequence", () => {
            const xs = AsyncSeq.fromIterable([])
                .dropWhile(constant(true))
                .collect()
            expect(xs).resolves.toEqual([])
        })

        it("does nothing when dropping 0 elements", () => {
            const xs = AsyncSeq.fromIterable([1, 2, 3])
                .dropWhile(constant(false))
                .collect()
            expect(xs).resolves.toEqual([1, 2, 3])
        })

        it("drops elements from a non-empty sequence", () => {
            const xs = AsyncSeq.fromIterable([1, 2, 3, 4, 5, 6])
                .dropWhile(x => x < 4)
                .collect()
            expect(xs).resolves.toEqual([4, 5, 6])
        })
    })

    describe("iterate", () => {
        it("sanity", () => {
            const xs = AsyncSeq.iterate(x => Promise.resolve(x / 2), 128)
                .take(4)
                .collect()
            expect(xs).resolves.toEqual([128, 64, 32, 16])
        })
    })

    describe("sum", () => {
        it("sanity", async () => {
            const xs = AsyncSeq.iterate(x => Promise.resolve(2 * x), 1).take(3)
            const ys = AsyncSeq.fromIterable([1, 1, 1])
            expect(await xs.sum()).toBe(7)
            expect(await ys.sum()).toBe(3)
        })
    })

    describe("product", () => {
        it("sanity", async () => {
            const xs = AsyncSeq.iterate(x => Promise.resolve(2 * x), 1).take(3)
            const ys = AsyncSeq.fromIterable([1, 1, 1])
            expect(await xs.product()).toBe(8)
            expect(await ys.product()).toBe(1)
        })
    })

    describe("concat laws", () => {
        it("satisfies associativity", async () => {
            const xs = AsyncSeq.fromIterable([1, 2, 3])
            const ys = AsyncSeq.fromIterable([4, 5, 6])
            const zs = [7, 8, 9]

            expect(
                await xs
                    .concat(ys)
                    .concat(zs)
                    .collect(),
            ).toEqual(await xs.concat(ys.concat(zs)).collect())
        })

        it("satisfies left identity", async () => {
            const empty = AsyncSeq.fromIterable<number>([])
            const xs = AsyncSeq.fromIterable([1, 2, 3])

            expect(await empty.concat(xs).collect()).toEqual(await xs.collect())
        })

        it("satisfies right identity", async () => {
            const empty = AsyncSeq.fromIterable<number>([])
            const xs = AsyncSeq.fromIterable([1, 2, 3])

            expect(await xs.concat(empty).collect()).toEqual(await xs.collect())
        })
    })

    describe("map laws", () => {
        it("satisfies identity", () => {
            const xs = AsyncSeq.fromIterable([1, 2, 3])
                .map(id)
                .collect()

            expect(xs).resolves.toEqual([1, 2, 3])
        })
    })

    describe("concatMap laws", () => {
        it("satisfies left identity", async () => {
            const f = (x: number) => [x, 2 * x]
            const xs = await AsyncSeq.singleton(Promise.resolve(1))
                .concatMap(f)
                .collect()

            expect(xs).toEqual(f(1))
        })

        it("satisfies right identity", async () => {
            const xs = [1, 2, 3, 4]
            const ys = await AsyncSeq.fromIterable(xs)
                .concatMap(x => [x])
                .collect()

            expect(xs).toEqual(ys)
        })

        it("satisfies associativity", () => {
            const f = (x: number) => descending(x).map(y => y.toString())
            const g = (s: string) => repeat(s, 2)

            const xs = AsyncSeq.fromIterable([0, 1, 3, 5])
            expect(
                xs
                    .concatMap(f)
                    .concatMap(g)
                    .collect(),
            ).toEqual(
                xs
                    .concatMap(x => AsyncSeq.fromIterable(f(x)).concatMap(g))
                    .collect(),
            )
        })
    })

    describe("take", () => {
        it("sanity: works on infinite sequence", () => {
            const xs = AsyncSeq.iterate(x => Promise.resolve(2 * x), 2)
                .take(3)
                .collect()
            const ys = AsyncSeq.cycle(AsyncSeq.fromIterable([3, 4]))
                .take(2)
                .collect()

            expect(xs).resolves.toEqual([2, 4, 8])
            expect(ys).resolves.toEqual([3, 4])
        })

        it("take(count) == id", () => {
            const xs = AsyncSeq.fromIterable([3, 4, 5])
                .take(3)
                .collect()

            expect(xs).resolves.toEqual([3, 4, 5])
        })

        it("take(0) == empty", () => {
            const xs = AsyncSeq.fromIterable([4, 5, 6])
                .take(0)
                .collect()

            expect(xs).resolves.toEqual([])
        })

        it("take(n) => count == n, where n <= input count", () => {
            const xs = AsyncSeq.fromIterable([1, 2, 3, 4]).take(3)

            expect(xs.count()).resolves.toBe(3)
        })
    })

    describe("count", () => {
        it("sanity: works on Array input iterables", () => {
            const xs = AsyncSeq.fromIterable([1, 2, 3, 4])

            expect(xs.count()).resolves.toBe(4)
        })
    })

    describe("splitAt", () => {
        it("sanity: works for doc example", async () => {
            const split = await Promise.all(
                AsyncSeq.fromIterable([1, 2, 3, 4, 5])
                    .splitAt(3)
                    .map(s => s.collect()),
            )

            expect(split).toEqual([[1, 2, 3], [4, 5]])
        })

        it("sanity: n <= 0", async () => {
            const split = await Promise.all(
                AsyncSeq.fromIterable([1, 2, 3, 4, 5])
                    .splitAt(0)
                    .map(s => s.collect()),
            )

            expect(split).toEqual([[], [1, 2, 3, 4, 5]])
        })

        it("sanity: empty sequence", async () => {
            const split = await Promise.all(
                AsyncSeq.fromIterable([])
                    .splitAt(1)
                    .map(s => s.collect()),
            )

            expect(split).toEqual([[], []])
        })
    })

    describe("takeWhile", () => {
        it("takeWhile(constant(false)) == empty", () => {
            const xs = AsyncSeq.fromIterable([3, 4, 5])
                .takeWhile(constant(false))
                .collect()

            expect(xs).resolves.toEqual([])
        })

        it("xs.takeWhile(constant(true)) == xs", () => {
            const xs = AsyncSeq.fromIterable([4, 5, 6])
                .takeWhile(constant(true))
                .collect()

            expect(xs).resolves.toEqual([4, 5, 6])
        })
    })

    describe("zip", () => {
        it("sanity", () => {
            const xs = AsyncSeq.fromIterable([1, 2, 3])
                .zip(AsyncSeq.fromIterable(["a", "b", "c"]))
                .collect()

            expect(xs).resolves.toEqual([[1, "a"], [2, "b"], [3, "c"]])
        })

        it("empty.zip(xs) == empty", () => {
            const xs = AsyncSeq.fromIterable<number>([])
                .zip(["a", "b", "c"])
                .collect()

            expect(xs).resolves.toEqual([])
        })

        it("xs.zip(empty) == empty", () => {
            const xs = AsyncSeq.fromIterable([1, 2, 3])
                .zip([])
                .collect()

            expect(xs).resolves.toEqual([])
        })
    })

    describe("zipWith", () => {
        it("sanity", async () => {
            const xs = await AsyncSeq.fromIterable([1, 2, 3])
                .zipWith(
                    (a, b: number) => a + b,
                    AsyncSeq.fromIterable([4, 5, 6, 7]),
                )
                .collect()

            expect(xs).toEqual([5, 7, 9])
        })

        it("empty.zipWith(f, xs) == empty", () => {
            const xs = AsyncSeq.fromIterable<number>([])
                .zipWith((_, b) => b, ["a", "b", "c"])
                .collect()

            expect(xs).resolves.toEqual([])
        })

        it("xs.zipWith(f, empty) == empty", () => {
            const xs = AsyncSeq.fromIterable([1, 2, 3])
                .zipWith((a, _) => a, [])
                .collect()

            expect(xs).resolves.toEqual([])
        })
    })

    describe("filter", () => {
        it("filter(constant(true)) == id", async () => {
            const xs = AsyncSeq.fromIterable([1, 2, 3, 4, 5])

            expect(await xs.filter(constant(true)).collect()).toEqual(
                await xs.collect(),
            )
        })

        it("filter(constant(false)) == empty", async () => {
            const xs = AsyncSeq.fromIterable([1, 2, 3, 4, 5])

            expect(await xs.filter(constant(false)).collect()).toEqual([])
        })

        it("sanity: even keeps even numbers", async () => {
            const xs = AsyncSeq.fromIterable([1, 2, 3, 4, 5, 6])
            expect(await xs.filter(even).collect()).toEqual([2, 4, 6])
        })
    })

    describe("indexed", () => {
        it("xs.indexed().map(value) == id", async () => {
            const xs = AsyncSeq.fromIterable([1, 2, 3, 4, 5])

            expect(
                await xs
                    .indexed()
                    .map(x => x.value)
                    .collect(),
            ).toEqual(await xs.collect())
        })

        it("xs.indexed().map(index) == fromRange(0,count-1)", async () => {
            const xs = AsyncSeq.fromIterable(["a", "b", "c"]).indexed()

            expect(xs.map(x => x.index).collect()).toEqual(
                AsyncSeq.fromIterable([0, 1, 2]).collect(),
            )
        })
    })

    describe("intersperse, intercalate", () => {
        it("sanity: intersperse", () => {
            const str = AsyncSeq.fromIterable(["a", "b", "c", "d", "e", "f"])

            expect(str.intersperse(",").collectString()).resolves.toEqual(
                "a,b,c,d,e,f",
            )
        })

        it("sanity: intercalate", () => {
            const xs = AsyncSeq.fromIterable([1, 2, 3, 4, 5])
            const expected = [1, 0, 0, 2, 0, 0, 3, 0, 0, 4, 0, 0, 5]
            expect(xs.intercalate([0, 0]).collect()).resolves.toEqual(expected)
        })

        it("intercalate([]) == id", () => {
            const xs = AsyncSeq.fromIterable([1, 2, 3]).intercalate([])
            expect(xs.collect()).resolves.toEqual([1, 2, 3])
        })
    })
})

const testIter = {
    index: 0,
    reset: () => {
        testIter.index = 0
    },
    next: () => ({
        done: testIter.index > 3 ? true : false,
        value: testIter.index++,
    }),
}

const id = <T>(x: T) => x
const constant = <T>(x: T) => <U>(_: U) => x
const repeat = <T>(x: T, n: number) => {
    const result = []

    for (let i = 0; i < n; ++i) {
        result.push(x)
    }

    return result
}
const descending = (x: number) => {
    const result: number[] = []
    for (let i = 0; i <= x; ++i) {
        result.push(i)
    }

    return result
}
const even = (x: number) => x % 2 === 0
