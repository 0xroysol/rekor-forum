import { BRAND } from "@/config/brand";

export const metadata = { title: `Kullanım Şartları - ${BRAND.name}` };

export default function KullanimSartlariPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-8">
      <div className="overflow-hidden" style={{ backgroundColor: "#131820", border: "1px solid #1e293b", borderRadius: "12px" }}>
        <div className="px-6 py-4" style={{ borderBottom: "1px solid #1e293b", backgroundColor: "#1a2130" }}>
          <h1 className="text-lg font-semibold" style={{ color: "#e2e8f0" }}>Kullanım Şartları</h1>
        </div>
        <div className="px-6 py-6 prose-sm" style={{ color: "#94a3b8" }}>
          <h2 className="text-base font-semibold mt-6 mb-2" style={{ color: "#e2e8f0" }}>Hizmet Tanımı</h2>
          <p className="text-sm leading-relaxed mb-3" style={{ color: "#94a3b8" }}>
            {BRAND.name}, spor konularında tartışma ve bilgi paylaşımı yapılan bir topluluk platformudur.
          </p>

          <h2 className="text-base font-semibold mt-6 mb-2" style={{ color: "#e2e8f0" }}>Üyelik</h2>
          <p className="text-sm leading-relaxed mb-3" style={{ color: "#94a3b8" }}>
            Platforma kayıt olmak için 18 yaşından büyük olmanız gerekmektedir. Kayıt sırasında verdiğiniz bilgilerin doğruluğundan siz sorumlusunuz. Hesabınızın güvenliği sizin sorumluluğunuzdadır.
          </p>

          <h2 className="text-base font-semibold mt-6 mb-2" style={{ color: "#e2e8f0" }}>İçerik Sorumluluğu</h2>
          <p className="text-sm leading-relaxed mb-3" style={{ color: "#94a3b8" }}>
            Kullanıcılar tarafından paylaşılan içerikler tamamen paylaşan kişinin sorumluluğundadır. {BRAND.name}, kullanıcı içeriklerinin doğruluğunu garanti etmez. Paylaşılan tahmin ve kuponlar yatırım tavsiyesi niteliği taşımaz.
          </p>

          <h2 className="text-base font-semibold mt-6 mb-2" style={{ color: "#e2e8f0" }}>Fikri Mülkiyet</h2>
          <p className="text-sm leading-relaxed mb-3" style={{ color: "#94a3b8" }}>
            Platform tasarımı, logosu ve yazılımı {BRAND.name}&apos;a aittir. Kullanıcılar paylaştıkları içeriklerin fikri mülkiyet haklarına sahip olmakla birlikte, platformda yayınlama lisansı vermiş sayılır.
          </p>

          <h2 className="text-base font-semibold mt-6 mb-2" style={{ color: "#e2e8f0" }}>Sorumluluk Reddi</h2>
          <p className="text-sm leading-relaxed mb-3" style={{ color: "#94a3b8" }}>
            Platformdaki bilgiler yalnızca tartışma amaçlıdır ve profesyonel tavsiye yerine geçmez.
          </p>

          <h2 className="text-base font-semibold mt-6 mb-2" style={{ color: "#e2e8f0" }}>Değişiklikler</h2>
          <p className="text-sm leading-relaxed mb-3" style={{ color: "#94a3b8" }}>
            Bu kullanım şartları önceden bildirim yapılmaksızın güncellenebilir. Platformu kullanmaya devam etmeniz, güncel şartları kabul ettiğiniz anlamına gelir.
          </p>
        </div>
      </div>
    </div>
  );
}
