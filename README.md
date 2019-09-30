# `lazy-sequences`

A TypeScript and JavaScript library providing lazy sequences with a "fluent", functional programming friendly API. The purpose is to make it simple and efficient to generate and operate on sequences of potentially infinite elements.

## Quick examples

### Generation
```ts
// Infinite sequence of the numbers 0, 1, 2, ...
const s = Seq.enumFrom(0);
```

```ts
// Infinite sequence of the numbers 1, 2, 4, 8, 16, ...
const s = Seq.iterate(x => 2*x, 1);
```

```ts
// Infinitely repeating cycle of 1, 2, 3, 1, 2, 3, ...
const s = Seq.cycle([1, 2, 3]);
```

### Operations

```ts
// Neat and efficient method chaining (the below will only iterate 'sequence' once)
const sumDoubles = sequence
    .map(x => 2 * x)
    .sum()
```

```ts
// Most of the fp collection operations available at the tap of a '.'
const strangeString = sequence
    .filter(str => str.length < 10)
    .map(str => str.toUpperCase())
    .map(str => str.slice(0,4))
    .reduce((accum, str) => accum.concat(str), '');
```

## Installation

```sh
$ npm install --save lazy-sequences
```

Or whatever the equivalent is for your favorite package manager. That should set you up regardless of whether you prefer JS or TS. To actually use the library, you'd typically just:

```ts
// Using typescript or some other platform with ES modules
import Seq from 'lazy-sequences';

// Or
import { Seq } from 'lazy-sequences';
```

```js
// Using node/commonjs style requires
const { Seq } = require('lazy-sequences');

// Or
const S = require('lazy-sequences').default;
```

## Async sequences

In addition to regular lazy sequences, `lazy-sequences` also provides _async_ lazy sequences. Just like `Seq`, in some sense, is a fluent/functional wrapper of `Iterable`s, `AsyncSeq` is kind of a wrapper of `AsyncIterable`. A quick example:

```ts
import AsyncSeq from 'lazy-sequences/Async';
// Or in commonjs:
// const { AsyncSeq } = require('lazy-sequences/Async');

const seq = new AsyncSeq(someAsyncIterable);

// resultPromise: Promise<string>
const seq2 = seq
    .map(x => x.foo())
    .map(foo => foo.toString());

// result: boolean
const result = await seq2.any(s => s.indexOf('foo') !== -1);
```

Note that to use asynchronous sequences you may have to add a shim for `Symbol.asyncIterator`. If so, it should be defined _before_ importing `AsyncSeq`. So, something like this in TypeScript:

```ts
if (
  typeof (Symbol as any).asyncIterator
    === "undefined"
) {
  (Symbol as any).asyncIterator =
    Symbol.asyncIterator
      || Symbol("asyncIterator");
}

import AsyncSeq from 'lazy-sequences/Async';
```

Or something like this in JS (assuming commonjs):

```js
if (typeof Symbol.asyncIterator === "undefined") {
    Symbol.asyncIterator = Symbol.asyncIterator || Symbol("asyncIterator");
}

const { AsyncSeq } = require('lazy-sequences/Async');
```
