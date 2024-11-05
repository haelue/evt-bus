/** Auto generate by evt-autogen.js! */

export interface EvtOnOffDictionary {
  /** Foo triggered with type infer */
  fooTrigger(cb?: (bar: { id: string; score: number; time: Date }) => void, gp?: EvtGroupName, order?: EvtOrder, repeatable?: EvtRepeatable): void;

  /** Bar triggered with type infer */
  barTrigger(cb?: (id: string, score: number, time: Date) => void, gp?: EvtGroupName, order?: EvtOrder, repeatable?: EvtRepeatable): void;

  /** Baz triggered with type infer */
  bazTrigger(cb?: (id: string, ...scores: number[]) => void, gp?: EvtGroupName, order?: EvtOrder, repeatable?: EvtRepeatable): void;
}