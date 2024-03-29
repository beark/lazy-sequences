import type { IndexedValue } from "../common"
import { ConcatIterable } from "./Concat"
import { ConsIterable } from "./Cons"
import { CycleIterable } from "./Cycle"
import { DropIterable, DropWhileIterable } from "./Drop"
import { FilterIterable } from "./Filter"
import { IntercalateIterable, IntersperseIterable } from "./Intersperse"
import { IterateIterable } from "./Iterate"
import { JoinIterable } from "./Join"
import { MapIterable } from "./Map"
import { isMemoizingIterable, MemoizingIterable } from "./Memoize"
import { EnumFromIterable, RangeIterable } from "./Range"
import { TakeIterable, TakeWhileIterable } from "./Take"
import { ZipIterable, ZipWithIterable } from "./Zip"

/**
 * An iterable sequence of values of type `T`.
 */
export class Seq<T> implements Iterable<T> {
    /**
     * Prepend an element to a sequence.
     *
     * @remarks
     * Evaluating the returned sequence is effectful if, and only if, evaluating
     * `xs` is effectful.
     *
     * @nosideeffects
     * @param x - The element to prepend.
     * @param xs - The sequence to prepend to.
     * @returns The sequence starting with `x`, followed by `xs`
     */
    static cons<T, U>(x: T, xs: Iterable<U>): Seq<T | U> {
        return new Seq(new ConsIterable<T | U>(x, xs))
    }

    /**
     * Infinitely cycle the elements of some `Iterable`.
     *
     * @remarks
     * If the input `Iterable` is already infinitely long, this is effectively
     * a no-op.
     *
     * Evaluation of the returned sequence is effectful if, and only if,
     * evaluation of `it` is effectful.
     *
     * @nosideeffects
     * @param it - Iterable of elements to cycle.
     * @returns
     *   A sequence that goes through every element of `it`, and then starts
     *   over in an infinite cycle.
     * @example
     * ```
     * Seq.cycle([1,2]).take(5).collect()
     *   === [1,2,1,2,1]
     * ```
     */
    static cycle<T>(it: Iterable<T>): Seq<T> {
        return new Seq(new CycleIterable(it))
    }

    /**
     * The empty sequence.
     *
     * @nosideeffects
     * @returns An empty sequence.
     */
    static empty(): Seq<never> {
        return new Seq([])
    }

    /**
     * Enumerate all numbers from some given starting point and a step size,
     * forever.
     *
     * @remarks
     * Evaluation of the returned sequence is effect-free.
     *
     * @nosideeffects
     * @param from - First number in the sequence.
     * @param step - How far to step each iteration. Defaults to `1`.
     * @returns
     *   An infinite sequence starting at `from`, changing by `step` each step
     *   of iteration.
     * @example
     * ```
     * Seq.enumFrom(0).take(5).collect()
     *   === [0,1,2,3,4]
     * ```
     */
    static enumFrom(from: number, step: number = 1): Seq<number> {
        return new Seq(new EnumFromIterable(from, step))
    }

    /**
     * Construct a potentially infinite sequence by iteratively calling some
     * generator function. The sequence is considered ended if the generator
     * returns `undefined`.
     *
     * @remarks
     * Any effects `g` may have are left unexecuted until the returned sequence
     * is evaluated (for example with {@link collect}).
     *
     * @nosideeffects
     * @param g -
     *   Generator function that, given an index, returns the element that
     *   should appear at that position in the sequence.
     * @returns Sequence over all the elements `g` can generate.
     * @example
     * ```
     * Seq.fromIndexedGenerator(
     *     i => i > 3 ? undefined : i
     * ).collect()
     *   === [0, 1, 2]
     * ```
     */
    static fromIndexedGenerator<T>(g: (i: number) => T | undefined): Seq<T> {
        return Seq.enumFrom(0)
            .map(g)
            .takeWhile(x => x !== undefined) as Seq<T>
    }

    /**
     * Create a sequence of all the numbers in a given (inclusive) range.
     *
     * @remarks
     * Evaluation of the returned sequence is effect-free.
     *
     * @nosideeffects
     * @param from - The first number in the range.
     * @param to - The final number in the range.
     * @param step - Size of each iteration step. Defaults to `1`.
     * @returns The sequence of the range [from..to]
     */
    static fromRange(from: number, to: number, step: number = 1): Seq<number> {
        if (to < from) {
            throw new RangeError("from must be smaller than to")
        }

        if (step <= 0) {
            throw new RangeError("step must be larger than 0")
        }

        return new Seq(new RangeIterable(from, to, step))
    }

    /**
     * Generate an infinite sequence by repeated application of a given
     * function.
     *
     * @remarks
     * Note that if `f` is an effectful function, its effects are "suspended"
     * until evaluation of the returned sequence. Ie, the effects of `f` are
     * executed once per element generated when running {@link collect} and
     * other evaluation methods.
     *
     * @nosideeffects
     * @param f - Function to apply to generate new values.
     * @param x - Initial value.
     * @returns The sequence of applying `f` infinitely recursively on `x`.
     * @example
     * ```
     * Seq.iterate(f, x).take(3).collect()
     *   === [x, f(x), f(f(x))]
     * ```
     */
    static iterate<T>(f: (x: T) => T, x: T): Seq<T> {
        return new Seq(new IterateIterable(f, x))
    }

    /**
     * Create an infinite sequence where every element is the same value.
     *
     * @remarks
     * Evaluation of the returned sequence is effect-free.
     *
     * @nosideeffects
     * @param x - The infinitely repeating value.
     * @returns An infinite sequence of `x`.
     * @example
     * ```
     * Seq.repeat(1).take(3).collect()
     *   === [1, 1, 1]
     * ```
     */
    static repeat<T>(x: T): Seq<T> {
        return Seq.iterate(_ => x, x)
    }

    /**
     * Similar to `repeat`, except only includes the value a given number of
     * times.
     *
     * @remarks
     * Evaluation of the returned sequence is effect-free.
     *
     * @nosideeffects
     * @param n - The number of times to repeat the value.
     * @param x - The value to replicate.
     * @returns A sequence with `n` repetitions of `x`.
     * @example
     * ```
     * Seq.replicate(3, 0).collect()
     *   === [0, 0, 0]
     * ```
     */
    static replicate<T>(n: number, x: T): Seq<T> {
        return Seq.repeat(x).take(n)
    }

    /**
     * Construct a sequence from a single value.
     *
     * @remarks
     * Evaluation of the returned sequence is effect-free.
     *
     * @nosideeffects
     * @param x - The singleton value.
     * @returns A sequence containing only the given value `x`.
     * @example
     * ```
     * Seq.singleton(1).collect()
     *   === [1]
     * ```
     */
    static singleton<T>(x: T): Seq<T> {
        return new Seq([x])
    }

    /**
     * Constructs a sequence from any `Iterable`.
     *
     * @remarks
     * Evaluation of the returned sequence is effectful if, and only if,
     * evaluation of `xs` is effectful.
     *
     * @nosideffects
     * @param xs -
     *   The root iterable that will serve as source of the elements in the
     *   sequence.
     */
    constructor(private readonly xs: Iterable<T>) {}

    [Symbol.iterator](): Iterator<T> {
        return this.xs[Symbol.iterator]()
    }

    /**
     * Check if all elements in the sequence satisfies some given predicate.
     *
     * @remarks
     * This will iterate the sequence, either until the end, or until an element
     * that does not satisfy the predicate is encountered. Ie, `all`
     * short-circuits.
     *
     * Naturally, this requires that all elements (up until short-circuit or
     * end) are evaluated and any associated effects are executed.
     *
     * @param p - Predicate that must be satified.
     * @returns True if every element in the sequence satisfied `p`.
     * @example
     * ```
     * const s = new Seq([1,2,3]);
     *
     * s.all(x => x > 0) === true
     * s.all(x => x < 3) === false
     * ```
     */
    all(p: (x: T) => boolean): boolean {
        for (const x of this.xs) {
            if (!p(x)) {
                return false
            }
        }

        return true
    }

    /**
     * Check if the sequence has at least one element satisfying a given
     * predicate.
     *
     * @remarks
     * This will iterate the sequence, either until the end, or until an element
     * that satisfies the predicate is encountered. Ie, `any` short-circuits.
     *
     * Naturally, this requires that all elements (up until short-circuit or
     * end) are evaluated and any associated effects are executed.
     *
     * @param p - The predicate to check.
     * @returns True if there was at least one element satisfying `p`.
     * @example
     * ```
     * const s = new Seq([1,2,3]);
     *
     * s.any(x => x > 2) === true
     * s.any(x => x > 3) === false
     * ```
     */
    any(p: (x: T) => boolean): boolean {
        for (const x of this.xs) {
            if (p(x)) {
                return true
            }
        }

        return false
    }

    /**
     * Enumerate the entire sequence and collect the elements in an array.
     *
     * @remarks
     * This will generally evaluate the entire sequence. Any side effectful
     * functions used to build it (eg, with {@link map}, {@link Seq.iterate},
     * etc) will be called and their effects run.
     *
     * There are a few cases when (re-)evaluation won't occur:
     * - If the sequence simply wraps an array.
     * - If the sequence has been {@link memoize}d and already evaluated at
     *   least once.
     *
     * @param alwaysCopy -
     *   If true, the returned array is always a copy, never a reference to some
     *   internal (eg, memoized) array. If false, `collect` will attempt to
     *   avoid copies when possible. Default is `true`.
     * @returns Concrete array with all the values in the sequence.
     * @example
     * ```
     * const xs = Seq.replicate(3, 0).collect();
     *
     * xs === [0, 0, 0]
     * ```
     */
    collect(alwaysCopy: boolean = true): T[] {
        if (Array.isArray(this.xs)) {
            return alwaysCopy ? this.xs.slice() : this.xs
        } else if (isMemoizingIterable(this.xs)) {
            return alwaysCopy ? this.xs.toArray().slice() : this.xs.toArray()
        }

        return Array.from(this.xs)
    }

    /**
     * Convert a sequence of strings/characters into a single string.
     *
     * @remarks
     * This method evaluates the entire sequence, triggering any associated
     * effects.
     *
     * For more details on evaluation and effects, see {@link collect}.
     *
     * @returns The result of concatenating all of the elements of the sequence.
     * @example
     * ```
     * const xs = new Seq(['a', 'b', 'c']);
     *
     * xs.collectString()
     *   === 'abc'
     * ```
     */
    collectString(this: Seq<string>): string {
        return "".concat(...this.xs)
    }

    /**
     * Concatenate any iterable or iterator to the sequence.
     *
     * @remarks
     * Evaluation of the returned sequence is effectful if, and only if,
     * evaluation of *either* `this` or `xs` is effectful.
     *
     * @nosideeffects
     * @param xs - Collection to append to the input sequence.
     * @returns
     *   Single sequence that will iterate over both the input sequence and the
     *   range represented by `xs`.
     * @example
     * ```
     * const xs = new Seq([1, 2]);
     * const ys = new Seq([3, 4]);
     *
     * xs.concat(ys).collect()
     *   === [1, 2, 3, 4]
     * ```
     */
    concat(xs: Iterable<T>): Seq<T> {
        return new Seq(new ConcatIterable(this.xs, xs))
    }

    /**
     * Lazily map the given function over the range of the iterable, then
     * concatenate the resulting sequence of iterables into a single sequence.
     *
     * @remarks
     * Note that no application will take place until the sequence is iterated.
     * Further note that the result is not cached--multiple iterations of the
     * result will evaluate the map multiple times.
     *
     * @nosideeffects
     * @param f - Function that will be mapped.
     * @returns
     *   A sequence that represents having applied `f` to each element in the
     *   input sequence and then concatenated all the results.
     */
    concatMap<U>(f: (x: T) => Iterable<U>): Seq<U> {
        return this.map(f).join()
    }

    /**
     * Count all the elements in the sequence.
     *
     * @remarks
     * Counting the elements means they will need to be evaluated, so this
     * function will iterate the entire sequence once. It can be considered a
     * specialized fold/reduce.
     *
     * For more details on evaluation/iteration and effects, see
     * {@link collect}.
     *
     * @returns The number of elements the sequence contained.
     */
    count(): number {
        if (Array.isArray(this.xs)) {
            return this.xs.length
        } else if (isMemoizingIterable(this.xs)) {
            this.xs.realize()
            return this.xs.evaluatedData.length
        }

        return this.reduce((c, _) => c + 1, 0)
    }

    /**
     * Drops the first `n` elements of a sequence.
     *
     * @nosideeffects
     * @param n - The number of elements to drop.
     * @returns
     *   The same sequence as the input, except without the first `n` elements.
     */
    drop(n: number): Seq<T> {
        return new Seq(new DropIterable(n, this.xs))
    }

    /**
     * Drops elements for as long as a given predicate is satisfied by them.
     *
     * @nosideeffects
     * @param p - Predicate that determines whether to keep dropping or not.
     * @returns
     *   The same sequence as the input, except without the elements for which
     *   `p` returned true.
     */
    dropWhile(p: (x: T) => boolean): Seq<T> {
        return new Seq(new DropWhileIterable(p, this.xs))
    }

    /**
     * Filters the sequence, returning one where every element satisfying the
     * given predicate is kept, and all the others are skipped.
     *
     * @nosideeffects
     * @param p - Predicate to filter with.
     * @returns The filtered sequence.
     */
    filter(p: (x: T) => boolean): Seq<T> {
        return new Seq(new FilterIterable(p, this.xs))
    }

    /**
     * Creates a sequence with all the elements from the input, except they're
     * paired with their index.
     *
     * @nosideeffects
     * @returns Indexed sequence.
     */
    indexed(): Seq<IndexedValue<T>> {
        return this.zipWith(
            (value, index) => ({ index, value }),
            new EnumFromIterable(0, 1),
        )
    }

    /**
     * Intersperse a value between every element in the sequence.
     *
     * @nosideeffects
     * @param sep - Value to intersperse.
     * @returns
     *   Sequence with `sep` interspersed between all the elements of the input
     *   sequence.
     */
    intersperse(sep: T): Seq<T> {
        return new Seq(new IntersperseIterable(this.xs, sep))
    }

    /**
     * Inserts the separator `Iterable` between every element of the input
     * sequence.
     *
     * @nosideeffects
     * @param sep -
     *   Separate each element of the input sequency by a given separating
     *   `Iterable`.
     */
    intercalate(sep: Iterable<T>): Seq<T> {
        return new Seq(new IntercalateIterable(this.xs, sep))
    }

    /**
     * Joins (flattens) a nested sequence.
     *
     * @nosideeffects
     * @returns The result of concatenating all the nested sequences.
     */
    join<U>(this: Seq<Iterable<U>>): Seq<U> {
        return new Seq(new JoinIterable(this.xs))
    }

    /**
     * Lazily map the given function over the range of the iterable.
     *
     * @remarks
     * Note that no application will take place until the sequence is iterated.
     * Further note that the result is not cached--multiple iterations of the
     * result will evaluate the map multiple times--though you can, for example,
     * {@link memoize} the mapped sequence to accomplish that.
     *
     * @nosideeffects
     * @param f - Function that will be mapped.
     * @returns
     *   A sequence that represents having applied `f` to each element in the
     *   input sequence.
     */
    map<U>(f: (x: T) => U): Seq<U> {
        return new Seq(new MapIterable(f, this))
    }

    /**
     * Creates a new sequence that memoizes the evaluation of the elements.
     *
     * @remarks
     * After having iterated the result `Seq` once, any further iterations of it
     * will not re-evaluate the sequence, but instead just return the already
     * evaluated elements. This can be a useful optimization for sequences that
     * will be shared in multiple computations.
     *
     * However, a memoized sequence will of course also allocate space for the
     * part of it that has been iterated (so, it's actually fine to memoize an
     * infinite sequence, so long as you don't try to iterate the entire thing).
     *
     * @nosideeffects
     * @returns A memoized sequence of the same elements as the input.
     */
    memoize(): Seq<T> {
        return new Seq(new MemoizingIterable(this.xs))
    }

    /**
     * Calculate the product of every number in the sequence.
     *
     * @remarks
     * This is a specialized fold where the elements are multiplied together.
     * Naturally, the entire sequence is evaluated as a result.
     *
     * @returns
     *   The result of multiplying all the numbers in the sequence together.
     */
    product(this: Seq<number>): number {
        return this.reduce((p, x) => p * x, 1)
    }

    /**
     * Strict left fold over all the values in the sequence.
     *
     * @remarks
     * By necessity, this will evaluate the entire input sequence.
     *
     * @param f - Reducing function.
     * @param init - Initial value.
     * @returns
     *   The result of reducing all the values in the sequence using `f`,
     *   starting with `init` as `accum`.
     */
    reduce<U>(f: (accum: U, x: T) => U, init: U): U {
        for (const x of this.xs) {
            init = f(init, x)
        }

        return init
    }

    /**
     * Right fold over all the values in the sequence.
     *
     * @remarks
     * By necessity, this will evaluate the entire input sequence.
     *
     * @param f - Reducing function.
     * @param init - Initial value.
     * @returns
     *   The result of reducing all the values in the sequence using `f`, with
     *   `init` being the last value passed to it.
     */
    reduceRight<U>(f: (x: T, accum: U) => U, init: U): U {
        const [x, xs] = this.unCons()
        if (x) {
            return f(x, xs.reduceRight(f, init))
        }

        return init
    }

    /**
     * Split the sequence at a given index.
     *
     * @remarks
     * For some `s: Seq<T>`, this is essentially equivalent of
     * `[s.take(n), s.drop(n)]`.
     *
     * @nosideeffects
     * @param n - The index to split at.
     * @returns
     *   The first element in the pair is the first `n` elements of the input,
     *   the second is all the elements starting at and following the index `n`.
     * @example
     * ```
     * Seq
     *   .fromArray([1,2,3,4,5])
     *   .splitAt(3)
     *   .map(s => s.collect())
     *   === [[1,2,3],[4,5]]
     * ```
     */
    splitAt(n: number): [Seq<T>, Seq<T>] {
        return n <= 0 ? [Seq.empty(), this] : [this.take(n), this.drop(n)]
    }

    /**
     * Sums all numbers in the sequence.
     *
     * @remarks
     * This is effectively a specialized fold of the sequence, and as such it
     * will trigger its complete evaluation.
     *
     * @returns The sum of all numbers in the sequence.
     */
    sum(this: Seq<number>): number {
        return this.reduce((a, b) => a + b, 0)
    }

    /**
     * Takes the first `n` elements of the sequence, discarding any additional
     * elements. If the sequence has fewer than `n` elements, the _entire_
     * input sequence is included in the result.
     *
     * @nosideeffects
     * @param n - The number of elements to take.
     * @returns A sqeuence of at most `n` elements.
     */
    take(n: number): Seq<T> {
        return new Seq(new TakeIterable(n, this.xs))
    }

    /**
     * Take elements from the input sequence for as long as the given predicate
     * holds true. As soon as the input sequence ends or the predicate returns
     * false, the output sequence will stop.
     *
     * @param p - Predicate to check whether to keep taking elements or not.
     * @returns The resulting sequence.
     */
    takeWhile(p: (x: T) => boolean): Seq<T> {
        return new Seq(new TakeWhileIterable(p, this.xs))
    }

    /**
     * Picks off the first element of the sequence and returns it and its tail.
     *
     * @remarks
     * This operation will evaluate the *first* element of the sequence, but any
     * subsequent elements remain unevaluated. As usual, the evaluation is free
     * of side effects if the sequence is built entirely of side effect-free
     * operations. Eg, the sequence was built by {@link map}ping an effectful
     * function, then this operation will realize that effect!
     *
     * If the sequence is empty, the result will be `[undefined, Seq.empty()]`.
     *
     * @returns A tuple containing the head and tail of the sequence.
     */
    unCons(): [head: T | undefined, tail: Seq<T>] {
        return [this.take(1).collect()[0], this.drop(1)]
    }

    /**
     * Zip the sequence with any `Iterable`.
     *
     * @remarks
     * The output sequence will contains as many elements as the smallest of the
     * two zipped collections.
     *
     * @nosideeffects
     * @param it - Iterable to zip with.
     * @returns
     *   A sequence that will iterate over both the input collections, yielding
     *   pairs of values.
     */
    zip<U>(it: Iterable<U>): Seq<[T, U]> {
        return new Seq(new ZipIterable(this.xs, it))
    }

    /**
     * Zips the sequence with another iterable using some zipping function that
     * combines two elements at a time.
     *
     * @param f - Zipping function.
     * @param it - Iterable to zip together.
     */
    zipWith<U, V>(f: (x: T, y: U) => V, it: Iterable<U>): Seq<V> {
        return new Seq(new ZipWithIterable(f, this.xs, it))
    }
}
