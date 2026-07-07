import { useMicVAD } from '@ricky0123/vad-react';

export function useVAD(onSpeechEndCallback: (audio: Float32Array) => void) {
  const vad = useMicVAD({
    startOnLoad: true,
    baseAssetPath: "/",
    onnxWASMBasePath: "/",
    ortConfig(ort) {
      ort.env.wasm.numThreads = 1;
      ort.env.wasm.wasmPaths = "/";
    },
    onSpeechEnd: (audio) => {
      onSpeechEndCallback(audio);
    },
  });

  return vad;
}
