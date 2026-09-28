import test from 'node:test';
import assert from 'node:assert/strict';
import {initialEdit,rotateEdit,cropEdit,selectionRect,fitSelection,moveSelection,imagePoint,drawEditedImage,pastedImage} from '../dist/image-edit.js';

// Tiny pixel grid interprets the renderer's Canvas transforms independently.
function pixels(source,edit){
  let m=[1,0,0,1,0,0],saved;
  const result=Array.from({length:edit.crop.height},()=>Array(edit.crop.width).fill('.'));
  const ctx={save(){saved=m.slice();},restore(){m=saved;},beginPath(){},rect(){},clip(){},
    translate(x,y){m[4]+=m[0]*x+m[2]*y;m[5]+=m[1]*x+m[3]*y;},
    rotate(angle){const c=Math.cos(angle),s=Math.sin(angle),[a,b,d,e]=m;m[0]=a*c+d*s;m[1]=b*c+e*s;m[2]=-a*s+d*c;m[3]=-b*s+e*c;},
    drawImage(){for(let y=0;y<source.length;y++)for(let x=0;x<source[0].length;x++){
      const dx=Math.floor(m[0]*(x+.5)+m[2]*(y+.5)+m[4]),dy=Math.floor(m[1]*(x+.5)+m[3]*(y+.5)+m[5]);
      if(dy>=0&&dy<result.length&&dx>=0&&dx<result[0].length)result[dy][dx]=source[y][x];
    }}
  };
  drawEditedImage(ctx,source,edit);return result.map(row=>row.join(''));
}
test('quarter-turns export exact pixel order without losing the original',()=>{
  const original=initialEdit(3,2),source=['abc','def'];
  assert.deepEqual(pixels(source,original),source);
  assert.deepEqual(pixels(source,rotateEdit(original,1)),['da','eb','fc']);
  assert.deepEqual(pixels(source,rotateEdit(original,-1)),['cf','be','ad']);
  assert.deepEqual(pixels(source,rotateEdit(original,2)),['fed','cba']);
  let edit=original;for(let i=0;i<4;i++)edit=rotateEdit(edit,1);
  assert.deepEqual(edit,original);assert.deepEqual(original.crop,{x:0,y:0,width:3,height:2});
});
test('multiple crops and rotations compose in current image coordinates',()=>{
  const source=['abc','def'],original=initialEdit(3,2);
  const cropped=cropEdit(original,{x:1,y:0,width:2,height:2});
  assert.deepEqual(pixels(source,cropped),['bc','ef']);
  const turned=rotateEdit(cropped,1);
  assert.deepEqual(pixels(source,turned),['eb','fc']);
  const second=cropEdit(turned,{x:0,y:0,width:2,height:1});
  assert.deepEqual(pixels(source,rotateEdit(second,-1)),['b','e']);
  assert.deepEqual(pixels(source,original),source);
});
test('reverse drags, ratios, clipping and selection moves stay in bounds',()=>{
  for(const ratio of [0,1,4/3,3/4,16/9,9/16]){
    for(const start of [{x:0,y:0},{x:400,y:300},{x:270,y:130}])for(const end of [{x:-200,y:-100},{x:1000,y:2000},{x:72,y:230}]){
      const r=selectionRect(start,end,400,300,ratio);
      assert.ok(r.x>=0&&r.y>=0&&r.width>=1&&r.height>=1&&r.x+r.width<=400&&r.y+r.height<=300);
      if(ratio&&r.width>2&&r.height>2)assert.ok(Math.abs(r.width-r.height*ratio)<=2);
    }
    const r=fitSelection(400,300,ratio),m=moveSelection(r,999,-999,400,300);
    assert.equal(m.x,400-r.width);assert.equal(m.y,0);assert.equal(m.width,r.width);
  }
  assert.deepEqual(selectionRect({x:300,y:200},{x:30,y:20},400,300),{x:30,y:20,width:270,height:180});
});
test('pointer coordinates use displayed bounds and clamp outside captured drags',()=>{
  const bounds={left:100,top:50,width:600,height:400};
  assert.deepEqual(imagePoint(400,250,bounds,3000,2000),{x:1500,y:1000});
  assert.deepEqual(imagePoint(-20,999,bounds,3000,2000),{x:0,y:2000});
});
test('pasting imports clipboard image bytes while preserving ordinary text paste',()=>{
  const image={name:'clipboard.png',type:'image/png'};
  const clipboard={items:[{kind:'file',type:'image/png',getAsFile:()=>image}],getData:()=>''};
  assert.equal(pastedImage(clipboard),image);
  assert.equal(pastedImage(clipboard,true),image);
  assert.equal(pastedImage({...clipboard,getData:()=>'My watermark'},true),null);
  assert.equal(pastedImage({items:[],files:[image],getData:()=>''}),image);
  assert.equal(pastedImage({items:[{kind:'string',type:'text/html'}],getData:()=>'<img src="https://example.com/private.png">'}),null);
});
