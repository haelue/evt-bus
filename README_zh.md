language: **[English](README.md) | 中文**

<p align="center">
  <img src="logo.svg" width="640" height="320" alt="evt-bus">
</p>

# Evt-Bus &middot; [![npm](https://badgen.net/npm/v/@haelue/evt-bus)](https://npmjs.com/package/@haelue/evt-bus)

> 一个超强大的 JS/TS 事件总线工具, 包含如下特性:

- 🔑 **类型推断:** 支持 typescript, 你可以在类型推断的支持下, 像调用方法一样使用事件
- 📦 **异步事件:** 支持异步回调, 通过 Promise 或 async-await 的方式发送事件
- 🧡 **冒泡终止:** 你可以终止事件冒泡循环
- 🔌 **监听响应排序:** 指定一个 order 值来对事件响应进行排序
- ⛰️ **按组取消监听:** 指定一个 group-id 值, 并在取消监听时按组取消
- ⚙️ **设置重复监听:** 可按需设置允许或禁止重复监听

## 目录

- [Evt-Bus · ](#evt-bus--)
  - [目录](#目录)
  - [快捷指南](#快捷指南)
  - [使用方式](#使用方式)
  - [功能特性](#功能特性)
    - [事件频道参数](#事件频道参数)
    - [异步事件](#异步事件)
    - [终止事件冒泡循环, 返回值](#终止事件冒泡循环-返回值)
    - [事件响应排序](#事件响应排序)
    - [事件响应按组取消监听](#事件响应按组取消监听)
    - [防止重复监听](#防止重复监听)
    - [异常处理](#异常处理)
    - [字符串消息](#字符串消息)
  - [更多功能和细节](#更多功能和细节)
    - [获取监听数量](#获取监听数量)
    - [事件方法: on, off, offAll, onCount](#事件方法-on-off-offall-oncount)
    - [调试大量事件](#调试大量事件)

## 快捷指南

**Step1**: 本项目使用 [node](http://nodejs.org) 和 [npm](https://npmjs.com) 来安装.

```sh
$ npm install --save @haelue/evt-bus
```

**Step2**: 在 **全局声明文件** 中添加声明: src/global.d.ts (如果不存在可以创建一个)

```typescript
/** file: src/global.d.ts */

declare type EvtGroupName = import("@haelue/evt-bus").EvtGroupName;
declare type EvtOrder = import("@haelue/evt-bus").EvtOrder;
declare type EvtRepeatable = import("@haelue/evt-bus").EvtRepeatable;
declare type EvtMessage = import("@haelue/evt-bus").EvtMessage;
```

**Step3**: 创建一个 **事件频道文件**: src/events/index.ts (或任意位置)

```typescript
/** file: src/events/index.ts */

import {
  EvtChannel,
  EvtChannelName,
  EvtOnMethod,
  EvtOffMethod,
  EvtOffAllMethod,
  EvtOnCountMethod,
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

  /** Count of event-listenning */
  onCount: EvtOnCountMethod & EvtOnCountDictionary;

  /** Set exception-handler once for next emit */
  withExceptionHandler: EvtWithExceptionHandlerMethod<
    EvtEmitDictionary,
    EvtEmitAsyncDictionary
  >;
}

export const channelCached: Record<EvtChannelName, any> = {};

/** Get an event-channel of options (caching). */
export default function evt(
  options?: Partial<EvtChannelOptions>,
): UserEvtChannel {
  const name = options?.name ?? evtDefaultOptions.name;
  return (channelCached[name] ??= new EvtChannel(options));
}
```

> 提示: 本工具可以同时用在 **Browser.js** 和 **Node.js**; JS 模式可以是 **esm**, **cjs** 和 **umd**.

**Step4**: 创建一个 **事件声明文件**: src/events/evt.d.ts (或任意位置, 但必须以 **evt.d.ts / emit.d.ts** 结尾)

```typescript
/** file: src/events/evt.d.ts */

declare interface EvtEmitDictionary {
  /** example emitter with type infer */
  fooTrigger(bar: { id: string; score: number; time: Date }): boolean;
}
```

> 提示: 返回类型必须是: **boolean**.

**Step5**: 执行以下命令行命令: (建议将命令加到 **package.json** 中)

```sh
$ npx evt-autogen
```

其他声明代码会自动生成在你的 **事件声明文件 (Step4)**. (看看发生了什么: src/events/evt.d.ts)

**Step6**: 使用事件 "fooTrigger":

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

> 提示: `evt()` 无论在哪个文件调用, 都会提供同一个缓存的对象实例.

## 使用方式

Evt-bus 的使用模式非常灵活.

你可以在不同的模块目录创建很多个 **事件声明文件 (Step4)**, **evt-autogen** 会递归扫描 **./src** 及其子目录.

你可以使用 -p 来修改扫描路径.

```sh
$ npx evt-autogen -P [path/to/declare/files/root]
# "-p -path -PATH" is also ok
```

你可以在 **事件声明文件 (Step4)** 中把 `export interface` 替换成 `declare interface`, 把文件名尾部替换为 **evt.ts / emit.ts** (没有 ".d."), 并将相关的符号 import 到 **事件频道文件 (Step3)**.

on 处理函数的第一个 **参数 "e"** 类似: `{ message: "fooTrigger", cancel: false }`, 你可以设置 `e.cancel = true` 来终止事件冒泡循环. 但如果你不需要这个特性, 也不喜欢第一个 **参数 "e"**, 可以通过下面的方式改造:

```typescript
/** file: src/events/index.ts */

import {
--- EvtChannel,
+++ EvtChannelSimple as EvtChannel,
...
} from "@haelue/evt-bus"
```

```sh
$ npx evt-autogen -S
# "-s -simple -SIMPLE" is also ok
```

## 功能特性

### 事件频道参数

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

### 异步事件

```typescript
import evt from "src/events";
const { emitAsync, on } = evt();

on.fooTrigger(async (e, bar: { id: string; score: number; time: Date }) => {
  console.log(`event received! ${JSON.stringify(bar)}`);
});

await emitAsync.fooTrigger({ id: "foo", score: 1, time: new Date() });
```

### 终止事件冒泡循环, 返回值

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

### 事件响应排序

默认的响应顺序号为 **0**, 你可以在事件频道构造, 或在事件监听的 on 方法中修改它.

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
// event received: Order 3
// event received: Order 2 (default)
// event received: Order 1
```

### 事件响应按组取消监听

默认的组名为 **\***, 你可以在事件频道构造, 或在事件监听的 on 方法中修改它.

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

### 防止重复监听

默认设置为 **禁止重复监听**, 你可以在事件频道构造, 或在事件监听的 on 方法中将它改为 **允许重复监听**.

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

> 提示: 每个箭头函数都是不同的实例，不算重复监听

### 异常处理

默认异常处理方法为 **console.error**, 你可以在事件频道构造, 或通过 withExceptionHandler 方法中修改它.

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

> 提示: 如果异常处理方法是异步的, 也请使用异步事件发送.

### 字符串消息

Evt-bus 同时支持类似传统经典事件总线的 字符串消息.

```typescript
import evt from "src/events";
const { emit, on, off } = evt();

on("fooTrigger", (e, bar: { id: string; score: number; time: Date }) => {
  console.log(`event received! ${JSON.stringify(bar)}`);
});

emit("fooTrigger", { id: "foo", score: 1, time: new Date() });

off("fooTrigger");
```

> 提示: 字符串消息还同时兼容定义类型的事件.

## 更多功能和细节

一些你可能用不到, 但需要说明的功能和细节.

### 获取监听数量

使用 onCount 方法来获取事件监听数量.

```typescript
import evt from "src/events";
const { on, off, onCount } = evt();

on.fooTrigger((e, bar: { id: string; score: number; time: Date }) => {
  console.log(`event received! ${JSON.stringify(bar)}`);
});
on.fooTrigger((e, bar: { id: string; score: number; time: Date }) => {
  console.log(`event received! ${JSON.stringify(bar)}`);
});

console.log("fooTrigger event subscribe count: ", onCount.fooTrigger());

// console print:
// fooTrigger event subscribe count: 2

off.fooTrigger();

console.log("fooTrigger event subscribe count： ", onCount.fooTrigger());

// console print:
// fooTrigger event subscribe count: 0
```

### 事件方法: on, off, offAll, onCount

先看看这几个事件方法的声明: on, off, offAll, onCount:

```typescript
interface onMethods {
  fooTrigger(handler, groupId?, sortOrder?, repeatable?): void;
}
interface offMethods {
  fooTrigger(handler?, groupId?, sortOrder?): void;
}
interface offAllMethod {
  (groupId?, sortOrder?): void;
}
interface onCountMethods {
  fooTrigger(handler?, groupId?, sortOrder?): number;
}
```

在 on 方法中, 如果你省略了参数 或 传入 `undefined` 值, 这个参数会得到其 **默认值**.

但在 off / offAll / onCount 方法中, 如果你省略了参数 或 传入 `undefined` 值, 这表示在搜索符合条件的监听时, 会忽略 **该参数的匹配条件**.

### 调试大量事件

在一个架构不太好的项目中, 大量事件到处穿插交互. evt-bus 设计了一个工具来进行调试. 下面是一个 vue3 前端项目的例子:

```typescript
/** file: main.ts */

import { nextTick } from "vue";
import { loadEvtDebug } from "@haelue/evt-bus";
loadEvtDebug(false, nextTick, ["mouseMoving", "keyboardPressing"]);
```

启动这个项目, 打开浏览器控制台, 输入 `evtDebug()` 看看会输出什么.
