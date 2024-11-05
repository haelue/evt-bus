declare interface EvtEmitDictionary {
  /** example emitter with type infer */
  barTrigger(id: string, score: number, time: Date): boolean;

  /** Baz triggered with type infer */
  bazTrigger(id: string, ...scores: number[]): boolean;
}

declare interface EvtEmitAsyncDictionary {
  /** example emitter with type infer */
  barTrigger(id: string, score: number, time: Date): Promise<boolean>;

  /** Baz triggered with type infer */
  bazTrigger(id: string, ...scores: number[]): Promise<boolean>;
}

declare interface EvtOnOffDictionary {
  /** example emitter with type infer */
  barTrigger(cb?: (e: EvtMessage, id: string, score: number, time: Date) => void, gp?: EvtGroupName, order?: EvtOrder, repeatable?: EvtRepeatable): void;

  /** Baz triggered with type infer */
  bazTrigger(cb?: (e: EvtMessage, id: string, ...scores: number[]) => void, gp?: EvtGroupName, order?: EvtOrder, repeatable?: EvtRepeatable): void;
}

declare interface EvtOnCountDictionary {
  /** example emitter with type infer */
  barTrigger(cb?: (e: EvtMessage, id: string, score: number, time: Date) => void, gp?: EvtGroupName, order?: EvtOrder): number;

  /** Baz triggered with type infer */
  bazTrigger(cb?: (e: EvtMessage, id: string, ...scores: number[]) => void, gp?: EvtGroupName, order?: EvtOrder): number;
}