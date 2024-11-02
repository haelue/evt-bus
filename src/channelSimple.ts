import { EvtChannel } from "./channel";
import { evtDebug, EvtMessageName } from "./common";

/** Simple Event channel (without e-arg & cancel) */
export class EvtChannelSimple extends EvtChannel {
  /** Dispatch event (manually) */
  dispatchEvent(msg: EvtMessageName, ...args: any[]): boolean {
    const e = { message: msg, cancel: false };
    for (let listener of this._evts[msg] || []) {
      try {
        evtDebug.emit(msg, listener[0], e, ...(args as [any]));
        listener[0](...(args as [any]));
      } catch (error) {
        evtDebug.exception(msg, listener[0], e, error);
        this.defaultExceptionHandler(error);
      }
    }
    if (this._oldExceptionHandler) {
      this.defaultExceptionHandler = this._oldExceptionHandler;
      this._oldExceptionHandler = undefined;
    }
    return true;
  }

  /** Dispatch event async (manually) */
  async dispatchEventAsync(
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
        await this.defaultExceptionHandler(error);
      }
    }
    if (this._oldExceptionHandler) {
      this.defaultExceptionHandler = this._oldExceptionHandler;
      this._oldExceptionHandler = undefined;
    }
    return true;
  }
}
