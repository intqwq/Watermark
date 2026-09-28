import test from 'node:test';
import assert from 'node:assert/strict';
import {Worker} from 'node:worker_threads';

// Exercise the module's message/transfer boundary in Node, without a browser.
function invoke(operation,image,id){
  return new Promise((resolve,reject)=>{
    const entry=new URL('../dist/trace-worker.js',import.meta.url).href;
    const worker=new Worker(`
      const {parentPort}=require('node:worker_threads');
      globalThis.self={postMessage:(data,transfer)=>parentPort.postMessage(data,transfer)};
      import(${JSON.stringify(entry)}).then(()=>parentPort.on('message',data=>self.onmessage({data})));
    `,{eval:true});
    worker.once('error',reject);
    worker.once('message',data=>{worker.terminate();resolve(data);});
    worker.postMessage({operation,width:image.width,height:image.height,buffer:image.data.buffer,id},[image.data.buffer]);
    assert.equal(image.data.byteLength,0,'input ownership is transferred');
  });
}

test('worker embeds and detects transferred pixels, and returns explicit failures',async()=>{
  const id='WM1-0123456789ABCDEF1029384756ABCDEF';
  const data=new Uint8ClampedArray(256*256*4).fill(255);
  const embedded=await invoke('embed',{width:256,height:256,data},id);
  assert.equal(embedded.result.id,id);
  assert.equal(embedded.buffer.byteLength,256*256*4);
  const detected=await invoke('detect',{width:256,height:256,data:new Uint8ClampedArray(embedded.buffer)});
  assert.equal(detected.result.id,id);
  const failed=await invoke('embed',{width:1,height:1,data:new Uint8ClampedArray([0,0,0,255])},id);
  assert.equal(failed.error,'traceTooSmall');
  assert.equal(failed.buffer,undefined);
});
