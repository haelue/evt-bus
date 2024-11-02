import {
  EvtHandler,
  EvtHandlerWithEventArg,
  EvtChannelName,
  EvtChannelOptions,
  evtDebug,
  evtDefaultOptions,
  EvtExceptionHandler,
  EvtGroupName,
  EvtMessageName,
  EvtOrder,
  EvtRepeatable,
} from "./common";

/** Event channel */
export class EvtChannel {
  /** Channel name */
  name: EvtChannelName;

  /** Error handler of exception caught at emit-handler-loop. */
  defaultExceptionHandler: EvtExceptionHandler;

  /** use in withExceptionHandler() */
  _oldExceptionHandler: EvtExceptionHandler | undefined = undefined;

  /** Default order */
  defaultOrder: EvtOrder;

  /** Default group */
  defaultGroup: EvtGroupName;

  /** Default repeatable */
  defaultRepeatable: EvtRepeatable;

  _evts: Record<
    EvtMessageName,
    [EvtHandler | EvtHandlerWithEventArg, EvtGroupName, EvtOrder][]
  > = {};

  constructor(options: Partial<EvtChannelOptions> | undefined = undefined) {
    const opt = options ? { ...evtDefaultOptions, options } : evtDefaultOptions;
    this.name = opt.name;
    this.defaultExceptionHandler = opt.defaultExceptionHandler;
    this.defaultGroup = opt.defaultGroup;
    this.defaultOrder = opt.defaultOrder;
    this.defaultRepeatable = opt.defaultRepeatable;
  }

  /** Add event-listener (manually) */
  addEventListener(
    msg: EvtMessageName,
    cb: EvtHandler | EvtHandlerWithEventArg | undefined = undefined,
    gp: EvtGroupName | undefined = undefined,
    order: EvtOrder | undefined = undefined,
    repeatable: EvtRepeatable | undefined = undefined,
  ): void {
    let listeners = this._evts[msg];
    repeatable ??= this.defaultRepeatable;
    if (
      typeof cb !== "function" ||
      (!repeatable &&
        (listeners || []).some(
          (v) =>
            v[0] === cb &&
            (gp === undefined || v[1] === gp) &&
            (order === undefined || v[2] === order),
        ))
    )
      return;
    listeners ??= ((this._evts[msg] = []), this._evts[msg]);
    gp ??= this.defaultGroup;
    order ??= this.defaultOrder;
    let left = 0;
    let right = listeners.length - 1;
    while (left <= right) {
      const mid = Math.floor((left + right) / 2);
      if (listeners[mid][2] > order) left = mid + 1;
      else if (listeners[mid][2] < order) right = mid - 1;
      else {
        left = mid;
        break;
      }
    }
    evtDebug.on(msg, cb, gp, order, repeatable);
    listeners.splice(left, 0, [cb, gp, order]);
  }

  /** Remove event-listeners of message & handler (manually) */
  removeEventListener(
    msg: EvtMessageName,
    cb: EvtHandler | EvtHandlerWithEventArg | undefined = undefined,
    gp: EvtGroupName | undefined = undefined,
    order: EvtOrder | undefined = undefined,
  ): void {
    const listeners = this._evts[msg];
    if (listeners) {
      for (let i = listeners.length - 1; i > -1; i--) {
        const listener = listeners[i];
        if (
          (cb === undefined || listener[0] === cb) &&
          (gp === undefined || listener[1] === gp) &&
          (order === undefined || listener[2] === order)
        ) {
          evtDebug.off(msg, cb, gp, order);
          listeners.splice(i, 1);
        }
      }
      if (listeners.length === 0) delete this._evts[msg];
    }
  }

  /** Remove event-listeners of group & order (manually) */
  removeGroupEventListeners(
    gp: EvtGroupName | undefined = undefined,
    order: EvtOrder | undefined = undefined,
  ): void {
    for (let msg in this._evts) {
      this.removeEventListener(msg, undefined, gp, order);
    }
  }

  /** Dispatch event (manually) */
  dispatchEvent(msg: EvtMessageName, ...args: any[]): boolean {
    let result = true;
    const e = { message: msg, cancel: false };
    for (let listener of this._evts[msg] || []) {
      try {
        evtDebug.emit(msg, listener[0], e, ...(args as [any]));
        listener[0](e, ...args);
      } catch (error) {
        evtDebug.exception(msg, listener[0], e, error);
        this.defaultExceptionHandler(error);
      }
      if (e.cancel) {
        result = false;
        break;
      }
    }
    if (this._oldExceptionHandler) {
      this.defaultExceptionHandler = this._oldExceptionHandler;
      this._oldExceptionHandler = undefined;
    }
    return result;
  }

  /** Dispatch event async (manually) */
  async dispatchEventAsync(
    msg: EvtMessageName,
    ...args: any
  ): Promise<boolean> {
    let result = true;
    const e = { message: msg, cancel: false };
    for (let listener of this._evts[msg] || []) {
      try {
        evtDebug.emit(msg, listener[0], e, ...(args as [any]));
        await listener[0](e, ...args);
      } catch (error) {
        evtDebug.exception(msg, listener[0], e, error);
        await this.defaultExceptionHandler(error);
      }
      if (e.cancel) {
        result = false;
        break;
      }
    }
    if (this._oldExceptionHandler) {
      this.defaultExceptionHandler = this._oldExceptionHandler;
      this._oldExceptionHandler = undefined;
    }
    return result;
  }

  /** Check if an event message exists (manually) */
  existEventListener(msg: EvtMessageName): boolean {
    return this._evts[msg]?.length > 0;
  }

  onMethodCached: { [x: string | symbol]: Function } = {};

  on = new Proxy(this.addEventListener.bind(this), {
    get: (_target, prop) => {
      // return a function for register event
      return (
        this.onMethodCached[prop] ||
        ((this.onMethodCached[prop] = this.addEventListener.bind(
          this,
          prop as EvtMessageName,
        )),
        this.onMethodCached[prop])
      );
    },
  });

  offMethodCached: { [x: string | symbol]: Function } = {};

  off = new Proxy(this.removeEventListener.bind(this), {
    get: (_target, prop) => {
      // return a function for unregister event
      return (
        this.offMethodCached[prop] ||
        ((this.offMethodCached[prop] = this.removeEventListener.bind(
          this,
          prop as EvtMessageName,
        )),
        this.offMethodCached[prop])
      );
    },
  });

  offAll = this.removeGroupEventListeners.bind(this);

  emitMethodCached: { [x: string | symbol]: Function } = {};

  emit = new Proxy(this.dispatchEvent.bind(this), {
    get: (_target, prop) => {
      // return a function for emit event
      return (
        this.emitMethodCached[prop] ||
        ((this.emitMethodCached[prop] = this.dispatchEvent.bind(
          this,
          prop as EvtMessageName,
        )),
        this.emitMethodCached[prop])
      );
    },
  });

  emitAsyncMethodCached: { [x: string | symbol]: Function } = {};

  emitAsync = new Proxy(this.dispatchEventAsync.bind(this), {
    get: (_target, prop) => {
      // return a function for emit event
      return (
        this.emitAsyncMethodCached[prop] ||
        ((this.emitAsyncMethodCached[prop] = this.dispatchEventAsync.bind(
          this,
          prop as EvtMessageName,
        )),
        this.emitAsyncMethodCached[prop])
      );
    },
  });

  existMethodCached: { [x: string | symbol]: Function } = {};

  exist = new Proxy(this.existEventListener.bind(this), {
    get: (_target, prop) => {
      // return a function for emit event
      return (
        this.existMethodCached[prop] ||
        ((this.existMethodCached[prop] = this.existEventListener.bind(
          this,
          prop as EvtMessageName,
        )),
        this.existMethodCached[prop])
      );
    },
  });

  _withExceptionHandler(exceptionHandler: EvtExceptionHandler) {
    if (typeof exceptionHandler !== "function") {
      return this;
    }
    this._oldExceptionHandler = this.defaultExceptionHandler;
    this.defaultExceptionHandler = exceptionHandler;
    return this;
  }

  withExceptionHandler = this._withExceptionHandler.bind(this);
}
