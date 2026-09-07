import { useEffect, useRef } from 'react';
import { useMicVAD } from '@ricky0123/vad-react';

export function useVAD(
  onSpeechEndCallback: (audio: Float32Array) => void,
  disabled = false,
) {
  const callbackRef = useRef(onSpeechEndCallback);
  const disabledRef = useRef(disabled);

  useEffect(() => {
    callbackRef.current = onSpeechEndCallback;
    disabledRef.current = disabled;
  }, [disabled, onSpeechEndCallback]);

  const vad = useMicVAD({
    startOnLoad: true,
    baseAssetPath: "/",
    onnxWASMBasePath: "/",
    ortConfig(ort) {
      ort.env.wasm.numThreads = 1;
      ort.env.wasm.wasmPaths = "/";
    },
    onSpeechEnd: (audio) => {
      if (!disabledRef.current) {
        callbackRef.current(audio);
      }
    },
  });

  return vad;
}
