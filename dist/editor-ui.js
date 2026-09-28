import {initialEdit,rotateEdit,cropEdit,boundedRect,selectionRect,fitSelection,moveSelection,imagePoint,clamp} from './image-edit.js?v=cf3e5289fca1';
const $=id=>document.getElementById(id);
const inside=(p,r,pad=0)=>p.x>=r.x-pad&&p.x<=r.x+r.width+pad&&p.y>=r.y-pad&&p.y<=r.y+r.height+pad;

export function createImageEditor({canvas,t,onChange,onGeometry,onMove}){
  let edit=null,history=[],selection=null,gesture=null,locked=false,watermark=null;
  const size=()=>({width:edit?.crop.width||0,height:edit?.crop.height||0});
  const ratio=()=>$('crop-ratio').value==='original'?size().width/size().height:Number($('crop-ratio').value);
  function stopGesture(){
    if(gesture&&canvas.hasPointerCapture(gesture.id))canvas.releasePointerCapture(gesture.id);
    gesture=null;canvas.classList.remove('dragging-watermark');
  }
  function commit(next){
    if(JSON.stringify(next)!==JSON.stringify(edit)){history.push(edit);edit=next;}
    selection=null;stopGesture();onGeometry();onChange();
  }
  function sync(){
    const {width,height}=size();
    $('edit-toolbar').hidden=!edit;$('crop-controls').hidden=!selection;
    $('crop-toggle').setAttribute('aria-pressed',String(!!selection));
    for(const id of ['crop-toggle','rotate-left','rotate-right','edit-undo','edit-restore'])$(id).disabled=locked||!edit||!!selection;
    $('crop-toggle').disabled=locked||!edit;
    $('edit-undo').disabled=locked||!history.length||!!selection;
    $('edit-restore').disabled=locked||!edit||!!selection||JSON.stringify(edit)===JSON.stringify(initialEdit(edit.sourceWidth,edit.sourceHeight));
    $('crop-controls').querySelectorAll('button,input,select').forEach(node=>node.disabled=locked);
    canvas.classList.toggle('cropping',!!selection);
    canvas.setAttribute('aria-busy',String(locked));
    if(selection){
      for(const key of ['x','y','width','height'])$('crop-'+key).value=selection[key];
      $('crop-x').max=width-1;$('crop-y').max=height-1;
      $('crop-width').max=width-selection.x;$('crop-height').max=height-selection.y;
      $('crop-size').textContent=selection.width+' × '+selection.height+' px';
    }
    $('canvas-help').textContent=t(selection?'cropHelp':'dragHelp');
  }
  function cancelCrop(){selection=null;stopGesture();onChange();}
  function applyCrop(){if(selection&&!locked)commit(cropEdit(edit,selection));}
  $('crop-toggle').onclick=()=>{if(!edit||locked)return;if(selection){cancelCrop();return;}selection=fitSelection(size().width,size().height,ratio());onChange();canvas.focus({preventScroll:true});};
  $('crop-cancel').onclick=cancelCrop;$('crop-apply').onclick=applyCrop;
  $('rotate-left').onclick=()=>{if(edit&&!locked&&!selection)commit(rotateEdit(edit,-1));};
  $('rotate-right').onclick=()=>{if(edit&&!locked&&!selection)commit(rotateEdit(edit,1));};
  $('edit-undo').onclick=()=>{if(locked||selection||!history.length)return;edit=history.pop();stopGesture();onGeometry();onChange();};
  $('edit-restore').onclick=()=>{if(edit&&!locked&&!selection)commit(initialEdit(edit.sourceWidth,edit.sourceHeight));};
  $('crop-ratio').onchange=()=>{if(selection){selection=fitSelection(size().width,size().height,ratio());onChange();}};
  for(const key of ['x','y','width','height'])$('crop-'+key).onchange=event=>{
    if(!selection||locked)return;
    const value=event.target.valueAsNumber;
    if(Number.isFinite(value)){
      // Exact pixel dimensions take precedence over an aspect-ratio preset.
      if(key==='width'||key==='height')$('crop-ratio').value='0';
      const next={...selection,[key]:value};
      if(key==='x'||key==='y')selection=moveSelection(selection,key==='x'?value-selection.x:0,key==='y'?value-selection.y:0,size().width,size().height);
      else selection=boundedRect(next,size().width,size().height);
    }
    onChange();
  };
  function corners(r){return [{x:r.x,y:r.y},{x:r.x+r.width,y:r.y},{x:r.x+r.width,y:r.y+r.height},{x:r.x,y:r.y+r.height}];}
  function point(event){return imagePoint(event.clientX,event.clientY,canvas.getBoundingClientRect(),size().width,size().height);}
  function tolerance(){return 12*size().width/Math.max(1,canvas.getBoundingClientRect().width);}
  canvas.addEventListener('pointerdown',event=>{
    if(locked||!edit||event.button!==0||gesture)return;
    const p=point(event),pad=tolerance();
    if(selection){
      const handles=corners(selection),corner=handles.findIndex(c=>Math.abs(p.x-c.x)<pad&&Math.abs(p.y-c.y)<pad);
      gesture=corner>=0?{kind:'resize',anchor:handles[(corner+2)%4]}:inside(p,selection)?{kind:'crop-move',start:p,rect:{...selection}}:{kind:'resize',anchor:p};
    }else if(watermark&&inside(p,watermark,pad)){
      gesture={kind:'watermark',offset:{x:p.x-watermark.x,y:p.y-watermark.y},box:{...watermark}};
      canvas.classList.add('dragging-watermark');
    }else return;
    gesture.id=event.pointerId;gesture.previousSelection=selection&&{...selection};
    canvas.setPointerCapture(event.pointerId);canvas.focus({preventScroll:true});event.preventDefault();
  });
  canvas.addEventListener('pointermove',event=>{
    if(locked||!edit)return;
    const p=point(event),{width,height}=size();
    if(!gesture){canvas.classList.toggle('over-watermark',!!watermark&&!selection&&inside(p,watermark,tolerance()));return;}
    if(event.pointerId!==gesture.id)return;
    if(gesture.kind==='watermark'){
      const b=gesture.box;
      onMove(clamp(p.x-gesture.offset.x+b.width/2,b.width/2,width-b.width/2)/width,clamp(p.y-gesture.offset.y+b.height/2,b.height/2,height-b.height/2)/height);
    }else{
      selection=gesture.kind==='resize'?selectionRect(gesture.anchor,p,width,height,ratio()):moveSelection(gesture.rect,p.x-gesture.start.x,p.y-gesture.start.y,width,height);
      onChange();
    }
    event.preventDefault();
  });
  canvas.addEventListener('pointerup',event=>{if(gesture?.id===event.pointerId){stopGesture();onChange();}});
  canvas.addEventListener('pointercancel',event=>{if(gesture?.id===event.pointerId){if(gesture.previousSelection)selection=gesture.previousSelection;stopGesture();onChange();}});
  canvas.addEventListener('lostpointercapture',()=>{if(gesture){gesture=null;canvas.classList.remove('dragging-watermark');onChange();}});
  canvas.addEventListener('keydown',event=>{
    if(locked||!edit)return;
    if(selection&&event.key==='Escape'){event.preventDefault();cancelCrop();return;}
    if(selection&&event.key==='Enter'){event.preventDefault();applyCrop();return;}
    const direction={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]}[event.key];
    if(!direction||event.metaKey||event.ctrlKey||event.altKey)return;
    event.preventDefault();const step=event.shiftKey?10:1,{width,height}=size();
    if(selection){selection=moveSelection(selection,direction[0]*step,direction[1]*step,width,height);onChange();}
    else if(watermark)onMove((watermark.x+watermark.width/2+direction[0]*step)/width,(watermark.y+watermark.height/2+direction[1]*step)/height);
  });
  canvas.addEventListener('focus',()=>onChange());canvas.addEventListener('blur',()=>onChange());
  return {
    get edit(){return edit;},get cropping(){return !!selection;},get bounds(){return watermark;},
    load(width,height){stopGesture();edit=initialEdit(width,height);history=[];selection=null;watermark=null;$('crop-ratio').value='0';},
    sync(state){locked=state.pending;sync();},
    overlay(ctx,bounds){
      watermark=bounds;
      const {width,height}=size(),unit=width/Math.max(1,canvas.getBoundingClientRect().width);
      ctx.save();ctx.lineWidth=unit*1.5;
      if(selection){
        const r=selection;ctx.fillStyle='rgba(12,15,28,.58)';
        ctx.fillRect(0,0,width,r.y);ctx.fillRect(0,r.y+r.height,width,height-r.y-r.height);
        ctx.fillRect(0,r.y,r.x,r.height);ctx.fillRect(r.x+r.width,r.y,width-r.x-r.width,r.height);
        ctx.strokeStyle='#fff';ctx.strokeRect(r.x,r.y,r.width,r.height);
        ctx.strokeStyle='rgba(255,255,255,.5)';ctx.lineWidth=unit*.75;ctx.beginPath();
        for(let i=1;i<3;i++){ctx.moveTo(r.x+r.width*i/3,r.y);ctx.lineTo(r.x+r.width*i/3,r.y+r.height);ctx.moveTo(r.x,r.y+r.height*i/3);ctx.lineTo(r.x+r.width,r.y+r.height*i/3);}ctx.stroke();
        ctx.fillStyle='#fff';for(const c of corners(r))ctx.fillRect(c.x-unit*4,c.y-unit*4,unit*8,unit*8);
      }else if(bounds&&document.activeElement===canvas){
        ctx.strokeStyle='#a79dff';ctx.setLineDash([4*unit,3*unit]);ctx.strokeRect(bounds.x-unit*3,bounds.y-unit*3,bounds.width+unit*6,bounds.height+unit*6);
      }
      ctx.restore();
    },
  };
}
