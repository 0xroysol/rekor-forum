import { BRAND } from "@/config/brand";

export const metadata = { title: `KVKK Aydınlatma Metni - ${BRAND.name}` };

export default function KVKKPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-8">
      <div className="overflow-hidden" style={{ backgroundColor: "#131820", border: "1px solid #1e293b", borderRadius: "12px" }}>
        <div className="px-6 py-4" style={{ borderBottom: "1px solid #1e293b", backgroundColor: "#1a2130" }}>
          <h1 className="text-lg font-semibold" style={{ color: "#e2e8f0" }}>KVKK Aydınlatma Metni</h1>
        </div>
        <div className="px-6 py-6 prose-sm" style={{ color: "#94a3b8" }}>
          <p className="text-sm leading-relaxed mb-3" style={{ color: "#94a3b8" }}>
            6698 sayılı Kişisel Verilerin Korunması Kanunu (&quot;KVKK&quot;) kapsamında aşağıdaki bilgilendirmeyi sunarız.
          </p>

          <h2 className="text-base font-semibold mt-6 mb-2" style={{ color: "#e2e8f0" }}>Veri Sorumlusu</h2>
          <p className="text-sm leading-relaxed mb-3" style={{ color: "#94a3b8" }}>
            Kişisel verileriniz, veri sorumlusu sıfatıyla {BRAND.name} tarafından işlenmektedir.
          </p>

          <h2 className="text-base font-semibold mt-6 mb-2" style={{ color: "#e2e8f0" }}>İşlenen Kişisel Veriler</h2>
          <ul className="text-sm list-disc list-inside mb-3 space-y-1" style={{ color: "#94a3b8" }}>
            <li>Kimlik bilgileri: Kullanıcı adı</li>
            <li>İletişim bilgileri: E-posta adresi</li>
            <li>İşlem güvenliği: Şifre (hashlenmiş), IP adresi</li>
            <li>Dijital iz: Çerezler, tarayıcı bilgileri, oturum verileri</li>
          </ul>

          <h2 className="text-base font-semibold mt-6 mb-2" style={{ color: "#e2e8f0" }}>İşleme Amaçları</h2>
          <ul className="text-sm list-disc list-inside mb-3 space-y-1" style={{ color: "#94a3b8" }}>
            <li>Üyelik hesabının oluşturulması ve yönetimi</li>
            <li>Platform hizmetlerinin sunulması</li>
            <li>Bilgi güvenliği süreçlerinin yürütülmesi</li>
            <li>Yasal yükümlülüklerin yerine getirilmesi</li>
            <li>İletişim faaliyetlerinin yürütülmesi</li>
          </ul>

          <h2 className="text-base font-semibold mt-6 mb-2" style={{ color: "#e2e8f0" }}>Aktarım</h2>
          <p className="text-sm leading-relaxed mb-3" style={{ color: "#94a3b8" }}>
            Kişisel verileriniz, yasal zorunluluklar ve hizmet gereksinimleri kapsamında yurt içi ve yurt dışındaki hizmet sağlayıcılarına (sunucu, e-posta hizmeti vb.) aktarılabilir.
          </p>

          <h2 className="text-base font-semibold mt-6 mb-2" style={{ color: "#e2e8f0" }}>Haklarınız (Madde 11)</h2>
          <p className="text-sm leading-relaxed mb-3" style={{ color: "#94a3b8" }}>
            KVKK&apos;nın 11. maddesi uyarınca aşağıdaki haklara sahipsiniz:
          </p>
          <ul className="text-sm list-disc list-inside mb-3 space-y-1" style={{ color: "#94a3b8" }}>
            <li>Kişisel verilerinizin işlenip işlenmediğini öğrenme</li>
            <li>İşlenmişse buna ilişkin bilgi talep etme</li>
            <li>İşlenme amacını ve amacına uygun kullanılıp kullanılmadığını öğrenme</li>
            <li>Yurt içinde veya yurt dışında aktarıldığı üçüncü kişileri bilme</li>
            <li>Eksik veya yanlış işlenmişse düzeltilmesini isteme</li>
            <li>KVKK&apos;nın 7. maddesindeki şartlar çerçevesinde silinmesini isteme</li>
            <li>Düzeltme ve silme işlemlerinin aktarıldığı üçüncü kişilere bildirilmesini isteme</li>
            <li>İşlenen verilerin münhasıran otomatik sistemlerle analiz edilmesi suretiyle aleyhinize bir sonucun ortaya çıkmasına itiraz etme</li>
            <li>Kanuna aykırı işlenmesi sebebiyle zarara uğramanız halinde zararın giderilmesini talep etme</li>
          </ul>

          <h2 className="text-base font-semibold mt-6 mb-2" style={{ color: "#e2e8f0" }}>Başvuru</h2>
          <p className="text-sm leading-relaxed mb-3" style={{ color: "#94a3b8" }}>
            Yukarıdaki haklarınızı kullanmak için {BRAND.contactEmail} adresine yazılı başvuru yapabilirsiniz. Başvurularınız en geç 30 gün içinde cevaplanacaktır.
          </p>
        </div>
      </div>
    </div>
  );
}
