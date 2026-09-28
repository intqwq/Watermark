import test from 'node:test';
import assert from 'node:assert/strict';
import {createImageEditor} from '../dist/editor-ui.js';

// Event-level controller tests use small DOM doubles, not a browser.
function harness(){
  const nodes=new Map();
  class Control extends EventTarget{
    constructor(id){super();this.id=id;this.value='0';this.attrs={};this.classes=new Set();this.classList={add:n=>this.classes.add(n),remove:n=>this.classes.delete(n),toggle:(n,on)=>on?this.classes.add(n):this.classes.delete(n)};}
    setAttribute(k,v){this.attrs[k]=v;}
    querySelectorAll(){return [];}
    getBoundingClientRect(){return {left:100,top:50,width:500,height:250};}
    focus(){document.activeElement=this;this.dispatchEvent(new Event('focus'));}
    hasPointerCapture(id){return this.pointer===id;}
    setPointerCapture(id){this.pointer=id;}
    releasePointerCapture(){this.pointer=null;}
  }
  const get=id=>{if(!nodes.has(id))nodes.set(id,new Control(id));return nodes.get(id);};
  globalThis.document={getElementById:get,activeElement:null};
  const canvas=get('preview'),moves=[],geometry=[];
  let editor;const sync=()=>editor.sync({pending:false});
  editor=createImageEditor({canvas,t:key=>key,onChange:sync,onGeometry:()=>geometry.push({...editor.edit.crop}),onMove:(x,y)=>moves.push({x,y})});
  const fire=(type,props={})=>canvas.dispatchEvent(Object.assign(new Event(type,{cancelable:true}),{pointerId:1,button:0,...props}));
  const overlay={save(){},restore(){},setLineDash(){},strokeRect(){}};
  editor.load(1000,500);sync();
  return {editor,canvas,get,moves,geometry,fire,overlay};
}
test('crop can be cancelled or committed, then undone and restored without raster copies',()=>{
  const {editor,get,geometry,fire}=harness();
  get('crop-toggle').onclick();assert.equal(editor.cropping,true);
  assert.equal(get('rotate-left').disabled,true);
  fire('keydown',{key:'Escape'});assert.equal(editor.cropping,false);assert.equal(geometry.length,0);
  get('crop-toggle').onclick();
  get('crop-width').valueAsNumber=400;get('crop-width').onchange({target:get('crop-width')});
  fire('keydown',{key:'Enter'});
  assert.equal(editor.edit.crop.width,400);assert.equal(geometry.at(-1).width,400);
  get('rotate-right').onclick();assert.equal(editor.edit.crop.height,400);
  get('edit-undo').onclick();assert.equal(editor.edit.crop.width,400);assert.equal(editor.edit.turns,0);
  get('edit-restore').onclick();assert.deepEqual(editor.edit.crop,{x:0,y:0,width:1000,height:500});
  get('edit-undo').onclick();assert.equal(editor.edit.crop.width,400);
  editor.load(800,600);editor.sync({pending:false});assert.equal(get('edit-undo').disabled,true);
});
test('pointer capture keeps watermark grab offset and permits all canvas positions',()=>{
  const {editor,moves,fire,overlay,canvas}=harness();
  editor.overlay(overlay,{x:100,y:50,width:80,height:30});
  fire('pointerdown',{clientX:155,clientY:80});assert.equal(canvas.pointer,1);
  fire('pointermove',{clientX:400,clientY:200});
  assert.deepEqual(moves.at(-1),{x:.63,y:.61});
  fire('pointermove',{clientX:1200,clientY:-100});assert.deepEqual(moves.at(-1),{x:.96,y:.03});
  fire('pointerup');assert.equal(canvas.pointer,null);
  const count=moves.length;fire('pointermove',{clientX:300,clientY:150});assert.equal(moves.length,count);
});
test('keyboard placement and pending export guards work',()=>{
  const {editor,get,moves,fire,overlay}=harness();
  editor.overlay(overlay,{x:100,y:50,width:80,height:30});
  fire('keydown',{key:'ArrowRight',shiftKey:true});assert.deepEqual(moves.at(-1),{x:.15,y:.13});
  editor.sync({pending:true});
  fire('keydown',{key:'ArrowDown'});get('rotate-right').onclick();get('crop-toggle').onclick();
  assert.equal(moves.length,1);assert.equal(editor.edit.turns,0);assert.equal(editor.cropping,false);
});
test('crop corner resizing, movement and pointer cancellation preserve a valid selection',()=>{
  const {editor,get,fire}=harness();get('crop-toggle').onclick();
  // Initial crop is (100,50,800,400). Resize its bottom-right corner.
  fire('pointerdown',{clientX:550,clientY:275});fire('pointermove',{clientX:400,clientY:225});fire('pointerup');
  assert.equal(get('crop-width').value,500);assert.equal(get('crop-height').value,300);
  fire('pointerdown',{clientX:250,clientY:150});fire('pointermove',{clientX:300,clientY:175});
  assert.equal(get('crop-x').value,200);assert.equal(get('crop-y').value,100);
  fire('pointercancel');assert.equal(get('crop-x').value,100);assert.equal(get('crop-y').value,50);
  get('crop-apply').onclick();assert.deepEqual(editor.edit.crop,{x:100,y:50,width:500,height:300});
});
