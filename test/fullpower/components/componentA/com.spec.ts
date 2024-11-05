/// <reference path="evt.d.ts" />

import { describe, it } from "mocha";
import { strictEqual } from "assert";
import evt from "../../events";

describe("Evt-bus test (componentA)", () => {
  it("basic-usage", () => {
    const { on, emit } = evt({ name: "basic-usage" });

    const barToSend = { id: "foo", score: 1.0, time: new Date() };

    on.fooTrigger((e, bar) => strictEqual(barToSend, bar));

    emit.fooTrigger(barToSend);
  });

  it("propagation-stop", () => {
    const { on, emit } = evt({ name: "propagation-stop" });

    let changeFlag = false;

    on.fooTrigger((e, bar) => (e.cancel = true));
    on.fooTrigger((e, bar) => (changeFlag = true));

    const emitResult = emit.fooTrigger({
      id: "foo",
      score: 1.0,
      time: new Date(),
    });

    strictEqual(changeFlag, false);
    strictEqual(emitResult, false);
  });

  it("propagation-stop(async)", async () => {
    const { on, emitAsync } = evt({ name: "propagation-stop" });

    let changeFlag = false;

    on.fooTrigger((e, bar) => {
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          e.cancel = true;
          resolve();
        }, 10);
      });
    });
    on.fooTrigger((e, bar) => (changeFlag = true));

    const emitResult = await emitAsync.fooTrigger({
      id: "foo",
      score: 1.0,
      time: new Date(),
    });

    strictEqual(changeFlag, false);
    strictEqual(emitResult, false);
  });
});
