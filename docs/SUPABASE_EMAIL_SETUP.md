# Supabase Email Template Setup (Turkish Localization)

Go to **Supabase Dashboard > Authentication > Email Templates** and replace each template with the Turkish versions below.

---

## 1. Confirm Signup

**Subject:** Rekor Forum - E-posta Doğrulama

```html
<h2>Rekor Forum'a Hoş Geldiniz!</h2>
<p>Hesabınızı doğrulamak için aşağıdaki bağlantıya tıklayın:</p>
<p><a href="{{ .ConfirmationURL }}">E-posta Adresimi Doğrula</a></p>
<p>Bu bağlantı 24 saat boyunca geçerlidir.</p>
<p>Eğer bu hesabı siz oluşturmadıysanız, bu e-postayı görmezden gelebilirsiniz.</p>
<p>Saygılarımızla,<br/>Rekor Forum Ekibi</p>
```

---

## 2. Reset Password

**Subject:** Rekor Forum - Şifre Sıfırlama

```html
<h2>Şifre Sıfırlama Talebi</h2>
<p>Şifrenizi sıfırlamak için aşağıdaki bağlantıya tıklayın:</p>
<p><a href="{{ .ConfirmationURL }}">Şifremi Sıfırla</a></p>
<p>Bu bağlantı 1 saat boyunca geçerlidir.</p>
<p>Eğer bu talebi siz yapmadıysanız, bu e-postayı görmezden gelebilirsiniz.</p>
<p>Saygılarımızla,<br/>Rekor Forum Ekibi</p>
```

---

## 3. Magic Link

**Subject:** Rekor Forum - Giriş Bağlantısı

```html
<h2>Giriş Bağlantınız</h2>
<p>Rekor Forum'a giriş yapmak için aşağıdaki bağlantıya tıklayın:</p>
<p><a href="{{ .ConfirmationURL }}">Giriş Yap</a></p>
<p>Bu bağlantı 1 saat boyunca geçerlidir.</p>
<p>Eğer bu talebi siz yapmadıysanız, bu e-postayı görmezden gelebilirsiniz.</p>
<p>Saygılarımızla,<br/>Rekor Forum Ekibi</p>
```

---

## Notes

- Supabase uses Go template syntax: `{{ .ConfirmationURL }}` is the magic variable.
- Make sure "Enable email confirmations" is turned on under **Authentication > Settings**.
- Set the **Site URL** to `https://rekorforum.com` (or your custom domain).
- Set **Redirect URLs** to include `https://rekorforum.com/**` for wildcard matching.
