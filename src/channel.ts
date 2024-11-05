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
    const opt = options
      ? { ...evtDefaultOptions, ...options }
      : evtDefaultOptions;
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
    let low = 0;
    let high = listeners.length;
    while (low < high) {
      const mid = Math.floor((low + high) / 2);
      if (order <= listeners[mid][2]) {
        low = mid + 1;
      } else {
        high = mid;
      }
    }
    evtDebug.on(msg, cb, gp, order, repeatable);
    listeners.splice(low, 0, [cb, gp, order]);
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
  _dispatchEvent(
    exceptionHandler: EvtExceptionHandler,
    msg: EvtMessageName,
    ...args: any[]
  ): boolean {
    let result = true;
    const e = { message: msg, cancel: false };
    for (let listener of this._evts[msg] || []) {
      try {
        evtDebug.emit(msg, listener[0], e, ...(args as [any]));
        listener[0](e, ...args);
      } catch (error) {
        evtDebug.exception(msg, listener[0], e, error);
        exceptionHandler(error);
      }
      if (e.cancel) {
        result = false;
        break;
      }
    }
    return result;
  }

  dispatchEvent(msg: EvtMessageName, ...args: any[]): boolean {
    return this._dispatchEvent(this.defaultExceptionHandler, msg, ...args);
  }

  /** Dispatch event async (manually) */
  async _dispatchEventAsync(
    exceptionHandler: EvtExceptionHandler,
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
        await exceptionHandler(error);
      }
      if (e.cancel) {
        result = false;
        break;
      }
    }
    return result;
  }

  async dispatchEventAsync(
    msg: EvtMessageName,
    ...args: any
  ): Promise<boolean> {
    return await this._dispatchEventAsync(
      this.defaultExceptionHandler,
      msg,
      ...args,
    );
  }

  /** Count event-listeners (manually) */
  countEventListener(
    msg: EvtMessageName,
    cb: EvtHandler | EvtHandlerWithEventArg | undefined = undefined,
    gp: EvtGroupName | undefined = undefined,
    order: EvtOrder | undefined = undefined,
  ): number {
    let count = 0;
    const listeners = this._evts[msg];
    if (listeners) {
      for (let listener of listeners) {
        if (
          (cb === undefined || listener[0] === cb) &&
          (gp === undefined || listener[1] === gp) &&
          (order === undefined || listener[2] === order)
        ) {
          count++;
        }
      }
    }
    return count;
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

  onCountMethodCached: { [x: string | symbol]: Function } = {};

  onCount = new Proxy(this.countEventListener.bind(this), {
    get: (_target, prop) => {
      // return a function for emit event
      return (
        this.onCountMethodCached[prop] ||
        ((this.onCountMethodCached[prop] = this.countEventListener.bind(
          this,
          prop as EvtMessageName,
        )),
        this.onCountMethodCached[prop])
      );
    },
  });

  _withExceptionHandler(exceptionHandler: EvtExceptionHandler) {
    return {
      emit: new Proxy(this._dispatchEvent.bind(this, exceptionHandler), {
        get: (_target, prop) => {
          // return a function for emit event
          return this._dispatchEvent.bind(
            this,
            exceptionHandler,
            prop as EvtMessageName,
          );
        },
      }),
      emitAsync: new Proxy(
        this._dispatchEventAsync.bind(this, exceptionHandler),
        {
          get: (_target, prop) => {
            // return a function for emit event
            return this._dispatchEventAsync.bind(
              this,
              exceptionHandler,
              prop as EvtMessageName,
            );
          },
        },
      ),
    };
  }

  withExceptionHandler = this._withExceptionHandler.bind(this);
}
