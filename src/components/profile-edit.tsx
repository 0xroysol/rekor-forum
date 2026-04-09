"use client";

import { useState, useRef } from "react";
import { useAuth } from "@/providers/auth-provider";
import { createClient } from "@/lib/supabase/client";

const TEAM_OPTIONS = [
  "Seçim yapmadım",
  "Galatasaray",
  "Fenerbahçe",
  "Beşiktaş",
  "Trabzonspor",
  "Başakşehir",
  "Alanyaspor",
  "Antalyaspor",
  "Göztepe",
  "Kasımpaşa",
  "Konyaspor",
  "Sivasspor",
  "Hatayspor",
  "Samsunspor",
  "Rizespor",
  "Kayserispor",
  "Gaziantep",
  "Bodrum",
  "Eyüpspor",
  "Gençlerbirliği",
  "Karagümrük",
];

interface ProfileEditProps {
  username: string;
  currentDisplayName: string | null;
  currentBio: string | null;
  currentAvatar: string | null;
  currentCoverImage?: string | null;
  currentFavoriteTeam?: string | null;
  currentLocation?: string | null;
  currentTwitterUrl?: string | null;
  currentInstagramUrl?: string | null;
}

export function ProfileEditButton({
  username,
  currentDisplayName,
  currentBio,
  currentAvatar,
  currentCoverImage,
  currentFavoriteTeam,
  currentLocation,
  currentTwitterUrl,
  currentInstagramUrl,
}: ProfileEditProps) {
  const { dbUser, refreshDbUser } = useAuth();
  const [open, setOpen] = useState(false);
  const [displayName, setDisplayName] = useState(currentDisplayName || "");
  const [bio, setBio] = useState(currentBio || "");
  const [avatar, setAvatar] = useState(currentAvatar || "");
  const [coverImage, setCoverImage] = useState(currentCoverImage || "");
  const [favoriteTeam, setFavoriteTeam] = useState(currentFavoriteTeam || "Seçim yapmadım");
  const [location, setLocation] = useState(currentLocation || "");
  const [twitterUrl, setTwitterUrl] = useState(currentTwitterUrl || "");
  const [instagramUrl, setInstagramUrl] = useState(currentInstagramUrl || "");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const coverFileRef = useRef<HTMLInputElement>(null);

  // Only show if viewing own profile
  if (!dbUser || dbUser.username !== username) return null;

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const supabase = createClient();
    const ext = file.name.split(".").pop();
    const path = `avatars/${dbUser!.id}-${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true });

    if (uploadError) {
      setError("Avatar yüklenirken hata oluştu");
      setUploading(false);
      return;
    }

    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    setAvatar(data.publicUrl);
    setUploading(false);
  }

  async function handleCoverUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingCover(true);
    const supabase = createClient();
    const ext = file.name.split(".").pop();
    const path = `covers/${dbUser!.id}-${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true });

    if (uploadError) {
      setError("Kapak görseli yüklenirken hata oluştu");
      setUploadingCover(false);
      return;
    }

    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    setCoverImage(data.publicUrl);
    setUploadingCover(false);
  }

  async function handleSave() {
    setLoading(true);
    setError("");
    setSuccess(false);

    const res = await fetch("/api/auth/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        displayName,
        bio,
        avatar,
        coverImage,
        favoriteTeam: favoriteTeam === "Seçim yapmadım" ? null : favoriteTeam,
        location: location || null,
        twitterUrl: twitterUrl || null,
        instagramUrl: instagramUrl || null,
      }),
    });

    if (!res.ok) {
      setError("Kayıt sırasında bir hata oluştu");
      setLoading(false);
      return;
    }

    await refreshDbUser();
    setSuccess(true);
    setLoading(false);
    setTimeout(() => {
      setOpen(false);
      setSuccess(false);
      window.location.reload();
    }, 800);
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-md px-3 py-1.5 text-sm font-medium transition-all duration-150 hover:bg-bg-hover"
        style={{ border: "1px solid #1e293b", color: "#94a3b8" }}
      >
        Profili Düzenle
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div
            className="w-full max-w-md overflow-hidden"
            style={{ backgroundColor: "#131820", border: "1px solid #1e293b", borderRadius: "12px" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid #1e293b" }}>
              <h2 className="text-base font-semibold" style={{ color: "#e2e8f0" }}>Profili Düzenle</h2>
              <button onClick={() => setOpen(false)} className="text-lg" style={{ color: "#64748b" }}>&times;</button>
            </div>

            {/* Body */}
            <div className="space-y-4 p-5">
              {error && (
                <div className="rounded-md border border-[#ef4444]/30 bg-[#ef4444]/10 px-3 py-2 text-sm text-[#ef4444]">
                  {error}
                </div>
              )}
              {success && (
                <div className="rounded-md border border-[#1f844e]/30 bg-[#1f844e]/10 px-3 py-2 text-sm text-[#1f844e]">
                  Profil güncellendi!
                </div>
              )}

              {/* Avatar */}
              <div>
                <label className="mb-1.5 block text-sm" style={{ color: "#94a3b8" }}>Avatar</label>
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-14 w-14 items-center justify-center rounded-full overflow-hidden"
                    style={{ backgroundColor: "#0d1017", border: "1px solid #1e293b" }}
                  >
                    {avatar ? (
                      <img src={avatar} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-lg font-bold" style={{ color: "#1f844e" }}>
                        {username.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => fileRef.current?.click()}
                    disabled={uploading}
                    className="rounded-md px-3 py-1.5 text-sm transition-colors hover:bg-bg-hover disabled:opacity-50"
                    style={{ border: "1px solid #1e293b", color: "#94a3b8" }}
                  >
                    {uploading ? "Yükleniyor..." : "Değiştir"}
                  </button>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarUpload}
                  />
                </div>
              </div>

              {/* Display Name */}
              <div>
                <label className="mb-1.5 block text-sm" style={{ color: "#94a3b8" }}>Görünen İsim</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Görünen isminiz"
                  className="w-full rounded-md border border-[#1e293b] bg-[#0d1017] px-3 py-2 text-sm text-[#e2e8f0] placeholder:text-[#64748b] focus:border-[#1f844e] focus:outline-none"
                />
              </div>

              {/* Bio */}
              <div>
                <label className="mb-1.5 block text-sm" style={{ color: "#94a3b8" }}>Hakkımda</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Kendiniz hakkında kısa bir bilgi..."
                  rows={3}
                  className="w-full rounded-md border border-[#1e293b] bg-[#0d1017] px-3 py-2 text-sm text-[#e2e8f0] placeholder:text-[#64748b] focus:border-[#1f844e] focus:outline-none resize-none"
                />
              </div>

              {/* Cover Image */}
              <div>
                <label className="mb-1.5 block text-sm" style={{ color: "#94a3b8" }}>Kapak Görseli</label>
                <div className="flex items-center gap-3">
                  {coverImage && (
                    <div
                      className="h-16 w-28 rounded-md overflow-hidden"
                      style={{ border: "1px solid #1e293b" }}
                    >
                      <img src={coverImage} alt="" className="h-full w-full object-cover" />
                    </div>
                  )}
                  <button
                    onClick={() => coverFileRef.current?.click()}
                    disabled={uploadingCover}
                    className="rounded-md px-3 py-1.5 text-sm transition-colors hover:bg-bg-hover disabled:opacity-50"
                    style={{ border: "1px solid #1e293b", color: "#94a3b8" }}
                  >
                    {uploadingCover ? "Yükleniyor..." : coverImage ? "Değiştir" : "Yükle"}
                  </button>
                  <input
                    ref={coverFileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleCoverUpload}
                  />
                </div>
              </div>

              {/* Favorite Team */}
              <div>
                <label className="mb-1.5 block text-sm" style={{ color: "#94a3b8" }}>Favori Takım</label>
                <select
                  value={favoriteTeam}
                  onChange={(e) => setFavoriteTeam(e.target.value)}
                  className="w-full appearance-none rounded-md border border-[#1e293b] bg-[#0d1017] px-3 py-2 text-sm text-[#e2e8f0] focus:border-[#1f844e] focus:outline-none"
                >
                  {TEAM_OPTIONS.map((team) => (
                    <option key={team} value={team}>{team}</option>
                  ))}
                </select>
              </div>

              {/* Location */}
              <div>
                <label className="mb-1.5 block text-sm" style={{ color: "#94a3b8" }}>Konum</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Şehir, Ülke"
                  className="w-full rounded-md border border-[#1e293b] bg-[#0d1017] px-3 py-2 text-sm text-[#e2e8f0] placeholder:text-[#64748b] focus:border-[#1f844e] focus:outline-none"
                />
              </div>

              {/* Twitter URL */}
              <div>
                <label className="mb-1.5 block text-sm" style={{ color: "#94a3b8" }}>Twitter / X</label>
                <input
                  type="url"
                  value={twitterUrl}
                  onChange={(e) => setTwitterUrl(e.target.value)}
                  placeholder="https://x.com/kullaniciadi"
                  className="w-full rounded-md border border-[#1e293b] bg-[#0d1017] px-3 py-2 text-sm text-[#e2e8f0] placeholder:text-[#64748b] focus:border-[#1f844e] focus:outline-none"
                />
              </div>

              {/* Instagram URL */}
              <div>
                <label className="mb-1.5 block text-sm" style={{ color: "#94a3b8" }}>Instagram</label>
                <input
                  type="url"
                  value={instagramUrl}
                  onChange={(e) => setInstagramUrl(e.target.value)}
                  placeholder="https://instagram.com/kullaniciadi"
                  className="w-full rounded-md border border-[#1e293b] bg-[#0d1017] px-3 py-2 text-sm text-[#e2e8f0] placeholder:text-[#64748b] focus:border-[#1f844e] focus:outline-none"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 px-5 py-4" style={{ borderTop: "1px solid #1e293b" }}>
              <button
                onClick={() => setOpen(false)}
                className="rounded-md px-4 py-2 text-sm transition-colors hover:bg-bg-hover"
                style={{ color: "#94a3b8" }}
              >
                İptal
              </button>
              <button
                onClick={handleSave}
                disabled={loading}
                className="rounded-md px-4 py-2 text-sm font-medium text-white transition-colors hover:brightness-110 disabled:opacity-50"
                style={{ backgroundColor: "#1f844e" }}
              >
                {loading ? "Kaydediliyor..." : "Kaydet"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
