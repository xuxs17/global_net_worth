/* Run in the local site's browser console, or load with Playwright.
 * createOGImage() returns a 1200×630 Canvas. Save its PNG as /og-image.png.
 * The artwork contains no salary figures and stays valid as rates change.
 */
window.createOGImage = async function createOGImage() {
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 630;
  const ctx = canvas.getContext('2d');
  const green = '#173d32';
  const lime = '#deeea4';
  ctx.fillStyle = '#f7f7ef';
  ctx.fillRect(0, 0, 1200, 630);
  ctx.strokeStyle = '#d5dcc9';
  ctx.lineWidth = 2;
  ctx.strokeRect(24, 24, 1152, 582);
  ctx.fillStyle = green;
  ctx.font = 'bold 30px "Trebuchet MS", sans-serif';
  ctx.fillText('GlobalSalary.', 64, 86);
  ctx.font = '16px "Trebuchet MS", sans-serif';
  ctx.fillStyle = '#486253';
  ctx.fillText('YOUR SALARY, AROUND THE WORLD', 64, 151);
  ctx.fillStyle = '#202d25';
  ctx.font = 'bold 83px "Trebuchet MS", sans-serif';
  ctx.fillText('Same salary.', 59, 258);
  ctx.fillStyle = green;
  ctx.font = 'italic 81px Georgia, serif';
  ctx.fillText('Different world.', 59, 351);
  ctx.font = '23px "Trebuchet MS", sans-serif';
  ctx.fillStyle = '#687160';
  ctx.fillText('One paycheck. Ten countries.', 64, 418);
  ctx.fillText('A whole new perspective.', 64, 452);
  ctx.font = 'bold 16px "Trebuchet MS", sans-serif';
  ctx.fillStyle = green;
  ctx.fillText('global-salary-fun.netlify.app', 64, 558);

  ctx.save();
  ctx.translate(905, 307);
  ctx.rotate(.045);
  ctx.fillStyle = '#e7ebdc';
  ctx.beginPath(); ctx.roundRect(-168, -193, 350, 401, 15); ctx.fill();
  ctx.fillStyle = green;
  ctx.beginPath(); ctx.roundRect(-178, -203, 350, 401, 15); ctx.fill();
  ctx.fillStyle = lime;
  ctx.font = '17px "Trebuchet MS", sans-serif';
  ctx.fillText('YOUR SALARY PASSPORT', -146, -151);
  ctx.strokeStyle = '#92aa7e';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(-3, -7, 83, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(-3, -7, 35, 83, 0, 0, Math.PI * 2); ctx.stroke();
  [-35, 21].forEach(y => { ctx.beginPath(); ctx.moveTo(-79, y); ctx.lineTo(73, y); ctx.stroke(); });
  ctx.font = 'bold 57px "Trebuchet MS", sans-serif';
  ctx.fillText('10', -143, 142);
  ctx.font = '16px "Trebuchet MS", sans-serif';
  ctx.fillText('COUNTRIES', -60, 123);
  ctx.fillText('7 LANGUAGES', -60, 149);
  ctx.restore();
  return canvas;
};
