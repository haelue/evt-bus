language: **| [English](README.md) | [中文](README_zh.md) |**

# Evt-Bus

> An event bus framework with powerful features:

- **Type inferring:** support typescript, you can use the event bus like calling functions with type inferring
- **Async emitter:** define async handler, and emit it using Promise OR async-await
- **Propagation stop:** stop event propagation in handler-loop
- **Handler sorting:** sort the handlers with order-index
- **Handler group off:** subscribe events with group-id, and unsubscribe them by group

## Table of Contents

- [Evt-Bus](#evt-bus)
  - [Table of Contents](#table-of-contents)
  - [Quick Start](#quick-start)
  - [Usage](#usage)
  - [Features](#features)
    - [Channel options](#channel-options)
    - [Async emitter](#async-emitter)
    - [Propagation stop \& return](#propagation-stop--return)
    - [Handler sorting](#handler-sorting)
    - [Handler group off](#handler-group-off)
    - [Avoid repeat subscribe](#avoid-repeat-subscribe)
    - [Handle exception](#handle-exception)
    - [String message](#string-message)
  - [Advanced details](#advanced-details)
    - [Methods: on, off, offAll](#methods-on-off-offall)
    - [Check subscribe exist](#check-subscribe-exist)
    - [Debug tons of events](#debug-tons-of-events)

## Quick Start

**Step 1**: This project uses [node](http://nodejs.org) and [npm](https://npmjs.com) to install.

```sh
$ npm install --save @haelue/evt-bus
```

**Step 2**: Create a **Channel-File**: src/events/index.ts (OR anywhere)

```typescript
/** file: src/events/index.ts */

import {
  EvtChannel,
  EvtChannelName,
  EvtOnMethod,
  EvtOffMethod,
  EvtOffAllMethod,
  EvtExistMethod,
  EvtEmitMethod,
  EvtEmitAsyncMethod,
  EvtWithExceptionHandlerMethod,
  EvtChannelOptions,
  evtDefaultOptions,
} from "@haelue/evt-bus";

interface UserEvtChannel {
  /** Add event-listenning */
  on: EvtOnMethod & EvtOnOffDictionary;

  /** Remove event-listenning of same handler(if defined) & same group(if defined) & same order(if defined) */
  off: EvtOffMethod & EvtOnOffDictionary;

  /** Remove all event-listenning of same group(if defined) & same order(if defined) */
  offAll: EvtOffAllMethod;

  /** Emit event */
  emit: EvtEmitMethod & EvtEmitDictionary;

  /** Emit event (async) */
  emitAsync: EvtEmitAsyncMethod & EvtEmitAsyncDictionary;

  /** Check if event-listenning exist */
  exist: EvtExistMethod & EvtExistDictionary;

  /** Set exception-handler once for next emit */
  withExceptionHandler: EvtWithExceptionHandlerMethod<EvtEmitDictionary>;
}

export const channelCached: Record<EvtChannelName, any> = {};

/** Get an event-channel of channel-name (caching). */
export default function evt(
  options?: Partial<EvtChannelOptions>,
): UserEvtChannel {
  const name = options?.name ?? evtDefaultOptions.name;
  return (channelCached[name] ??= new EvtChannel(options));
}
```

> Tip: It can both use in **Browser.js** OR **Node.js**; With both **esm**, **cjs** OR **umd**.

**Step 3**: Insert types in **Global-Declare-File**: src/global.d.ts (create one if non-exist)

```typescript
/** file: src/global.d.ts */

declare type EvtGroupName = import("@haelue/evt-bus").EvtGroupName;
declare type EvtOrder = import("@haelue/evt-bus").EvtOrder;
declare type EvtRepeatable = import("@haelue/evt-bus").EvtRepeatable;
declare type EvtMessage = import("@haelue/evt-bus").EvtMessage;
```

**Step 4**: Create an **Event-Declare-File**: src/events/evt.d.ts (OR anywhere, but ends with **evt.d.ts / emit.d.ts**)

```typescript
/** file: src/events/evt.d.ts */

declare interface EvtEmitDictionary {
  /** example emitter with type infer */
  fooTrigger(bar: { id: string; score: number; time: Date }): boolean;
}
```

> Tip: Return type must be: **boolean**.

**Step 5**: Run command below: (recommand insert it into **package.json**)

```sh
$ npx evt-autogen
```

Other declares will generate in your **Event-Declare-File (Step4)**. (see what happens in src/events/evt.d.ts)

**Step 6**: Use the event "fooTrigger":

```typescript
/** file: path/to/your/code.ts */

import evt from "src/events";
const { emit, on, off } = evt();

on.fooTrigger((e, bar: { id: string; score: number; time: Date }) => {
  console.log(`event received! ${JSON.stringify(bar)}`);
});

emit.fooTrigger({ id: "foo", score: 1, time: new Date() });

// console print:
// event received! {"id":"foo","score":1,"time":"2024-11-01T06:48:50.865Z"}

off.fooTrigger();

emit.fooTrigger({ id: "foo2", score: 2, time: new Date() });

// console print:
// [nothing as expected]
```

> Tip: `evt()` provides the same cached instance in different file.

## Usage

The usage mode of evt-bus can be very flexible.

You can create many **Event-Declare-File (Step4)** in different modules, **evt-autogen** scan path **./src** recursive.

You can use -p to change scan path.

```sh
$ npx evt-autogen -P [path/to/declare/files/root]
# "-p -path -PATH" is also ok
```

You can use `export interface` instead of `declare interface` in **Event-Declare-File (Step4)**, and make the filename ends with **evt.ts / emit.ts** (without ".d."), and import symbols in **Channel-File (Step2)**.

The first **"e" argument** in on-handler is like: `{ message: "fooTrigger", cancel: false }`, you can use `e.cancel = true` to stop event propagation. But if you don't need this feature, and hate the first **"e" argument**, directions below would help:

```typescript
/** file: src/events/index.ts */

import {
--- EvtChannel,
+++ EvtChannelSimple as EvtChannel,
...
...
} from "@haelue/evt-bus"
```

```sh
$ npx evt-autogen -S
# "-s -simple -SIMPLE" is also ok
```

## Features

### Channel options

```typescript
import evt from "src/events";
const { emit, on, off } = evt({
  // each option below is ommitable
  name: "channel-1", // default "#"
  defaultGroup: "group-1", // default "*"
  defaultOrder: -1, // default 0
  defaultRepeatable: true, // default false
  defaultExceptionHandler: console.log, // default console.error
});
```

### Async emitter

```typescript
import evt from "src/events";
const { emitAsync, on } = evt();

on.fooTrigger(async (e, bar: { id: string; score: number; time: Date }) => {
  console.log(`event received! ${JSON.stringify(bar)}`);
});

await emitAsync.fooTrigger({ id: "foo", score: 1, time: new Date() });
```

### Propagation stop & return

```typescript
import evt from "src/events";
const { emit, on } = evt();

let changeFlag = false;
on.fooTrigger((e, bar: { id: string; score: number; time: Date }) => {
  e.cancel = true;
});
on.fooTrigger((e, bar: { id: string; score: number; time: Date }) => {
  changeFlag = true;
});

const result = emit.fooTrigger({ id: "foo", score: 1, time: new Date() });
console.log(`result: ${result}, flag changed: ${changeFlag}`);

// console print:
// result: false, flag changed: false
```

### Handler sorting

The default sort-order is **0**, you can change it in channel-building, OR in on-method.

```typescript
import evt from "src/events";
const { emit, on } = evt({ defaultOrder: 2 });

on.fooTrigger((e, bar: { id: string; score: number; time: Date }) => {
  console.log(`event received: Order 2 (default)}`);
});
on.fooTrigger(
  (e, bar: { id: string; score: number; time: Date }) => {
    console.log(`event received: Order 3}`);
  },
  undefined,
  3,
);
on.fooTrigger(
  (e, bar: { id: string; score: number; time: Date }) => {
    console.log(`event received: Order 1`);
  },
  undefined,
  1,
);

emit.fooTrigger({ id: "foo", score: 1, time: new Date() });

// console print:
// event received: Order 1
// event received: Order 2 (default)
// event received: Order 3
```

### Handler group off

The default group name is **"\*"**, you can change it in channel-building, OR in on-method.

```typescript
import evt from "src/events";
const { on, offAll } = evt({ defaultGroup: "group-1" });

on.fooTrigger(
  (e, bar: { id: string; score: number; time: Date }) => {},
  "group-2",
);
on.eventBar((e, bar: string, tick: number) => {}, "group-2");

offAll("group-2");
```

### Avoid repeat subscribe

The default setting is **avoid-repeat**, you can change to **allow-repeat** in channel-building, OR in on-method.

```typescript
import evt from "src/events";
const { emit, on } = evt({ defaultRepeatable: true });

const handler1 = (e, bar: { id: string; score: number; time: Date }) => {
  console.log(`event received in handler1`);
};
on.fooTrigger(handler1);
on.fooTrigger(handler1);
on.fooTrigger(handler1);

const handler2 = (e, bar: { id: string; score: number; time: Date }) => {
  console.log(`event received in handler2`);
};
on.fooTrigger(handler2, undefined, undefined, false);
on.fooTrigger(handler2, undefined, undefined, false);
on.fooTrigger(handler2, undefined, undefined, false);

emit.fooTrigger({ id: "foo", score: 1, time: new Date() });

// console print:
// event received in handler1
// event received in handler1
// event received in handler1
// event received in handler2
```

### Handle exception

The default handler is **console.error**, you can change it in channel-building, OR using withExceptionHandler-method.

```typescript
import evt from "src/events";
const { withExceptionHandler, emit, on } = evt({
  defaultExceptionHandler: () => console.log("Handle error throws"),
});

on.fooTrigger((e, bar: { id: string; score: number; time: Date }) => {
  throw new Error("Specified error");
});

emit.fooTrigger({ id: "foo", score: 1, time: new Date() });

// console print:
// Handle error throws

const avoidErrorLog = () => {};
withExceptionHandler(avoidErrorLog).emit.fooTrigger({
  id: "foo",
  score: 1,
  time: new Date(),
});

// console print:
// [nothing as expected]
```

> Tip: If event-handler is async, use async emitter.

### String message

String-message is also supported like a typical event bus.

```typescript
import evt from "src/events";
const { emit, on, off } = evt();

on("fooTrigger", (e, bar: { id: string; score: number; time: Date }) => {
  console.log(`event received! ${JSON.stringify(bar)}`);
});

emit("fooTrigger", { id: "foo", score: 1, time: new Date() });

off("fooTrigger");
```

> Tip: And it is also compatible to declare-type usage.

## Advanced details

Advanced details that you may not use, but needs to be mentioned.

### Methods: on, off, offAll

See the declares of methods: on, off, offAll:

```typescript
interface onMethods {
  fooEvent(handler, groupId?, sortOrder?, repeatable?): void;
}
interface offMethods {
  fooEvent(handler?, groupId?, sortOrder?): void;
}
interface offAllMethod {
  (groupId?, sortOrder?): void;
}
```

In on-method, if you ommit any parameter OR put `undefined`, the parameter will get **default value**.

But in off(All)-method, if you ommit any parameter OR put `undefined`, it means **this "Parameter-Match-Condition" will be ignored** while searching to unsubscribe.

### Check subscribe exist

Use exist-method to see if there is subscribe on some event.

```typescript
import evt from "src/events";
const { on, off, exist } = evt();

on.fooTrigger((e, bar: { id: string; score: number; time: Date }) => {
  console.log(`event received! ${JSON.stringify(bar)}`);
});

console.log("fooTrigger event subscribed: ", exist.fooTrigger());

// console print:
// fooTrigger event subscribed: true

off.fooTrigger();

console.log("fooTrigger event subscribed: ", exist.fooTrigger());

// console print:
// fooTrigger event subscribed: false
```

### Debug tons of events

In a badly structed project, tons of events may interweaving here and there. A debug tool is designed to analyze them. Example of vue3 web project as belows:

```typescript
/** file: main.ts */

import { nextTick } from "vue";
import { loadEvtDebug } from "@haelue/evt-bus";
loadEvtDebug(false, nextTick, ["mouseMoving", "keyboardPressing"]);
```

Run the web project, open the browser console, input `evtDebug()` and see what outputs.
