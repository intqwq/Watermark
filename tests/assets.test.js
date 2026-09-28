import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';

test('published asset URLs match the current dependent files, preventing mixed cached releases',()=>{
  let checked=0;
  for(const parent of ['index.html','app.js','style.css','trace-ui.js','trace-worker.js']){
    const source=readFileSync(new URL('../dist/'+parent,import.meta.url),'utf8');
    for(const match of source.matchAll(/\.\/([^"'\s<>?]+)\?v=([a-f0-9]{12})(?=["'])/g)){
      const [,path,version]=match;
      let bytes=readFileSync(new URL('../dist/'+path,import.meta.url));
      if(/\.(js|css|html)$/.test(path))bytes=Buffer.from(bytes.toString('utf8').replaceAll('\r\n','\n'));
      assert.equal(version,createHash('sha256').update(bytes).digest('hex').slice(0,12),parent+' -> '+path+'; run scripts/fingerprint_assets.py');
      checked++;
    }
  }
  assert.equal(checked,12);
});
