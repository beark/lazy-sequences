import type { IndexedValue } from "../common"
import { enumFrom } from "../common"
import { ConcatAsyncIterable } from "./Concat"
import { ConsAsyncIterable } from "./Cons"
import { CycleAsyncIterable } from "./Cycle"
import { DropAsyncIterable, DropWhileAsyncIterable } from "./Drop"
import { FilterAsyncIterable } from "./Filter"
import {
    IntercalateAsyncIterable,
    IntersperseAsyncIterable,
} from "./Intersperse"
import { AsyncFromIterable, IterateAsyncIterable } from "./Iterate"
import { JoinAsyncIterable } from "./Join"
import { MapAsyncIterable } from "./Map"
import { TakeAsyncIterable, TakeWhileAsyncIterable } from "./Take"
import { ZipAsyncIterable, ZipWithAsyncIterable } from "./Zip"

/**
 * An asynchronous iterable sequence of values of type `T`.
 *
 * @remarks
 * Note that to use `AsyncSeq` in a browser or context lacking full ES6 support,
 * you'll need to polyfill `Symbol.asyncIterator` as described in the
 * TypeScript documentation of asynchronous iterators _before_ importing this
 * class. Here's an example shim that should work:
 *
 * ```ts
 * if (
 *   typeof (Symbol as any).asyncIterator
 *   === "undefined"
 * ) {
 *   (Symbol as any).asyncIterator =
 *     Symbol.asyncIterator
 *       || Symbol("asyncIterator");
 * }
 *
 * import { AsyncSeq } from 'seq/Async';
 * ```
 */
export class AsyncSeq<T> implements AsyncIterable<T> {
    /**
     * Prepend an element to a sequence.
     *
     * @nosideeffects
     * @param x - The element to prepend.
     * @param xs - The sequence to prepend to.
     * @returns The sequence starting with `x`, followed by `xs`
     */
    static cons<T, U>(x: T | Promise<T>, xs: AsyncSeq<U>): AsyncSeq<T | U> {
        return new AsyncSeq(new ConsAsyncIterable<T | U>(x, xs))
    }

    /**
     * Infinitely cycle the elements of some `AsyncIterable`.
     *
     * @remarks
     * If the input `AsyncIterable` is already infinitely long, this is
     * effectively a no-op. If the input iterable is empty, evaluation of the
     * result sequence will diverge (never yield any elements, never return).
     *
     * @nosideeffects
     * @param xs - Iterable of elements to cycle.
     * @returns
     *   A sequence that goes through every element of `xs`, and thenstarts over
     *   in an infinite cycle.
     * @example
     * ```
     * await AsyncSeq
     *   .cycle(AsyncSeq.from([1,2]))
     *   .take(5)
     *   .collect() === [1,2,1,2,1]
     * ```
     */
    static cycle<T>(xs: AsyncIterable<T>): AsyncSeq<T> {
        return new AsyncSeq(new CycleAsyncIterable<T>(xs))
    }

    /**
     * Construct an async sequence from an iterable of promises.
     *
     * @nosideeffects
     * @param xs - Iterable to construct from.
     * @returns Sequence of all the values contained in `xs`.
     */
    static from<T>(xs: Iterable<T | Promise<T>>): AsyncSeq<T> {
        return new AsyncSeq(new AsyncFromIterable(xs))
    }

    /**
     * Generate an infinite sequence by repeated application of a given
     * function.
     *
     * @param f - Function to apply to generate new values.
     * @param x - Initial value.
     * @returns The sequence of applying `f` infinitely recursively on `x`.
     * @example
     * ```
     * await AsyncSeq
     *   .iterate(f, x)
     *   .take(4)
     *   .collect()
     *   === [x, f(x), f(f(x)), f(f(f(x)))]
     * ```
     */
    static iterate<T>(f: (x: T) => Promise<T> | T, x: T): AsyncSeq<T> {
        return new AsyncSeq(new IterateAsyncIterable(f, x))
    }

    /**
     * Construct a sequence from a single promised value.
     *
     * @param - x The singleton value.
     * @returns A sequence containing only the given value `x`.
     */
    static singleton<T>(x: Promise<T>): AsyncSeq<T> {
        return AsyncSeq.from([x])
    }

    /**
     * Constructs a sequence from any `AsyncIterable`.
     *
     * @param xs -
     *   root iterable that will serve as source of the elements in the
     *   sequence.
     */
    constructor(private readonly xs: AsyncIterable<T>) {}

    [Symbol.asyncIterator](): AsyncIterator<T> {
        return this.xs[Symbol.asyncIterator]()
    }

    /**
     * Check if all elements in the sequence satisfies some given predicate.
     *
     * @remarks
     * Short-circuits if an element that does not satisfy the predicate is
     * encountered. However, if all elements satisfy the predicate, this method
     * will evaluate the entire sequence.
     *
     * @param p - Predicate that must be satified.
     * @returns True if every element in the sequence satisfied `p`.
     */
    async all(p: (x: T) => boolean): Promise<boolean> {
        for await (const x of this.xs) {
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
     * Short-circuits on the first element satisfies the predicate. However, if
     * no elements satisfy the predicate, this method will evaluate the entire
     * sequence.
     *
     * @param p - The predicate to check.
     * @returns True if there was at least one element satisfying `p`.
     */
    async any(p: (x: T) => boolean): Promise<boolean> {
        for await (const x of this.xs) {
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
     * This obviously evaluates the entire sequence.
     *
     * @returns Concrete array with all the values in the sequence.
     */
    async collect(): Promise<T[]> {
        const result: T[] = []
        for await (const x of this.xs) {
            result.push(x)
        }

        return result
    }

    /**
     * Convert a sequence of strings/characters into a single string.
     *
     * @remarks
     * If you want the behavior of, eg, `Array.join`, it is easily replicated
     * using something like:
     * ```ts
     * declare const seq: AsyncSeq<string>;
     * const joined = await seq
     *   .intersperse(', ')
     *   .collectString()
     * ```
     *
     * This method evaluates the entire sequence.
     *
     * @returns The result of concatenating all of the elements of the sequence.
     * @example
     * ```
     * await AsyncSeq
     *   .from(["a", "b", "cd"])
     *   .collectString()
     *   === "abcd"
     * ```
     */
    collectString(this: AsyncSeq<string>): Promise<string> {
        return this.reduce((result, s) => result.concat(s), "")
    }

    /**
     * Concatenate any iterable, async or not, to the sequence.
     *
     * @nosideeffects
     * @param xs - Collection to append to the input sequence.
     * @returns
     *   Single sequence that will iterate over both the input sequence and the
     *   range represented by `xs`.
     */
    concat(xs: Iterable<T> | AsyncIterable<T>): AsyncSeq<T> {
        return new AsyncSeq(new ConcatAsyncIterable(this.xs, xs))
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
     * @param  f - Function that will be mapped.
     * @returns
     *   A sequence that represents having applied `f` to each element in the
     *   input sequence and then concatenated all the results.
     * @example
     * ```
     * await AsyncSeq.from([1,2,3])
     *   .concatMap(x => [x*2, x*4])
     *   .collect()
     *   === [2, 4, 4, 8, 6, 12]
     * ```
     */
    concatMap<U>(f: (x: T) => Iterable<U> | AsyncIterable<U>): AsyncSeq<U> {
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
     * @returns The number of elements the sequence contained.
     */
    count(): Promise<number> {
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
    drop(n: number): AsyncSeq<T> {
        return new AsyncSeq(new DropAsyncIterable(n, this.xs))
    }

    /**
     * Drops elements for as long as a given predicate is satisfied by them.
     *
     * @nosideeffects
     * @param p - Predicate that determines whether to keep dropping or not.
     * @returns
     *   The same sequence as the input, except without the elements for which
     *   `p` returned true.
     * @example
     * ```
     * await AsyncSeq
     *   .from([1,2,3,4,5])
     *   .dropWhile(x => x < 3)
     *   .collect()
     *   === [3,4,5]
     * ```
     */
    dropWhile(p: (x: T) => boolean): AsyncSeq<T> {
        return new AsyncSeq(new DropWhileAsyncIterable(p, this.xs))
    }

    /**
     * Filters the sequence, returning one where every element satisfying the
     * given predicate is kept, and all the others are skipped.
     *
     * @nosideeffects
     * @param p - Predicate to filter with.
     * @returns The filtered sequence.
     */
    filter(p: (x: T) => boolean): AsyncSeq<T> {
        return new AsyncSeq(new FilterAsyncIterable(p, this.xs))
    }

    /**
     * Creates a sequence with all the elements from the input, except they're
     * paired with their index.
     *
     * @nosideeffects
     * @returns Indexed sequence.
     */
    indexed(): AsyncSeq<IndexedValue<T>> {
        return this.zipWith(
            (value, index) => ({ index, value }),
            enumFrom(0, 1),
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
    intersperse(sep: T): AsyncSeq<T> {
        return new AsyncSeq(new IntersperseAsyncIterable(this.xs, sep))
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
    intercalate(sep: Iterable<T>): AsyncSeq<T> {
        return new AsyncSeq(new IntercalateAsyncIterable(this.xs, sep))
    }

    /**
     * Joins (flattens) a nested sequence.
     *
     * @nosideeffects
     * @returns The result of concatenating all the nested sequences.
     */
    join<U>(this: AsyncSeq<Iterable<U> | AsyncIterable<U>>): AsyncSeq<U> {
        return new AsyncSeq(new JoinAsyncIterable(this.xs))
    }

    /**
     * Lazily map the given function over the range of the iterable.
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
     *   input sequence.
     */
    map<U>(f: (x: T) => U): AsyncSeq<U> {
        return new AsyncSeq(new MapAsyncIterable(f, this.xs))
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
    product(this: AsyncSeq<number>): Promise<number> {
        return this.reduce((p, x) => p * x, 1)
    }

    /**
     * Strict left fold over all the values in the sequence.
     *
     * @remarks
     * By necessity, this will evaluate the entire input sequence.
     *
     * @param f - Reducing function.
     * @param  init - Initial value.
     * @returns
     *   The result of combining all the elements using `f`, starting with
     *   `init` as `accum`.
     */
    async reduce<U>(f: (accum: U, x: T) => U, init: U): Promise<U> {
        for await (const x of this.xs) {
            init = f(init, x)
        }

        return init
    }

    /**
     * Split the sequence at a given index.
     *
     * @remarks
     * For some `s: AsyncSeq<T>`, this is essentially equivalent of
     * `[s.take(n), s.drop(n)]`.
     *
     * @nosideeffects
     * @param n - The index to split at.
     * @returns
     *   The first element in the pair is the first `n` elements of the input,
     *   the second is all the elements starting at and following the index `n`.
     * @example
     * ```
     * await Promise.all(AsyncSeq
     *   .from([1,2,3,4,5])
     *   .splitAt(3)
     *   .map(s => s.collect()))
     *   === [[1,2,3],[4,5]]
     * ```
     */
    splitAt(n: number): [AsyncSeq<T>, AsyncSeq<T>] {
        return n <= 0
            ? [AsyncSeq.from([] as T[]), this]
            : [this.take(n), this.drop(n)]
    }

    /**
     * Sums all numbers in the sequence.
     *
     * @remarks
     * This is a specialized fold, and as such, it will evaluate the entire
     * sequence.
     *
     * @returns The sum of all numbers in the sequence.
     */
    sum(this: AsyncSeq<number>): Promise<number> {
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
    take(n: number): AsyncSeq<T> {
        return new AsyncSeq(new TakeAsyncIterable(n, this.xs))
    }

    /**
     * Take elements from the input sequence for as long as the given predicate
     * holds true. As soon as the input sequence ends or the predicate returns
     * false, the output sequence will stop.
     *
     * @nosideeffects
     * @param p - Predicate to check whether to keep taking elements or not.
     * @returns The resulting sequence.
     */
    takeWhile(p: (x: T) => boolean): AsyncSeq<T> {
        return new AsyncSeq(new TakeWhileAsyncIterable(p, this.xs))
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
    zip<U>(it: AsyncIterable<U> | Iterable<U>): AsyncSeq<[T, U]> {
        return new AsyncSeq(new ZipAsyncIterable(this.xs, it))
    }

    /**
     * Zips the sequence with another iterable using some zipping function that
     * combines two elements at a time.
     *
     * @nosideeffects
     * @param f - Zipping function.
     * @param it - Iterable to zip together with.
     * @returns A sequence containing the combined values.
     */
    zipWith<U, V>(
        f: (x: T, y: U) => V,
        it: AsyncIterable<U> | Iterable<U>,
    ): AsyncSeq<V> {
        return new AsyncSeq(new ZipWithAsyncIterable(f, this.xs, it))
    }
}

export default AsyncSeq
