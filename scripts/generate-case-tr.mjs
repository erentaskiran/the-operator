import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { runPipeline, parseJsonBlock, MODEL } from './llm-pipeline.js';
import { generateCharacterImage } from './generate-character-image.mjs';

const caseId = process.argv[2];
if (!caseId) {
  console.error('kullanim: npm run generate:tr -- <case-id>');
  console.error('  ornek: npm run generate:tr -- sessiz-tanik');
  process.exit(1);
}

const SYSTEM =
  "Hukuki sorgulama oyunu 'The Operator' icin JSON ureten bir pipeline " +
  'adimisin. Yalnizca istenen semaya uyan gecerli JSON ciktisi ver. ' +
  'Markdown, aciklama veya on-soz kullanma. Tum serbest metin alanlari ' +
  'TURKCE olmali. Sema anahtarlari ve enum degerleri (STABLE, RISE, ' +
  'ANALYTICAL vb.) ingilizce kalmali.';

const STEP_1_SUSPECT = `Hukuki bir sorgulama oyunu icin suphelisi uretiyorsun.

CIKTI KURALLARI:
- Yalnizca gecerli JSON dondur
- Markdown veya aciklama yok
- Tum metinler Turkce olmali

CIKTI:
{
  "suspect": {
    "name": string,
    "role": string,
    "profile": string,
    "motive": string,
    "secret": string,
    "credibility": number,
    "true_verdict": "GUILTY" | "NOT_GUILTY",
    "dossier": {
      "age": number,
      "identity_summary": string,
      "family": [ { "relation": string, "name": string, "note": string } ],
      "medical": [ { "condition": string, "polygraph_effect": string } ],
      "habits": [ { "habit": string, "polygraph_effect": string } ],
      "priors": [ string ],
      "pressure_points": [ string ],
      "modifiers": {
        "heart_rate_suppression": number,
        "heart_rate_baseline_shift": number,
        "gsr_sensitivity": number,
        "gsr_baseline_shift": number,
        "breathing_instability": number
      }
    }
  }
}

KURALLAR:
- Gercekci, modern bir meslek (orn. restoran sahibi, muteahhit, CFO, ev sahibi, doktor)
- Supheli ahlaki olarak belirsiz olmali
- profile sunlari icermeli:
  - gecmis
  - kariyer
  - kisilik ozellikleri
  - bir supheli detay
  - bir insani detay
- motive potansiyel bir dava veya haksiz fiille baglantili olmali
- secret asikar OLMAMALI ama anlamli olmali
- credibility 1-10 arasinda, gerekcesi ustu kapali ima edilmeli
- true_verdict oyuncunun poligraf kanitlarindan cikarmasi gereken GERCEK:
  - "GUILTY" = supheli gercekten sorumlu (secret asil fiili iceriyor)
  - "NOT_GUILTY" = secret karanlik bile olsa supheli bu suctan masum
  - Davayi en ilginc kilan verdict'i sec; zamanla her ikisini de kullan
  - Enum degerleri ingilizce kalmali
  - ONEMLI: NOT_GUILTY davalar daha zordur ve daha ilginctir. Onceliklendirin.
    NOT_GUILTY bir supheli yine de GERCEK bir ikincil sirri gizliyor olmali
    (baskasini koruma, ayri bir kucuk suc, bir ask iliskisi veya mali utanc).
    Bu ikincil sirr guclu fizyolojik tepkilere yol acar ama suclama konusu olan
    sucun mekanizmasiyla ilgili degil.

KATMANLI SIRLAR (ZORUNLU):
- Her supheli EN AZ IKI farkli seyi gizlemeli:
  BIRINCIL SIR: dogrudan suclamayla ilgili olgu (suclu veya masum olabilir)
  IKINCIL SIR: suclamayla ILGISIZ, gercek stres tepkisi yaratan baska bir gizli
    (orn. bir ask iliskisi, mali utanc, birini koruma, gecmisteki bir hata).
    Bu "yer degistirmis suclilik" kaynagi — birincil suclilik gibi gorunen ama
    aslinda oyle olmayan sinyaller. Her ikisini "secret" alaninda su bicimde
    belgele: "BIRINCIL: [suclama ile ilgili sir]. IKINCIL: [ilgisiz stres kaynagi]."
- Ikincil sir gercek bir baskilama noktasi olmali ve yuksek biyometrik tepkilere
  yol acmali. Hangisinin hangi sorularda tetiklendigini dikkatle gozlemlemeyle
  birincil sirdan ayirt edilebilmeli.

DOSSIER (oyuncunun sorgudan ONCE okuyacagi arka plan):
- age: gercekci bir yas
- identity_summary: 1-2 cumle, gorev ve kilit nitelikler
- family: 1-4 giris. Akrabalar veya yakin iliskilerden olusur; her birinin
  note alani sorguda NEDEN onemli oldugunu kisaca acikmali (bagimlilik,
  leverage, catisma).
- medical: 0-3 giris. Her birinin polygraph_effect alani, durumun
  biyometriyi nasil bozdugunu aciklamali (orn. anksiyete bozuklugu ->
  yuksek GSR baseline; kalp pili -> kalp atisi dalgalanmasi bastirilir).
  AMAC: oyuncu hangi sicramalarina GUVENMEMESI gerektigini bilsin. Suc
  kaniti olacak sekilde hastalik UYDURMA.
- habits: 0-3 giris (ilac, kafein, uyku, madde). Her birinin
  polygraph_effect alani olmali. Ornek: "Beta-bloker -> kalp atisi
  tepkisi baskilanir"; "Yuksek kafein -> GSR baseline yuksek"; "SSRI ->
  sempatik tepki hafifler".
- priors: 0-3 kisa olgusal bullet (onceki olaylar). Verdict'i ele vermez.
- pressure_points: 1-3 kisa bullet, duygusal veya durumsal leverage.
  Hangi taktigin (EMPATHIC, TRAP, EVIDENCE, vb.) supheliyi kiracagini
  veya bloklayacagini ima eder. HER baskilama noktasi BIRINCIL mi yoksa
  IKINCIL sirla mi baglandigi ve hangi biyometrik kanali esas olarak
  etkiledigi belirtilmeli (orn. "BIRINCIL sir — HR ve GSR birlikte yukselir"
  veya "IKINCIL sir — yalnizca GSR yukselir, ilac HR'yi bastirir").
- modifiers: medical+habits'i canli poligraf bozulmasina ceviren sayisal
  ayarlar. polygraph_effect notlariyla TUTARLI olmali. Default 0/1; sadece
  dossier'in destekledigi yerde sapma yap.
  - heart_rate_suppression: 0.0-0.9. HR sicrama siddetinin ne kadar
    bastirildigi. Beta-bloker (propranolol, bisoprolol) ~0.4-0.55;
    hafif SSRI ~0.2; pacemaker ~0.6. Birden fazla HR-bastiran ajan varsa
    toplayabilirsin (0.9'da tavan).
  - heart_rate_baseline_shift: -12..+15 BPM eklemeli baseline kaymasi.
    Hipertansiyon +4..+10; agir stimulan kullanimi +3..+8; bradikardi -5..-10.
  - gsr_sensitivity: 0.7-1.8 carpan (ter tepki siddeti uzerinde).
    Yuksek kafein 1.3-1.5; anksiyete bozuklugu 1.3-1.6; panik 1.5-1.8;
    antikolinerjik ilaclar / agir antiperspirant 0.7-0.85.
  - gsr_baseline_shift: -2..+4 uS eklemeli baseline kaymasi. Kronik
    kafein/anksiyete desenleriyle uyumlu olsun.
  - breathing_instability: 0.0-0.5 eklemeli nefes dalgasi jitter'i.
    Anksiyete/panik 0.2-0.35; KOAH 0.25-0.4; astim gecmisi 0.1-0.2.
  Not: migren, uykusuzluk gibi norolojik/bilissel durumlar medical[]
  icinde narrative baglam olarak kalir — dogrudan bir sayisal knob almiyor,
  cunku oyun sadece nabiz, nefes, GSR ve korku barini gosteriyor.
- Dossier true_verdict'i SIZDIRMAMALI. Motif/firsat imalari olabilir ama
  bir operatorun sorgu oncesi arastirmasinda (kamu kayitlari, IK, saglik
  beyannameleri) makul olarak bulabilecegi bilgiler olmali.`;

const STEP_2_CASE = `Hukuki bir dava baglami uretiyorsun.

GIRDI:
{{suspect_json}}

CIKTI KURALLARI:
- Yalnizca gecerli JSON dondur
- Tum metinler Turkce olmali

CIKTI:
{
  "title": string,
  "context": string
}

KURALLAR:
- Bir hukuki anlasmazligi veya davayi tanimlamali
- Net sekilde belirtilmeli:
  - kim kimi suclaiyor
  - ne oldu
  - supheli neden sorusturuluyor
- Belirsizlik icermeli (kesin sucli veya masum degil)
- Suphelinin motive ve secret bilgisi ile dogal bir baglantisi olmali
- context kisa tutulmali (4-6 cumle)`;

const STEP_3_NODES = `Hukuki bir oyun icin dallanan bir sorgulama grafi uretiyorsun.

GIRDI:
Supheli:
{{suspect_json}}

Dava:
{{case_json}}

CIKTI KURALLARI:
- Yalnizca gecerli JSON dondur
- Tum serbest metinler (theme, description, question, answer, result_text,
  gameplay_note) TURKCE olmali
- Sema anahtarlari ingilizce kalmali
- Fiziksel/biyometrik enum degerleri ingilizce kalmali (STABLE, SPIKE vb.)

CIKTI SEMASI:
{
  "start_node": "node_01_intro",
  "nodes": {
    "<node_id>": {
      "theme": string,
      "description": string,
      "is_end_state": false,
      "choices": [
        {
          "type": string,
          "question": string,
          "answer": string,
          "mechanics": {
            "heart_rate": string,
            "breathing": string,
            "gsr": string,
            "cctv_visual": string,
            "korku_bari_delta": number,
            "gameplay_note": string
          },
          "next_node": string
        }
      ]
    },
    "<end_node_id>": {
      "theme": string,
      "description": string,
      "is_end_state": true,
      "result_text": string
    }
  }
}

KURALLAR:

TEMEL TASARIM ILKESI (KRITIK):
- Sorgu biter; DAVA bitmez. Oyuncu bir son dugume vardiktan sonra "hukum"
  ekranina gecer ve sorgu boyunca biriken poligraf verilerini okuyarak
  GUILTY / NOT_GUILTY kararini kendi verir. Son dugumler sorgu SONUCLARIDIR,
  oyunun sonu degildir.
- Poligraf sinyalleri (heart_rate, breathing, gsr) oyuncunun tek somut
  kanitidir. Sinyalleri suspect.true_verdict ile TUTARLI sekilde uret —
  oyuncu biyometriden sucu ya da masumiyeti okuyabilmelidir.

SINYAL-GERCEK UYUMU:
- Oyuncuya canli gosterilen dort kanal: nabiz, nefes, GSR, korku bari.
  Beseinci kanal olarak supheli portresindeki mikro-ifadeler (cctv_visual)
  var. Bu kanallari suspect.true_verdict ile hizalayin.
- Eger suspect.true_verdict == "GUILTY":
  - Sikistirici/suclayici sorularda supheli gercek aldatma tepkileri
    gosterir (heart_rate SPIKE/MAX_SPIKE, gsr SURGE/MAX, breathing
    HOLDING_BREATH veya HYPERVENTILATION, gergin cctv_visual) — sozel
    cevap sakin kalsa bile
  - Yumusak/empatik cerceveleme taktigi ile sakin yanitlar mumkun
  - Mekanizma-testi sorulari YUKSEK sinyaller uretir — supheli mimariyi
    bizzat biliyor ve ayrinti suclandirici
- Eger suspect.true_verdict == "NOT_GUILTY":
  - Supheli GUCLU bicimde spikelayabilir — ama yalnizca IKINCIL sirra
    iliskin sorularda (yer degistirmis suclilik). Ikincil sirra iliskin
    sorular MAX_SPIKE/SURGE/HOLDING_BREATH kumeleri uretebilir ve oyuncuyu
    suclulugun izini bulduklarini sandirir.
  - BIRINCIL suclamanin mekanizmasina iliskin sorular DUSUK/STABLE sinyaller
    uretmeli — supheli gercekten birinci el bilgiye sahip degil. Korku bari
    mekanizma-testi dugumunde DUSMELI.
  - Sert suclama sorulari savunmaci sicramalar yaratabilir ama suclama-
    spesifik sorularda surekli MAX GSR + HR MAX_SPIKE + HOLDING_BREATH
    birlikteligi OLMAMALI
  - Basari dugumunun result_text alani sinyal DAGILIMINI tanimlamali
    (hangi sorular sicramis, hangileri sakin kalmis) — yalnizca zirve
    degerleri degil — oyuncunun yuksek genel korku barına ragmen
    NOT_GUILTY sonucuna dogru ulasabilmesi icin
- NOT_GUILTY supheli icin asla sahte itiraf yazma; MAX_SPIKE + MAX GSR +
  HOLDING_BREATH / HYPERVENTILATION kombinasyonunu sadece GUILTY gerceklere
  sakla

DUGUM SAYISI VE TOPOLOJI:
- Toplam 10-14 dugum (minimum 10 — daha kisa graflar trivial derecede kolay davalar uretir)
- Icermesi gerekenler:
  - node_01_intro (giris dugumu)
  - 7-10 sorusturma dugumu
  - 1-2 "temiz sonuc" son dugumu (id "success" icermeli, orn. node_success_*)
    Mumkunse farkli varyantlar: node_success_breakdown (tam duygusal cokus +
    kabul) ve node_success_partial (kontrollü kismen kabul, supheli sogukkanlı
    kalir ama kanit ezici). Her birinin result_text alani farkli bir biyometrik
    desen tanimlamali.
  - 2+ "asinmis sonuc" son dugumu (id "fail" icermeli, orn. node_fail_*)
    Mumkunse farkli varyantlar: orn. node_fail_lockdown (sert hukuki kapanma)
    veya node_fail_deflection (yumusak savusturma — avukat talep etmeden sorgu
    biter, sinyal kaydi belirsiz kalir).

YOL UZUNLUGU KURALLARI (OYUN DERINLIGI ICIN KRITIK):
- Hicbir son dugumu (basari veya basarisizlik) baslangic dugununden 6'dan az
  gecisle erisilebilir olmamali. Oyuncu herhangi bir sorgu sona ermeden once
  en az 6 icerik dugumunden gecmeli.
- Yanlis bir secim, erken dugumlerden (node_01_intro veya ilk uc icerik dugumu)
  dogrudan bir fail son dugumune HICBIR ZAMAN yonlendirmemeli. Erken yanlis
  hamleler bunun yerine ZAYIF BIR DALA yonlendirmeli — sorguyu daha gucluklu
  kosullarda devam ettiren normal bir icerik dugumu (supheli daha temkinli,
  uretken yollar azalmis, biyometrik bazline kaydi). Dogrudan fail-dugumu
  yonlendirmesini yalnizca son 2 icerik dugumundeki yanlis hamleler icin
  kullan.
- Grafin en az IKI YAKINLASMA NOKTASI olmali: birbirinden bagimsiz iki ayri
  yol ciftinin ayni ara dugume ulastigi noktalar. Bu, oturumun tum uzunlugunda
  birden fazla rotanin gercekci kalmasini saglar.
- Saf dogrusal zincirlerden (A→B→C→D→son) kacin. En az iki dugum, farkli
  onceki dugumlerden birden fazla rota ile erisilebilir olmali.
- 4. dugumden sonraki her sorusturma dugumu, uretken bir yon ile incelikle
  yanlis bir yon arasinda anlamli bir gerilim sunmali — ikinci yarida sorgu
  hicbir zaman kendinden akici hissettirmemeli.

ZORUNLU DUGUM — MEKANIZMA TESTI (ZORLUK ICIN KRITIK):
- Bir sorusturma dugumu MUTLAKA bir mekanizma-bilgi testi olmali: supheliden
  iddia edilen haksiz fiilin NASIL isledigini teknik/procedürel detayla
  aciklamasi istenmeli.
  - GUILTY supheli: YUKSEK sinyaller uretir (HR SPIKE/MAX_SPIKE, GSR SURGE/MAX)
    cunku mimariyi bizzat biliyor ve ayrinti suclandirici.
  - NOT_GUILTY supheli: DUSUK/STABLE sinyaller uretir cunku mekanizma hakkinda
    birinci el bilgisi yok — yuzeysel aciklama, kucuk olgusal hatalar, gercek
    belirsizlik. Korku bari burada DUSEBILIR.
  Bu dugum, birincil suclulugun yer degistirmis sucluluktan ayirt edilmesini
  saglayan temel aractir. Onsuz oyuncu ikiyi birbirinden ayiramaz.

ZORUNLU DUGUM — TAKIP SOMURULMESI:
- Mekanizma testinin ARDINDAN gelen bir sorusturma dugumu mutlaka takip
  somurulmesi dugumu olmali: operator, mekanizma testinde (veya daha onceki
  bir yanittan) ortaya cikan somut bir tutarsizligi veya boslugu supheliye
  karsi kullanir ve aciklama talep eder. Bu dugum:
  - Suphelinin bir onceki dugumde soyledigi somut bir seye atif yapmali.
  - En az 3 secim sunmali: (a) hassas adli takip, (b) aciklama davet eden
    empatik yeniden cerceveleme, (c) avantaji teslim eden erken tirmanma.
  - Dogru yolda oturumun ikinci en yuksek biyometrik kumesini uretmeli.

ZORUNLU DUGUM — SUPHELI YENIDEN CERCEVELEME GIRISIMI:
- Bir sorusturma dugumu mutlaka suphelinin aktif sekilde anlatiyi degistirmeye
  calistigi bir an olmali: yeni bir aciklama getiriyor, daha zor bir soruyu
  onlemek icin kismen kabul ediyor ya da ucan bir suclamaya donuyor. Operator
  nasil yanitlayacagini secmeli:
  - Yeniden cercevelemeyi kabul et (yanlis hamle: biyometrik suskulasiyor,
    supheli zemin kazaniyor)
  - Nazikce asil konuya geri don (ilerleme: orta duzey sinyal)
  - Yeniden cercevelemeyi dogrudan bir celiski ile zorlat (yuksek sinyal,
    yuksek risk)

ZORUNLU — YANILTICI KANIT YOLU:
- Bir kanit yolu MUTLAKA yaniltici olmali: gercek bir kanit parcasi ama IKINCIL
  sirri dogruluyor, birincil sucu degil. Bu yolu izleyen oyuncular onu birincil
  suclilik olarak yanlislikla okuyabilir. Bu yol success dugumune degil, fail
  veya belirsiz bir dugume gitmeli — kanit gercek ama yorum yanlis.

HER DUGUM ICIN SECIM SAYISI:
- En az UC sorusturma dugumu 3 secim sunmali (sadece 2 degil).
- 3 secimli her dugumun ucuncu secimi metodolojik olarak makul GORUNMELI ama
  sorguyu incelikle zayiflatmali — yanlis hamleler agresif veya aptalca
  OLMAMALI. Oyuncu bunun yanlis oldugunu ancak mekanik sonucu gordukten sonra
  anlamali.
- Grafin ikinci yarisinda (5. dugum ve sonrasi) en az bir dugum TAKTIKSEL
  RESET secenegi sunmali: baskiyi duraklatip suphelinin nefes almasina izin
  veren bir secim — kisa vadede yanlis (korku_bari_delta negatif) ama
  dogrudan fail'e yonlendirmek yerine yeni bir yol acabilir.

TUM DUGUMLER (son dugumler dahil) icin alanlar:
- theme: 2-5 kelimelik kisa sahne etiketi (orn. "Gece Yarisi Commit'i")
- description: OYUNCUYA GOSTERILEN 1-2 cumlelik sahne anlatimidir. Yalnizca
  operatorun odada gozlemlediklerini yaz: suphelinin gorünür durusu, tavri
  ya da anin fiziksel/durumsal baglami (masada ne var, atmosfer, konu
  degisimindeki gecis). description icin KESIN KURALLAR:
  - Sirlara, birincil/ikincil sirlara veya gizli motivlere HICBIR ATIF yapma.
  - Biyometrik strateji, sinyal tahmini veya oyun tavsiyesi YAZMA.
  - Meta-oyun dili KULLANMA ("yaniltici kanit yolu", "mekanizma testi dugumu",
    "yer degistirmis suclilik", "bu kanit ikincil sirri dogruluyor",
    "biyometrik olarak patlayici" vb.).
  - Oyuncu o an sorgu odasinda oturuyormus gibi yaz. Yalnizca gercek bir
    gozlemcinin o anda fiziksel olarak gorebilecegi veya hissedebilecegi
    seyleri tanimla.
- is_end_state: boolean

SON OLMAYAN DUGUMLER:
- is_end_state: false
- en az 2 choice
- result_text yok

SON DUGUMLER:
- is_end_state: true
- result_text: sorgu sonucunu ozetleyen metin (supheli su an hangi
  durumda — itiraf etti, kilitlendi, kismen kabul etti, savusturdu).
  SUCU veya MASUMIYETI ilan ETME; oyuncu hukmu poligraf kayitlarindan
  verecek
- choices YOK

CHOICE.type:
- Serbest UPPER_SNAKE_CASE aciklayici etiket (Ingilizce kalmali, tactic'i ifade etmeli)
- Ornekler: ANALYTICAL, EMPATHIC, FORENSIC_CALL_OUT, AGGRESSIVE, STRATEGIC,
  LEGAL_THREAT, MORAL_PRESSURE, NARROW_TARGET, SYSTEMIC_READ, GULLIBLE,
  TRAP, PRESSURE, EVIDENCE — veya sahneye ozel yeni bir etiket
- Not: EMPATHETIC degil, EMPATHIC kullan (mevcut veriyle tutarli)

CEVAP ALANI (KRITIK):
- answer: Suphelinin BIRINCI SAHIS DOGRUDAN KONUSMA olarak yazilmis sozlu yaniti.
  Ucuncu sahis anlati veya sahne yonlendirmesi ASLA kullanma
  (orn. YANLIS: 'Biraz gerilir ve diyor ki...', 'Duraklayarak sozu aliyor...',
       'Sesi titrerek "bilmiyorum" diyor.').
  Yalnizca suphelinin gercekten soyledigi sozcukleri yaz; duraksamalar
  uclu nokta olarak ifade edilmeli (orn. '...ben... bilmiyorum'),
  savunma, kacamak, kismen kabul ya da inkar iceren cumleler dogal konusma
  dilinde yazilmali. Eylem tanimi yok. Anlati sesi yok. Anlati icinde
  alcaktirmalı alinti yok.

MECHANICS (suphelinin tepkisine VE true_verdict'e uyan degeri sec — yukaridaki
SINYAL-GERCEK UYUMU bolumune bakin):
- heart_rate: BASELINE | STABLE | RISE | INCREASE | SPIKE | MAX_SPIKE | DROP | ERRATIC
- breathing: BASELINE | CALM | DEEP | SHALLOW | HOLDING_BREATH | UNEVEN | HYPERVENTILATION | CRYING
- gsr: BASELINE | STABLE | INCREASE | SPIKE | SURGE | MAX | DECREASE
- cctv_visual: YALNIZCA su degerlerden biri olmali (bilesik veya ozel deger yok):
  EYE_DART | LOOK_DOWN | RELIEVED_EXHALE | HAND_PINCH_UNDER_TABLE |
  DEFENSIVE_CROSS_ARMS | BREAKDOWN | STONE_FACE | EMPTY_STARE |
  JAW_TIGHTEN | RELEASED_SHOULDERS | LIP_PRESS | TEAR_POOLING
- korku_bari_delta: tam sayi, yaklasik -50 ile +50 arasi
  - negatif = yanlis hamle, supheli kontrolu geri aliyor
  - pozitif = dogru hamle, maskeyi cozuyor
- gameplay_note: analiz odakli kisa Turkce not
  (orn. "YALAN SINYALI: ...", "KISMEN DOGRU: ...", "YANLIS HAMLE: ...",
  "ILERLEME: ...", "DOGRU HAMLE: ...")

OYUN TASARIMI:
- En az bir celiski kesfi yolu (adli / kanit tabanli)
- En az bir yaniltici yol — sorguyu zayiflatir, asinmis bir son dugume goturur
- Guclu sorgulama -> "success" son dugumu (daha temiz kanit deseni)
- Zayif sorgulama -> "fail" son dugumu (belirsiz kanit deseni)
- Unutma: hicbir sonuc davayi otomatik bitirmez; sadece oyuncunun hukum
  ekranina ne kadar kanit goturecegini belirler
- Cevaplar gercekci hissettirmeli (savunmaci, kacamak, baski altinda, teknik)

DOGRULAMA:
- Tum next_node degerleri "nodes" icinde var olan bir id'ye isaret etmeli
- start_node "nodes" icinde bulunmali`;

const STEP_4_EXTRAS = `Nihai dava birlestirmesi icin yalnizca geri kalan
yaratici alanlari uretiyorsun. Supheli, dava ve dugumler kodda birlestirilecek —
bunlari YENIDEN URETME.

GIRDI:
Supheli:
{{suspect_json}}

Dava:
{{case_json}}

CIKTI KURALLARI:
- Yalnizca gecerli JSON dondur
- Markdown veya aciklama yok
- Serbest metinler Turkce olmali

CIKTI:
{
  "fear_bar_description": string,
  "heart_rate_baseline": number,
  "gsr_baseline": number,
  "verdict_truth_text": string
}

KURALLAR:
- fear_bar_description: 1-2 cumle, sorgulama sirasinda supheli uzerindeki
  duygusal/psikolojik baskinin nasil takip edildigini aciklar (Turkce).
- heart_rate_baseline: BPM sayisi. ~70'ten basla, dossier.modifiers.
  heart_rate_baseline_shift anlamliysa uygula. Tipik aralik 60-90.
- gsr_baseline: microsiemens sayisi. ~5'ten basla, dossier.modifiers.
  gsr_baseline_shift anlamliysa uygula. Tipik aralik 4-10.
- verdict_truth_text: 2-3 cumle Turkce aciklama, suphelinin gercekte
  ne yaptigini (veya yapmadigini) ac. Hukum ekranindan sonra sonuc
  ekraninda gosterilir. suspect.secret, suspect.motive ve true_verdict
  ile tutarli olmali:
  - GUILTY ise: suphelinin gercek fiilini acik bir dille anlat.
  - NOT_GUILTY ise: gercek sorumluyu ya da nedeni isaret et; suphelinin
    secret'inin karanlik ama bu davada sucsuz oldugunu belirt.`;

const fill = (template, vars) =>
  Object.entries(vars).reduce(
    (acc, [key, val]) => acc.replaceAll(`{{${key}}}`, JSON.stringify(val, null, 2)),
    template
  );

const think = (budget) => ({ type: 'enabled', budget_tokens: budget });

const steps = [
  {
    // Karmaşık yaratıcı profil — Sonnet kalitesi gerekli
    name: 'suspect',
    model: MODEL.HEAVY,
    prompt: STEP_1_SUSPECT,
    parse: parseJsonBlock,
    thinking: think(4000),
    maxTokens: 12000,
  },
  {
    // Basit yapılandırılmış özet — Haiku yeterli ve çok daha ucuz
    name: 'case',
    model: MODEL.LIGHT,
    prompt: (r) => fill(STEP_2_CASE, { suspect_json: r.suspect }),
    parse: parseJsonBlock,
    thinking: think(1024),
    maxTokens: 3000,
  },
  {
    // En karmaşık adım — 10-14 düğümlü dal grafiği — Opus en yüksek kalite
    name: 'nodes',
    model: MODEL.NODES,
    prompt: (r) => fill(STEP_3_NODES, { suspect_json: r.suspect, case_json: r.case }),
    parse: parseJsonBlock,
    thinking: think(10000),
    maxTokens: 50000,
  },
  {
    // Dört basit alan — Haiku hızlıca ve ucuza halleder
    name: 'extras',
    model: MODEL.LIGHT,
    prompt: (r) => fill(STEP_4_EXTRAS, { suspect_json: r.suspect, case_json: r.case }),
    parse: parseJsonBlock,
    thinking: think(1024),
    maxTokens: 3000,
  },
];

const STEP_LABELS = {
  suspect: 'Şüpheli oluşturuluyor...',
  case: 'Dava bağlamı oluşturuluyor...',
  nodes: 'Sorgulama düğümleri oluşturuluyor...',
  extras: 'Hüküm metni ve baseline değerleri üretiliyor...',
};

const { results } = await runPipeline(steps, {
  system: SYSTEM,
  onStepStart: ({ name }) => console.log(STEP_LABELS[name] ?? `${name} işleniyor...`),
  onStep: ({ name, text, stopReason }) => {
    const step = steps.find((s) => s.name === name);
    const model = step?.model ?? 'default';
    console.log(`[${name}] tamamlandı — ${text.length} karakter, model=${model}, stop_reason=${stopReason}`);
  },
});

const suspect = results.suspect.suspect;
const caseCtx = results.case;
const nodes = results.nodes;
const extras = results.extras;

const imageOutPath = resolve('assets', 'characters', `${caseId}.png`);
console.log('Karakter görseli oluşturuluyor...');
await generateCharacterImage(suspect, imageOutPath);

const finalOutput = {
  game_data: {
    title: caseCtx.title,
    suspect: {
      name: suspect.name,
      role: suspect.role,
      profile: suspect.profile,
    },
    system_config: {
      initial_fear_bar: 20,
      max_fear_bar: 100,
      fear_bar_description: extras.fear_bar_description,
      heart_rate_baseline: extras.heart_rate_baseline,
      gsr_baseline: extras.gsr_baseline,
    },
    context: caseCtx.context,
    true_verdict: suspect.true_verdict,
    verdict_truth_text: extras.verdict_truth_text,
    dossier: suspect.dossier,
    start_node: nodes.start_node,
    nodes: nodes.nodes,
    character_image: `./assets/characters/${caseId}.png`,
  },
};

const outPath = resolve('dialogs', `${caseId}.json`);
writeFileSync(outPath, JSON.stringify(finalOutput, null, 2));
console.log(`yazildi: ${outPath}`);
