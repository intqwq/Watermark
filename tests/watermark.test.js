import test from 'node:test';
import assert from 'node:assert/strict';
import {DEFAULT_WATERMARK, drawWatermark, resolveWatermarkText, SIGNATURE_PRESETS, isHandwrittenStyle} from '../dist/renderer.js';

test('empty input uses the default and custom input replaces it',()=>{
  assert.equal(DEFAULT_WATERMARK,'Made by intqwq@X');
  for(const input of ['', '   ', '\n\t', undefined]) assert.equal(resolveWatermarkText(input),DEFAULT_WATERMARK);
  assert.equal(resolveWatermarkText('My photo'),'My photo');
  assert.equal(resolveWatermarkText('  摄影师  '),'摄影师');
});

test('small type, zero gap and handwritten overhangs stay inside every corner',()=>{
  let ink;
  const ctx={save(){},restore(){},beginPath(){},roundRect(){},fill(){},stroke(){},fillText(text,x,y){const m=this.measureText(text);ink={left:x-m.actualBoundingBoxLeft,right:x+m.actualBoundingBoxRight,top:y-m.actualBoundingBoxAscent,bottom:y+m.actualBoundingBoxDescent};},measureText(text){const size=Number(this.font.match(/([\d.]+)px/)[1]);return {width:text.length*size*.6,actualBoundingBoxLeft:size*.25,actualBoundingBoxRight:text.length*size*.6+size*.3,actualBoundingBoxAscent:size*.8,actualBoundingBoxDescent:size*.25};}};
  for(const [width,height] of [[1600,1000],[300,1200],[32,16]])
    for(const position of ['tl','tr','bl','br'])
      for(const style of ['capsule','simple','serif','handwriting'])
        for(const size of [.5,1,4,10])
          for(const margin of [0,.1,1,10]){
            const box=drawWatermark(ctx,width,height,{text:'Made by intqwq@X / '+ 'w'.repeat(70),position,style,size,margin,opacity:90,color:'light'});
            assert.ok(ink.left>=-1e-6 && ink.top>=-1e-6 && ink.right<=width+1e-6 && ink.bottom<=height+1e-6,JSON.stringify({width,height,position,style,size,margin,ink}));
            if(isHandwrittenStyle(style) && margin===0){
              assert.ok(ctx.font.includes('Lumen Hand'));
              assert.ok(Math.abs(position.endsWith('r') ? width-box.x-box.width : box.x)<1e-6);
            }
          }
});

test('the supplied signature draws as an image in all corners, without font glyphs or padding',()=>{
  let drawn;
  const ctx={save(){},restore(){},drawImage(...args){drawn=args;},fillText(){assert.fail('Signature must not use font glyphs.');}};
  const signature={width:470,height:165,light:{id:'light ink'},dark:{id:'dark ink'}};
  assert.deepEqual(Object.keys(SIGNATURE_PRESETS),['signature-intqwq']);
  assert.equal(SIGNATURE_PRESETS['signature-intqwq'].text,'intqwq@X');
  for(const position of ['tl','tr','bl','br'])for(const size of [.5,4,10])for(const margin of [0,1,10])for(const color of ['light','dark']){
    const box=drawWatermark(ctx,1600,1000,{style:'signature-intqwq',position,margin,size,opacity:90,color},signature);
    assert.equal(drawn[0],signature[color]);
    assert.equal(box.height,size*10);assert.equal(box.width/box.height,470/165);
    assert.equal(box.x,position.endsWith('r')?1600-margin*10-box.width:margin*10);
    assert.equal(box.y,position.startsWith('b')?1000-margin*10-box.height:margin*10);
    assert.deepEqual(drawn.slice(1),[box.x,box.y,box.width,box.height]);
  }
  assert.throws(()=>drawWatermark(ctx,1600,1000,{style:'signature-intqwq',position:'br',size:4}),/not ready/);
});

test('edge spacing moves the same watermark closer without changing its size',()=>{
  const ctx={save(){},restore(){},fillText(){},measureText(text){return {width:80,actualBoundingBoxAscent:20,actualBoundingBoxDescent:5};}};
  const settings={text:'My photo',position:'br',style:'handwriting',size:2,opacity:90,color:'light'};
  const inset=drawWatermark(ctx,1000,800,{...settings,margin:3.5});
  const edge=drawWatermark(ctx,1000,800,{...settings,margin:0});
  assert.equal(edge.width,inset.width);assert.equal(edge.height,inset.height);
  assert.equal(edge.x-inset.x,28);assert.equal(edge.y-inset.y,28);
});

test('the shared preview/export renderer draws the resolved text in all corners',()=>{
  let drawn;
  const ctx={save(){},restore(){},beginPath(){},roundRect(){},fill(){},stroke(){},fillText(text){drawn=text;},measureText(text){const size=Number(this.font.match(/([\d.]+)px/)[1]);return {width:text.length*size*.6,actualBoundingBoxAscent:size*.8,actualBoundingBoxDescent:size*.2};}};
  for(const position of ['tl','tr','bl','br']) for(const text of ['', '   ', 'My photo']){
    const box=drawWatermark(ctx,1200,800,{text,position,style:'capsule',size:4,opacity:90,color:'light'});
    assert.equal(drawn,text.trim() || DEFAULT_WATERMARK);
    assert.ok(box.x>=0 && box.y>=0 && box.x+box.width<=1200 && box.y+box.height<=800);
  }
});

test('free positions use the same box for every style and keep complete ink within the image',()=>{
  const ctx={save(){},restore(){},beginPath(){},roundRect(){},fill(){},stroke(){},fillText(){},drawImage(){},measureText(text){const size=Number(this.font.match(/([\d.]+)px/)[1]);return {width:text.length*size*.6,actualBoundingBoxLeft:size*.2,actualBoundingBoxRight:text.length*size*.6,actualBoundingBoxAscent:size*.8,actualBoundingBoxDescent:size*.2};}};
  const signature={width:470,height:165,light:{},dark:{}};
  for(const style of ['capsule','simple','serif','handwriting','signature-intqwq'])for(const [width,height] of [[1600,1000],[120,1200],[25,16]]){
    for(const [freeX,freeY] of [[0,0],[1,1],[.5,.5],[.25,.72],[-2,4]]){
      const settings={text:'Made by intqwq@X',position:'free',freeX,freeY,style,size:4,margin:10,opacity:90,color:'light'};
      const box=drawWatermark(ctx,width,height,settings,signature);
      assert.ok(box.x>=0&&box.y>=0&&box.x+box.width<=width+1e-6&&box.y+box.height<=height+1e-6);
      if(freeX===.5&&freeY===.5){assert.ok(Math.abs(box.x+box.width/2-width/2)<1e-6);assert.ok(Math.abs(box.y+box.height/2-height/2)<1e-6);}
      assert.deepEqual(drawWatermark(ctx,width,height,{...settings,margin:0},signature),box,'corner margin does not constrain free placement');
    }
  }
});
