/** Auto generate by evt-autogen.js! */

export interface EvtOnCountDictionary {
  /** Foo triggered with type infer */
  fooTrigger(
    cb?: (bar: { id: string; score: number; time: Date }) => void,
    gp?: EvtGroupName,
    order?: EvtOrder,
  ): number;

  /** Bar triggered with type infer */
  barTrigger(
    cb?: (id: string, score: number, time: Date) => void,
    gp?: EvtGroupName,
    order?: EvtOrder,
  ): number;

  /** Baz triggered with type infer */
  bazTrigger(
    cb?: (id: string, ...scores: number[]) => void,
    gp?: EvtGroupName,
    order?: EvtOrder,
  ): number;
}
