/// <reference lib="webworker" />
import { env, pipeline, type FeatureExtractionPipeline, type TextClassificationPipeline } from "@huggingface/transformers";

/**
 * Model worker: embeddings for duplicate-question suggestions and the toxicity nudge. Everything
 * stays on the device; models download from the Hugging Face CDN on first use and are cached by
 * the browser. The main thread treats any failure as "no AI".
 */
env.allowLocalModels = false;

type Req = { id: number; kind: "embed" | "toxicity"; text: string; device: "webgpu" | "wasm" };
type Res = { id: number; ok: true; vector?: number[]; scores?: { label: string; score: number }[] } | { id: number; ok: false; error: string };

let embedder: Promise<FeatureExtractionPipeline> | null = null;
let classifier: Promise<TextClassificationPipeline> | null = null;

function post(msg: Res) {
  (self as unknown as Worker).postMessage(msg);
}

self.onmessage = async (e: MessageEvent<Req>) => {
  const { id, kind, text, device } = e.data;
  try {
    if (kind === "embed") {
      embedder ??= pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2", { dtype: "q8", device });
      const out = await (await embedder)(text, { pooling: "mean", normalize: true });
      post({ id, ok: true, vector: Array.from(out.data as Float32Array) });
    } else {
      classifier ??= pipeline("text-classification", "Xenova/toxic-bert", { dtype: "q8", device });
      const out = await (await classifier)(text, { top_k: 6 });
      const list = (Array.isArray(out[0]) ? out[0] : out) as { label: string; score: number }[];
      post({ id, ok: true, scores: list.map((s) => ({ label: s.label, score: s.score })) });
    }
  } catch (err) {
    post({ id, ok: false, error: err instanceof Error ? err.message : String(err) });
  }
};
