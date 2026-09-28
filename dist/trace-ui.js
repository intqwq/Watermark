import {createTraceId,TRACE_VERSION} from './trace-codec.js?v=c9339be02f85';
const REGISTRY='watermark-studio-trace-records-v1';
const $=id=>document.getElementById(id);
const knownErrors=new Set(['traceTooSmall','traceCapacity','traceEmbedFailed']);
function runWorker(operation,image,id){
  return new Promise((resolve,reject)=>{
    const worker=new Worker(new URL('./trace-worker.js?v=f1faf0434b6b',import.meta.url),{type:'module'});
    const finish=()=>{clearTimeout(timer);worker.terminate();};
    const timer=setTimeout(()=>{finish();reject(new Error('traceTimeout'));},90000);
    worker.onmessage=({data})=>{finish();data.error?reject(new Error(knownErrors.has(data.error)?data.error:'traceProcessingError')):resolve(data);};
    worker.onerror=()=>{finish();reject(new Error('traceProcessingError'));};
    worker.postMessage({operation,width:image.width,height:image.height,buffer:image.data.buffer,id},[image.data.buffer]);
  });
}
async function sha256(blob){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',await blob.arrayBuffer())),b=>b.toString(16).padStart(2,'0')).join('');}
function records(){try{const data=JSON.parse(localStorage.getItem(REGISTRY)||'[]');return Array.isArray(data)?data.filter(r=>r&&typeof r.id==='string'&&typeof r.createdAt==='string'&&typeof r.filename==='string'):[];}catch{return [];}}
function saveRecord(record){try{const saved=records();if(!saved.some(r=>r.sha256===record.sha256))saved.push(record);localStorage.setItem(REGISTRY,JSON.stringify(saved));return true;}catch{return false;}}
function downloadBlob(blob,name){
  const url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=name;document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);
}

export function createTraceUI(t){
  let image=null,lastRecord=null,stored=true,enabled=true,pending=false,checking=false,result=null;
  function sync(){
    $('trace-identity').hidden=!enabled||!image;
    $('trace-id').value=image?.id||'';
    $('trace-copy').disabled=!image||pending;
    $('trace-record').disabled=!lastRecord||pending;
    $('trace-check').disabled=checking||pending;
    $('trace-record-note').textContent=lastRecord?t(stored?'traceSaved':'traceStorageUnavailable'):'';
    $('trace-status').textContent=!enabled?t('traceOff'):image&&(image.width<256||image.height<256)?t('traceTooSmall'):t(image?'traceReady':'traceDefault');
    $('trace-check-result').setAttribute('aria-busy',String(checking));
    if(checking){$('trace-check-result').textContent=t('traceChecking');return;}
    if(!result){$('trace-check-result').textContent=t('traceCheckHint');return;}
    const area=$('trace-check-result');area.replaceChildren();
    const title=document.createElement('strong');title.textContent=t(result.error|| (result.found?'traceFound':'traceNotFound'));area.append(title);
    if(result.found){
      const code=document.createElement('code');code.textContent=result.found.id;area.append(code);
      const note=document.createElement('p');note.textContent=t(result.local?'traceLocalMatch':'traceUnknownRecord');area.append(note);
      if(result.local){const detail=document.createElement('p');detail.textContent=result.local.filename+' · '+new Date(result.local.createdAt).toLocaleString();area.append(detail);}
    }
  }
  $('trace-copy').onclick=async()=>{if(image)try{await navigator.clipboard.writeText(image.id);$('trace-status').textContent=t('traceCopied');}catch{$('trace-id').focus();$('trace-id').select();}};
  $('trace-record').onclick=()=>{if(lastRecord)downloadBlob(new Blob([JSON.stringify(lastRecord,null,2)+'\n'],{type:'application/json'}),lastRecord.id+'-record.json');};
  $('trace-check').onclick=()=>$('trace-check-input').click();
  $('trace-check-input').onchange=async event=>{
    const file=event.target.files[0];event.target.value='';if(!file||checking||pending)return;
    checking=true;result=null;sync();let bitmap,canvas;
    try{
      if(!['image/png','image/jpeg','image/webp'].includes(file.type))throw new Error('invalidType');
      if(file.size>200*1024*1024)throw new Error('traceCheckTooLarge');
      bitmap=await createImageBitmap(file,{imageOrientation:'from-image'});
      if(bitmap.width*bitmap.height>40000000||Math.max(bitmap.width,bitmap.height)>16384)throw new Error('tooManyPixels');
      canvas=document.createElement('canvas');canvas.width=bitmap.width;canvas.height=bitmap.height;
      const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(bitmap,0,0);bitmap.close();bitmap=null;
      const pixels=ctx.getImageData(0,0,canvas.width,canvas.height);canvas.width=canvas.height=0;
      const {result:found}=await runWorker('detect',pixels);
      result={found,local:found?records().findLast(r=>r.id===found.id):null};
    }catch(error){result={error:['invalidType','traceCheckTooLarge','tooManyPixels','traceTimeout','traceProcessingError'].includes(error.message)?error.message:'readError'};}
    finally{bitmap?.close();if(canvas)canvas.width=canvas.height=0;checking=false;sync();}
  };
  return {
    newImage(name,width,height){image={id:createTraceId(),name,width,height};lastRecord=null;sync();},
    sync(state){enabled=state.enabled;pending=state.pending;sync();},
    canExport(){return !enabled||image&&image.width>=256&&image.height>=256;},
    async embed(ctx,width,height){
      const identity={...image};
      const {buffer,result:embedding}=await runWorker('embed',ctx.getImageData(0,0,width,height),identity.id);
      ctx.putImageData(new ImageData(new Uint8ClampedArray(buffer),width,height),0,0);
      return {...identity,embedding};
    },
    async record(blob,identity,name,visibleText){
      const record={format:TRACE_VERSION,id:identity.id,filename:name,sourceName:identity.name,width:identity.width,height:identity.height,visibleText,createdAt:new Date().toISOString(),sha256:await sha256(blob),note:'Recoverable identifier, not proof of ownership or authenticity. Keep this record separately from the image.'};
      stored=saveRecord(record);lastRecord=record;sync();return record;
    },
  };
}
