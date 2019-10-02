import Seq from ".."

describe("Seq", () => {
    describe("all", () => {
        it("sanity", () => {
            const xs = new Seq([1, 2, 3, 4])
            const ys = new Seq([1, 2, 0, 4])
            const zs = new Seq([0, 2, 3, 4])

            expect(xs.all(x => x > 0)).toBe(true)
            expect(ys.all(x => x > 0)).toBe(false)
            expect(zs.all(x => x > 0)).toBe(false)
        })
    })

    describe("any", () => {
        it("sanity", () => {
            const xs = new Seq([0, 0, 0, 4])
            const ys = new Seq([0, 2, 0, 0])
            const zs = new Seq([0, 0, 0, 0])

            expect(xs.any(x => x > 0)).toBe(true)
            expect(ys.any(x => x > 0)).toBe(true)
            expect(zs.any(x => x > 0)).toBe(false)
        })
    })

    describe("collect", () => {
        it("sanity: roundtrips", () => {
            expect(new Seq([1, 2, 3]).collect(false)).toEqual([1, 2, 3])
            expect(new Seq(["a", "b", "c"]).collect(true)).toEqual([
                "a",
                "b",
                "c",
            ])
        })

        it("collecting the same sequence twice gives same result", () => {
            const xs = Seq.enumFrom(0).take(4)
            const ys = Seq.iterate(x => 2 * x, 1).take(4)
            const zs = new Seq([1, 2, 3]).map(x => x / 2)
            expect(xs.collect()).toEqual(xs.collect())
            expect(ys.collect()).toEqual(ys.collect())
            expect(zs.collect()).toEqual(zs.collect())
        })
    })

    it("sanity: finite generators create finite sequences", () => {
        const xs = Seq.fromIndexedGenerator(i => (i < 3 ? i : undefined))

        expect(xs.collect()).toEqual([0, 1, 2])
    })

    describe("cons", () => {
        it("sanity: adds an element ot a sequence", () => {
            const xs = Seq.fromRange(0, 3)
            const ys = Seq.cons(10, xs).collect()

            expect(ys).toEqual([10, 0, 1, 2, 3])
        })
    })

    describe("cycle", () => {
        it("repeats a sequence", () => {
            const xs = Seq.cycle([1])
                .take(3)
                .collect()
            const ys = Seq.cycle([2, 3])
                .take(5)
                .collect()

            expect(xs).toEqual([1, 1, 1])
            expect(ys).toEqual([2, 3, 2, 3, 2])
        })
    })

    describe("drop", () => {
        it("does nothing on an empty sequence", () => {
            const xs = Seq.empty()
                .drop(10)
                .collect()
            expect(xs).toEqual([])
        })

        it("does nothing when dropping 0 elements", () => {
            const xs = new Seq([1, 2, 3]).drop(0).collect()
            expect(xs).toEqual([1, 2, 3])
        })

        it("drops n elements from a non-empty sequence", () => {
            const xs = new Seq([1, 2, 3, 4, 5, 6]).drop(3).collect()
            expect(xs).toEqual([4, 5, 6])
        })
    })

    describe("dropWhile", () => {
        it("does nothing on an empty sequence", () => {
            const xs = Seq.empty()
                .dropWhile(constant(true))
                .collect()
            expect(xs).toEqual([])
        })

        it("does nothing when dropping 0 elements", () => {
            const xs = new Seq([1, 2, 3]).dropWhile(constant(false)).collect()
            expect(xs).toEqual([1, 2, 3])
        })

        it("drops elements from a non-empty sequence", () => {
            const xs = new Seq([1, 2, 3, 4, 5, 6])
                .dropWhile(x => x < 4)
                .collect()
            expect(xs).toEqual([4, 5, 6])
        })
    })

    describe("fromRange", () => {
        it("sanity: creates an inclusive range", () => {
            const xs = Seq.fromRange(3, 6)

            expect(xs.collect()).toEqual([3, 4, 5, 6])
        })

        it("throws if to < from", () => {
            expect(() => Seq.fromRange(9, 3)).toThrow(RangeError)
        })

        it("throws if step <= 0", () => {
            expect(() => Seq.fromRange(3, 9, -1)).toThrow(RangeError)
        })
    })

    describe("iterate", () => {
        it("sanity", () => {
            const xs = Seq.iterate(x => x / 2, 128)
                .take(4)
                .collect()
            expect(xs).toEqual([128, 64, 32, 16])
        })
    })

    describe("product", () => {
        it("sanity", () => {
            const xs = Seq.enumFrom(1).take(3)
            const ys = new Seq([1, 1, 1])
            expect(xs.product()).toBe(6)
            expect(ys.product()).toBe(1)
        })
    })

    describe("replicate", () => {
        it("sanity", () => {
            const xs = Seq.replicate(3, 10).collect()
            expect(xs).toEqual([10, 10, 10])
        })
    })

    describe("concat laws", () => {
        it("satisfies associativity", () => {
            const xs = new Seq([1, 2, 3])
            const ys = new Seq([4, 5, 6])
            const zs = new Seq([7, 8, 9])

            expect(
                xs
                    .concat(ys)
                    .concat(zs)
                    .collect(),
            ).toEqual(xs.concat(ys.concat(zs)).collect())
        })

        it("satisfies left identity", () => {
            const empty: Seq<number> = Seq.empty()
            const xs = new Seq([1, 2, 3])

            expect(empty.concat(xs).collect()).toEqual(xs.collect())
        })

        it("satisfies right identity", () => {
            const empty: Seq<number> = Seq.empty()
            const xs = new Seq([1, 2, 3])

            expect(xs.concat(empty).collect()).toEqual(xs.collect())
        })
    })

    describe("map laws", () => {
        it("satisfies identity", () => {
            const xs = new Seq([1, 2, 3]).map(id).collect()

            expect(xs).toEqual([1, 2, 3])
        })
    })

    describe("concatMap laws", () => {
        it("satisfies left identity", () => {
            const f = (x: number) => [x, 2 * x]
            const xs = Seq.singleton(1)
                .concatMap(f)
                .collect()

            expect(xs).toEqual(f(1))
        })

        it("satisfies right identity", () => {
            const xs = [1, 2, 3, 4]
            const ys = new Seq(xs).concatMap(Seq.singleton).collect()

            expect(xs).toEqual(ys)
        })

        it("satisfies associativity", () => {
            const f = (x: number) => descending(x).map(y => y.toString())
            const g = (s: string) => repeat(s, 2)

            const xs = new Seq([0, 1, 3, 5])
            expect(
                xs
                    .concatMap(f)
                    .concatMap(g)
                    .collect(),
            ).toEqual(xs.concatMap(x => new Seq(f(x)).concatMap(g)).collect())
        })
    })

    describe("splitAt", () => {
        it("sanity: works for doc example", () => {
            expect(
                new Seq([1, 2, 3, 4, 5]).splitAt(3).map(s => s.collect()),
            ).toEqual([[1, 2, 3], [4, 5]])
        })

        it("sanity: n <= 0", () => {
            const split = new Seq([1, 2, 3, 4, 5])
                .splitAt(0)
                .map(s => s.collect())

            expect(split).toEqual([[], [1, 2, 3, 4, 5]])
        })

        it("sanity: empty sequence", () => {
            const split = Seq.empty()
                .splitAt(1)
                .map(s => s.collect())

            expect(split).toEqual([[], []])
        })
    })

    describe("take", () => {
        it("sanity: works on infinite sequence", () => {
            const xs = Seq.repeat(1).take(3)
            const ys = Seq.enumFrom(3).take(2)

            expect(xs.collect()).toEqual([1, 1, 1])
            expect(ys.collect()).toEqual([3, 4])
        })

        it("take(count) == id", () => {
            const xs = new Seq([3, 4, 5]).take(3).collect()

            expect(xs).toEqual([3, 4, 5])
        })

        it("take(0) == empty", () => {
            const xs = new Seq([4, 5, 6]).take(0).collect()

            expect(xs).toEqual([])
        })

        it("take(n) => count == n, where n <= input count", () => {
            const xs = new Seq([1, 2, 3, 4]).take(3)

            expect(xs.count()).toBe(3)
        })
    })

    describe("count", () => {
        it("sanity: works on Array input iterables", () => {
            const xs = new Seq([1, 2, 3, 4])

            expect(xs.count()).toBe(4)
        })

        it("sanity: works on memoized input iterables", () => {
            const xs = new Seq([1, 2, 3, 4]).map(x => 2 * x).memoize()

            expect(xs.count()).toBe(4)
        })
    })

    describe("takeWhile", () => {
        it("takeWhile(constant(false)) == empty", () => {
            const xs = new Seq([3, 4, 5]).takeWhile(constant(false)).collect()

            expect(xs).toEqual([])
        })

        it("xs.takeWhile(constant(true)) == xs", () => {
            const xs = new Seq([4, 5, 6]).takeWhile(constant(true)).collect()

            expect(xs).toEqual([4, 5, 6])
        })
    })

    describe("zip", () => {
        it("sanity", () => {
            const xs = new Seq([1, 2, 3]).zip(["a", "b", "c"]).collect()

            expect(xs).toEqual([[1, "a"], [2, "b"], [3, "c"]])
        })

        it("empty.zip(xs) == empty", () => {
            const xs = Seq.empty()
                .zip(["a", "b", "c"])
                .collect()

            expect(xs).toEqual([])
        })

        it("xs.zip(empty) == empty", () => {
            const xs = new Seq([1, 2, 3]).zip([]).collect()

            expect(xs).toEqual([])
        })
    })

    describe("zipWith", () => {
        it("sanity", () => {
            const xs = new Seq([1, 2, 3])
                .zipWith((a, b) => a + b, [4, 5, 6])
                .collect()

            expect(xs).toEqual([5, 7, 9])
        })

        it("empty.zipWith(f, xs) == empty", () => {
            const xs = Seq.empty()
                .zipWith((_, b) => b, ["a", "b", "c"])
                .collect()

            expect(xs).toEqual([])
        })

        it("xs.zipWith(f, empty) == empty", () => {
            const xs = new Seq([1, 2, 3]).zipWith((a, _) => a, []).collect()

            expect(xs).toEqual([])
        })
    })

    describe("filter", () => {
        it("filter(constant(true)) == id", () => {
            const xs = new Seq([1, 2, 3, 4, 5])

            expect(xs.filter(constant(true)).collect()).toEqual(xs.collect())
        })

        it("filter(constant(false)) == empty", () => {
            const xs = new Seq([1, 2, 3, 4, 5])

            expect(xs.filter(constant(false)).collect()).toEqual([])
        })

        it("sanity: even keeps even numbers", () => {
            const xs = new Seq([1, 2, 3, 4, 5, 6])
            expect(xs.filter(even).collect()).toEqual([2, 4, 6])
        })
    })

    describe("indexed", () => {
        it("xs.indexed().map(value) == id", () => {
            const xs = new Seq([1, 2, 3, 4, 5])

            expect(
                xs
                    .indexed()
                    .map(x => x.value)
                    .collect(),
            ).toEqual(xs.collect())
        })

        it("xs.indexed().map(index) == fromRange(0,count-1)", () => {
            const xs = new Seq(["a", "b", "c"]).indexed()

            expect(xs.map(x => x.index).collect()).toEqual(
                Seq.fromRange(0, 2).collect(),
            )
        })
    })

    describe("reduce", () => {
        it("should handle the empty sequence case gracefully", () => {
            const xs = new Seq([])

            expect(xs.reduce((x, p) => x + p, 0)).toBe(0)
        })

        it("should reduce left-associatively", () => {
            const xs = new Seq([2, 2, 4])

            const expected = xs.collect().reduce((p, x) => p / x, 32)
            expect(xs.reduce((p, x) => p / x, 32)).toBe(expected)
        })
    })

    describe("reduceRight", () => {
        it("should handle the empty sequence case gracefully", () => {
            const xs = new Seq([])

            expect(xs.reduceRight((x, p) => x + p, 0)).toBe(0)
        })

        it("should reduce right-associatively", () => {
            const xs = new Seq([32, 8, 4])

            const expected = xs.collect().reduceRight((p, x) => x / p, 2)
            expect(xs.reduceRight((x, p) => x / p, 2)).toBe(expected)
        })
    })

    describe("intersperse, intercalate", () => {
        it("sanity: intersperse", () => {
            const str = new Seq("abcdef")

            expect(str.intersperse(",").collectString()).toEqual("a,b,c,d,e,f")
        })

        it("sanity: intercalate", () => {
            const xs = new Seq([1, 2, 3, 4, 5])
            const expected = [1, 0, 0, 2, 0, 0, 3, 0, 0, 4, 0, 0, 5]
            expect(xs.intercalate([0, 0]).collect()).toEqual(expected)
        })

        it("intercalate([]) == id", () => {
            const xs = new Seq([1, 2, 3]).intercalate([])
            expect(xs.collect()).toEqual([1, 2, 3])
        })
    })

    describe("memoize", () => {
        it("sanity: partial iteration does not break subsequent iterations", () => {
            const seq = new Seq([1, 2, 3, 4]).map(x => 2 * x).memoize()

            let i = 0
            const iter = seq[Symbol.iterator]()
            while (i < 2) {
                ++i
                iter.next()
            }

            const xs = []
            for (const x of seq) {
                xs.push(x)
            }

            expect(xs).toEqual([2, 4, 6, 8])
        })

        it("sanity: collect fully evaluates the sequence", () => {
            let i = 0
            const seq = new Seq([1, 2, 3, 4])
                .map(x => 2 * x)
                .map(x => {
                    i++
                    return x
                })
                .memoize()

            expect(seq.collect()).toEqual([2, 4, 6, 8])
            expect(seq.sum()).toBe(20)
            expect(i).toBe(4)
        })

        it("sanity: works on infinite sequences", () => {
            const xs = Seq.enumFrom(0, 2).memoize()

            expect(xs.take(3).collect()).toEqual([0, 2, 4])
        })

        it("never evaluates an array, since it's already evaluated", () => {
            const xs = [1, 2, 3, 4]
            const seq = new Seq(xs).memoize()

            expect(seq.collect(false)).toBe(xs)
        })

        it("iterates the same sequence only once", () => {
            let i = 0
            const seq = new Seq([1, 2, 3, 4])
                .map(x => 2 * x)
                .concat([10, 12])
                .map(x => {
                    i++
                    return x.toString()
                })
                .memoize()

            const xs = seq.reduce((a, b) => a.concat([b]), [] as string[])
            const ys = seq.reduce((a, b) => a.concat([b]), [] as string[])

            expect(xs).toEqual(ys)
            expect(i).toBe(6)
        })

        it("preserves evaluation under downlevel sharing", () => {
            let i = 0
            const memSeq = new Seq([1, 2, 3, 4])
                .map(x => 2 * x)
                .concat([10, 12])
                .map(x => {
                    i++
                    return x - 1
                })
                .memoize()

            const xs = memSeq
                .concat([20, 21, 22])
                .concatMap(x => repeat(x, 2))
                .take(5)
                .collect()
            const ys = memSeq.map(x => 5 + x).collect()

            expect(xs).toEqual([1, 1, 3, 3, 5])
            expect(ys).toEqual([6, 8, 10, 12, 14, 16])
            expect(i).toBe(6)
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
    const result: T[] = []

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
