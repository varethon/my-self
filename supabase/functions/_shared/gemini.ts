import { geminiSelection } from './schemas.ts';
import type { Candidate } from './scheduler.ts';

const modelName = (): string => Deno.env.get('GEMINI_MODEL') ?? 'gemini-3.8-flash';

export async function chooseCandidates(candidates: Candidate[]): Promise<{ ids: string[]; model: string; fallback: boolean }> {
  const apiKey = Deno.env.get('GEMINI_API_KEY');
  if (!apiKey || candidates.length === 0) return { ids: candidates.slice(0, 8).map((candidate) => candidate.candidateId), model: 'deterministic', fallback: true };
  const prompt = JSON.stringify(candidates.slice(0, 80).map((candidate) => ({ id: candidate.candidateId, taskId: candidate.taskId, startAt: candidate.startAt, endAt: candidate.endAt, score: candidate.score })));
  const payload = { contents: [{ parts: [{ text: `Choose at most 8 non-overlapping candidate IDs for the user's highest priority work. Return JSON only in the shape {"candidateIds":["..."]}. Candidates: ${prompt}` }] }], generationConfig: { responseMimeType: 'application/json' } };
  for (const model of [modelName(), 'gemini-2.5-flash']) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 12000);
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), signal: controller.signal });
      clearTimeout(timeout);
      if (!response.ok) continue;
      const body = await response.json() as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
      const text = body.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) continue;
      const parsed = geminiSelection.safeParse(JSON.parse(text));
      if (parsed.success) return { ids: parsed.data.candidateIds, model, fallback: false };
    } catch {
      // A planner timeout must never prevent a deterministic preview.
    }
  }
  return { ids: candidates.slice(0, 8).map((candidate) => candidate.candidateId), model: 'deterministic-fallback', fallback: true };
}
