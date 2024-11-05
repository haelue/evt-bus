export interface EvtEmitDictionary {
  /** Foo triggered with type infer */
  fooTrigger(bar: { id: string; score: number; time: Date }): boolean;

  /** Bar triggered with type infer */
  barTrigger(id: string, score: number, time: Date): boolean;

  /** Baz triggered with type infer */
  bazTrigger(id: string, ...scores: number[]): boolean;
}
