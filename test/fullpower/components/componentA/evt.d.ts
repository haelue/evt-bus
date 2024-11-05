declare interface EvtEmitDictionary {
  /** example emitter with type infer */
  fooTrigger(bar: { id: string; score: number; time: Date }): boolean;
}

declare interface EvtEmitAsyncDictionary {
  /** example emitter with type infer */
  fooTrigger(bar: { id: string; score: number; time: Date }): Promise<boolean>;
}

declare interface EvtOnOffDictionary {
  /** example emitter with type infer */
  fooTrigger(cb?: (e: EvtMessage, bar: { id: string; score: number; time: Date }) => void, gp?: EvtGroupName, order?: EvtOrder, repeatable?: EvtRepeatable): void;
}

declare interface EvtOnCountDictionary {
  /** example emitter with type infer */
  fooTrigger(cb?: (e: EvtMessage, bar: { id: string; score: number; time: Date }) => void, gp?: EvtGroupName, order?: EvtOrder): number;
}