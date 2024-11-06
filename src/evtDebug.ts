import {
  EvtHandler,
  evtDebug,
  EvtGroupName,
  EvtMessage,
  EvtMessageName,
  EvtOrder,
  EvtRepeatable,
} from "./common";

declare global {
  interface Window {
    evtDebug: (...args: any) => void;
  }
}

const loadEvtDebug = (
  loadImmediately: boolean,
  nextTickHandler: Function,
  omitMessages: string[],
) => {
  const onTraceMap = new Map();

  evtDebug.on = (
    msg: EvtMessageName,
    cb: EvtHandler,
    gp: EvtGroupName,
    order: EvtOrder,
    repeatable: EvtRepeatable,
  ) => {
    if (cb != null && !onTraceMap.has(cb)) {
      const trace =
        new Error().stack?.split("\n")[3]?.trim().substring(3) ?? "";
      onTraceMap.set(cb, trace);
    }
  };

  const omitMsgs = new Set(omitMessages);
  let lastEvent: EvtMessage | null = null;
  const tickEvents = new Set();
  let diffTick = true;

  const evtDebugEmit = (
    msg: EvtMessageName,
    cb: EvtHandler,
    e: EvtMessage,
    ...args: any[]
  ) => {
    if (omitMsgs.has(msg)) return;
    if (diffTick) {
      diffTick = false;
      nextTickHandler(() => {
        diffTick = true;
        tickEvents.clear();
        console.groupEnd();
        console.log(
          `\x1b[35m--- [nextTick] corresponding: emit.${msg} ----------------------------\x1b[0m`,
        );
      });
    }
    if (e !== lastEvent) {
      lastEvent = e;
      const trace1 =
        new Error().stack?.split("\n")[3]?.trim().substring(3) ??
        "CALLER_NAME_NOT_FOUND";
      let trace2 =
        new Error().stack?.split("\n")[4]?.trim().substring(3) ??
        "CALLER_NAME_NOT_FOUND";
      if (trace2.includes("/.vite/")) trace2 = "CALLER_NAME_NOT_FOUND";

      let flag = "↑";
      if (!tickEvents.has(e)) {
        tickEvents.add(e);
        flag = "◉";
      }

      console.groupEnd();
      console.groupCollapsed(
        `%c${flag} [emit.${msg}]%c ${trace1} at ${trace2} %o`,
        "font-weight:lighter;color:#ff9",
        "font-weight:lighter;color:#fff",
        args,
      );
    }
    console.log(
      `  \x1b[34m[on]\x1b[0m ${onTraceMap.has(cb) ? onTraceMap.get(cb) : "ON_HANDLER_NOT_FOUND"}`,
    );
  };

  if (loadImmediately) {
    evtDebug.emit = evtDebugEmit;
  }
  window["evtDebug"] = () => {
    evtDebug.emit = evtDebug.emit === evtDebugEmit ? () => {} : evtDebugEmit;
  };
};

export default loadEvtDebug;
