export type OcrWord={text:string;x:number;y:number;width:number;height:number}
type Row={words:OcrWord[];center:number;height:number}
const median=(values:number[])=>{const sorted=[...values].sort((a,b)=>a-b);return sorted[Math.floor(sorted.length/2)]!}
/** Windows OCR returns reading blocks (often columns). Rebuild visual rows from word rectangles. */
export function readingRows(input:unknown):string[] {
 if(!Array.isArray(input)||input.length>12000)throw new Error('Invalid OCR word list')
 const words:OcrWord[]=input.filter((word):word is OcrWord=>word&&typeof word==='object'&&typeof word.text==='string'&&word.text.length>0&&word.text.length<1000&&['x','y','width','height'].every(k=>typeof word[k]==='number'&&Number.isFinite(word[k])&&word[k]>=0)&&word.width>0&&word.height>0)
 const rows:Row[]=[]
 for(const word of words.sort((a,b)=>(a.y+a.height/2)-(b.y+b.height/2)||a.x-b.x)) {
  const center=word.y+word.height/2
  const candidate=rows.filter(row=>Math.abs(center-row.center)<=Math.max(2,Math.min(row.height,word.height)*0.55)).sort((a,b)=>Math.abs(a.center-center)-Math.abs(b.center-center))[0]
  if(candidate){candidate.words.push(word);candidate.center=median(candidate.words.map(w=>w.y+w.height/2));candidate.height=median(candidate.words.map(w=>w.height))}
  else rows.push({words:[word],center,height:word.height})
 }
 return rows.sort((a,b)=>a.center-b.center).map(row=>{
  const sorted=row.words.sort((a,b)=>a.x-b.x)
  const label=sorted.find(w=>/^(cuotas|apuesta|pago|retirarse)$/i.test(w.text))
  let text='',previous:OcrWord|undefined,previousText=''
  for(const word of sorted) {
   let token=word.text.trim();if(!token)continue
   // Restrict glyph disambiguation to decimal amounts in the value column, never names or scores.
   if(label&&word.x>label.x+label.width+row.height*2&&/^[0-9oOlI|]+[.,][0-9oOlI|]+$/.test(token))token=token.replace(/[oO]/g,'0').replace(/[lI|]/g,'1')
   const gap=previous?word.x-(previous.x+previous.width):0
   const decimalContinuation=previous&&/^[0-9]+[.,][0-9]+$/.test(previousText)&&/^[0-9]+$/.test(token)&&gap<=Math.max(2,row.height*0.5)
   const separator=!previous||decimalContinuation?'':gap>row.height*3?'\t':' '
   text+=separator+token
   previous=word;previousText=decimalContinuation?previousText+token:token
  }
  return text
 }).filter(Boolean)
}
