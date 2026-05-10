const LevelsModule = (() => {
  const LEVELS = [
    { key: 'extremely_rich', min: 10, max: Infinity },
    { key: 'very_rich',     min: 5,  max: 10 },
    { key: 'middle',        min: 1,  max: 5 },
    { key: 'average',       min: 0.5, max: 1 },
    { key: 'low',           min: 0.2, max: 0.5 },
    { key: 'very_low',      min: 0.1, max: 0.2 },
    { key: 'extremely_low', min: 0,   max: 0.1 },
  ];

  function determineLevel(ratio) {
    for (const level of LEVELS) {
      if (ratio >= level.min && ratio <= level.max) return level;
    }
    return LEVELS[LEVELS.length - 1];
  }

  function getLevelLabel(key) {
    return I18n.levelLabel(key);
  }

  return { determineLevel, getLevelLabel, LEVELS };
})();
