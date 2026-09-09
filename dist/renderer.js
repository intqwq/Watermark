export function drawWatermark(ctx, width, height, settings) {
  const text = settings.text.trim();
  if (!text) return null;
  const short = Math.min(width, height);
  const margin = short * .035;
  const capsule = settings.style === 'capsule';
  let size = short * settings.size / 100;
  const font = () => settings.style === 'serif' ? `italic 500 ${size}px Georgia, "Noto Serif SC", "Songti SC", SimSun, serif` : `600 ${size}px "Segoe UI", "Microsoft YaHei", sans-serif`;
  ctx.save();
  ctx.font = font();
  let padX = capsule ? size * .8 : size * .15;
  let padY = capsule ? size * .5 : size * .2;
  const available = width - margin * 2;
  const measured = ctx.measureText(text).width + padX * 2;
  if (measured > available) {
    const scale = available / measured;
    size *= scale; padX *= scale; padY *= scale; ctx.font = font();
  }
  const metrics = ctx.measureText(text);
  const ascent = metrics.actualBoundingBoxAscent || size * .8;
  const descent = metrics.actualBoundingBoxDescent || size * .22;
  const boxWidth = metrics.width + padX * 2;
  const boxHeight = ascent + descent + padY * 2;
  const x = settings.position.endsWith('r') ? width - margin - boxWidth : margin;
  const y = settings.position.startsWith('b') ? height - margin - boxHeight : margin;
  const dark = settings.color === 'dark';
  ctx.globalAlpha = settings.opacity / 100;
  if (capsule) {
    ctx.fillStyle = dark ? 'rgba(255,255,255,.86)' : 'rgba(21,24,34,.64)';
    ctx.beginPath(); ctx.roundRect(x,y,boxWidth,boxHeight,size * .36); ctx.fill();
    ctx.strokeStyle = dark ? 'rgba(0,0,0,.10)' : 'rgba(255,255,255,.22)';
    ctx.lineWidth = Math.max(.5, size * .025);ctx.stroke();
  }
  ctx.fillStyle = dark ? '#232531' : '#ffffff';
  if (!capsule) {ctx.shadowColor = dark ? 'rgba(255,255,255,.5)' : 'rgba(0,0,0,.55)';ctx.shadowBlur = size * .18;ctx.shadowOffsetY = size * .035;}
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(text,x+padX,y+padY+ascent);
  ctx.restore();
  return {x,y,width:boxWidth,height:boxHeight};
}
