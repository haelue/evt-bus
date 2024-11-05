/// <reference path="evt.d.ts" />

import { describe, it } from "mocha";
import { deepEqual, strictEqual } from "assert";
import evt from "../../events";

describe("Evt-bus test (componentB)", () => {
  it("basic-usage", () => {
    const { on, emit } = evt({ name: "basic-usage" });

    const barToSend = { id: "foo", score: 1.0, time: new Date() };

    on.barTrigger((e, id, score, time) => {
      strictEqual(id, barToSend.id);
      strictEqual(score, barToSend.score);
      strictEqual(time, barToSend.time);
    });

    emit.barTrigger(barToSend.id, barToSend.score, barToSend.time);

    on.bazTrigger((e, id, ...scores) => {
      strictEqual(id, "baz");
      deepEqual(scores, [1, 2, 3]);
    });

    emit.bazTrigger("baz", 1, 2, 3);
  });
});
