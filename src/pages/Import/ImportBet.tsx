import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import TicketEditor from '../../components/TicketEditor'
import { useBets } from '../../lib/bets'
import { api } from '../../lib/api'
import type { Ticket } from '../../../shared/types'
type Draft={ticket:Partial<Ticket>;warnings:string[]}
export default function ImportBet(){
 const navigate=useNavigate(),{create}=useBets()
 const [image,setImage]=useState(''),[fileName,setFileName]=useState(''),[mode,setMode]=useState('local'),[consent,setConsent]=useState(false)
 const [vision,setVision]=useState(false),[localOcr,setLocalOcr]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState('')
 const [drafts,setDrafts]=useState<Draft[]>([]),[rawText,setRawText]=useState(''),[selected,setSelected]=useState(0),[reviewed,setReviewed]=useState(false)
 const [saved,setSaved]=useState<number[]>([])
 useEffect(()=>{let active=true;void api<{vision:boolean;localOcr:boolean}>('/integrations').then(result=>{if(active){setVision(result.vision);setLocalOcr(result.localOcr);if(!result.localOcr&&result.vision)setMode('openai')}}).catch(e=>{if(active)setError((e as Error).message)});return()=>{active=false}},[])
 async function loadFile(file:File|undefined){
  setError('');setDrafts([]);setRawText('');setReviewed(false);setSaved([]);setImage('')
  if(!file)return
  if(!['image/png','image/jpeg'].includes(file.type)||file.size>6*1024*1024){setError('Usa una imagen PNG o JPEG de hasta 6 MB.');return}
  const reader=new FileReader();reader.onload=()=>{setImage(String(reader.result));setFileName(file.name)};reader.onerror=()=>setError('No se pudo leer el archivo.');reader.readAsDataURL(file)
 }
 async function extract(){
  if(!image||busy)return
  if(mode==='openai'&&!consent){setError('Confirma el envío de esta captura al servicio de visión.');return}
  setBusy(true);setError('');setReviewed(false);setSaved([])
  try{const response=await api<{drafts:Draft[];rawText:string}>('/import/image','POST',{image,mode});setDrafts(response.drafts);setRawText(response.rawText);setSelected(0)}catch(e){setError((e as Error).message)}finally{setBusy(false)}
 }
 return <main className="new-bet-page"><div className="new-bet-container"><header className="new-bet-header"><div><p className="new-bet-eyebrow">Capturas de Stake</p><h1>Importar apuesta</h1><p>Lee la captura, revisa cada dato y guarda un ticket a la vez.</p></div><Link to="/bets/new" className="back-button">Registro manual</Link></header>
  <section className="form-card"><div className="form-grid"><div className="form-group"><label htmlFor="capture">Captura PNG o JPEG · hasta 6 MB</label><input id="capture" type="file" accept="image/png,image/jpeg" disabled={busy} onChange={e=>void loadFile(e.target.files?.[0])}/></div><div className="form-group"><label htmlFor="reading-mode">Método de lectura</label><select id="reading-mode" value={mode} disabled={busy} onChange={e=>setMode(e.target.value)}><option value="local" disabled={!localOcr}>OCR local · revisar y completar campos</option><option value="openai" disabled={!vision}>IA · extracción de campos {!vision?'(sin configurar)':''}</option></select></div></div>
  <p className="source-note">La lectura local procesa la imagen en este servidor y elimina el archivo temporal. La imagen no se guarda con el ticket. El modo IA envía la captura a OpenAI para extraer los datos.</p>
  {mode==='openai'&&<label className="editor-check"><input type="checkbox" checked={consent} onChange={e=>setConsent(e.target.checked)}/>Entiendo que esta captura se enviará a OpenAI para su lectura.</label>}
  {!vision&&<p className="integration-status">La extracción automática con IA está preparada y pendiente de conexión. La lectura local permite reconocer el texto y completar un borrador sin enviar la captura a un proveedor externo.</p>}
  <button className="save-button" type="button" disabled={!image||busy||(mode==='openai'&&!consent)||(mode==='local'&&!localOcr)} onClick={()=>void extract()}>{busy?'Leyendo captura…':'Leer y preparar borrador'}</button>
  {error&&<p className="form-error" role="alert">{error}</p>}</section>
  {!!drafts.length&&<div className="import-grid"><aside className="import-side"><img className="import-preview" src={image} alt={`Captura original: ${fileName}`}/>{rawText&&<div className="form-group"><label htmlFor="ocr-text">Texto reconocido · puede contener errores</label><textarea id="ocr-text" readOnly rows={12} value={rawText}/></div>}</aside><section>
   {drafts.length>1&&<div className="form-group"><label htmlFor="draft-ticket">Ticket de la captura</label><select id="draft-ticket" value={selected} onChange={e=>{setSelected(Number(e.target.value));setReviewed(false)}}>{drafts.map((_,i)=><option key={i} value={i}>Ticket {i+1}{saved.includes(i)?' · guardado':''}</option>)}</select></div>}
   <div className="integration-status"><strong>Revisa antes de guardar</strong><ul>{drafts[selected]!.warnings.map((w,i)=><li key={i} className="import-warning">{w}</li>)}</ul><label className="editor-check"><input type="checkbox" checked={reviewed} onChange={e=>setReviewed(e.target.checked)}/>Confirmo moneda USDT, equipos, fecha/año, mercados, periodos, cuotas y monto de este ticket.</label></div>
   {saved.includes(selected)?<div className="form-card"><p>Ticket guardado.</p><button type="button" className="save-button" onClick={()=>navigate('/bets')}>Ver historial</button></div>:<TicketEditor key={`${drafts[selected]!.ticket.id}`} initial={drafts[selected]!.ticket} label="Guardar ticket revisado" onSave={async ticket=>{if(!reviewed)throw new Error('Revisa los datos y marca la confirmación antes de guardar.');await create(ticket);setSaved(current=>[...current,selected]);setReviewed(false)}}/>}
  </section></div>}
 </div></main>
}
