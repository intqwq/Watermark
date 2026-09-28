import test from 'node:test';
import assert from 'node:assert/strict';
import {createTraceId,crc32,embedTrace,detectTrace} from '../dist/trace-codec.js';
const ID='WM1-0123456789ABCDEF1029384756ABCDEF';
function fixture(width=512,height=512,seed=42){
  const data=new Uint8ClampedArray(width*height*4);let state=seed;
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){
    state=(Math.imul(state,1664525)+1013904223)>>>0;
    const p=(y*width+x)*4,n=(state>>>24)/12;
    data.set([40+x/width*130+n,35+y/height*150+n,90+Math.sin(x/23)*35+n,255],p);
  }
  return {width,height,data};
}
function crop(image,x,y,width,height){
  const data=new Uint8ClampedArray(width*height*4);
  for(let j=0;j<height;j++)data.set(image.data.subarray(((y+j)*image.width+x)*4,((y+j)*image.width+x+width)*4),j*width*4);
  return {width,height,data};
}
test('IDs use cryptographic randomness and a standard checksum',()=>{
  const a=createTraceId(),b=createTraceId();assert.match(a,/^WM1-[0-9A-F]{32}$/);assert.notEqual(a,b);
  assert.equal(crc32(new TextEncoder().encode('123456789')),0xcbf43926);
});
test('round-trip recovers the full 128-bit ID with low pixel distortion',()=>{
  const image=fixture(),original=image.data.slice();const embedded=embedTrace(image,ID);
  assert.equal(embedded.repetitions,16);assert.equal(detectTrace(image).id,ID);
  let mse=0;for(let i=0;i<original.length;i++){if(i%4===3)assert.equal(image.data[i],original[i]);else mse+=(image.data[i]-original[i])**2;}
  const psnr=10*Math.log10(255**2/(mse/(image.width*image.height*3)));assert.ok(psnr>43,psnr);
});
test('finds an ID after a crop with non-block-aligned offsets and a brightness change',()=>{
  const image=fixture();embedTrace(image,ID);
  assert.equal(detectTrace(crop(image,19,27,448,448)).id,ID);
  for(let i=0;i<image.data.length;i++)if(i%4!==3)image.data[i]=Math.round(image.data[i]*1.04);
  assert.equal(detectTrace(image).id,ID);
});
test('distributed copies survive a small opaque overlay',()=>{
  const image=fixture();embedTrace(image,ID);
  for(let y=150;y<210;y++)for(let x=200;x<260;x++)image.data.set([0,0,0,255],(y*image.width+x)*4);
  assert.equal(detectTrace(image).id,ID);
});
test('alpha and all transparent or translucent blocks remain unchanged',()=>{
  const image=fixture();
  for(let y=0;y<128;y++)for(let x=0;x<128;x++)image.data[(y*512+x)*4+3]=x%2?0:180;
  const before=image.data.slice();embedTrace(image,ID);
  for(let y=0;y<128;y++)for(let x=0;x<128;x++){
    const i=(y*512+x)*4;assert.deepEqual(image.data.subarray(i,i+4),before.subarray(i,i+4));
  }
  assert.equal(detectTrace(image).id,ID);
});
test('small images and insufficient opaque coverage fail explicitly',()=>{
  assert.throws(()=>embedTrace(fixture(200,512),ID),/traceTooSmall/);
  const transparent=fixture();for(let i=3;i<transparent.data.length;i+=4)transparent.data[i]=0;
  assert.throws(()=>embedTrace(transparent,ID),/traceCapacity/);
  assert.equal(detectTrace(transparent),null);
  assert.throws(()=>embedTrace(fixture(),'not-an-id'),/Invalid Trace ID/);
});
test('unmarked images do not yield invented IDs',()=>{
  for(let seed=0;seed<8;seed++)assert.equal(detectTrace(fixture(320,320,seed)),null);
  for(const gray of [0,128,255]){
    const image=fixture(256,256);for(let i=0;i<image.data.length;i+=4)image.data.set([gray,gray,gray,255],i);
    assert.equal(detectTrace(image),null);
    embedTrace(image,ID);assert.equal(detectTrace(image).id,ID);
  }
});
