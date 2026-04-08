export const metadata = { title: "Forum Kuralları - Rekor Forum" };

export default function KurallarPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-8">
      <div className="overflow-hidden" style={{ backgroundColor: "#131820", border: "1px solid #1e293b", borderRadius: "12px" }}>
        <div className="px-6 py-4" style={{ borderBottom: "1px solid #1e293b", backgroundColor: "#1a2130" }}>
          <h1 className="text-lg font-semibold" style={{ color: "#e2e8f0" }}>Forum Kuralları</h1>
        </div>
        <div className="px-6 py-6 prose-sm" style={{ color: "#94a3b8" }}>
          <h2 className="text-base font-semibold mt-6 mb-2" style={{ color: "#e2e8f0" }}>Genel Kurallar</h2>
          <ul className="text-sm list-disc list-inside mb-3 space-y-1" style={{ color: "#94a3b8" }}>
            <li>Diğer üyelere saygılı olun, hakaret ve küfür yasaktır.</li>
            <li>Spam, reklam ve tanıtım içerikli paylaşımlar yasaktır.</li>
            <li>Kişisel bilgileri (TC, adres, telefon vb.) paylaşmayın.</li>
            <li>Aynı konuyu birden fazla kategoride açmayın.</li>
            <li>Moderatör uyarılarına uyun, itirazlarınızı özel mesajla iletin.</li>
          </ul>

          <h2 className="text-base font-semibold mt-6 mb-2" style={{ color: "#e2e8f0" }}>İçerik Kuralları</h2>
          <ul className="text-sm list-disc list-inside mb-3 space-y-1" style={{ color: "#94a3b8" }}>
            <li>Yasadışı içerik paylaşımı kesinlikle yasaktır.</li>
            <li>Telif hakkı ihlali içeren paylaşımlar kaldırılır.</li>
            <li>Nefret söylemi, ırkçılık ve ayrımcılık yasaktır.</li>
            <li>Yanıltıcı veya sahte bilgi paylaşmayın.</li>
          </ul>

          <h2 className="text-base font-semibold mt-6 mb-2" style={{ color: "#e2e8f0" }}>Bahis &amp; Kupon Kuralları</h2>
          <ul className="text-sm list-disc list-inside mb-3 space-y-1" style={{ color: "#94a3b8" }}>
            <li>Paylaşılan kuponlar yalnızca fikir amaçlıdır, yatırım tavsiyesi değildir.</li>
            <li>Garantili kazanç vaadinde bulunmak yasaktır.</li>
            <li>Ücretli kupon satışı ve reklam yapmak yasaktır.</li>
            <li>Bahis sitelerinin referans linklerini paylaşmak yasaktır.</li>
          </ul>

          <h2 className="text-base font-semibold mt-6 mb-2" style={{ color: "#e2e8f0" }}>Casino &amp; Slot Bölümü</h2>
          <ul className="text-sm list-disc list-inside mb-3 space-y-1" style={{ color: "#94a3b8" }}>
            <li>Bu bölüm yalnızca 18 yaş ve üzeri kullanıcılar içindir.</li>
            <li>Kumar bağımlılık yapabilir, sorumlu oynayın.</li>
            <li>Casino sitelerinin doğrudan linklerini paylaşmak yasaktır.</li>
            <li>Hile, bot veya manipülasyon yöntemleri paylaşmak yasaktır.</li>
          </ul>

          <h2 className="text-base font-semibold mt-6 mb-2" style={{ color: "#e2e8f0" }}>Moderasyon</h2>
          <ul className="text-sm list-disc list-inside mb-3 space-y-1" style={{ color: "#94a3b8" }}>
            <li>Kuralları ihlal eden içerikler uyarı olmaksızın kaldırılabilir.</li>
            <li>Tekrarlayan ihlallerde geçici veya kalıcı ban uygulanır.</li>
            <li>Moderatör kararlarına itiraz özel mesaj yoluyla yapılır.</li>
            <li>Yönetim, kuralları önceden haber vermeksizin değiştirme hakkını saklı tutar.</li>
          </ul>

          <p className="text-sm leading-relaxed mb-3 mt-6" style={{ color: "#64748b" }}>
            Yardım ve destek için: iletisim@rekorforum.com | Yardım Hattı: 444 0 632
          </p>
        </div>
      </div>
    </div>
  );
}
