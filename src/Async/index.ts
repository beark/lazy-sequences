import { Seq } from "../Seq"
import { AsyncSeq } from "./AsyncSeq"

declare module "./AsyncSeq" {
    export interface AsyncSeq<T> {
        /**
         * Collects the async sequence into a synchronous one.
         *
         * @remarks
         * This method will evaluate the entire sequence.
         *
         * @returns The promise of a regular synchronous sequence.
         */
        collectSeq(): Promise<Seq<T>>
    }
}

AsyncSeq.prototype.collectSeq = function () {
    return this.collect().then(arr => new Seq(arr))
}

export default AsyncSeq
export { AsyncSeq }
