export const metadata = { title: "Gizlilik Politikası - Rekor Forum" };

export default function GizlilikPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-8">
      <div className="overflow-hidden" style={{ backgroundColor: "#131820", border: "1px solid #1e293b", borderRadius: "12px" }}>
        <div className="px-6 py-4" style={{ borderBottom: "1px solid #1e293b", backgroundColor: "#1a2130" }}>
          <h1 className="text-lg font-semibold" style={{ color: "#e2e8f0" }}>Gizlilik Politikası</h1>
        </div>
        <div className="px-6 py-6 prose-sm" style={{ color: "#94a3b8" }}>
          <h2 className="text-base font-semibold mt-6 mb-2" style={{ color: "#e2e8f0" }}>Toplanan Veriler</h2>
          <p className="text-sm leading-relaxed mb-3" style={{ color: "#94a3b8" }}>
            Rekor Forum olarak kayıt sırasında kullanıcı adı, e-posta adresi ve şifrenizi toplarız. Ayrıca platform kullanımınız sırasında IP adresi, tarayıcı bilgileri ve çerez verileri otomatik olarak kaydedilir.
          </p>

          <h2 className="text-base font-semibold mt-6 mb-2" style={{ color: "#e2e8f0" }}>Verilerin Kullanımı</h2>
          <ul className="text-sm list-disc list-inside mb-3 space-y-1" style={{ color: "#94a3b8" }}>
            <li>Hesap oluşturma ve kimlik doğrulama</li>
            <li>Platform güvenliğinin sağlanması</li>
            <li>Kullanıcı deneyiminin iyileştirilmesi</li>
            <li>Yasal yükümlülüklerin yerine getirilmesi</li>
          </ul>

          <h2 className="text-base font-semibold mt-6 mb-2" style={{ color: "#e2e8f0" }}>Verilerin Paylaşımı</h2>
          <p className="text-sm leading-relaxed mb-3" style={{ color: "#94a3b8" }}>
            Kişisel verileriniz üçüncü taraflarla paylaşılmaz. Yalnızca yasal zorunluluk halinde yetkili mercilerle paylaşım yapılabilir. Hizmet sağlayıcılarımız (hosting, e-posta vb.) ile teknik gereklilikler doğrultusunda sınırlı veri paylaşımı yapılabilir.
          </p>

          <h2 className="text-base font-semibold mt-6 mb-2" style={{ color: "#e2e8f0" }}>Çerezler</h2>
          <p className="text-sm leading-relaxed mb-3" style={{ color: "#94a3b8" }}>
            Platformumuz oturum yönetimi ve kullanıcı tercihlerini hatırlamak için çerezler kullanır. Tarayıcı ayarlarınızdan çerezleri devre dışı bırakabilirsiniz, ancak bu durumda bazı özellikler çalışmayabilir.
          </p>

          <h2 className="text-base font-semibold mt-6 mb-2" style={{ color: "#e2e8f0" }}>Haklarınız</h2>
          <ul className="text-sm list-disc list-inside mb-3 space-y-1" style={{ color: "#94a3b8" }}>
            <li>Verilerinize erişim talep etme</li>
            <li>Verilerinizin düzeltilmesini isteme</li>
            <li>Verilerinizin silinmesini talep etme</li>
            <li>Veri işlemeye itiraz etme</li>
          </ul>

          <h2 className="text-base font-semibold mt-6 mb-2" style={{ color: "#e2e8f0" }}>İletişim</h2>
          <p className="text-sm leading-relaxed mb-3" style={{ color: "#94a3b8" }}>
            Gizlilik politikamızla ilgili sorularınız için iletisim@rekorforum.com adresinden bize ulaşabilirsiniz.
          </p>
        </div>
      </div>
    </div>
  );
}
