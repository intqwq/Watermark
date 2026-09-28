// Keep the supplied artwork unchanged on disk. Remove its white paper only
// when preparing the transparent watermark, preserving antialiased ink edges.
export function extractSignatureInk({width,height,data}) {
  const alpha=new Uint8ClampedArray(width*height);
  let left=width,top=height,right=-1,bottom=-1;
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){
    const p=y*width+x,i=p*4;
    const shade=Math.round(.2126*data[i]+.7152*data[i+1]+.0722*data[i+2]);
    const coverage=Math.round((255-shade)*data[i+3]/255);
    alpha[p]=coverage;
    if(coverage){left=Math.min(left,x);top=Math.min(top,y);right=Math.max(right,x);bottom=Math.max(bottom,y);}
  }
  if(right<left)throw new Error('Signature artwork is empty.');
  return {alpha,left,top,width:right-left+1,height:bottom-top+1,sourceWidth:width};
}

export async function loadSignature(url) {
  const image=new Image();image.src=url;await image.decode();
  const paper=document.createElement('canvas');
  paper.width=image.naturalWidth;paper.height=image.naturalHeight;
  const context=paper.getContext('2d',{willReadFrequently:true});
  context.drawImage(image,0,0);
  const ink=extractSignatureInk(context.getImageData(0,0,paper.width,paper.height));
  const variants={width:ink.width,height:ink.height};
  for(const [name,rgb] of [['light',[255,255,255]],['dark',[35,37,49]]]){
    const canvas=document.createElement('canvas');canvas.width=ink.width;canvas.height=ink.height;
    const ctx=canvas.getContext('2d'),pixels=ctx.createImageData(ink.width,ink.height);
    for(let y=0;y<ink.height;y++)for(let x=0;x<ink.width;x++){
      const i=(y*ink.width+x)*4;
      pixels.data.set(rgb,i);pixels.data[i+3]=ink.alpha[(y+ink.top)*ink.sourceWidth+x+ink.left];
    }
    ctx.putImageData(pixels,0,0);variants[name]=canvas;
  }
  paper.width=paper.height=0;
  return variants;
}
