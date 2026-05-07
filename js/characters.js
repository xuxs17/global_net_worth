const CharactersModule = (() => {
  // 等级角色 emoji 映射（在素材就绪前用 emoji 代替）
  const CHAR_EMOJI = {
    extremely_rich: '👑',
    very_rich:     '💎',
    middle:        '⭐',
    average:       '🙂',
    low:           '🌱',
    very_low:      '🫤',
    extremely_low: '🍞',
  };

  function getEmoji(levelKey) {
    return CHAR_EMOJI[levelKey] || '❓';
  }

  return { getEmoji };
})();
