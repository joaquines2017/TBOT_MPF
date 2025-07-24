export interface SessionData {
  estado: Record<string, EstadoChat>
  contexto: Record<string, ContextoChat>
  conversacionFinalizada: Record<string, boolean>
  paginaActual: Record<string, number>
}

export type EstadoChat = 
  | 'nodo_saludo'
  | 'esperando_categoria'
  | 'esperando_id_consulta'
  | 'esperando_id_cancelar'
  | 'nodo_confirmar_envio'
  | 'subcat_impresora'
  | 'subcat_pc'
  | 'subcat_telefonoip'
  | 'subcat_internet'
  | 'subcat_audiencia'
  | 'nodo_ayuda'

export interface ContextoChat {
  ticketId?: number
  resumenTicket?: string
  ultimoMensaje?: string
  categoria?: string
  subCategoria?: string
}

export interface TicketPayload {
  project_id: number
  tracker_id: number
  status_id: number
  priority_id: number
  subject: string
  description: string
  assigned_to_id: number
  custom_fields: Array<{
    id: number
    value: string
  }>
}
