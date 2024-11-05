import { describe, it } from "mocha";
import { strictEqual } from "assert";
import evt from "../events";

describe("Evt-bus test (simple)", () => {
  it("basic-usage", () => {
    const { on, emit } = evt({ name: "basic-usage" });

    const barToSend = { id: "foo", score: 1.0, time: new Date() };

    on.fooTrigger((bar) => strictEqual(barToSend, bar));

    emit.fooTrigger(barToSend);
  });

  it("async-emitter", async () => {
    const { on, emitAsync } = evt({ name: "async-emitter" });

    const barToSend = { id: "foo", score: 1.0, time: new Date() };

    on.fooTrigger(async (bar) => {
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          strictEqual(barToSend, bar);
          resolve();
        }, 10);
      });
    });

    await emitAsync.fooTrigger(barToSend);
  });

  it("propagation-stop", () => {
    // Simple mode cannot stop propagation
  });

  it("handler-sorting", () => {
    const { emit, on } = evt({ name: "handler-sorting", defaultOrder: 2 });

    let sortResult = "";

    on.fooTrigger((bar) => (sortResult += " -> 1"), undefined, 1);
    on.fooTrigger((bar) => (sortResult += " -> 1(later)"), undefined, 1);
    on.fooTrigger((bar) => (sortResult += " -> 2(default)"));
    on.fooTrigger((bar) => (sortResult += " -> 2(later)"));
    on.fooTrigger((bar) => (sortResult += " -> 3"), undefined, 3);
    on.fooTrigger((bar) => (sortResult += " -> 3(later)"), undefined, 3);

    emit.fooTrigger({ id: "foo", score: 1, time: new Date() });

    strictEqual(
      sortResult,
      " -> 3 -> 3(later) -> 2(default) -> 2(later) -> 1 -> 1(later)",
    );
  });

  it("handler-group-off", () => {
    const { emit, on, offAll } = evt({
      name: "handler-group-off",
      defaultGroup: "group-1",
    });

    let eventResult = "received:";

    on.fooTrigger((bar) => (eventResult += " foo"), "group-1");
    on.barTrigger((id, score, time) => (eventResult += " bar"), "group-1");
    on.bazTrigger((id, ...score) => (eventResult += " baz"), "group-2");

    offAll("group-1");

    emit.fooTrigger({ id: "foo", score: 1, time: new Date() });
    emit.barTrigger("bar", 1, new Date());
    emit.bazTrigger("baz", 1, 2, 3, 4, 5);

    strictEqual(eventResult, "received: baz");
  });

  it("handler-repeatable", () => {
    const { emit, on } = evt({
      name: "handler-repeatable",
      defaultRepeatable: true,
    });

    let eventResult = "received in:";

    const handler1 = (bar: { id: string; score: number; time: Date }) => {
      eventResult += " handler1";
    };
    on.fooTrigger(handler1);
    on.fooTrigger(handler1);
    on.fooTrigger(handler1);

    const handler2 = (bar: { id: string; score: number; time: Date }) => {
      eventResult += " handler2";
    };
    on.fooTrigger(handler2, undefined, undefined, false);
    on.fooTrigger(handler2, undefined, undefined, false);
    on.fooTrigger(handler2, undefined, undefined, false);

    emit.fooTrigger({ id: "foo", score: 1, time: new Date() });

    strictEqual(
      eventResult,
      "received in: handler1 handler1 handler1 handler2",
    );
  });

  it("exception-handler", () => {
    let exceptionResult = "exception caught:";

    const { withExceptionHandler, emit, on } = evt({
      name: "exception-handler",
      defaultExceptionHandler: (err) =>
        (exceptionResult += ` ${err.message}(default)`),
    });

    on.fooTrigger((bar: { id: string; score: number; time: Date }) => {
      throw new Error("user-err");
    });

    emit.fooTrigger({ id: "foo", score: 1, time: new Date() });

    withExceptionHandler(
      (err) => (exceptionResult += ` ${err.message}(specific)`),
    ).emit.fooTrigger({
      id: "foo",
      score: 1,
      time: new Date(),
    });

    strictEqual(
      exceptionResult,
      "exception caught: user-err(default) user-err(specific)",
    );
  });

  it("string-message", () => {
    const { on, emit } = evt({ name: "string-message" });

    const barToSend = { id: "foo", score: 1.0, time: new Date() };

    on.fooTrigger((bar) => strictEqual(barToSend, bar));
    emit("fooTrigger", barToSend);

    on("barTrigger", (id: string, score: number, time: Date) => {
      strictEqual(barToSend.id, id);
      strictEqual(barToSend.score, score);
      strictEqual(barToSend.time, time);
    });
    emit.barTrigger(barToSend.id, barToSend.score, barToSend.time);
  });

  it("count-listener", () => {
    const { on, onCount } = evt({ name: "count-listener" });

    const handler1 = (bar: { id: string; score: number; time: Date }) => {};
    const handler2 = (bar: { id: string; score: number; time: Date }) => {};

    on.fooTrigger(handler1, "group-1", 1);
    on.fooTrigger(handler1, "group-1", 2);
    on.fooTrigger(handler1, "group-2", 1);
    on.fooTrigger(handler1, "group-2", 2);
    on.fooTrigger(handler2, "group-1", 1);
    on.fooTrigger(handler2, "group-1", 2);
    on.fooTrigger(handler2, "group-2", 1);
    on.fooTrigger(handler2, "group-2", 2);

    strictEqual(onCount.fooTrigger(handler1, "group-1", 1), 1);
  });
});
