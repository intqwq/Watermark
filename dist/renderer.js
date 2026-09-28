export const DEFAULT_WATERMARK = 'Made by intqwq@X';
export const SIGNATURE_PRESETS = {
  'signature-intqwq': {text:'intqwq@X'},
};
export const isHandwrittenStyle = style => style==='handwriting';

export function resolveWatermarkText(text = '') {
  return text.trim() || DEFAULT_WATERMARK;
}

function origin(width,height,w,h,settings,margin){
  if(settings.position==='free'){
    const inset=settings.style==='capsule'?Math.max(.5,Math.min(width,height)*settings.size/100*.025)/2:0;
    const x=Number.isFinite(settings.freeX)?settings.freeX:.5,y=Number.isFinite(settings.freeY)?settings.freeY:.5;
    return {x:Math.max(inset,Math.min(width-w-inset,x*width-w/2)),y:Math.max(inset,Math.min(height-h-inset,y*height-h/2))};
  }
  return {x:settings.position.endsWith('r')?width-margin-w:margin,y:settings.position.startsWith('b')?height-margin-h:margin};
}

export function drawWatermark(ctx, width, height, settings, signature) {
  const preset=SIGNATURE_PRESETS[settings.style];
  const text = resolveWatermarkText(settings.text);
  const short = Math.min(width, height);
  const capsule = settings.style === 'capsule';
  let size = short * Math.max(.5,Math.min(10,settings.size)) / 100;
  const gap = settings.position==='free'?0:Number.isFinite(settings.margin) ? Math.max(0,Math.min(10,settings.margin)) : 1;
  // Preserve the capsule outline even when its requested gap is zero.
  const margin = Math.max(short * gap / 100,capsule ? Math.max(.5,size*.025)/2 : 0);
  if(preset){
    if(!signature)throw new Error('Signature artwork is not ready.');
    const ratio=signature.width/signature.height;
    const h=Math.min(size,(width-margin*2)/ratio,height-margin*2),w=h*ratio;
    const {x,y}=origin(width,height,w,h,settings,margin);
    ctx.save();ctx.globalAlpha=settings.opacity/100;
    ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
    ctx.drawImage(signature[settings.color==='dark'?'dark':'light'],x,y,w,h);
    ctx.restore();return {x,y,width:w,height:h};
  }
  const font = () => isHandwrittenStyle(settings.style) ? `400 ${size}px "Lumen Hand", "Segoe UI", "Microsoft YaHei", sans-serif` : settings.style === 'serif' ? `italic 500 ${size}px Georgia, "Noto Serif SC", "Songti SC", SimSun, serif` : `600 ${size}px "Segoe UI", "Microsoft YaHei", sans-serif`;
  ctx.save();
  ctx.textAlign = 'left';ctx.textBaseline = 'alphabetic';
  ctx.font = font();
  const measure = () => {
    const metrics=ctx.measureText(text);
    const left=Math.max(0,metrics.actualBoundingBoxLeft || 0);
    return {metrics,left,width:left+Math.max(metrics.width,metrics.actualBoundingBoxRight || 0)};
  };
  let padX = capsule ? size * .8 : size * .15;
  let padY = capsule ? size * .5 : size * .2;
  const available = width - margin * 2;
  const measured = measure().width + padX * 2;
  if (measured > available) {
    const scale = available / measured;
    size *= scale; padX *= scale; padY *= scale; ctx.font = font();
  }
  const {metrics,left,width:textWidth} = measure();
  const ascent = Math.max(0,metrics.actualBoundingBoxAscent ?? size * .8);
  const descent = Math.max(0,metrics.actualBoundingBoxDescent ?? size * .22);
  const boxWidth = textWidth + padX * 2;
  const boxHeight = ascent + descent + padY * 2;
  const {x,y}=origin(width,height,boxWidth,boxHeight,settings,margin);
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
  ctx.fillText(text,x+padX+left,y+padY+ascent);
  ctx.restore();
  return {x,y,width:boxWidth,height:boxHeight};
}
