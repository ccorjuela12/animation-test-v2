import { Html } from '@react-three/drei'

export default function CanvasLoader() {
  return (
    <Html center>
      <div className="flex items-center gap-2 rounded-md bg-black/70 px-4 py-2 text-sm text-white">
        <span className="inline-block h-2 w-2 animate-ping rounded-full bg-white" />
        <span>Cargando escena…</span>
      </div>
    </Html>
  )
}
