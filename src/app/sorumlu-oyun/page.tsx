export const metadata = { title: "Sorumlu Oyun Politikası - Rekor Forum" };

export default function SorumluOyunPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-8">
      <div className="overflow-hidden" style={{ backgroundColor: "#131820", border: "1px solid #1e293b", borderRadius: "12px" }}>
        <div className="px-6 py-4" style={{ borderBottom: "1px solid #1e293b", backgroundColor: "#1a2130" }}>
          <h1 className="text-lg font-semibold" style={{ color: "#e2e8f0" }}>Sorumlu Oyun Politikası</h1>
        </div>
        <div className="px-6 py-6 prose-sm" style={{ color: "#94a3b8" }}>
          {/* Warning Box */}
          <div className="rounded-xl p-4 mb-4" style={{ backgroundColor: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)" }}>
            <p className="text-sm font-semibold" style={{ color: "#ef4444" }}>
              ⚠️ Kumar bağımlılık yapabilir.
            </p>
          </div>

          <h2 className="text-base font-semibold mt-6 mb-2" style={{ color: "#e2e8f0" }}>Önemli Uyarılar</h2>
          <ul className="text-sm list-disc list-inside mb-3 space-y-1" style={{ color: "#94a3b8" }}>
            <li>Kumar ve bahis yalnızca eğlence amaçlı olmalıdır.</li>
            <li>Kaybetmeyi göze alabileceğiniz miktarlarla oynayın.</li>
            <li>Borç alarak veya kredi çekerek bahis yapmayın.</li>
            <li>Kayıplarınızı telafi etmek için daha fazla bahis yapmayın.</li>
            <li>Alkol veya duygusal stres altında bahis yapmayın.</li>
            <li>Bahis için ayırdığınız süreyi ve bütçeyi önceden belirleyin.</li>
          </ul>

          <h2 className="text-base font-semibold mt-6 mb-2" style={{ color: "#e2e8f0" }}>Bağımlılık Belirtileri</h2>
          <ul className="text-sm list-disc list-inside mb-3 space-y-1" style={{ color: "#94a3b8" }}>
            <li>Bahis oynamayı bırakamama veya kontrol edememe</li>
            <li>Bahis için giderek artan miktarlar harcama</li>
            <li>Bahis alışkanlıklarınızı çevrenizden gizleme</li>
            <li>Günlük sorumluluklarınızı ihmal etme</li>
            <li>Bahis nedeniyle mali sorunlar yaşama</li>
          </ul>

          <h2 className="text-base font-semibold mt-6 mb-2" style={{ color: "#e2e8f0" }}>Yardım Hatları</h2>
          <ul className="text-sm list-disc list-inside mb-3 space-y-1" style={{ color: "#94a3b8" }}>
            <li><strong style={{ color: "#e2e8f0" }}>Yeşilay Danışma Hattı:</strong> 444 0 632 (7/24)</li>
            <li><strong style={{ color: "#e2e8f0" }}>ALO 182:</strong> Sosyal Destek Hattı</li>
          </ul>

          <h2 className="text-base font-semibold mt-6 mb-2" style={{ color: "#e2e8f0" }}>Bu Platform</h2>
          <ul className="text-sm list-disc list-inside mb-3 space-y-1" style={{ color: "#94a3b8" }}>
            <li>Rekor Forum bir bahis veya kumar sitesi değildir.</li>
            <li>Platformda paylaşılan içerikler yalnızca tartışma amaçlıdır.</li>
            <li>Hiçbir paylaşım yatırım tavsiyesi niteliği taşımaz.</li>
            <li>Platformumuz sorumlu oyun ilkelerini destekler ve teşvik eder.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
