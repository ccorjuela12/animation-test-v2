declare module 'three/examples/jsm/loaders/SVGLoader.js' {
  import * as THREE from 'three'

  export interface SVGLoaderResult {
    paths: SVGLoaderPath[]
    xml?: SVGSVGElement
  }

  export interface SVGLoaderPath extends THREE.ShapePath {
    userData: {
      style?: {
        fill?: string
      }
    }
  }

  export class SVGLoader {
    constructor()
    load(
      url: string,
      onLoad: (data: SVGLoaderResult) => void,
      onProgress?: (event: ProgressEvent<EventTarget>) => void,
      onError?: (event: ErrorEvent) => void,
    ): void
    parse(data: string | Document): SVGLoaderResult
  }
}
