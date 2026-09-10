import test from 'node:test';
import assert from 'node:assert/strict';
import {DEFAULT_WATERMARK, drawWatermark, resolveWatermarkText} from '../dist/renderer.js';

test('empty input uses the default and custom input replaces it',()=>{
  assert.equal(DEFAULT_WATERMARK,'Made by intqwq@X');
  for(const input of ['', '   ', '\n\t', undefined]) assert.equal(resolveWatermarkText(input),DEFAULT_WATERMARK);
  assert.equal(resolveWatermarkText('My photo'),'My photo');
  assert.equal(resolveWatermarkText('  摄影师  '),'摄影师');
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
