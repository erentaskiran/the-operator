export const TR = {
  // title / common
  APP_TITLE: 'THE OPERATOR',
  GAME_SUBTITLE: '[ POLIGRAF SORGU SIMULATORU ]',
  GAME_TAGLINE: 'GERCEGI SIZ ORTAYA CIKARIN',
  PRESS_ANY_KEY: '>> BASLAMAK ICIN BIR TUSA BASIN <<',
  LOADING: 'Yukleniyor...',
  LOAD_FAIL_TITLE: 'Oyun baslatilamadi',

  // menu
  MENU_CASE_SELECT: '[ DAVA SECIMI ]',
  MENU_CASE_LOAD_ERROR: 'Vaka yuklenemedi.',
  MENU_KEY_INSTRUCTIONS: 'OK TUSLARI: VAKA SEC',
  MENU_ENTER_START: '>> ENTER: BASLA <<',
  STAT_NEW: 'YENI',
  STAT_SHORT_CORRECT: 'DOG',
  STAT_SHORT_FAIL: 'HATA',
  STAT_COMPLETED: 'TAMAMLANDI',
  STAT_ATTEMPTED: 'DENENDI',
  STAT_FAILED: 'BASARISIZ',
  LANG_TOGGLE_HINT: 'L: EN',

  // dossier
  DOSSIER_TITLE: '[ SANIK DOSYASI ]',
  DOSSIER_IDENTITY: 'KIMLIK',
  DOSSIER_NAME: 'Ad',
  DOSSIER_ROLE: 'Gorev',
  DOSSIER_AGE: 'Yas',
  DOSSIER_FAMILY: 'AILE VE ILISKILER',
  DOSSIER_HEALTH: 'SAGLIK DURUMU',
  DOSSIER_POLY_TAG: 'POLIGRAF',
  DOSSIER_HABITS: 'ALISKANLIKLAR / ILAC',
  DOSSIER_PRIORS: 'GECMIS KAYITLAR',
  DOSSIER_PRESSURE: 'BASKI NOKTALARI',
  DOSSIER_CASE_SUMMARY: 'DAVA OZETI',
  DOSSIER_START_BTN: '>> SORGUYA BASLA (ENTER) <<',
  DOSSIER_FOOTER: 'ESC: Menu  |  Scroll: Kaydir',
  DOSSIER_DEFAULT_NAME: 'SANIK',
  PLAY_OPERATOR_LABEL: 'OPERATOR',

  // verdict
  VERDICT_TITLE: '[ HUKUM ASAMASI ]',
  VERDICT_SUSPECT_PREFIX: 'SANIK: ',
  VERDICT_SUMMARY_HEADER: 'SORGU OZETI',
  VERDICT_EVIDENCE_HEADER: 'POLIGRAF KANITLARI',
  VERDICT_HEART: 'KALP',
  VERDICT_STATS_FEAR: 'STRES METRESI SON:',
  VERDICT_STATS_QUESTIONS: 'SORU:',
  VERDICT_STATS_STRESS: 'STRES PUANI:',
  VERDICT_PROMPT: 'POLIGRAFI OKUYUN. SANIGIN SUCLU OLDUGUNA KANI GETIRDINIZ MI?',
  VERDICT_GUILTY_BTN: '[1] SUCLU',
  VERDICT_GUILTY_SUB: 'Poligraf yalanlarini ele verdi',
  VERDICT_NOT_GUILTY_BTN: '[2] SUCSUZ',
  VERDICT_NOT_GUILTY_SUB: 'Yeterli delil yok',
  VERDICT_INSTRUCTIONS: '1 / 2 / MOUSE: HUKUM VER',
  VERDICT_CONFIRM_TITLE: 'EMIN MISIN?',
  VERDICT_CONFIRM_BODY: 'Bu hukum davayi kapatacak.',
  VERDICT_CONFIRM_YES: 'ONAYLA',
  VERDICT_CONFIRM_NO: 'IPTAL',
  VERDICT_NO_RECORD: 'Sorgu kaydi yok.',
  VERDICT_WAVE_HR: 'HR',
  VERDICT_WAVE_BREATHING: 'NF',
  VERDICT_WAVE_GSR: 'GS',
  VERDICT_WAVE_STRESS: 'ST',

  // bad end
  BAD_END_TITLE: '[ SORGU BASARISIZ ]',
  BAD_END_INSTRUCTIONS: 'ESC / ENTER / TIKLA: Menuye Don',

  // result
  RESULT_CORRECT: '[ DOGRU HUKUM ]',
  RESULT_WRONG: '[ HATALI HUKUM ]',
  RESULT_YOUR_VERDICT: 'VERDIGINIZ HUKUM:',
  RESULT_TRUE_VERDICT: 'GERCEK:',
  RESULT_TRUTH_STORY: 'DAVANIN GERCEK OYKUSU',
  RESULT_INTERROGATION_RESULT: 'SORGU SONUCU',
  RESULT_INSTRUCTIONS: 'R: Yeniden Oyna  |  ESC: Menu',
  RESULT_ERROR: '[ HATA ]',
  VERDICT_LABEL_GUILTY: 'SUCLU',
  VERDICT_LABEL_NOT_GUILTY: 'SUCSUZ',

  // settings
  SETTINGS_TITLE: '[ AYARLAR ]',
  SETTINGS_LANGUAGE_LABEL: 'DIL',
  SETTINGS_SCROLL_LABEL: 'SCROLL TERSLE',
  SETTINGS_SOUND_LABEL: 'SES',
  SETTINGS_SCROLL_ON: 'ACIK',
  SETTINGS_SCROLL_OFF: 'KAPALI',
  SETTINGS_LANGUAGE_EN: 'ENGLISH',
  SETTINGS_LANGUAGE_TR: 'TURKCE',
  SETTINGS_BACK: 'ESC: Menuye Don',
  MENU_SETTINGS_HINT: 'S: Ayarlar',
  MENU_BRIEFING_HINT: 'B: Brifing',

  // briefing
  BRIEFING_TITLE: '[ OPERATOR BRIFINGI ]',
  BRIEFING_HINT_NEXT: 'ENTER / → : Ileri',
  BRIEFING_HINT_BACK: '← : Geri',
  BRIEFING_HINT_STATE: 'SPACE : Sonraki durum',
  BRIEFING_HINT_EXIT: 'ESC : Menu',
  BRIEFING_INTRO_TITLE: 'ODAYI OKUMAK',
  BRIEFING_INTRO_BODY:
    'Bu oyunda 5 kaynagi birlikte okursun: NABIZ, NEFES, GSR, STRES metresi ve supheli portresi. Tek bir kanal tek basina kanit degildir. Her sorudan sonra once degisimi gor, sonra dosya notlariyla karsilastir.',
  BRIEFING_PULSE_TITLE: 'NABIZ',
  BRIEFING_PULSE_BODY:
    'Nabizda hem atim sikligina hem de ani sicrama anlarina bak. Sert bir sorudan sonra hizli yukselis normaldir; hic tepki gelmemesi bazen "kontrol" degil ilac etkisi olabilir. Ozellikle beta-bloker notu varsa sakin gorunen nabzi tek basina dogru kabul etme.',
  BRIEFING_BREATHING_TITLE: 'NEFES',
  BRIEFING_BREATHING_BODY:
    'Nefes kanali "ritim" verir: duzenli ve derin akis daha kontrollu bir durumu, yuzeysel/hizli akis savunmayi gosterir. Uzun duz bolge + ani nefes alma, nefes tutma denemesi olabilir. Cevabin zorlu noktasinda ritim bozuluyorsa bunu not et.',
  BRIEFING_GSR_TITLE: 'GSR (DERI ILETKENLIGI)',
  BRIEFING_GSR_BODY:
    'GSR duygusal tepkiyi biraz gecikmeli verir. Soru aninda degil, kisa bir sure sonra yukselis gorebilirsin. Kafein ve anksiyete gibi etkiler taban seviyeyi zaten yuksek tutabilir; bu durumda artisin zamanlamasi, yukseklikten daha degerlidir.',
  BRIEFING_FEAR_TITLE: 'STRES METRESI',
  BRIEFING_FEAR_BODY:
    'Stres metresi tek kanalin degil, genel sorgu baskisinin ozetidir. Dogru baski kurdugunda yukselir; zayif veya zamansiz hamlede dusebilir. "Yuksek stres = otomatik suclu" demek degildir, sadece dogru noktaya temas ettigini gosterir.',
  BRIEFING_CCTV_TITLE: 'SUPHELI PORTRESI',
  BRIEFING_CCTV_BODY:
    'Portrede metin etiketi yok; sadece gorsel ipucu var. Kirmizi/titrek gorunum genelde gerginlik, cokme etkisi kirilma, soguk-sabit gorunum kontrol, yumusama ise rahatlama sinyali verir. Portreyi mutlaka poligraf kanallariyla birlikte yorumla.',
  BRIEFING_MODIFIERS_TITLE: 'SAGLIK VE ALISKANLIK',
  BRIEFING_MODIFIERS_BODY:
    'Dossier ekranindaki medical/habits notlari oyunu dogrudan etkiler. "polygraph_effect" satirlarini okumadan sinyal yorumlamak kolayca yanlis sonuca goturur. Kural basit: once dosya, sonra grafik.',
  BRIEFING_CLOSE_TITLE: 'OPERATOR SENSIN',
  BRIEFING_CLOSE_BODY:
    'Guvenli karar akisi: (1) soruyu sor, (2) 3 kanaldaki degisimi gor, (3) dosya ile capraz kontrol et, (4) sonucu logdan tekrar oku. Bu adimlari birlestirmeden hukum verme. ENTER ile dava secimine donebilirsin.',

  // polygraph / UI
  POLY_HEADER: 'POLIGRAF SINYALLERI',
  POLY_FEAR: 'STRES',
  POLY_PULSE: 'NABIZ',
  POLY_BREATHING: 'NEFES',
  POLY_GSR: 'GSR',
  DIALOGUE_ANSWER_HEADER: '[ CEVAP ]',
  DIALOGUE_YOU_PREFIX: 'SEN: ',
  DIALOGUE_SKIP_HINT: 'ENTER ile atla',
  CHOICE_MODAL_TITLE: 'SORU SEC',
  LOG_HEADER: '[ LOG ]',

  // pause menu
  PAUSE_TITLE: '[ DURAKLATILDI ]',
  PAUSE_CONTINUE: 'DEVAM ET',
  PAUSE_SETTINGS: 'AYARLAR',
  PAUSE_QUIT: 'MENUYE DON',

  // tutorial
  TUTORIAL_NEXT: 'DEVAM (ENTER / TIKLA)',
  TUTORIAL_SKIP: 'ESC: ATLA',
  TUTORIAL_STEP: 'ADIM',
  TUTORIAL_OF: '/',
  TUTORIAL_POLYGRAPH_TITLE: 'POLIGRAF PANELI',
  TUTORIAL_POLYGRAPH_BODY:
    'Sanigin kalp, beyin ve deri tepkilerini gosterir. Sorgu sirasinda olusan renkli bantlar, tepkinin siddetini belli eder.',
  TUTORIAL_DOSSIER_TITLE: 'SANIK DOSYASI',
  TUTORIAL_DOSSIER_BODY:
    'Saglik, aliskanlik ve baski noktalarini inceleyin. Bazi durumlar poligraf okumalarini carpitabilir.',
  TUTORIAL_LOG_TITLE: 'GECMIS KAYIT',
  TUTORIAL_LOG_BODY: 'Sorgu boyunca yapilan konusmalari buradan tekrar okuyabilirsiniz.',
  TUTORIAL_CHOICES_TITLE: 'SORULAR',
  TUTORIAL_CHOICES_BODY:
    'Tiklayarak veya 1-9 tuslarini kullanarak soru secin. Her soru farkli bir tepki doguracaktir.',

  // language / case filtering
  MENU_NO_CASES: 'BU DIL ICIN VAKA BULUNAMADI',
  WARN_LANG_MISMATCH: '! SORGU SIRASINDA DIL DEGISTIRILDI — ICERIK ORIJINAL DILDE KALIR',
};
