/* Regenerate og-image.png (1200x630).
 *
 * There is no build step, so run this from the site itself where the fonts and
 * flag assets are already available:
 *   1. open http://localhost:8000/ in DevTools
 *   2. paste this file into the console
 *   3. save the downloaded og-image.png into the repo root
 *
 * Keep the background flat: a gradient costs ~400KB of PNG dithering for no
 * visible gain in a feed thumbnail.
 */
(async () => {
  await document.fonts.load('700 60px "Playfair Display"');
  await document.fonts.load('400 26px Inter');
  const loadFlag = code => new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = `assets/flags/${code}.svg`;
  });
  const [inFlag, vnFlag, usFlag] = await Promise.all(['in', 'vn', 'us'].map(loadFlag));

  const NAVY = '#1a1a2e';
  const MUTED = '#6b6560';
  const ACCENT = '#c77826';
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 630;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#f7f4ef';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const wrap = (text, font, maxWidth) => {
    ctx.font = font;
    const lines = [];
    let line = '';
    for (const word of text.split(' ')) {
      const candidate = line ? `${line} ${word}` : word;
      if (ctx.measureText(candidate).width > maxWidth && line) {
        lines.push(line);
        line = word;
      } else {
        line = candidate;
      }
    }
    if (line) lines.push(line);
    return lines;
  };
  const paragraph = (text, font, color, x, y, lineHeight, maxWidth) => {
    ctx.font = font;
    ctx.fillStyle = color;
    for (const line of wrap(text, font, maxWidth)) {
      ctx.fillText(line, x, y);
      y += lineHeight;
    }
    return y;
  };

  let y = paragraph("What's your salary worth worldwide?",
    '700 60px "Playfair Display", Georgia, serif', NAVY, 72, 190, 72, 540);
  paragraph('Enter a monthly salary and see how it ranks across 10 countries.',
    '400 26px Inter, sans-serif', MUTED, 72, y + 6, 36, 520);

  ctx.font = '700 32px "Playfair Display", Georgia, serif';
  ctx.fillStyle = ACCENT;
  ctx.fillText('global-salary-fun.netlify.app', 72, 548);
  ctx.font = '400 17px Inter, sans-serif';
  ctx.fillStyle = MUTED;
  ctx.fillText('For entertainment only - not financial advice', 72, 578);

  const cards = [
    { flag: inFlag, cur: 'INR', amount: '142,734', country: 'India', tag: 'Middle Class', fg: '#2a7d4f', bg: '#e6f4ec' },
    { flag: vnFlag, cur: 'VND', amount: '38,678,574', country: 'Vietnam', tag: 'Middle Class', fg: '#2a7d4f', bg: '#e6f4ec' },
    { flag: usFlag, cur: 'USD', amount: '1,489.60', country: 'United States', tag: 'Modest Means', fg: '#6b4e8a', bg: '#f2ecf7' },
  ];
  const X = 664, WIDTH = 464, HEIGHT = 116, GAP = 22;

  cards.forEach((card, index) => {
    const top = 118 + index * (HEIGHT + GAP);
    ctx.save();
    ctx.shadowColor = 'rgba(26,26,46,0.08)';
    ctx.shadowBlur = 18;
    ctx.shadowOffsetY = 4;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.roundRect(X, top, WIDTH, HEIGHT, 16);
    ctx.fill();
    ctx.restore();

    ctx.strokeStyle = '#f0ece6';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(X + 0.5, top + 0.5, WIDTH - 1, HEIGHT - 1, 16);
    ctx.stroke();

    ctx.drawImage(card.flag, X + 26, top + 36, 44, 44);
    ctx.font = '600 18px Inter, sans-serif';
    ctx.fillStyle = MUTED;
    ctx.fillText(`#${index + 1}`, X + 84, top + 46);
    ctx.font = '600 20px Inter, sans-serif';
    ctx.fillStyle = NAVY;
    ctx.fillText(card.cur, X + 122, top + 46);
    ctx.font = '700 32px Inter, sans-serif';
    ctx.fillText(card.amount, X + 122, top + 84);
    ctx.font = '400 17px Inter, sans-serif';
    ctx.fillStyle = MUTED;
    ctx.fillText(card.country, X + 26, top + 106);

    ctx.font = '600 17px Inter, sans-serif';
    const textWidth = ctx.measureText(card.tag).width;
    ctx.fillStyle = card.bg;
    ctx.beginPath();
    ctx.roundRect(X + WIDTH - textWidth - 52, top + 44, textWidth + 32, 32, 16);
    ctx.fill();
    ctx.fillStyle = card.fg;
    ctx.fillText(card.tag, X + WIDTH - textWidth - 36, top + 66);
  });

  const link = document.createElement('a');
  link.download = 'og-image.png';
  link.href = canvas.toDataURL('image/png');
  link.click();
})();
