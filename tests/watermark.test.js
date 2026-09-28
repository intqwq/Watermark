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
      for(const style of ['capsule','simple','serif','handwriting',...Object.keys(SIGNATURE_PRESETS)])
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

test('dedicated signatures draw original word glyphs rather than separate type characters',()=>{
  let drawn;
  const ctx={save(){},restore(){},fillText(text){drawn=text;},measureText(){return {width:120,actualBoundingBoxAscent:25,actualBoundingBoxDescent:8};}};
  for(const [style,preset] of Object.entries(SIGNATURE_PRESETS)){
    drawWatermark(ctx,1600,1000,{text:preset.text,style,position:'br',margin:0,size:2,opacity:90,color:'light'});
    assert.equal(drawn,preset.glyph);assert.ok(ctx.font.includes('Lumen Hand'));
  }
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
