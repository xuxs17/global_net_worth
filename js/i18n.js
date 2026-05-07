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
      disclaimer3: 'Data sources: Frankfurter API / World Bank / IMF',
      disclaimer4: 'PPP based on World Bank ICP data.',
      rankTitle: 'My Global Income Ranking',
      modeMonthly: 'Monthly',
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
      disclaimer3: 'データソース: Frankfurter API / 世界銀行 / IMF',
      disclaimer4: 'PPPは世界銀行ICPデータに基づきます。',
      rankTitle: '世界収入ランキング',
      modeMonthly: '月収',
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
      disclaimer3: 'Nguồn dữ liệu: Frankfurter API / World Bank / IMF',
      disclaimer4: 'PPP dựa trên dữ liệu ICP của World Bank.',
      rankTitle: 'Xếp Hạng Thu Nhập Toàn Cầu',
      modeMonthly: 'Hàng tháng',
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
      disclaimer3: 'डेटा स्रोत: Frankfurter API / विश्व बैंक / IMF',
      disclaimer4: 'PPP विश्व बैंक ICP डेटा पर आधारित है।',
      rankTitle: 'मेरी वैश्विक आय रैंकिंग',
      modeMonthly: 'मासिक',
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
      disclaimer3: 'Fontes: Frankfurter API / Banco Mundial / FMI',
      disclaimer4: 'PPP baseado nos dados ICP do Banco Mundial.',
      rankTitle: 'Meu Ranking de Renda Global',
      modeMonthly: 'Mensal',
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
      disclaimer3: '数据来源：Frankfurter API / 世界银行 / IMF',
      disclaimer4: '购买力平价(PPP)基于世界银行ICP数据计算。',
      rankTitle: '我的全球收入排行榜',
      modeMonthly: '月薪',
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
      disclaimer3: '데이터 출처: Frankfurter API / 세계은행 / IMF',
      disclaimer4: 'PPP는 세계은행 ICP 데이터 기준.',
      rankTitle: '세계 수입 랭킹',
      modeMonthly: '월급',
    },
  };

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

  let currentLang = 'en';

  function detectLang() {
    const saved = localStorage.getItem(LS_KEY);
    if (saved && translations[saved]) return saved;
    const browser = navigator.language;
    if (browser.startsWith('ja')) return 'ja';
    if (browser.startsWith('vi')) return 'vi';
    if (browser.startsWith('hi')) return 'hi';
    if (browser.startsWith('pt')) return 'pt-BR';
    if (browser.startsWith('zh')) return 'zh-CN';
    if (browser.startsWith('ko')) return 'ko';
    return 'en';
  }

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

  function getLang() { return currentLang; }

  // Initialize
  currentLang = detectLang();
  document.documentElement.lang = currentLang;

  return { setLang, t, levelLabel, getLang, translations, levelLabels };
})();
