/**
 * The set of naturally comparable primitive types.
 *
 * That is, all primitive types for which the default operators `<`, `<=`,
 * `>=`, and `>` make sense.
 *
 * @typedef {(number|string|boolean|Array<NaturallyOrderable>)}
 */
export type NaturallyOrderable =
    | number
    | string
    | boolean
    | ArrayOfNaturallyOrderable

export interface ArrayOfNaturallyOrderable
    extends ReadonlyArray<NaturallyOrderable> {}

/**
 * A comparator for a type `T`.
 *
 * @template T
 */
export interface Comparator<T> {
    /**
     * The comparison operator that will be used.
     *
     * @param {T} a Left hand side of comparison.
     * @param {T} b Right hand side of comparison.
     * @return {number}
     *   Less than zero if `a` compared smaller than `b`, zero if they compared
     *   equal, and greater than zero if `a` compared larger than `b`.
     */
    (a: T, b: T): number

    /**
     * Function to chain comparisons, in case the initial one returns equal.
     *
     * @param {(a: T, b: T) => number} cmp
     *   Second comparison, the result of which will be used if the first
     *   comparison is equal.
     * @return {Comparator<T>} Combined comparator.
     */
    thenBy: (cmp: (a: T, b: T) => number) => Comparator<T>

    /**
     * Inverts the comparison, turning it into a "descending" order.
     *
     * @returns {Comparator<T>} Inverted comparator.
     */
    desc: () => Comparator<T>
}

/**
 * Make a {@link Comparator} out of a plain comparison function.
 *
 * @nosideeffects
 * @param {(a: T, b: T) => number} cmp
 *   Comparison function. Should return < 0 if `a < b`, 0 if `a === b`, and > 0
 *   if `a > b`.
 * @returns {Comparator<T>} A comparator for values of type `T`.
 * @template T
 */
export function makeComparator<T>(cmp: (a: T, b: T) => number): Comparator<T> {
    const thenBy = (cmp2: (a: T, b: T) => number) =>
        makeComparator((a: T, b: T) => {
            const ord1 = cmp(a, b)
            if (ord1 === 0) {
                return cmp2(a, b)
            } else {
                return ord1
            }
        })

    const result = cmp.bind({})
    return Object.assign(result, cmp, { thenBy, desc: () => desc(cmp) })
}

/**
 * Create a {@link Comparator} out of some projection of a `T` to a `U`, where
 * `U` is {@link NaturallyOrderable}.
 *
 * @nosideeffects
 * @param {(x: T) => U} selector Selector to project from `T` to `U`.
 * @returns {Comparator<T>} A comparator for values of type `T`.
 * @template T
 * @template U
 */
export function comparing<T, U extends NaturallyOrderable>(
    selector: (x: T) => U,
): Comparator<T> {
    return makeComparator((a, b) => compare(selector(a), selector(b)))
}

type PickComparableKeys<T> = {
    [K in keyof T]: T[K] extends NaturallyOrderable ? K : never
}

/**
 * Calculates the set of `T`'s keys that are {@link NaturallyOrderable}.
 */
export type ComparableKeys<T> = PickComparableKeys<T>[keyof T]

/**
 * Create a {@link Comparator} for objects of type `T` by comparing them on some
 * naturally comparable property.
 *
 * @nosideeffects
 * @param {keyof T} key
 *   A property of `T` that extends `NaturallyOrderable`. The value of the
 *   property will be used as basis for all comparisons in the result
 *   `Comparator`.
 * @returns {Comparator<T>}
 *   A comparator that compares any two instances of `T` using the given
 *   property.
 * @template T
 */
export function compareOn<T>(key: ComparableKeys<T>): Comparator<T> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return makeComparator((a: T, b: T) => compare((a as any)[key], b[key]))
}

/**
 * Default comparison function for two values of any {@link NaturallyOrderable}
 * type.
 *
 * @nosideeffects
 * @param {T} a Left hand side of the comparison.
 * @param {T} b Right hand side of the comparison.
 * @returns A number indicating the comparison result:
 *          - A result < 0 implies `a < b`,
 *          - A result of 0 implies`a === b`,
 *          - A result > 0 implies `a > b`
 * @template T
 */
export function compare<T extends NaturallyOrderable>(a: T, b: T): number {
    if (a < b) {
        return -1
    } else if (a > b) {
        return 1
    } else {
        return 0
    }
}

function desc<T>(cmp: (a: T, b: T) => number): Comparator<T> {
    return makeComparator((a, b) => cmp(b, a))
}
