/**
 * Kayıp Mühürcüler Loncası — hikâye parçaları ve mühür kenarlarına gizlenen satırlar.
 * Parçalar, üretilen eser sayısıyla açılır.
 */

export interface LoreFragment {
  id: string;
  title: string;
  text: string;
}

export const GUILD_STORY: readonly LoreFragment[] = [
  {
    id: "arsiv",
    title: "Arşivin Açılışı",
    text:
      "Denizle gökyüzünün buluştuğu dar bir sokakta, kapısında pirinç bir mühür asılı küçük bir dükkân vardı. " +
      "1602 kışında kurulan Mühürcüler Loncası, sırları yalnızca kağıda gömmezdi; yıldızların arasına, " +
      "değneklerin sarımlarına, çarkın sessiz dişlilerine yazardı. Lonca yüzyıllar önce dağıldı. " +
      "Dükkân yeniden açıldı. Mühürler seni bekliyor.",
  },
  {
    id: "yildiz",
    title: "Yıldız Anahtarı",
    text:
      "Loncaya kabul edilen her çırak, doğduğu gecenin haritasını çıkarırdı. Ustalar derdi ki: " +
      "\"Anahtar akılda tutulmaz; gökyüzünde doğar.\" Çırakların görevi, yıldızlarının onlara verdiği " +
      "şifre geleneğini bulmak ve kendi mühürlerini öyle vurmaktı. Kaybolan ustaların mühürleri hâlâ " +
      "kendi gökyüzleriyle konuşuyor.",
  },
  {
    id: "cark",
    title: "Çarkın Sırrı",
    text:
      "Lonca meclisinde ortada duran iki halkalı çark, bir şifre aleti olduğu kadar bir kader aletiydi. " +
      "Çark döndürülür, gelen dörtlük önce şifreli okunurdu. Kehanetini kendi çözen çırak, yoluna devam " +
      "ederdi. Çözemeyenin dörtlüğü de, adı da, çarkın tozunda kaybolurdu.",
  },
  {
    id: "degnek",
    title: "Sessiz Değnek",
    text:
      "Sparta'dan miras kalan en eski lonca geleneği şeritti: ince bir parşömen, doğru kalınlıktaki " +
      "değneğe sarılır, üstüne tek satır yazılır, sonra açılıp gönderilirdi. Yanlış değnek saran herkes " +
      "aynı şeridi okur ama hiçbir şey göremezdi. Lonca buna \"sessizlik\" derdi; çünkü sırrın kendisi " +
      "değil, onu taşıyan alet konuştu.",
  },
  {
    id: "usta",
    title: "Kayıp Usta",
    text:
      "Loncanın son büyük ustası, bir gece bütün mühürlerini şehre dağıttı ve bir mektup bıraktı: " +
      "\"Her mühür bir cümlem; hepsini birleştirin.\" Mektubun altında tek bir yıldız haritası vardı. " +
      "O geceden beri kimse onu görmedi. Ama bazı geceler, mühürlere asılı satırların arasında onun " +
      "el yazısı beliriyor.",
  },
  {
    id: "buyuk",
    title: "Büyük Mühür",
    text:
      "Arşivin en dibinde, camın ardında tek bir sayfa durur: hepsi birbirine zincirlenmiş, hiç kimsenin " +
      "tek başına çözemeyeceği kadar uzun bir şifre. Lonca, onu ancak yeterince mühür dünyaya yayıldığında " +
      "çözülebilecek şekilde tasarlamış. Belki de mühürlerini paylaşan herkes, farkında olmadan o " +
      "sayfada bir harf taşıyor.",
  },
];

/** Mühür kenarına, kitap arasına, diskin arkasına gizlenebilecek kısa satırlar. */
export const SECRET_LINES: readonly string[] = [
  "Yıldızlar konuşur, ama fısıltıyla.",
  "Her mühür bir yalandır; her sır bir anahtar.",
  "Aynaya bak, alfabeyi göreceksin.",
  "Gece yazdı, şafak sildi.",
  "Değnek doğruysa, söz okunur.",
  "Çark döner, kader döner.",
  "Bir harf kayar, dünya değişir.",
  "Sessizlik de bir şifredir.",
  "Gökyüzü yazar, biz okuruz.",
  "Kilitli kapı anahtarını cebinde taşımaz.",
  "Her yıldız bir nokta, her nokta bir harftir.",
  "Mühür açıldığında hikâye başlar.",
];

/** i. parçanın açılması için gereken eser sayısı. */
export function requiredArtifacts(index: number): number {
  return index <= 0 ? 0 : index * 2;
}

export function unlockedFragments(artifactCount: number): LoreFragment[] {
  return GUILD_STORY.filter((_, i) => artifactCount >= requiredArtifacts(i));
}

/** Bir sonraki parçaya kalan eser sayısı; hepsi açıksa 0. */
export function remainingForNext(artifactCount: number): number {
  for (let i = 0; i < GUILD_STORY.length; i++) {
    const need = requiredArtifacts(i);
    if (artifactCount < need) return need - artifactCount;
  }
  return 0;
}

/** Aynı girdi her zaman aynı gizli satırı verir. */
export function secretLineFor(seedText: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < seedText.length; i++) {
    h ^= seedText.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return SECRET_LINES[Math.abs(h) % SECRET_LINES.length];
}
