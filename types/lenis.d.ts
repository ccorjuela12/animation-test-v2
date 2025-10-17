declare module '@studio-freight/lenis' {
  export interface LenisOptions {
    lerp?: number;
    smoothWheel?: boolean;
    smoothTouch?: boolean;
    orientation?: 'vertical' | 'horizontal';
    [key: string]: unknown;
  }

  export default class Lenis {
    constructor(opts?: LenisOptions);
    raf(time: number): void;
    on(event: string, cb: (...args: unknown[]) => void): void;
    scrollTo(value: number | HTMLElement, options?: Record<string, unknown>): void;
    destroy(): void;
  }
}
