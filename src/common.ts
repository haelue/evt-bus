/** Event message name */
export type EvtMessageName = string;

/** Event message, if cancel be set true, the emit-handler-loop will be interrupted and return false */
export interface EvtMessage {
  /** Message name */
  message: EvtMessageName;

  /** Do cancel (stop popagation) when set e.cancel=true */
  cancel?: boolean;
}

/** Event group name, event-listening can be off by group. (default "*") */
export type EvtGroupName = string;

/** Event handler order, larger order take priority, smaller order come later. (default 0) */
export type EvtOrder = number;

/** when adding listener(on method), enable repeat handler & group & order listener exist. (default false) */
export type EvtRepeatable = boolean;

/** Event channel name. (default "#") */
export type EvtChannelName = string;

/**
 * Error handler of exception caught at emit-handler-loop.
 *
 * (You can "throw error" to interrupt the LOOP)
 */
export type EvtExceptionHandler = (error: any) => any;

export interface EvtChannelOptions {
  /** Default name */
  name: EvtChannelName;
  /** Default group name */
  defaultGroup: EvtGroupName;
  /** Default order */
  defaultOrder: EvtOrder;
  /** Default repeatable: false */
  defaultRepeatable: EvtRepeatable;
  /** Default exception handler: console.error() */
  defaultExceptionHandler: EvtExceptionHandler;
}

/** Event handler */
export type EvtHandlerWithEventArg = (e: EvtMessage, ...args: any[]) => any;
export type EvtHandler = (...args: any[]) => any;

/** Event on-method */
export type EvtOnMethod = (
  msg: EvtMessageName,
  cb?: EvtHandler | EvtHandlerWithEventArg,
  gp?: EvtGroupName,
  order?: EvtOrder,
  repeatable?: EvtRepeatable,
) => void;

/** Event off-method */
export type EvtOffMethod = (
  msg: EvtMessageName,
  cb?: EvtHandler | EvtHandlerWithEventArg,
  gp?: EvtGroupName,
  order?: EvtOrder,
) => void;

/** Event offAll-method */
export type EvtOffAllMethod = (gp?: EvtGroupName, order?: EvtOrder) => void;

/** Event emit-method */
export type EvtEmitMethod = (msg: EvtMessageName, ...args: any) => boolean;

/** Event emit-async-method */
export type EvtEmitAsyncMethod = (
  msg: EvtMessageName,
  ...args: any
) => Promise<boolean>;

/** Event exist-method */
export type EvtExistMethod = (msg: EvtMessageName) => boolean;

/** Event with-exception-handler-method */
export type EvtWithExceptionHandlerMethod<T> = (
  exceptionHandler: EvtExceptionHandler,
) => T;

export const evtDebug = {
  on: (
    msg: EvtMessageName,
    cb: EvtHandler,
    gp: EvtGroupName,
    order: EvtOrder,
    repeatable: EvtRepeatable,
  ) => {},
  off: (
    msg: EvtMessageName,
    cb: EvtHandler | EvtHandlerWithEventArg | undefined,
    gp: EvtGroupName | undefined,
    order: EvtOrder | undefined,
  ) => {},
  emit: (
    msg: EvtMessageName,
    cb: EvtHandler,
    e: EvtMessage,
    ...args: any[]
  ) => {},
  exception: (
    msg: EvtMessageName,
    cb: EvtHandler,
    e: EvtMessage,
    error: any,
  ) => {},
};

export const evtDefaultOptions: EvtChannelOptions = {
  name: "#",
  defaultGroup: "*",
  defaultOrder: 0,
  defaultRepeatable: false,
  defaultExceptionHandler: console.error,
};
