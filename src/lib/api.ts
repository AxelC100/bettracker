export class ApiError extends Error {
  status: number
  constructor(message: string, status: number) { super(message); this.status = status }
}
export async function api<T>(path: string, method = 'GET', body?: unknown): Promise<T> {
  let response: Response
  try { response = await fetch(`/api${path}`, { method, credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) }) }
  catch { throw new Error('No se pudo conectar con el servidor.') }
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new ApiError(data.error || 'No se pudo completar la operación.', response.status)
  return data as T
}
