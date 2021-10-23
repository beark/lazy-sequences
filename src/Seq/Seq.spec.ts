import { Gen, Range } from "@propcheck/core"
import * as G from "@propcheck/core/generators"
import { given } from "@propcheck/jest"
import Seq from ".."

// Utility generator
const posInt = G.nat.map(n => n + 1)

// Infinite generators
const enumeratedSeq = G.nat.andThen(n =>
    G.nat.scale(s => Math.floor(s / 10)).map(m => Seq.enumFrom(n, m + 1)),
)
const iteratedSeq = G.nat.andThen(n =>
    G.nat.map(m => Seq.iterate(x => n * x, m)),
)
const repeatedSeq = G.nat.map(n => Seq.repeat(n))
const cycledSeq = G.arrayOf(G.nat).map(arr => Seq.cycle(arr))

// Finite generators
const indexedSeq = G.nat.map(n =>
    Seq.fromIndexedGenerator(i => (i >= n ? undefined : i)),
)
const iterableSeq = G.arrayOf(G.nat).map(arr => new Seq(arr))
const rangeSeq = G.nat
    .map(to => to + 1)
    .andThen(to =>
        G.integral_(new Range(0, Math.max(0, to - 1), 0)).andThen(from =>
            G.nat
                .scale(s => Math.floor(s / 10))
                .map(step => Seq.fromRange(from, to, 1 + step)),
        ),
    )
const singletonSeq = G.nat.map(n => Seq.singleton(n))
const replicatedSeq = G.nat.map(n => Seq.replicate(n, n))
const emptySeq = G.oneOf_(
    Gen.const(Seq.empty()),
    Gen.const(Seq.fromIndexedGenerator(() => undefined as any as never)),
    Gen.const(Seq.cycle([])),
    Gen.const(Seq.enumFrom(0).take(0)),
    Gen.const(Seq.enumFrom(0).drop(Infinity)),
)

const consSeq = G.oneOf_(
    enumeratedSeq,
    iteratedSeq,
    repeatedSeq,
    cycledSeq,
    indexedSeq,
    iterableSeq,
    rangeSeq,
    singletonSeq,
    replicatedSeq,
    emptySeq,
).andThen(s => G.nat.map(n => Seq.cons(n, s)))

const finiteSeq: Gen<Seq<number>> = G.nat.andThen(n =>
    G.oneOf_(
        enumeratedSeq.map(s => s.take(n)),
        iteratedSeq.map(s => s.take(n)),
        repeatedSeq.map(s => s.take(n)),
        indexedSeq.map(s => s.take(n)),
        cycledSeq.map(s => s.take(n)),
        consSeq.map(s => s.take(n)),
        iterableSeq,
        rangeSeq,
        singletonSeq,
        replicatedSeq,
        emptySeq,
    ),
)

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

    // Uncons properties
    const nonEmptyAlwaysHasAHead = (xs: Seq<unknown>) => {
        const [h, _] = xs.unCons()
        return h !== undefined
    }

    const emptyNeverHasAHead = (xs: Seq<unknown>) => {
        const [h, _] = xs.unCons()
        return h === undefined
    }

    given(consSeq).operation("unCons").shouldSatisfy(nonEmptyAlwaysHasAHead)
    given(emptySeq).operation("unCons").shouldSatisfy(emptyNeverHasAHead)

    // Collect properties
    const roundtrips = (xs: number[]) => {
        expect(new Seq(xs).collect(true)).toEqual(xs)
    }

    const roundtripsNoCopy = (xs: number[]) => {
        expect(new Seq(xs).collect(false)).toEqual(xs)
    }

    const collectIsIdempotent = (xs: Seq<unknown>) => {
        expect(xs.collect()).toEqual(xs.collect())
    }

    given(G.arrayOf(G.nat)).operation("collect").shouldSatisfy(roundtrips)
    given(G.arrayOf(G.nat)).operation("collect").shouldSatisfy(roundtripsNoCopy)
    given(finiteSeq).operation("collect").shouldSatisfy(collectIsIdempotent)

    // Cons properties
    const addsElement = (x: unknown, xs: Seq<unknown>) => {
        const consed = Seq.cons(x, xs)
        const spreadConsed = [...consed]
        const spread = [x, ...xs]
        expect(spreadConsed).toEqual(spread)
    }

    given(G.nat, finiteSeq).operation("cons").shouldSatisfy(addsElement)

    describe("unCons", () => {
        it("sanity: gets head + tail of simple sequences", () => {
            const xs = new Seq([])
            const ys = new Seq([0, 1, 2])

            const [x, xxs] = xs.unCons()
            expect(x).toBe(undefined)
            expect([...xxs]).toEqual([])

            const [y, yys] = ys.unCons()
            expect(y).toBe(0)
            expect([...yys]).toEqual([1, 2])
        })
    })

    // Cycle properties
    const cyclingEmptyIsEmpty = (xs: Seq<unknown>) => {
        expect(xs.collect()).toEqual([])
    }

    given(emptySeq).operation("cycle").shouldSatisfy(cyclingEmptyIsEmpty)

    describe("cycle", () => {
        it("repeats a sequence", () => {
            const xs = Seq.cycle([1]).take(3).collect()
            const ys = Seq.cycle([2, 3]).take(5).collect()

            expect(xs).toEqual([1, 1, 1])
            expect(ys).toEqual([2, 3, 2, 3, 2])
        })

        it("works with exotic iterables", () => {
            const xs = Seq.cycle(Seq.fromRange(1, 3)).take(6).collect()
            expect(xs).toEqual([1, 2, 3, 1, 2, 3])
        })
    })

    // Drop properties
    const dropOnEmptyIsNoop = (xs: Seq<unknown>, n: number) => {
        expect(xs.drop(n).collect()).toEqual([])
    }

    const Drop0IsNoop = (xs: Seq<unknown>) => {
        expect(xs.collect()).toEqual(xs.drop(0).collect())
    }

    given(emptySeq, posInt).operation("drop").shouldSatisfy(dropOnEmptyIsNoop)
    given(finiteSeq).operation("drop").shouldSatisfy(Drop0IsNoop)

    describe("drop", () => {
        it("drops n elements from a non-empty sequence", () => {
            const xs = new Seq([1, 2, 3, 4, 5, 6]).drop(3).collect()
            expect(xs).toEqual([4, 5, 6])
        })
    })

    describe("dropWhile", () => {
        it("does nothing on an empty sequence", () => {
            const xs = Seq.empty().dropWhile(constant(true)).collect()
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

    // Concat properties
    const associativity = (
        xs: Seq<unknown>,
        ys: Seq<unknown>,
        zs: Seq<unknown>,
    ) => {
        expect(xs.concat(ys).concat(zs).collect()).toEqual(
            xs.concat(ys.concat(zs)).collect(),
        )
    }
    const leftIdentity = (xs: Seq<unknown>) => {
        const empty: Seq<unknown> = Seq.empty()
        expect(empty.concat(xs).collect()).toEqual(xs.collect())
    }
    const rightIdentity = (xs: Seq<unknown>) => {
        const empty: Seq<unknown> = Seq.empty()
        expect(xs.concat(empty).collect()).toEqual(xs.collect())
    }

    given(finiteSeq, finiteSeq, finiteSeq)
        .operation("concat")
        .shouldSatisfy(associativity)

    given(finiteSeq).operation("concat").shouldSatisfy(leftIdentity)
    given(finiteSeq).operation("concat").shouldSatisfy(rightIdentity)

    // Map properties
    const identity = (xs: Seq<unknown>) => {
        const ys = xs.map(id)

        expect(ys.collect()).toEqual(xs.collect())
    }

    given(finiteSeq).operation("map").shouldSatisfy(identity)

    // ConcatMap properties
    const concatMap = {
        leftIdentity: (x: unknown, f: (x: unknown) => Iterable<unknown>) => {
            const ys = Seq.singleton(x).concatMap(f).collect()
            expect(ys).toEqual([...f(x)])
        },
        rightIdentity: (xs: Seq<unknown>) => {
            const ys = xs.concatMap(Seq.singleton).collect()

            expect(ys).toEqual(xs.collect())
        },
        associativity: (xs: Seq<number>) => {
            // These are a bit silly, but the performance penalty of using
            // the fn generator is currently a bit too much...
            const f = (x: number) =>
                descending(Math.floor(x / 2)).map(y => y.toString())
            const g = (s: string) => repeat(s, 2)

            expect(xs.concatMap(f).concatMap(g).collect()).toEqual(
                xs.concatMap(x => new Seq(f(x)).concatMap(g)).collect(),
            )
        },
    }

    given(G.nat, G.fn(finiteSeq, 20))
        .operation("concatMap")
        .shouldSatisfy(concatMap.leftIdentity)

    given(finiteSeq)
        .operation("concatMap")
        .shouldSatisfy(concatMap.rightIdentity)

    given(finiteSeq)
        .operation("concatMap")
        .shouldSatisfy(concatMap.associativity)

    describe("splitAt", () => {
        it("sanity: works for doc example", () => {
            expect(
                new Seq([1, 2, 3, 4, 5]).splitAt(3).map(s => s.collect()),
            ).toEqual([
                [1, 2, 3],
                [4, 5],
            ])
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

            expect(xs).toEqual([
                [1, "a"],
                [2, "b"],
                [3, "c"],
            ])
        })

        it("empty.zip(xs) == empty", () => {
            const xs = Seq.empty().zip(["a", "b", "c"]).collect()

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
const constant =
    <T>(x: T) =>
    <U>(_: U) =>
        x
const repeat = <T>(x: T, n: number) => {
    const result: T[] = []

    for (let i = 0; i < n; ++i) {
        result.push(x)
    }

    return result
}
const descending = (x: number) =>
    Seq.fromIndexedGenerator(i => (i <= x && i <= 3 ? x * i : undefined))

const even = (x: number) => x % 2 === 0
