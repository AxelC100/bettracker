import test from 'node:test'
import assert from 'node:assert/strict'
import {readingRows} from '../dist/ocr-layout.js'
const word=(text,x,y,width=35,height=12)=>({text,x,y,width,height})
test('reads complete rows left to right instead of OCR column order',()=>{
 const input=[word('Cuotas',10,100),word('Apuesta',10,125),word('Pago',10,150),word('2,45',260,101),word('1.00000000',200,126,85),word('2.45000000',200,151,85)]
 assert.deepEqual(readingRows(input),['Cuotas\t2,45','Apuesta\t1.00000000','Pago\t2.45000000'])
})
test('assembles names and their score on the same row without merging adjacent rows',()=>{
 const input=[word('Torino',40,110,40),word('Como',40,135,36),word('FC',85,110,18),word('1907',82,135,32),word('1',280,110,7),word('3',280,135,7)]
 assert.deepEqual(readingRows(input),['Torino FC\t1','Como 1907\t3'])
})
test('joins decimal fragments and disambiguates glyphs only in labeled decimal amount cells',()=>{
 assert.deepEqual(readingRows([word('Apuesta',10,0,50),word('1.000',190,0,40),word('00000',231,0,43)]),['Apuesta\t1.00000000'])
 assert.deepEqual(readingRows([word('Pago',10,0),word('l.oooooooo',190,0,90)]),['Pago\t1.00000000'])
 assert.deepEqual(readingRows([word('Como',10,0),word('1907',55,0)]),['Como 1907'])
 assert.deepEqual(readingRows([word('Paz,',10,0),word('Nico',50,0),word('1+',90,0)]),['Paz, Nico 1+'])
})
test('ignores invalid rectangles and rejects invalid payloads',()=>{
 assert.throws(()=>readingRows({text:'bad'}))
 assert.deepEqual(readingRows([{text:'bad',x:NaN,y:0,width:1,height:1},word('Valido',10,5)]),['Valido'])
})
