// Edits describe a view of the original bitmap; no intermediate resampling.
export const clamp=(n,low,high)=>Math.max(low,Math.min(high,n));
export function initialEdit(width,height){
  return {sourceWidth:width,sourceHeight:height,turns:0,crop:{x:0,y:0,width,height}};
}
export function rotateEdit(edit,delta){
  let result={...edit,crop:{...edit.crop}};
  for(let i=0;i<((delta%4)+4)%4;i++){
    const height=result.turns%2?result.sourceWidth:result.sourceHeight;
    const r=result.crop;
    result={...result,turns:(result.turns+1)%4,crop:{x:height-r.y-r.height,y:r.x,width:r.height,height:r.width}};
  }
  return result;
}
export function boundedRect(rect,width,height){
  const x=clamp(Math.round(rect.x),0,width-1),y=clamp(Math.round(rect.y),0,height-1);
  return {x,y,width:clamp(Math.round(rect.width),1,width-x),height:clamp(Math.round(rect.height),1,height-y)};
}
export function cropEdit(edit,selection){
  const r=boundedRect(selection,edit.crop.width,edit.crop.height);
  return {...edit,crop:{...r,x:r.x+edit.crop.x,y:r.y+edit.crop.y}};
}
export function selectionRect(start,end,width,height,ratio=0){
  const a={x:clamp(start.x,0,width),y:clamp(start.y,0,height)};
  const b={x:clamp(end.x,0,width),y:clamp(end.y,0,height)};
  let w=Math.abs(b.x-a.x),h=Math.abs(b.y-a.y);
  const sx=b.x<a.x?-1:1,sy=b.y<a.y?-1:1;
  if(ratio>0){
    w=Math.max(w,h*ratio);
    w=Math.min(w,sx<0?a.x:width-a.x,(sy<0?a.y:height-a.y)*ratio);
    h=w/ratio;
  }
  return boundedRect({x:sx<0?a.x-w:a.x,y:sy<0?a.y-h:a.y,width:w,height:h},width,height);
}
export function fitSelection(width,height,ratio=0){
  let w=width*.8,h=height*.8;
  if(ratio>0){w=Math.min(w,h*ratio);h=w/ratio;}
  return boundedRect({x:(width-w)/2,y:(height-h)/2,width:w,height:h},width,height);
}
export function moveSelection(rect,dx,dy,width,height){
  return {...rect,x:clamp(Math.round(rect.x+dx),0,width-rect.width),y:clamp(Math.round(rect.y+dy),0,height-rect.height)};
}
export function imagePoint(clientX,clientY,bounds,width,height){
  return {x:clamp((clientX-bounds.left)/bounds.width*width,0,width),y:clamp((clientY-bounds.top)/bounds.height*height,0,height)};
}
export function drawEditedImage(ctx,source,edit){
  ctx.save();
  ctx.beginPath();ctx.rect(0,0,edit.crop.width,edit.crop.height);ctx.clip();
  ctx.translate(-edit.crop.x,-edit.crop.y);
  if(edit.turns===1){ctx.translate(edit.sourceHeight,0);ctx.rotate(Math.PI/2);}
  if(edit.turns===2){ctx.translate(edit.sourceWidth,edit.sourceHeight);ctx.rotate(Math.PI);}
  if(edit.turns===3){ctx.translate(0,edit.sourceWidth);ctx.rotate(-Math.PI/2);}
  ctx.drawImage(source,0,0);ctx.restore();
}

// Only image bytes from a paste gesture are accepted, never remote HTML URLs.
export function pastedImage(clipboard,editingText=false){
  if(!clipboard || editingText&&clipboard.getData('text/plain'))return null;
  for(const item of Array.from(clipboard.items||[]))if(item.kind==='file'&&item.type.startsWith('image/'))return item.getAsFile();
  return Array.from(clipboard.files||[]).find(file=>file.type.startsWith('image/'))||null;
}
