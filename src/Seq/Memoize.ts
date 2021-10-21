/* @internal */
export class MemoizingIterable<T> implements Iterable<T> {
    evaluatedData: T[]
    partialState?: PartialEvalState<T>

    constructor(iter: Iterable<T>) {
        if (Array.isArray(iter)) {
            this.evaluatedData = iter
        } else {
            this.evaluatedData = []
            this.partialState = {
                evaluationIndex: 0,
                evaluationIter: iter[Symbol.iterator](),
            }
        }
    }

    [Symbol.iterator](): Iterator<T, void, void> {
        return new MemoizingIterator(this)
    }

    toArray(): T[] {
        this.realize()

        return this.evaluatedData
    }

    realize(): void {
        if (this.partialState !== undefined) {
            let r = this.partialState.evaluationIter.next()
            while (!r.done) {
                this.evaluatedData.push(r.value)
                r = this.partialState.evaluationIter.next()
            }

            this.partialState = undefined
        }
    }
}

type PartialEvalState<T> = {
    evaluationIndex: number
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    evaluationIter: Iterator<T, any, any>
}

/* @internal */
export function isMemoizingIterable<T>(
    it: Iterable<T>,
): it is MemoizingIterable<T> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return "evaluatedData" in it && Array.isArray((it as any).evaluatedData)
}

class MemoizingIterator<T> implements Iterator<T, void, void> {
    index: number = 0
    constructor(private mem: MemoizingIterable<T>) {}

    next(): IteratorResult<T, void> {
        if (this.mem.partialState !== undefined) {
            const state = this.mem.partialState
            if (this.index < state.evaluationIndex) {
                const value = this.mem.evaluatedData[this.index++]
                return { done: false, value }
            } else {
                const r = state.evaluationIter.next()
                if (r.done) {
                    this.mem.partialState = undefined
                    return r
                } else {
                    this.mem.evaluatedData.push(r.value)
                    this.index++
                    state.evaluationIndex++

                    return {
                        done: false,
                        value: r.value,
                    }
                }
            }
        } else {
            if (this.index < this.mem.evaluatedData.length) {
                return {
                    done: false,
                    value: this.mem.evaluatedData[this.index++],
                }
            }

            return { done: true, value: undefined }
        }
    }
}
