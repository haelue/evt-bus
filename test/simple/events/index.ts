/** file: src/events/index.ts */

import {
  EvtChannelSimple as EvtChannel,
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
} from "../../../src";

import { EvtOnOffDictionary } from "./onoff";
import { EvtEmitDictionary } from "./emit";
import { EvtEmitAsyncDictionary } from "./emitasync";
import { EvtOnCountDictionary } from "./oncount";

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

/** Get an event-channel of channel-name (caching). */
export default function evt(
  options?: Partial<EvtChannelOptions>,
): UserEvtChannel {
  const name = options?.name ?? evtDefaultOptions.name;
  return (channelCached[name] ??= new EvtChannel(options));
}
