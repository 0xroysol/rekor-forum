export async function uploadImage(file: File): Promise<string | null> {
  if (file.size > 5 * 1024 * 1024) {
    throw new Error("Dosya boyutu 5MB'dan büyük olamaz");
  }

  const allowed = ["image/jpeg", "image/png", "image/gif", "image/webp"];
  if (!allowed.includes(file.type)) {
    throw new Error("Sadece JPG, PNG, GIF ve WebP formatları desteklenir");
  }

  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch("/api/upload", { method: "POST", body: formData });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || "Yükleme başarısız");
  }

  const data = await res.json();
  return data.url;
}
