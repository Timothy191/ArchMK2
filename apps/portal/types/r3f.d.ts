// Extend React.JSX.IntrinsicElements for React Three Fiber v8 with React 19.
// R3F v8 augments the global JSX namespace, but React 19 uses React.JSX,
// so we must augment React.JSX.IntrinsicElements directly.
import type { ThreeElements } from "@react-three/fiber";

declare module "react" {
  namespace JSX {
    interface IntrinsicElements extends ThreeElements {}
  }
}
