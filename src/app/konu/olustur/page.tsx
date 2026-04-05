"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

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

  useEffect(() => {
    // Fetch categories
    fetch("/api/categories")
      .then((res) => res.json())
      .then((data) => setCategories(data))
      .catch(() => {});

    // Fetch prefixes
    fetch("/api/prefixes")
      .then((res) => res.json())
      .then((data) => setPrefixes(data))
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#080a0f" }}>
      {/* Header */}
      <header
        className="border-b border-white/10"
        style={{ backgroundColor: "#0d1017" }}
      >
        <div className="mx-auto max-w-7xl px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl font-bold" style={{ color: "#1f844e" }}>
              REKOR
            </span>
            <span className="text-xl font-semibold text-white/80">Forum</span>
          </Link>
          <nav className="flex items-center gap-6 text-sm text-white/60">
            <Link href="/" className="hover:text-white transition-colors">
              Ana Sayfa
            </Link>
          </nav>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 py-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-white/40 mb-6">
          <Link href="/" className="hover:text-white transition-colors">
            Forum
          </Link>
          <span>/</span>
          <span className="text-white/70">Yeni Konu Olustur</span>
        </nav>

        {/* Form */}
        <div className="rounded-lg overflow-hidden" style={{ backgroundColor: "#131820" }}>
          <div
            className="px-5 py-3 font-bold text-sm text-white uppercase tracking-wide"
            style={{ backgroundColor: "#1f844e" }}
          >
            Yeni Konu Olustur
          </div>

          <div className="p-5 space-y-5">
            {/* Category Selector */}
            <div>
              <label className="block text-sm font-medium text-white/70 mb-1.5">
                Kategori
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full rounded-lg border border-white/10 px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#1f844e] transition-colors appearance-none"
                style={{ backgroundColor: "#0d1017" }}
              >
                <option value="">Kategori secin...</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.parentName ? `${cat.parentName} > ` : ""}
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Prefix Selector */}
            <div>
              <label className="block text-sm font-medium text-white/70 mb-1.5">
                Etiket (Prefix)
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedPrefix("")}
                  className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors ${
                    selectedPrefix === ""
                      ? "text-white ring-2 ring-white/30"
                      : "text-white/50 hover:text-white"
                  }`}
                  style={{ backgroundColor: "#0d1017" }}
                >
                  Yok
                </button>
                {prefixes.map((prefix) => (
                  <button
                    key={prefix.id}
                    type="button"
                    onClick={() => setSelectedPrefix(prefix.id)}
                    className={`px-3 py-1.5 rounded text-xs font-bold uppercase text-white transition-all ${
                      selectedPrefix === prefix.id
                        ? "ring-2 ring-white/50 scale-105"
                        : "opacity-70 hover:opacity-100"
                    }`}
                    style={{ backgroundColor: prefix.color }}
                  >
                    {prefix.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Title Input */}
            <div>
              <label className="block text-sm font-medium text-white/70 mb-1.5">
                Konu Basligi
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Konunuz icin aciklayici bir baslik girin..."
                className="w-full rounded-lg border border-white/10 px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#1f844e] transition-colors"
                style={{ backgroundColor: "#0d1017" }}
              />
            </div>

            {/* Content Editor */}
            <div>
              <label className="block text-sm font-medium text-white/70 mb-1.5">
                Icerik
              </label>
              {/* Toolbar */}
              <div
                className="flex items-center gap-1 px-3 py-2 rounded-t-lg border border-b-0 border-white/10"
                style={{ backgroundColor: "#0a0d14" }}
              >
                <button
                  type="button"
                  className="px-2 py-1 text-xs text-white/50 hover:text-white hover:bg-white/10 rounded transition-colors font-bold"
                >
                  B
                </button>
                <button
                  type="button"
                  className="px-2 py-1 text-xs text-white/50 hover:text-white hover:bg-white/10 rounded transition-colors italic"
                >
                  I
                </button>
                <button
                  type="button"
                  className="px-2 py-1 text-xs text-white/50 hover:text-white hover:bg-white/10 rounded transition-colors underline"
                >
                  U
                </button>
                <div className="w-px h-4 bg-white/10 mx-1" />
                <button
                  type="button"
                  className="px-2 py-1 text-xs text-white/50 hover:text-white hover:bg-white/10 rounded transition-colors"
                >
                  🔗
                </button>
                <button
                  type="button"
                  className="px-2 py-1 text-xs text-white/50 hover:text-white hover:bg-white/10 rounded transition-colors"
                >
                  🖼️
                </button>
                <button
                  type="button"
                  className="px-2 py-1 text-xs text-white/50 hover:text-white hover:bg-white/10 rounded transition-colors"
                >
                  📋
                </button>
              </div>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Konu iceriginizi buraya yazin..."
                rows={12}
                className="w-full rounded-b-lg border border-white/10 px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#1f844e] transition-colors resize-y"
                style={{ backgroundColor: "#0d1017" }}
              />
            </div>

            {/* Tags Input */}
            <div>
              <label className="block text-sm font-medium text-white/70 mb-1.5">
                Etiketler (Tags)
              </label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="Etiketleri virgul ile ayirin: futbol, super lig, fenerbahce"
                className="w-full rounded-lg border border-white/10 px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#1f844e] transition-colors"
                style={{ backgroundColor: "#0d1017" }}
              />
              <p className="text-[11px] text-white/30 mt-1">
                En fazla 5 etiket ekleyebilirsiniz.
              </p>
            </div>

            {/* Submit */}
            <div className="flex items-center justify-between pt-2">
              <Link
                href="/"
                className="text-sm text-white/40 hover:text-white transition-colors"
              >
                Iptal
              </Link>
              <button
                type="button"
                className="px-8 py-2.5 rounded-lg text-white font-semibold text-sm transition-all hover:brightness-110"
                style={{ backgroundColor: "#1f844e" }}
              >
                Konuyu Olustur
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
