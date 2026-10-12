# MÜHÜRHANE

Tarihi şifreleme + üretken sanat atölyesi. Mesajını antik bir şifreyle mühürle;
mühür, scytale şeridi ve Alberti şifre diski olarak indir, yazdır, yanına al.

## Modüller

- **Müzik** — harfler nota, dilin ritmi vuruş; dinle ve MIDI olarak indir

- **Atbash** — Antik İbrani, alfabenin ayna görüntüsü (anahtarsız)
- **Sezar** — Antik Roma, alfabeyi sabit sayıda kaydırma
- **Vigenère** — 16. yüzyıl İtalya, anahtar sözcükle kaydırma
- **Scytale** — Antik Sparta, değnek kalınlığına bağlı ızgara şifresi

Her şifre **Türk alfabesi (29 harf)** ile çalışır; Ğ, İ, Ş, Ü, Ö, Ç doğru kayar.

## Çıktılar

- **Şifreli mühür (SVG)** — şifreli metinden deterministik üretilen mühür deseni
- **Scytale şeridi (SVG)** — kesilip değneğe sarılmaya hazır baskı
- **Alberti şifre diski (SVG)** — kesilip iğnelenmeye hazır iki disk
- **Yazdır / PDF** — üç artefaktı tek seferde yazdırma

## Geliştirme

```bash
npm install
npm run dev       # http://localhost:3000
npm test          # şifre modülü testleri
npm run build     # typecheck + üretim build
```

## Yol haritası

- [x] Müzik modülü: mesajı melodiye çevirme (Bach'ın B-A-C-H şifresi gibi)
- [ ] Gizem duvarı: topluluk mesajlarının çözülmeyen vakalar olarak sergilenmesi
