const I18n = (() => {
  const LS_KEY = 'gsw-lang';

  const translations = {
    en: {
      title: 'What\'s Your Income Worth Worldwide?',
      subtitle: 'Enter your monthly salary and see how you rank across 10 countries',
      amountPlaceholder: 'Monthly salary',
      calcBtn: 'Calculate Global Ranking',
      capturing: 'Capturing...',
      shareBtn: 'Generate Share Image',
      emptyHint: 'Enter your monthly salary to see your global ranking',
      dataError: 'Failed to load data. Please refresh the page.',
      calcError: 'Calculation error. Check your input.',
      disclaimer1: 'This tool is for entertainment only. Not financial advice.',
      disclaimer2: 'Exchange rate date:',
      ratesSource: 'Exchange rates: ECB via Frankfurter, supplemented by open.er-api.com',
      salaryBasis: 'Comparison basis: average monthly salary per country (CEOWORLD 2025)',
      rankTitle: 'My Global Income Ranking',
      copied: 'Copied to clipboard!',
      imageReady: 'Image ready! Long-press to save',
      screenshotFailed: 'Screenshot failed',
    },
    ja: {
      title: 'あなたの収入は世界でどのレベル？',
      subtitle: '月収を入力して、10カ国でのランキングを見てみよう',
      amountPlaceholder: '月収',
      calcBtn: '世界ランキングを計算',
      capturing: 'キャプチャ中...',
      shareBtn: '共有画像を生成',
      emptyHint: '月収を入力して世界ランキングを表示',
      dataError: 'データの読み込みに失敗しました。ページを更新してください。',
      calcError: '計算エラー。入力を確認してください。',
      disclaimer1: 'このツールは娯楽目的です。財務アドバイスではありません。',
      disclaimer2: '為替レート日付:',
      ratesSource: '為替レート: ECB（Frankfurter）+ open.er-api.com',
      salaryBasis: '比較基準: 各国の平均月収（CEOWORLD 2025）',
      rankTitle: '世界収入ランキング',
      copied: 'クリップボードにコピーしました！',
      imageReady: '画像の準備ができました！長押しで保存',
      screenshotFailed: 'スクリーンショットに失敗しました',
    },
    vi: {
      title: 'Thu Nhập của Bạn Xếp Hạng Thế Nào Trên Thế Giới?',
      subtitle: 'Nhập lương tháng và xem thứ hạng của bạn trên 10 quốc gia',
      amountPlaceholder: 'Lương tháng',
      calcBtn: 'Tính Xếp Hạng Toàn Cầu',
      capturing: 'Đang chụp...',
      shareBtn: 'Tạo Ảnh Chia Sẻ',
      emptyHint: 'Nhập lương tháng để xem xếp hạng toàn cầu',
      dataError: 'Không tải được dữ liệu. Vui lòng làm mới trang.',
      calcError: 'Lỗi tính toán. Kiểm tra đầu vào.',
      disclaimer1: 'Công cụ này chỉ mang tính giải trí. Không phải tư vấn tài chính.',
      disclaimer2: 'Ngày tỷ giá:',
      ratesSource: 'Tỷ giá: ECB qua Frankfurter, bổ sung bởi open.er-api.com',
      salaryBasis: 'Cơ sở so sánh: lương trung bình tháng mỗi quốc gia (CEOWORLD 2025)',
      rankTitle: 'Xếp Hạng Thu Nhập Toàn Cầu',
      copied: 'Đã sao chép vào clipboard!',
      imageReady: 'Ảnh đã sẵn sàng! Nhấn giữ để lưu',
      screenshotFailed: 'Chụp màn hình thất bại',
    },
    hi: {
      title: 'दुनिया भर में आपकी आय का स्तर क्या है?',
      subtitle: 'अपना मासिक वेतन दर्ज करें और 10 देशों में अपनी रैंकिंग देखें',
      amountPlaceholder: 'मासिक वेतन',
      calcBtn: 'वैश्विक रैंकिंग की गणना करें',
      capturing: 'कैप्चर हो रहा है...',
      shareBtn: 'शेयर इमेज बनाएं',
      emptyHint: 'अपनी वैश्विक रैंकिंग देखने के लिए मासिक वेतन दर्ज करें',
      dataError: 'डेटा लोड करने में विफल। कृपया पेज रिफ्रेश करें।',
      calcError: 'गणना त्रुटि। अपना इनपुट जांचें।',
      disclaimer1: 'यह टूल केवल मनोरंजन के लिए है। वित्तीय सलाह नहीं।',
      disclaimer2: 'विनिमय दर तिथि:',
      ratesSource: 'विनिमय दर: ECB (Frankfurter) + open.er-api.com',
      salaryBasis: 'तुलना आधार: प्रति देश औसत मासिक वेतन (CEOWORLD 2025)',
      rankTitle: 'मेरी वैश्विक आय रैंकिंग',
      copied: 'क्लिपबोर्ड पर कॉपी किया गया!',
      imageReady: 'इमेज तैयार! सेव करने के लिए लॉन्ग-प्रेस करें',
      screenshotFailed: 'स्क्रीनशॉट विफल',
    },
    'pt-BR': {
      title: 'Como Sua Renda Se Compara no Mundo?',
      subtitle: 'Digite seu salário mensal e veja como você se classifica em 10 países',
      amountPlaceholder: 'Salário mensal',
      calcBtn: 'Calcular Ranking Global',
      capturing: 'Capturando...',
      shareBtn: 'Gerar Imagem',
      emptyHint: 'Digite seu salário mensal para ver o ranking global',
      dataError: 'Falha ao carregar dados. Atualize a página.',
      calcError: 'Erro de cálculo. Verifique os dados.',
      disclaimer1: 'Ferramenta apenas para entretenimento. Não é aconselhamento financeiro.',
      disclaimer2: 'Data da taxa de câmbio:',
      ratesSource: 'Taxas cambiais: ECB via Frankfurter, com open.er-api.com',
      salaryBasis: 'Base de comparação: salário mensal médio por país (CEOWORLD 2025)',
      rankTitle: 'Meu Ranking de Renda Global',
      copied: 'Copiado!',
      imageReady: 'Imagem pronta! Pressione para salvar',
      screenshotFailed: 'Captura de tela falhou',
    },
    'zh-CN': {
      title: '你的收入在全球算什么水平？',
      subtitle: '输入月薪，查看你在 10 个国家的财富排名',
      amountPlaceholder: '输入月薪',
      calcBtn: '计算全球排名',
      capturing: '生成中...',
      shareBtn: '生成分享图片',
      emptyHint: '输入你的月薪，看看在全球算什么水平',
      dataError: '数据加载失败，请稍后刷新页面',
      calcError: '计算出错，请检查输入',
      disclaimer1: '数据仅供娱乐参考，不构成财务建议。',
      disclaimer2: '汇率基准：',
      ratesSource: '汇率来源：欧洲央行（Frankfurter），小币种由 open.er-api.com 补充',
      salaryBasis: '对比基准：各国平均月薪（CEOWORLD 2025）',
      rankTitle: '我的全球收入排行榜',
      copied: '已复制到剪贴板！',
      imageReady: '图片已生成！长按保存',
      screenshotFailed: '截图失败',
    },
    ko: {
      title: '당신의 수입은 세계에서 어느 수준일까요?',
      subtitle: '월급을 입력하고 10개국에서의 순위를 확인하세요',
      amountPlaceholder: '월급',
      calcBtn: '세계 랭킹 계산',
      capturing: '캡처 중...',
      shareBtn: '공유 이미지 생성',
      emptyHint: '월급을 입력하여 세계 랭킹을 확인하세요',
      dataError: '데이터 로드 실패. 페이지를 새로고침하세요.',
      calcError: '계산 오류. 입력을 확인하세요.',
      disclaimer1: '이 도구는 오락 목적입니다. 재정 조언이 아닙니다.',
      disclaimer2: '환율 날짜:',
      ratesSource: '환율 출처: ECB(Frankfurter) + open.er-api.com',
      salaryBasis: '비교 기준: 국가별 평균 월급 (CEOWORLD 2025)',
      rankTitle: '세계 수입 랭킹',
      copied: '클립보드에 복사되었습니다!',
      imageReady: '이미지 준비 완료! 길게 눌러 저장',
      screenshotFailed: '스크린샷 실패',
    },
  };

  // Text that only appears inside the share image / capture area
  const captureLabels = {
    en: {
      basedOn: 'Based on {salary} per month',
      captureDisclaimer: 'For entertainment only — not financial advice',
      captureBasis: 'Compared with each country\'s average monthly salary',
      captureDate: 'Rates as of',
    },
    ja: {
      basedOn: '{salary}/月 の場合',
      captureDisclaimer: '娯楽目的です。財務アドバイスではありません',
      captureBasis: '各国の平均月収と比較',
      captureDate: '為替レート日付',
    },
    vi: {
      basedOn: 'Tính theo {salary}/tháng',
      captureDisclaimer: 'Chỉ mang tính giải trí, không phải tư vấn tài chính',
      captureBasis: 'So với lương trung bình tháng của mỗi quốc gia',
      captureDate: 'Tỷ giá ngày',
    },
    hi: {
      basedOn: '{salary}/मासिक के आधार पर',
      captureDisclaimer: 'केवल मनोरंजन के लिए, वित्तीय सलाह नहीं',
      captureBasis: 'प्रत्येक देश के औसत मासिक वेतन से तुलना',
      captureDate: 'विनिमय दर तिथि',
    },
    'pt-BR': {
      basedOn: 'Com base em {salary}/mês',
      captureDisclaimer: 'Apenas para entretenimento — não é aconselhamento financeiro',
      captureBasis: 'Comparado com o salário mensal médio de cada país',
      captureDate: 'Taxas de',
    },
    'zh-CN': {
      basedOn: '按 {salary}/月 计算',
      captureDisclaimer: '仅供娱乐，不构成财务建议',
      captureBasis: '对比基准为各国平均月薪',
      captureDate: '汇率日期',
    },
    ko: {
      basedOn: '{salary}/월 기준',
      captureDisclaimer: '오락용입니다. 재정 조언이 아닙니다',
      captureBasis: '각국 평균 월급과 비교',
      captureDate: '환율 날짜',
    },
  };
  Object.keys(captureLabels).forEach(lang => Object.assign(translations[lang], captureLabels[lang]));

  // Degraded-state wording (per-country gaps, rejected input, lagging currencies)
  const miscLabels = {
    en: {
      dataUnavailable: 'Data unavailable',
      amountTooLarge: 'Please enter a realistic monthly salary.',
      staleNote: 'Cached rate, not current:',
      captureUnavailable: 'Image library not loaded. Please refresh.',
    },
    ja: {
      dataUnavailable: 'データなし',
      amountTooLarge: '現実的な月収を入力してください。',
      staleNote: '一部レートは更新済み:',
      captureUnavailable: '画像ライブラリを読み込めませんでした。再読み込みしてください。',
    },
    vi: {
      dataUnavailable: 'Không có dữ liệu',
      amountTooLarge: 'Vui lòng nhập mức lương hợp lý.',
      staleNote: 'Tỷ giá cũ (chưa cập nhật):',
      captureUnavailable: 'Không tải được thư viện ảnh. Vui lòng tải lại.',
    },
    hi: {
      dataUnavailable: 'डेटा अनुपलब्ध',
      amountTooLarge: 'कृपया यथार्थपूर्ण मासिक वेतन दर्ज करें।',
      staleNote: 'पुरानी दर:',
      captureUnavailable: 'इमेज लाइब्रेरी लोड नहीं हुई। कृपया रीफ्रेश करें।',
    },
    'pt-BR': {
      dataUnavailable: 'Sem dados',
      amountTooLarge: 'Informe um salário mensal realista.',
      staleNote: 'Taxa em cache:',
      captureUnavailable: 'Biblioteca de imagem não carregou. Atualize a página.',
    },
    'zh-CN': {
      dataUnavailable: '数据暂缺',
      amountTooLarge: '请输入合理的月薪数值。',
      staleNote: '以下币种仍为旧汇率：',
      captureUnavailable: '图片组件未加载，请刷新页面重试。',
    },
    ko: {
      dataUnavailable: '데이터 없음',
      amountTooLarge: '현실적인 월급을 입력하세요.',
      staleNote: '오래된 환율:',
      captureUnavailable: '이미지 라이브러리를 불러오지 못했습니다. 새로고침하세요.',
    },
  };
  Object.keys(miscLabels).forEach(lang => Object.assign(translations[lang], miscLabels[lang]));

  // Level labels in all languages
  const levelLabels = {
    en: {
      extremely_rich: 'Ultra High Net Worth',
      very_rich: 'Quite Wealthy',
      middle: 'Middle Class',
      average: 'Average Income',
      low: 'Modest Means',
      very_low: 'Tight Budget',
      extremely_low: 'Bare Minimum',
    },
    ja: {
      extremely_rich: '超富裕層',
      very_rich: 'かなり裕福',
      middle: '中流階級',
      average: '平均的収入',
      low: '控えめな生活',
      very_low: '厳しい予算',
      extremely_low: '最低限の生活',
    },
    vi: {
      extremely_rich: 'Siêu Giàu',
      very_rich: 'Khá Giả',
      middle: 'Trung Lưu',
      average: 'Thu Nhập Trung Bình',
      low: 'Vừa Đủ',
      very_low: 'Eo Hẹp',
      extremely_low: 'Tối Thiểu',
    },
    hi: {
      extremely_rich: 'अति धनी',
      very_rich: 'काफी अमीर',
      middle: 'मध्यम वर्ग',
      average: 'औसत आय',
      low: 'साधारण',
      very_low: 'तंग बजट',
      extremely_low: 'न्यूनतम',
    },
    'pt-BR': {
      extremely_rich: 'Ultra Rico',
      very_rich: 'Bastante Rico',
      middle: 'Classe Média',
      average: 'Renda Média',
      low: 'Modesto',
      very_low: 'Apertado',
      extremely_low: 'Mínimo',
    },
    'zh-CN': {
      extremely_rich: '超高净值人士',
      very_rich: '相当富裕',
      middle: '中产水平',
      average: '普通收入',
      low: '温饱有余',
      very_low: '手头有点紧',
      extremely_low: '需要精打细算',
    },
    ko: {
      extremely_rich: '초고소득자',
      very_rich: '상당한 부유층',
      middle: '중산층',
      average: '평균 소득',
      low: '검소한 생활',
      very_low: '빠듯한 예산',
      extremely_low: '최저 생계',
    },
  };

  // Country names by code
  const countryNames = {
    US: { en: 'United States', ja: 'アメリカ', ko: '미국', 'zh-CN': '美国', vi: 'Hoa Kỳ', hi: 'संयुक्त राज्य', 'pt-BR': 'Estados Unidos' },
    GB: { en: 'United Kingdom', ja: 'イギリス', ko: '영국', 'zh-CN': '英国', vi: 'Vương Quốc Anh', hi: 'यूनाइटेड किंगडम', 'pt-BR': 'Reino Unido' },
    DE: { en: 'Germany', ja: 'ドイツ', ko: '독일', 'zh-CN': '德国', vi: 'Đức', hi: 'जर्मनी', 'pt-BR': 'Alemanha' },
    JP: { en: 'Japan', ja: '日本', ko: '일본', 'zh-CN': '日本', vi: 'Nhật Bản', hi: 'जापान', 'pt-BR': 'Japão' },
    CN: { en: 'China', ja: '中国', ko: '중국', 'zh-CN': '中国', vi: 'Trung Quốc', hi: 'चीन', 'pt-BR': 'China' },
    RU: { en: 'Russia', ja: 'ロシア', ko: '러시아', 'zh-CN': '俄罗斯', vi: 'Nga', hi: 'रूस', 'pt-BR': 'Rússia' },
    IN: { en: 'India', ja: 'インド', ko: '인도', 'zh-CN': '印度', vi: 'Ấn Độ', hi: 'भारत', 'pt-BR': 'Índia' },
    VN: { en: 'Vietnam', ja: 'ベトナム', ko: '베트남', 'zh-CN': '越南', vi: 'Việt Nam', hi: 'वियतनाम', 'pt-BR': 'Vietnã' },
    ID: { en: 'Indonesia', ja: 'インドネシア', ko: '인도네시아', 'zh-CN': '印度尼西亚', vi: 'Indonesia', hi: 'इंडोनेशिया', 'pt-BR': 'Indonésia' },
    BR: { en: 'Brazil', ja: 'ブラジル', ko: '브라질', 'zh-CN': '巴西', vi: 'Brasil', hi: 'ब्राज़ील', 'pt-BR': 'Brasil' },
  };

  // Language → default currency
  const langCurrency = {
    en: 'USD', ja: 'JPY', ko: 'USD', 'zh-CN': 'CNY',
    vi: 'VND', hi: 'INR', 'pt-BR': 'BRL',
  };

  let currentLang = 'en';

  function setLang(lang) {
    if (!translations[lang]) return;
    currentLang = lang;
    localStorage.setItem(LS_KEY, lang);
    document.documentElement.lang = lang;
  }

  function t(key) {
    return translations[currentLang][key] || translations['en'][key] || key;
  }

  function levelLabel(levelKey) {
    return (levelLabels[currentLang] || levelLabels['en'])[levelKey] || levelKey;
  }

  function countryName(code) {
    return (countryNames[code] || {})[currentLang] || (countryNames[code] || {}).en || code;
  }

  function getDefaultCurrency(lang) {
    return langCurrency[lang] || 'USD';
  }

  function getLang() { return currentLang; }

  // Initialize — restore saved language, default to English
  const saved = localStorage.getItem(LS_KEY);
  currentLang = (saved && translations[saved]) ? saved : 'en';
  document.documentElement.lang = currentLang;

  return { setLang, t, levelLabel, countryName, getDefaultCurrency, getLang, translations, levelLabels };
})();
