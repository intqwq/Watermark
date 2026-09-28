import {DEFAULT_WATERMARK, drawWatermark, resolveWatermarkText, SIGNATURE_PRESETS, isHandwrittenStyle} from './renderer.js?v=d707e59af361';
import {browserLanguage, localizePage, translate} from './i18n.js?v=412951c73d4f';
import {loadSignature} from './signature.js?v=5b8e0412c15a';
import {createTraceUI} from './trace-ui.js?v=4d5fd884a536';
let language=browserLanguage();
const t=key=>translate(key,language);
localizePage(document,language);
const $ = id => document.getElementById(id);
const defaults = {text:'',position:'br',style:'capsule',size:4,margin:1,opacity:90,color:'light',trace:true};
const ranges={size:{minimum:.5,maximum:10,step:.1},margin:{minimum:0,maximum:10,step:.1},opacity:{minimum:10,maximum:100,step:5}};
let settings = {...defaults}, source = null, filename = '', pending = false, loadId = 0, messageTimer;
let fontStatus='loading',fontPromise;
let signatureStatus='loading',signaturePromise,signature;
const canvas = $('preview'), ctx = canvas.getContext('2d');
const traceUI=createTraceUI(t);
$('watermark').placeholder=DEFAULT_WATERMARK;
let statusKey='';
function notify(key) { statusKey=key;$('status').textContent=t(key);clearTimeout(messageTimer);messageTimer=setTimeout(()=>{statusKey='';$('status').textContent='';},5500); }
function sync() {
  $('image-info').textContent=source ? `${source.width} × ${source.height} px` : t('waiting');
  $('preview-note').textContent=t(source?'previewLoaded':'previewEmpty');
  $('watermark').value=settings.text; $('char-count').textContent=`${settings.text.length} / 100`;
  for (const name of Object.keys(ranges)) {$(name).value=settings[name];$(name+'-value').textContent=settings[name]+'%';}
  for (const name of ['position','style','color']) document.querySelectorAll(`[data-${name}]`).forEach(button=>button.setAttribute('aria-pressed',String(button.dataset[name]===settings[name])));
  const handwritten=isHandwrittenStyle(settings.style),signed=!!SIGNATURE_PRESETS[settings.style];
  const assetStatus=signed?signatureStatus:fontStatus;
  $('font-status').hidden=!handwritten&&!signed;
  $('font-status').textContent=t(assetStatus==='ready'?(signed?'signatureNote':'handwritingNote'):assetStatus==='error'?(signed?'signatureError':'fontError'):(signed?'signatureLoading':'fontLoading'));
  $('retry-font').hidden=(!handwritten&&!signed) || assetStatus!=='error';
  $('retry-font').textContent=t(signed?'retrySignature':'retryFont');
  $('signature-sample').hidden=signatureStatus!=='ready';
  $('trace-enabled').checked=settings.trace;
  document.querySelectorAll('.settings button,.settings input').forEach(control=>control.disabled=pending);
  $('upload').disabled=$('replace').disabled=pending;
  traceUI.sync({enabled:settings.trace,pending});
  $('download').disabled=!source || pending || !assetsReady() || !traceUI.canExport();
  $('download').querySelector('[data-i18n]').textContent=t(pending?'exporting':'download');
  render();
}
function assetsReady(){return SIGNATURE_PRESETS[settings.style]?signatureStatus==='ready':!isHandwrittenStyle(settings.style)||fontStatus==='ready';}
function render() {
  if (!source) return;
  const scale=Math.min(1,1800/Math.max(source.width,source.height));
  canvas.width=Math.max(1,Math.round(source.width*scale));canvas.height=Math.max(1,Math.round(source.height*scale));
  ctx.clearRect(0,0,canvas.width,canvas.height);
  // Preview and export share source coordinates and the same signature bitmap.
  ctx.save();ctx.scale(canvas.width/source.width,canvas.height/source.height);
  ctx.drawImage(source,0,0);
  if(assetsReady())drawWatermark(ctx,source.width,source.height,settings,signature);
  ctx.restore();
}
async function loadSignatureArtwork(){
  if(signatureStatus==='ready')return;
  if(signaturePromise)return signaturePromise;
  signatureStatus='loading';sync();
  signaturePromise=loadSignature(new URL('./signatures/intqwq-x.png?v=eb81a6e13a6e',import.meta.url).href)
    .then(loaded=>{
      signature=loaded;signatureStatus='ready';
      const sample=$('signature-sample');sample.width=loaded.width;sample.height=loaded.height;
      sample.getContext('2d').drawImage(loaded.dark,0,0);
    }).catch(()=>{signatureStatus='error';})
    .finally(()=>{signaturePromise=null;sync();});
  return signaturePromise;
}
async function loadHandwritingFont() {
  if(fontStatus==='ready')return;
  if(fontPromise)return fontPromise;
  fontStatus='loading';sync();
  fontPromise=Promise.resolve()
    .then(()=>document.fonts.load('400 24px "Lumen Hand"','Made by intqwq@X'))
    .then(faces=>{if(!faces.length)throw new Error('Handwritten font unavailable');fontStatus='ready';})
    .catch(()=>{fontStatus='error';})
    .finally(()=>{fontPromise=null;sync();});
  return fontPromise;
}
async function loadFile(file) {
  if(!file) return;
  if(pending)return notify('exporting');
  if(!['image/jpeg','image/png','image/webp'].includes(file.type)) return notify('invalidType');
  if(file.size>30*1024*1024) return notify('tooLarge');
  const request=++loadId;
  let bitmap;
  try {
    bitmap=await createImageBitmap(file,{imageOrientation:'from-image'});
    if(request!==loadId||pending){bitmap.close();return;}
    if(bitmap.width*bitmap.height>40000000 || Math.max(bitmap.width,bitmap.height)>16384){bitmap.close();return notify('tooManyPixels');}
    source?.close();source=bitmap;filename=file.name;
    traceUI.newImage(filename,bitmap.width,bitmap.height);
    $('empty-state').hidden=true;canvas.hidden=false;$('replace').hidden=false;
    $('image-info').title=filename;
    sync();notify('loaded');
  } catch {bitmap?.close();if(request===loadId) notify('readError');}
}
async function download() {
  if(!source || pending || !assetsReady() || !traceUI.canExport()) return;
  pending=true;sync();
  const exportSettings={...settings};
  const exportName=filename.replace(/\.[^.]+$/,'')+'-watermarked.png';
  let output;
  try {
    output=document.createElement('canvas');output.width=source.width;output.height=source.height;
    const out=output.getContext('2d');if(!out)throw new Error('canvas');
    out.drawImage(source,0,0);drawWatermark(out,output.width,output.height,exportSettings,signature);
    const identity=exportSettings.trace?await traceUI.embed(out,output.width,output.height):null;
    const blob=await new Promise(resolve=>output.toBlob(resolve,'image/png'));
    if(!blob) throw new Error('export');
    if(identity)await traceUI.record(blob,identity,exportName,resolveWatermarkText(exportSettings.text));
    const url=URL.createObjectURL(blob),link=document.createElement('a');
    link.href=url;link.download=exportName;
    document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);
    notify('downloaded');
  } catch(error) {notify(['traceTooSmall','traceCapacity','traceEmbedFailed','traceTimeout','traceProcessingError'].includes(error.message)?error.message:'exportError');}
  finally {if(output){output.width=0;output.height=0;}pending=false;sync();}
}
$('upload').onclick=$('replace').onclick=()=>$('file-input').click();
$('file-input').addEventListener('change',event=>{loadFile(event.target.files[0]);event.target.value='';});
$('watermark').addEventListener('input',event=>{
  settings.text=event.target.value;
  if(SIGNATURE_PRESETS[settings.style] && settings.text!==SIGNATURE_PRESETS[settings.style].text)settings.style='handwriting';
  sync();
});
$('trace-enabled').onchange=event=>{settings.trace=event.target.checked;sync();};
for(const name of Object.keys(ranges)) $(name).addEventListener('input',event=>{settings[name]=Number(event.target.value);sync();});
for(const name of ['position','style','color']) document.querySelectorAll(`[data-${name}]`).forEach(button=>button.onclick=()=>{
  settings[name]=button.dataset[name];
  if(name==='style' && SIGNATURE_PRESETS[settings.style])settings.text=SIGNATURE_PRESETS[settings.style].text;
  sync();
});
$('reset').onclick=()=>{settings={...defaults};sync();notify('resetDone');};
$('download').onclick=download;
$('retry-font').onclick=()=>SIGNATURE_PRESETS[settings.style]?loadSignatureArtwork():loadHandwritingFont();
let dragDepth=0;
document.addEventListener('dragover',event=>event.preventDefault());
document.addEventListener('drop',event=>event.preventDefault());
$('drop-zone').addEventListener('dragenter',event=>{event.preventDefault();dragDepth++;$('drop-zone').classList.add('dragging');});
$('drop-zone').addEventListener('dragleave',()=>{dragDepth=Math.max(0,dragDepth-1);if(!dragDepth)$('drop-zone').classList.remove('dragging');});
$('drop-zone').addEventListener('dragover',event=>{event.preventDefault();event.dataTransfer.dropEffect='copy';});
$('drop-zone').addEventListener('drop',event=>{event.preventDefault();dragDepth=0;$('drop-zone').classList.remove('dragging');loadFile(event.dataTransfer.files[0]);});
sync();
void loadHandwritingFont();
void loadSignatureArtwork();
addEventListener('languagechange',()=>{
  language=browserLanguage();localizePage(document,language);sync();
  if(statusKey)$('status').textContent=t(statusKey);
});
// Optional browser agent integration shares the same settings and renderer.
if (document.modelContext?.registerTool) {
  const lifecycle=new AbortController();
  const tool={
    name:'configure_watermark',title:t('configureTool'),
    description:'Update the visible watermark settings and preview for the image already selected by the user. Does not upload or download an image.',
    inputSchema:{type:'object',properties:{trace:{type:'boolean',description:'Embed a recoverable Trace ID in the exported image. On by default. Does not track views or upload images.'},text:{type:'string',maxLength:100,description:'Custom watermark text. Empty uses Made by intqwq@X. The signature preset uses the supplied intqwq@X artwork; changing that text returns to handwriting.'},position:{type:'string',enum:['tl','tr','bl','br']},style:{type:'string',enum:['capsule','simple','serif','handwriting','signature-intqwq']},size:{type:'number',minimum:.5,maximum:10,multipleOf:.1},margin:{type:'number',minimum:0,maximum:10,multipleOf:.1,description:'Gap from the selected corner as a percentage of the shorter image side.'},opacity:{type:'number',minimum:10,maximum:100,multipleOf:5},color:{type:'string',enum:['light','dark']}},additionalProperties:false},
    annotations:{readOnlyHint:false,untrustedContentHint:false},
    async execute(input){
      if(pending)throw new Error(t('exporting'));
      if(!input || typeof input!=='object' || Array.isArray(input)) throw new Error('Expected a settings object.');
      for(const [key,value] of Object.entries(input)){
        if(!Object.hasOwn(defaults,key))throw new Error('Unknown setting.');
        if(key==='text' && (typeof value!=='string'||value.length>100))throw new Error('Text must be a string of up to 100 characters.');
        if(key==='trace' && typeof value!=='boolean')throw new Error('Trace ID must be a boolean.');
        if(['position','style','color'].includes(key) && !tool.inputSchema.properties[key].enum.includes(value))throw new Error('Invalid option.');
        if(Object.hasOwn(ranges,key)){
          const schema=ranges[key];
          if(typeof value!=='number'||!Number.isFinite(value)||value<schema.minimum||value>schema.maximum)throw new Error('Value outside allowed range.');
          const step=schema.step;if(Math.abs(value/step-Math.round(value/step))>1e-8)throw new Error('Invalid slider step.');
        }
      }
      const next={...settings,...input};
      const preset=SIGNATURE_PRESETS[next.style];
      if(preset){
        if(Object.hasOwn(input,'text') && input.text!==preset.text)next.style='handwriting';
        else next.text=preset.text;
      }
      if(SIGNATURE_PRESETS[next.style]){
        await loadSignatureArtwork();
        if(signatureStatus!=='ready')throw new Error(t('signatureError'));
      }else if(isHandwrittenStyle(next.style)){
        await loadHandwritingFont();
        if(fontStatus!=='ready')throw new Error(t('fontError'));
      }
      settings=next;sync();return {settings:{...settings},watermarkText:resolveWatermarkText(settings.text),imageLoaded:!!source};
    }
  };
  try {Promise.resolve(document.modelContext.registerTool(tool,{signal:lifecycle.signal})).catch(()=>{});}catch{}
  addEventListener('pagehide',()=>lifecycle.abort(),{once:true});
}
