import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {extractSignatureInk} from '../dist/signature.js';

test('signature preparation removes white paper and trims it while retaining antialiasing and transparency',()=>{
  const data=new Uint8ClampedArray(4*3*4).fill(255);
  data.set([0,0,0,255],(1*4+1)*4);
  data.set([128,128,128,255],(1*4+2)*4);
  data.set([0,0,0,0],(2*4+3)*4);
  const ink=extractSignatureInk({width:4,height:3,data});
  assert.deepEqual([ink.left,ink.top,ink.width,ink.height],[1,1,2,1]);
  assert.equal(ink.alpha[5],255);assert.equal(ink.alpha[6],127);
  assert.equal(ink.alpha[0],0);assert.equal(ink.alpha[11],0);
  assert.throws(()=>extractSignatureInk({width:1,height:1,data:new Uint8ClampedArray([255,255,255,255])}),/empty/);
});

test('style thumbnail uses an image canvas and the removed preset cannot appear in the UI',()=>{
  const html=readFileSync(new URL('../dist/index.html',import.meta.url),'utf8');
  assert.match(html,/<canvas id="signature-sample"/);
  assert.doesNotMatch(html,/&#xE00[01];|signature-shuyuanlv/);
  const source=readFileSync(new URL('../dist/app.js',import.meta.url),'utf8');
  assert.doesNotMatch(source,/signature-shuyuanlv/);
});
