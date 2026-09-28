import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolveLanguage,browserLanguage,messages,translate} from '../dist/i18n.js';

test('matches supported languages in browser preference order',()=>{
  for(const [preferences,expected] of [
    [['zh-CN'],'zh'],[['zh-TW'],'zh'],[['zh-Hant-HK','en-US'],'zh'],
    [['en-GB','zh-CN'],'en'],[['fr-FR','zh-SG','en-US'],'zh'],
    [['de-DE','en-US','zh'],'en'],[['ja-JP'],'en'],[[],'en'],[[null,'ZH_hant'],'zh']
  ]) assert.equal(resolveLanguage(preferences),expected);
  assert.equal(browserLanguage({language:'zh-CN'}),'zh');
  assert.equal(browserLanguage({languages:[],language:'en-AU'}),'en');
});

test('all UI labels, accessibility labels and notifications have both translations',()=>{
  assert.deepEqual(Object.keys(messages.zh).sort(),Object.keys(messages.en).sort());
  const html=readFileSync(new URL('../dist/index.html',import.meta.url),'utf8');
  const app=readFileSync(new URL('../dist/app.js',import.meta.url),'utf8');
  const keys=[...html.matchAll(/data-i18n(?:-aria)?="([^"]+)"/g),...app.matchAll(/\b(?:notify|t)\('([^']+)'\)/g)].map(match=>match[1]);
  assert.ok(keys.length>40);
  for(const key of keys) for(const locale of ['en','zh'])assert.ok(messages[locale][key],`${locale}: ${key}`);
  for(const [key,value] of Object.entries(messages.en)){
    if(key==='signatureShuyuanlv')assert.equal(value,'数原律 signature'); // Preserve the user's proper name.
    else assert.doesNotMatch(value,/[\u3400-\u9fff]/);
  }
  assert.equal(translate('invalidType','en'),'Choose a JPG, PNG or WebP image.');
  assert.match(html,/placeholder="Made by intqwq@X"/);
});
