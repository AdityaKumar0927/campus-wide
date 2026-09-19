import "server-only";
import { scrubPii } from "./pii";

/**
 * Optional server fallback (Groq, OpenAI-compatible). Off unless GROQ_API_KEY is set AND the campus
 * switched `ai_server` on AND the member clicked the button. Input is scrubbed; output is a label or
 * a summary, never an action.
 */
const ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = process.env.GROQ_MODEL ?? "llama-3.1-8b-instant";

export function serverAiConfigured(): boolean {
  return Boolean(process.env.GROQ_API_KEY);
}

export async function complete(system: string, user: string, maxTokens = 300): Promise<string | null> {
  const key = process.env.GROQ_API_KEY;
  if (!key) return null;
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: MODEL,
      temperature: 0.2,
      max_tokens: maxTokens,
      messages: [
        { role: "system", content: system },
        { role: "user", content: scrubPii(user).slice(0, 12_000) },
      ],
    }),
    signal: AbortSignal.timeout(20_000),
  });
  if (!res.ok) return null;
  const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  return json.choices?.[0]?.message?.content?.trim() ?? null;
}
