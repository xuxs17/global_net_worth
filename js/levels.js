const LevelsModule = (() => {
  const LEVELS = [
    { key: 'extremely_rich', label: '超高净值人士', min: 10, max: Infinity },
    { key: 'very_rich',     label: '相当富裕',     min: 5,  max: 10 },
    { key: 'middle',        label: '中产水平',     min: 1,  max: 5 },
    { key: 'average',       label: '普通收入',     min: 0.5, max: 1 },
    { key: 'low',           label: '温饱有余',     min: 0.2, max: 0.5 },
    { key: 'very_low',      label: '手头有点紧',   min: 0.1, max: 0.2 },
    { key: 'extremely_low', label: '需要精打细算', min: 0,   max: 0.1 },
  ];

  function determineLevel(ratio) {
    for (const level of LEVELS) {
      if (ratio > level.min && ratio <= level.max) return level;
    }
    return LEVELS[LEVELS.length - 1];
  }

  function getLevelConfig(key) {
    return LEVELS.find(l => l.key === key) || LEVELS[LEVELS.length - 1];
  }

  return { determineLevel, getLevelConfig, LEVELS };
})();
