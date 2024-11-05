/** Auto generate by evt-autogen.js! */

export interface EvtEmitAsyncDictionary {
  /** Foo triggered with type infer */
  fooTrigger(bar: { id: string; score: number; time: Date }): Promise<boolean>;

  /** Bar triggered with type infer */
  barTrigger(id: string, score: number, time: Date): Promise<boolean>;

  /** Baz triggered with type infer */
  bazTrigger(id: string, ...scores: number[]): Promise<boolean>;
}
