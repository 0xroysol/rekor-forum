"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { RichTextEditor } from "@/components/editor/rich-text-editor";
import { useAuth } from "@/providers/auth-provider";

interface CategoryOption {
  id: string;
  name: string;
  slug: string;
  parentName: string | null;
}

interface PrefixOption {
  id: string;
  label: string;
  color: string;
}

export default function CreateThreadPage() {
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [prefixes, setPrefixes] = useState<PrefixOption[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedPrefix, setSelectedPrefix] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState("");
  const [pollEnabled, setPollEnabled] = useState(false);
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState<string[]>(["", ""]);
  const [pollDuration, setPollDuration] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { dbUser } = useAuth();
  const router = useRouter();

  useEffect(() => {
    fetch("/api/categories")
      .then((res) => res.json())
      .then((data) => setCategories(data))
      .catch(() => {});

    fetch("/api/prefixes")
      .then((res) => res.json())
      .then((data) => setPrefixes(data))
      .catch(() => {});
  }, []);

  async function handleSubmit() {
    setError("");

    if (!selectedCategory) {
      setError("Lütfen bir kategori seçin");
      return;
    }
    if (title.length < 5) {
      setError("Başlık en az 5 karakter olmalıdır");
      return;
    }
    if (content.length < 10) {
      setError("İçerik en az 10 karakter olmalıdır");
      return;
    }

    setLoading(true);

    const tagList = tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean)
      .slice(0, 5);

    const res = await fetch("/api/threads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        content,
        categoryId: selectedCategory,
        prefixId: selectedPrefix || null,
        tags: tagList,
        ...(pollEnabled && pollQuestion && pollOptions.filter(Boolean).length >= 2
          ? {
              poll: {
                question: pollQuestion,
                options: pollOptions.filter(Boolean),
                duration: pollDuration,
              },
            }
          : {}),
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Konu oluşturulurken bir hata oluştu");
      setLoading(false);
      return;
    }

    const data = await res.json();
    router.push(`/konu/${data.slug}`);
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-sm text-[#64748b]">
        <Link href="/" className="transition-colors hover:text-[#e2e8f0]">
          Forum
        </Link>
        <span>›</span>
        <span className="text-[#94a3b8]">Yeni Konu Oluştur</span>
      </nav>

      {/* Form Card */}
      <div className="overflow-hidden rounded-xl border border-[#1e293b] bg-[#131820]">
        {/* Card Header */}
        <div className="bg-[#1a2130] px-5 py-3">
          <h1 className="text-xs font-semibold uppercase tracking-wide text-[#94a3b8]">
            Yeni Konu Oluştur
          </h1>
        </div>

        <div className="space-y-5 p-5">
          {error && (
            <div className="rounded-md border border-[#ef4444]/30 bg-[#ef4444]/10 px-3 py-2 text-sm text-[#ef4444]">
              {error}
            </div>
          )}

          {!dbUser && (
            <div className="rounded-md border border-[#e8a935]/30 bg-[#e8a935]/10 px-3 py-2 text-sm text-[#e8a935]">
              Konu oluşturmak için{" "}
              <Link href="/giris" className="underline">giriş yapın</Link>.
            </div>
          )}

          {/* Category Selector */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[#94a3b8]">
              Kategori
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full appearance-none rounded-md border border-[#1e293b] bg-[#0d1017] px-4 py-2.5 text-sm text-[#e2e8f0] transition-colors focus:border-[#1f844e] focus:outline-none focus:ring-1 focus:ring-[#1f844e]/30"
            >
              <option value="">Kategori seçin...</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.parentName ? `${cat.parentName} › ` : ""}
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Prefix Selector */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[#94a3b8]">
              Etiket (Prefix)
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setSelectedPrefix("")}
                className={`rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors ${
                  selectedPrefix === ""
                    ? "border-[#94a3b8] bg-[#94a3b8]/10 text-[#e2e8f0]"
                    : "border-[#1e293b] text-[#64748b] hover:text-[#94a3b8]"
                }`}
              >
                Yok
              </button>
              {prefixes.map((prefix) => (
                <button
                  key={prefix.id}
                  type="button"
                  onClick={() => setSelectedPrefix(prefix.id)}
                  className={`rounded-md border px-3 py-1.5 text-xs font-bold uppercase transition-all ${
                    selectedPrefix === prefix.id
                      ? "scale-105"
                      : "opacity-70 hover:opacity-100"
                  }`}
                  style={{
                    borderColor: prefix.color,
                    color: prefix.color,
                    backgroundColor:
                      selectedPrefix === prefix.id
                        ? `${prefix.color}1a`
                        : "transparent",
                  }}
                >
                  {prefix.label}
                </button>
              ))}
            </div>
          </div>

          {/* Title Input */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[#94a3b8]">
              Konu Başlığı
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Konunuz için açıklayıcı bir başlık girin..."
              className="w-full rounded-md border border-[#1e293b] bg-[#0d1017] px-4 py-2.5 text-sm text-[#e2e8f0] placeholder:text-[#64748b] transition-colors focus:border-[#1f844e] focus:outline-none focus:ring-1 focus:ring-[#1f844e]/30"
            />
          </div>

          {/* Content Editor */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[#94a3b8]">
              İçerik
            </label>
            <RichTextEditor content={content} onChange={setContent} placeholder="Konunuzu detaylı yazın..." minHeight={250} />
          </div>

          {/* Poll Toggle */}
          <div>
            <button
              type="button"
              onClick={() => setPollEnabled(!pollEnabled)}
              className={`flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-medium transition-colors ${
                pollEnabled
                  ? "border-[#1f844e] bg-[#1f844e]/10 text-[#1f844e]"
                  : "border-[#1e293b] text-[#94a3b8] hover:text-[#e2e8f0]"
              }`}
            >
              <span>📊</span> Anket Ekle
            </button>

            {pollEnabled && (
              <div className="mt-3 space-y-3 rounded-lg border border-[#1e293b] bg-[#0d1017] p-4">
                {/* Poll Question */}
                <div>
                  <label className="mb-1 block text-sm text-[#94a3b8]">Soru</label>
                  <input
                    type="text"
                    value={pollQuestion}
                    onChange={(e) => setPollQuestion(e.target.value)}
                    placeholder="Anket sorunuz..."
                    className="w-full rounded-md border border-[#1e293b] bg-[#131820] px-3 py-2 text-sm text-[#e2e8f0] placeholder:text-[#64748b] focus:border-[#1f844e] focus:outline-none"
                  />
                </div>

                {/* Poll Options */}
                <div>
                  <label className="mb-1 block text-sm text-[#94a3b8]">Seçenekler</label>
                  <div className="space-y-2">
                    {pollOptions.map((opt, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={opt}
                          onChange={(e) => {
                            const next = [...pollOptions];
                            next[i] = e.target.value;
                            setPollOptions(next);
                          }}
                          placeholder={`Seçenek ${i + 1}`}
                          className="flex-1 rounded-md border border-[#1e293b] bg-[#131820] px-3 py-2 text-sm text-[#e2e8f0] placeholder:text-[#64748b] focus:border-[#1f844e] focus:outline-none"
                        />
                        {pollOptions.length > 2 && (
                          <button
                            type="button"
                            onClick={() =>
                              setPollOptions(pollOptions.filter((_, j) => j !== i))
                            }
                            className="flex h-8 w-8 items-center justify-center rounded-md text-[#64748b] hover:bg-[#1e2738] hover:text-[#ef4444]"
                          >
                            &times;
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  {pollOptions.length < 10 && (
                    <button
                      type="button"
                      onClick={() => setPollOptions([...pollOptions, ""])}
                      className="mt-2 text-sm text-[#1f844e] hover:underline"
                    >
                      + Seçenek ekle
                    </button>
                  )}
                </div>

                {/* Poll Duration */}
                <div>
                  <label className="mb-1 block text-sm text-[#94a3b8]">Süre</label>
                  <select
                    value={pollDuration ?? ""}
                    onChange={(e) =>
                      setPollDuration(e.target.value ? Number(e.target.value) : null)
                    }
                    className="w-full appearance-none rounded-md border border-[#1e293b] bg-[#131820] px-3 py-2 text-sm text-[#e2e8f0] focus:border-[#1f844e] focus:outline-none"
                  >
                    <option value="">Süresiz</option>
                    <option value="1">1 Gün</option>
                    <option value="3">3 Gün</option>
                    <option value="7">7 Gün</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Tags Input */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[#94a3b8]">
              Etiketler (Tags)
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="Etiketleri virgülle ayırın: futbol, süper lig, fenerbahçe"
              className="w-full rounded-md border border-[#1e293b] bg-[#0d1017] px-4 py-2.5 text-sm text-[#e2e8f0] placeholder:text-[#64748b] transition-colors focus:border-[#1f844e] focus:outline-none focus:ring-1 focus:ring-[#1f844e]/30"
            />
            <p className="mt-1 text-[11px] text-[#64748b]">
              En fazla 5 etiket ekleyebilirsiniz.
            </p>
          </div>

          {/* Submit */}
          <div className="flex items-center justify-between pt-2">
            <Link
              href="/"
              className="text-sm text-[#64748b] transition-colors hover:text-[#e2e8f0]"
            >
              İptal
            </Link>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading || !dbUser}
              className="rounded-md bg-[#1f844e] px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1f844e]/80 disabled:opacity-50"
            >
              {loading ? "Oluşturuluyor..." : "Konuyu Oluştur"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
