const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent";

export async function rewriteNews(title: string, summary: string): Promise<{ title: string; summary: string; content: string } | null> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;

  const prompt = `Sen bir Türk spor gazetecisisin. Aşağıdaki haber başlığı ve özetini kullanarak tamamen orijinal bir Türkçe spor haberi yaz.

KAYNAK BAŞLIK: ${title}
KAYNAK ÖZET: ${summary}

KURALLAR:
- Tamamen orijinal, kendi cümlelerinle yaz. Kaynak metni kopyalama.
- Başlık: dikkat çekici, kısa, Türkçe (max 80 karakter)
- Özet: 1-2 cümle (max 200 karakter)
- İçerik: 3-4 paragraf, detaylı spor haberi (200-400 kelime)
- Profesyonel gazetecilik diliyle yaz
- Tarafsız ve bilgilendirici ol

JSON formatında yanıt ver:
{"title": "...", "summary": "...", "content": "..."}

SADECE JSON yanıt ver.`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20_000); // 20s timeout
    const res = await fetch(`${GEMINI_URL}?key=${key}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 1024 },
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) return null;
    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    // Extract JSON from response (may have markdown code blocks)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    return JSON.parse(jsonMatch[0]);
  } catch {
    return null;
  }
}
