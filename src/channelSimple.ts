import { EvtChannel } from "./channel";
import { evtDebug, EvtExceptionHandler, EvtMessageName } from "./common";

/** Simple Event channel (without e-arg & cancel) */
export class EvtChannelSimple extends EvtChannel {
  /** Dispatch event (manually) */
  _dispatchEvent(
    exceptionHandler: EvtExceptionHandler,
    msg: EvtMessageName,
    ...args: any[]
  ): boolean {
    const e = { message: msg, cancel: false };
    for (let listener of this._evts[msg] || []) {
      try {
        evtDebug.emit(msg, listener[0], e, ...(args as [any]));
        listener[0](...(args as [any]));
      } catch (error) {
        evtDebug.exception(msg, listener[0], e, error);
        exceptionHandler(error);
      }
    }
    return true;
  }

  /** Dispatch event async (manually) */
  async _dispatchEventAsync(
    exceptionHandler: EvtExceptionHandler,
    msg: EvtMessageName,
    ...args: any
  ): Promise<boolean> {
    const e = { message: msg, cancel: false };
    for (let listener of this._evts[msg] || []) {
      try {
        evtDebug.emit(msg, listener[0], e, ...(args as [any]));
        await listener[0](...(args as [any]));
      } catch (error) {
        evtDebug.exception(msg, listener[0], e, error);
        await exceptionHandler(error);
      }
    }
    return true;
  }
}
