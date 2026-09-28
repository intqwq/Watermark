// Trace ID v1. An original, public, blind image watermark, not Google SynthID.
// Repeated 16x16 tiles of 8x8 luminance blocks carry a checksummed 128-bit ID.
export const TRACE_VERSION='trace-id-v1';
const STEP=24,TILE=16,BITS=256;
const MAGIC=new Uint8Array([87,77,83,73,68,48,48,49]); // WMSID001
const A=new Float64Array(64),B=new Float64Array(64);
for(let y=0;y<8;y++)for(let x=0;x<8;x++){
  A[y*8+x]=.25*Math.cos((2*x+1)*2*Math.PI/16)*Math.cos((2*y+1)*Math.PI/16);
  B[y*8+x]=.25*Math.cos((2*x+1)*Math.PI/16)*Math.cos((2*y+1)*2*Math.PI/16);
}
export function crc32(bytes){
  let crc=0xffffffff;
  for(const byte of bytes){crc^=byte;for(let i=0;i<8;i++)crc=(crc>>>1)^((crc&1)?0xedb88320:0);}
  return (crc^0xffffffff)>>>0;
}
export function createTraceId(random=globalThis.crypto){
  const bytes=new Uint8Array(16);random.getRandomValues(bytes);
  return 'WM1-'+Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('').toUpperCase();
}
function frameFor(id){
  if(!/^WM1-[0-9A-F]{32}$/i.test(id))throw new Error('Invalid Trace ID.');
  const frame=new Uint8Array(32);frame.set(MAGIC);
  frame.set(id.slice(4).match(/../g).map(b=>parseInt(b,16)),8);
  new DataView(frame.buffer).setUint32(24,crc32(frame.subarray(0,24)));
  frame.set([84,82,67,49],28); // TRC1
  return frame;
}
function parseFrame(frame){
  if(!MAGIC.every((n,i)=>frame[i]===n)||!([84,82,67,49].every((n,i)=>frame[28+i]===n)))return null;
  if(new DataView(frame.buffer).getUint32(24)!==crc32(frame.subarray(0,24)))return null;
  return 'WM1-'+Array.from(frame.subarray(8,24),n=>n.toString(16).padStart(2,'0')).join('').toUpperCase();
}
function validateImage(image){
  if(!Number.isInteger(image.width)||!Number.isInteger(image.height)||image.width<1||image.height<1||image.width*image.height>40000000||image.data.length!==image.width*image.height*4)throw new Error('Invalid image buffer.');
}
function coefficients(data,width,x,y){
  let ca=0,cb=0;
  for(let j=0,k=0;j<8;j++)for(let i=0;i<8;i++,k++){
    const p=((y+j)*width+x+i)*4;
    if(data[p+3]!==255)return null; // Never alter transparent or translucent pixels.
    const l=.299*data[p]+.587*data[p+1]+.114*data[p+2];
    ca+=l*A[k];cb+=l*B[k];
  }
  return [ca,cb];
}
const bitFor=(x,y)=>(((y%TILE)*TILE+x%TILE)*73+19)%BITS;
export function embedTrace(image,id){
  validateImage(image);
  if(image.width<256||image.height<256)throw new Error('traceTooSmall');
  const frame=frameFor(id),counts=new Uint32Array(BITS),data=image.data;
  for(let y=0,by=0;y+8<=image.height;y+=8,by++)for(let x=0,bx=0;x+8<=image.width;x+=8,bx++){
    let pair=coefficients(data,image.width,x,y);if(!pair)continue;
    const bit=bitFor(bx,by),value=(frame[bit>>3]>>(7-(bit%8)))&1;
    const target=(Math.round(((pair[0]-pair[1])/STEP-value)/2)*2+value)*STEP;
    // Correct once more after clipping/rounding, so near-black/white blocks
    // can still carry a bit. RGB gets the same delta; alpha is never changed.
    for(let pass=0;pass<3;pass++){
      if(pass)pair=coefficients(data,image.width,x,y);
      const delta=(target-pair[0]+pair[1])/2;
      if(Math.abs(delta)<.3)break;
      for(let j=0,k=0;j<8;j++)for(let i=0;i<8;i++,k++){
        const p=((y+j)*image.width+x+i)*4,change=delta*(A[k]-B[k]);
        for(let c=0;c<3;c++)data[p+c]=Math.max(0,Math.min(255,Math.round(data[p+c]+change)));
      }
    }
    counts[bit]++;
  }
  if(Math.min(...counts)<4)throw new Error('traceCapacity');
  const checked=detectAtGrid(image,0,0,false);
  if(checked?.id!==id.toUpperCase())throw new Error('traceEmbedFailed');
  return {id:id.toUpperCase(),version:TRACE_VERSION,repetitions:Math.min(...counts)};
}

function detectAtGrid(image,ox,oy,searchPhase){
  const votes=new Float64Array(BITS),counts=new Uint32Array(BITS);
  // Bound detection work on very large images while sampling all their regions.
  const blocksX=Math.floor((image.width-ox)/8),blocksY=Math.floor((image.height-oy)/8);
  const tileStride=Math.max(1,Math.ceil(Math.sqrt(blocksX*blocksY/16384)));
  for(let by=0;by<blocksY;by++)for(let bx=0;bx<blocksX;bx++){
    if(Math.floor(bx/16)%tileStride||Math.floor(by/16)%tileStride)continue;
    const pair=coefficients(image.data,image.width,ox+bx*8,oy+by*8);if(!pair)continue;
    const slot=(by%16)*16+bx%16;
    votes[slot]+=Math.cos(Math.PI*(pair[0]-pair[1])/STEP);counts[slot]++;
  }
  for(let dy=0;dy<(searchPhase?16:1);dy++)for(let dx=0;dx<(searchPhase?16:1);dx++){
    const frame=new Uint8Array(32);let confidence=0,minimum=Infinity;
    for(let y=0;y<16;y++)for(let x=0;x<16;x++){
      const slot=y*16+x,bit=bitFor(x+dx,y+dy);
      if(votes[slot]<0)frame[bit>>3]|=1<<(7-bit%8);
      minimum=Math.min(minimum,counts[slot]);
      confidence+=Math.abs(votes[slot])/Math.max(1,counts[slot]);
    }
    if(minimum<2)continue;
    const id=parseFrame(frame);
    if(id)return {id,version:TRACE_VERSION,signal:confidence/256,repetitions:minimum};
  }
  return null;
}
export function detectTrace(image,{searchCrop=true}={}){
  validateImage(image);
  if(image.width<128||image.height<128)return null;
  const aligned=detectAtGrid(image,0,0,searchCrop);if(aligned)return aligned;
  if(searchCrop)for(let y=0;y<8;y++)for(let x=0;x<8;x++){
    if(x===0&&y===0)continue;
    const result=detectAtGrid(image,x,y,true);if(result)return result;
  }
  return null;
}
