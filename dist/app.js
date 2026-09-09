import {drawWatermark} from './renderer.js';
import {browserLanguage, localizePage, translate} from './i18n.js';
let language=browserLanguage();
const t=key=>translate(key,language);
localizePage(document,language);
const $ = id => document.getElementById(id);
const defaults = {text:'Made by inline_int@X',position:'br',style:'capsule',size:4,opacity:90,color:'light'};
let settings = {...defaults}, source = null, filename = '', pending = false, loadId = 0, messageTimer;
const canvas = $('preview'), ctx = canvas.getContext('2d');
let statusKey='';
function notify(key) { statusKey=key;$('status').textContent=t(key);clearTimeout(messageTimer);messageTimer=setTimeout(()=>{statusKey='';$('status').textContent='';},5500); }
function sync() {
  $('image-info').textContent=source ? `${source.width} × ${source.height} px` : t('waiting');
  $('preview-note').textContent=t(source?'previewLoaded':'previewEmpty');
  $('watermark').value=settings.text; $('char-count').textContent=`${settings.text.length} / 100`;
  for (const name of ['size','opacity']) {$(name).value=settings[name];$(name+'-value').textContent=settings[name]+'%';}
  for (const name of ['position','style','color']) document.querySelectorAll(`[data-${name}]`).forEach(button=>button.setAttribute('aria-pressed',String(button.dataset[name]===settings[name])));
  $('download').disabled=!source || !settings.text.trim() || pending;
  render();
}
function render() {
  if (!source) return;
  const scale=Math.min(1,1800/Math.max(source.width,source.height));
  canvas.width=Math.max(1,Math.round(source.width*scale));canvas.height=Math.max(1,Math.round(source.height*scale));
  ctx.clearRect(0,0,canvas.width,canvas.height);
  // Render in source coordinates so preview and export use exactly the same layout.
  ctx.save();ctx.scale(canvas.width/source.width,canvas.height/source.height);
  ctx.drawImage(source,0,0);drawWatermark(ctx,source.width,source.height,settings);ctx.restore();
}
async function loadFile(file) {
  if(!file) return;
  if(!['image/jpeg','image/png','image/webp'].includes(file.type)) return notify('invalidType');
  if(file.size>30*1024*1024) return notify('tooLarge');
  const request=++loadId;
  let bitmap;
  try {
    bitmap=await createImageBitmap(file,{imageOrientation:'from-image'});
    if(request!==loadId){bitmap.close();return;}
    if(bitmap.width*bitmap.height>40000000 || Math.max(bitmap.width,bitmap.height)>16384){bitmap.close();return notify('tooManyPixels');}
    source?.close();source=bitmap;filename=file.name;
    $('empty-state').hidden=true;canvas.hidden=false;$('replace').hidden=false;
    $('image-info').title=filename;
    sync();notify('loaded');
  } catch {bitmap?.close();if(request===loadId) notify('readError');}
}
async function download() {
  if(!source || !settings.text.trim() || pending) return;
  pending=true;sync();
  const exportName=filename.replace(/\.[^.]+$/,'')+'-watermarked.png';
  let output;
  try {
    output=document.createElement('canvas');output.width=source.width;output.height=source.height;
    const out=output.getContext('2d');if(!out) throw new Error('canvas');
    out.drawImage(source,0,0);drawWatermark(out,output.width,output.height,settings);
    const blob=await new Promise(resolve=>output.toBlob(resolve,'image/png'));
    if(!blob) throw new Error('export');
    const url=URL.createObjectURL(blob),link=document.createElement('a');
    link.href=url;link.download=exportName;
    document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);
    notify('downloaded');
  } catch {notify('exportError');}
  finally {if(output){output.width=0;output.height=0;}pending=false;sync();}
}
$('upload').onclick=$('replace').onclick=()=>$('file-input').click();
$('file-input').addEventListener('change',event=>{loadFile(event.target.files[0]);event.target.value='';});
$('watermark').addEventListener('input',event=>{settings.text=event.target.value;sync();});
for(const name of ['size','opacity']) $(name).addEventListener('input',event=>{settings[name]=Number(event.target.value);sync();});
for(const name of ['position','style','color']) document.querySelectorAll(`[data-${name}]`).forEach(button=>button.onclick=()=>{settings[name]=button.dataset[name];sync();});
$('reset').onclick=()=>{settings={...defaults};sync();notify('resetDone');};
$('download').onclick=download;
let dragDepth=0;
document.addEventListener('dragover',event=>event.preventDefault());
document.addEventListener('drop',event=>event.preventDefault());
$('drop-zone').addEventListener('dragenter',event=>{event.preventDefault();dragDepth++;$('drop-zone').classList.add('dragging');});
$('drop-zone').addEventListener('dragleave',()=>{dragDepth=Math.max(0,dragDepth-1);if(!dragDepth)$('drop-zone').classList.remove('dragging');});
$('drop-zone').addEventListener('dragover',event=>{event.preventDefault();event.dataTransfer.dropEffect='copy';});
$('drop-zone').addEventListener('drop',event=>{event.preventDefault();dragDepth=0;$('drop-zone').classList.remove('dragging');loadFile(event.dataTransfer.files[0]);});
sync();
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
    inputSchema:{type:'object',properties:{text:{type:'string',minLength:1,maxLength:100},position:{type:'string',enum:['tl','tr','bl','br']},style:{type:'string',enum:['capsule','simple','serif']},size:{type:'number',minimum:2,maximum:10},opacity:{type:'number',minimum:10,maximum:100},color:{type:'string',enum:['light','dark']}},additionalProperties:false},
    annotations:{readOnlyHint:false,untrustedContentHint:false},
    execute(input){
      if(!input || typeof input!=='object' || Array.isArray(input)) throw new Error('Expected a settings object.');
      for(const [key,value] of Object.entries(input)){
        if(!Object.hasOwn(defaults,key))throw new Error('Unknown setting.');
        if(key==='text' && (typeof value!=='string'||!value.trim()||value.length>100))throw new Error('Text must contain 1 to 100 characters.');
        if(['position','style','color'].includes(key) && !tool.inputSchema.properties[key].enum.includes(value))throw new Error('Invalid option.');
        if(['size','opacity'].includes(key)){
          const schema=tool.inputSchema.properties[key];
          if(typeof value!=='number'||!Number.isFinite(value)||value<schema.minimum||value>schema.maximum)throw new Error('Value outside allowed range.');
          const step=key==='size'?.5:5;if(Math.abs(value/step-Math.round(value/step))>1e-8)throw new Error('Invalid slider step.');
        }
      }
      settings={...settings,...input};sync();return {settings:{...settings},imageLoaded:!!source};
    }
  };
  try {Promise.resolve(document.modelContext.registerTool(tool,{signal:lifecycle.signal})).catch(()=>{});}catch{}
  addEventListener('pagehide',()=>lifecycle.abort(),{once:true});
}
