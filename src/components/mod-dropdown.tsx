"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/auth-provider";

interface ModDropdownProps {
  threadId: string;
  isPinned: boolean;
  isLocked: boolean;
  isFeatured: boolean;
  categoryId: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

export default function ModDropdown({
  threadId,
  isPinned,
  isLocked,
  isFeatured,
  categoryId,
}: ModDropdownProps) {
  const { dbUser } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState(categoryId);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Only render for MOD or ADMIN
  if (!dbUser || (dbUser.role !== "MOD" && dbUser.role !== "ADMIN")) {
    return null;
  }

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
        setShowDeleteConfirm(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  async function handleAction(action: string) {
    setLoading(true);
    try {
      await fetch("/api/moderation/thread", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ threadId, action }),
      });
      router.refresh();
    } catch {
      // silently fail
    } finally {
      setLoading(false);
      setOpen(false);
      setShowDeleteConfirm(false);
    }
  }

  async function handleMove() {
    if (selectedCategory === categoryId) return;
    setLoading(true);
    try {
      await fetch("/api/moderation/thread", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ threadId, action: "move", categoryId: selectedCategory }),
      });
      router.refresh();
    } catch {
      // silently fail
    } finally {
      setLoading(false);
      setShowMoveModal(false);
      setOpen(false);
    }
  }

  async function openMoveModal() {
    setShowMoveModal(true);
    setOpen(false);
    try {
      const res = await fetch("/api/categories");
      if (res.ok) {
        const data = await res.json();
        setCategories(data.categories || data);
      }
    } catch {
      // silently fail
    }
  }

  return (
    <>
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setOpen(!open)}
          className="px-3 py-1.5 text-sm rounded-lg bg-[#1a2130] border border-[#1e293b] text-[#e2e8f0] hover:bg-[#1e2738] transition-colors"
          disabled={loading}
        >
          ⚙️ Moderasyon
        </button>

        {open && (
          <div className="absolute right-0 mt-2 w-56 bg-[#131820] border border-[#1e293b] rounded-xl shadow-lg z-50 overflow-hidden">
            <button
              onClick={() => handleAction("pin")}
              className="w-full text-left px-3 py-2 text-sm text-[#e2e8f0] hover:bg-[#1e2738] transition-colors"
            >
              📌 {isPinned ? "Sabitlemeden Kaldır" : "Sabitle"}
            </button>
            <button
              onClick={() => handleAction("lock")}
              className="w-full text-left px-3 py-2 text-sm text-[#e2e8f0] hover:bg-[#1e2738] transition-colors"
            >
              🔒 {isLocked ? "Kilidi Aç" : "Kilitle"}
            </button>
            <button
              onClick={() => handleAction("feature")}
              className="w-full text-left px-3 py-2 text-sm text-[#e2e8f0] hover:bg-[#1e2738] transition-colors"
            >
              ⭐ {isFeatured ? "Kaldır" : "Öne Çıkar"}
            </button>
            <button
              onClick={openMoveModal}
              className="w-full text-left px-3 py-2 text-sm text-[#e2e8f0] hover:bg-[#1e2738] transition-colors"
            >
              📁 Konuyu Taşı
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full text-left px-3 py-2 text-sm text-[#ef4444] hover:bg-[#1e2738] transition-colors"
            >
              🗑️ Konuyu Sil
            </button>
          </div>
        )}

        {/* Delete confirmation inline */}
        {showDeleteConfirm && (
          <div className="absolute right-0 mt-2 w-64 bg-[#131820] border border-[#1e293b] rounded-xl shadow-lg z-50 p-4">
            <p className="text-sm text-[#e2e8f0] mb-3">
              Bu konuyu silmek istediğinize emin misiniz?
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setOpen(false);
                }}
                className="px-3 py-1.5 text-sm rounded-lg bg-[#1a2130] text-[#94a3b8] hover:bg-[#1e2738] transition-colors"
              >
                İptal
              </button>
              <button
                onClick={() => handleAction("delete")}
                className="px-3 py-1.5 text-sm rounded-lg bg-[#ef4444] text-white hover:bg-[#dc2626] transition-colors"
                disabled={loading}
              >
                Sil
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Move modal */}
      {showMoveModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center">
          <div className="bg-[#131820] border border-[#1e293b] rounded-xl shadow-lg w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-[#e2e8f0] mb-4">
              📁 Konuyu Taşı
            </h3>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[#1a2130] border border-[#1e293b] text-[#e2e8f0] text-sm mb-4 focus:outline-none focus:border-[#1f844e]"
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  setShowMoveModal(false);
                  setSelectedCategory(categoryId);
                }}
                className="px-4 py-2 text-sm rounded-lg bg-[#1a2130] text-[#94a3b8] hover:bg-[#1e2738] transition-colors"
              >
                İptal
              </button>
              <button
                onClick={handleMove}
                className="px-4 py-2 text-sm rounded-lg bg-[#1f844e] text-white hover:bg-[#166d3b] transition-colors"
                disabled={loading || selectedCategory === categoryId}
              >
                Taşı
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
