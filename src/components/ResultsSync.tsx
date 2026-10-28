import { useState } from 'react'
import { api } from '../lib/api'
export default function ResultsSync({onUpdated}:{onUpdated:()=>Promise<void>}) {
 const [busy,setBusy]=useState(false),[message,setMessage]=useState('')
 async function sync(){setBusy(true);setMessage('');try{const r=await api<{checked:number;updated:number;review:number;busy:boolean}>('/results/sync','POST',{});await onUpdated();setMessage(r.busy?'Ya hay una consulta en curso.':`Tickets revisados: ${r.checked}. Actualizados: ${r.updated}. Selecciones pendientes de revisión o datos: ${r.review}.`)}catch(e){setMessage((e as Error).message)}finally{setBusy(false)}}
 return <div className="integration-status"><button type="button" className="back-button" disabled={busy} onClick={()=>void sync()}>{busy?'Consultando resultados…':'Actualizar resultados'}</button><p className="editor-help">Solo se consultan tickets pendientes con actualización automática activada y partidos vinculados.</p>{message&&<p role="status">{message}</p>}</div>
}
