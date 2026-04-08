const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent";

export async function rewriteNews(title: string, summary: string): Promise<{ title: string; summary: string; content: string } | null> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;

  const prompt = `Türkçe spor haberi yaz. Kaynak: "${title}" - ${summary.slice(0, 150)}

Kısa başlık (max 60 karakter), 1 cümle özet, 2 paragraf içerik (100-150 kelime). Orijinal yaz.

SADECE şu JSON formatında yanıt ver, başka hiçbir şey yazma:
{"title":"başlık","summary":"özet","content":"paragraf1\\n\\nparagraf2"}`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30_000);
    const res = await fetch(`${GEMINI_URL}?key=${key}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2048,
          responseMimeType: "application/json",
        },
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) {
      console.error(`[Gemini] HTTP ${res.status}`);
      return null;
    }
    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    if (!text) return null;

    // Clean and parse
    const cleaned = text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
    try {
      return JSON.parse(cleaned);
    } catch {
      const match = cleaned.match(/\{[\s\S]*\}/);
      if (match) return JSON.parse(match[0]);
      console.error("[Gemini] Parse failed:", cleaned.slice(0, 150));
      return null;
    }
  } catch (e) {
    console.error("[Gemini] Error:", (e as Error).message?.slice(0, 80));
    return null;
  }
}
