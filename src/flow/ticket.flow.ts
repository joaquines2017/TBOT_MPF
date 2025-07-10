/**
 * Maneja el flujo principal de operaciones relacionadas con tickets, incluyendo creación, consulta, cancelación,
 * rechazo y paginación de tickets. Interpreta el intent del usuario y el contexto de la conversación para determinar
 * la acción a realizar, interactuando con servicios externos como Redmine y gestionando el estado de la sesión.
 *
 * @param _senderId - Identificador único del usuario que envía la solicitud.
 * @param intent - Intención detectada del usuario (por ejemplo: 'consultar', 'cancelar_123', 'si', 'ver_todos').
 * @param contexto - Objeto que contiene información contextual relevante de la conversación actual.
 * @returns Una promesa que resuelve en un string con el mensaje de respuesta para el usuario.
 *
 * @remarks
 * - Utiliza el objeto `session` para manejar el estado conversacional y la finalización de la conversación.
 * - Realiza validaciones sobre los datos recibidos y maneja errores devolviendo mensajes apropiados.
 * - Interactúa con el servicio de Redmine para operaciones CRUD sobre tickets.
 * - Soporta paginación para la visualización de múltiples tickets.
 */

import RedmineService from '../services/redmine.service'

interface SessionData {
  estado: Record<string, string>
  contexto: Record<string, any>
  conversacionFinalizada: Record<string, boolean>
  paginaActual: Record<string, number>
}

export const session: SessionData = {
  estado: {},
  contexto: {},
  conversacionFinalizada: {},
  paginaActual: {}
}

export const limpiarEstado = (senderId: string) => {
  session.estado[senderId] = 'nodo_saludo'
  session.contexto[senderId] = {}
  session.conversacionFinalizada[senderId] = false
}

const consultarTicket = async (ticketId: number): Promise<string> => {
  console.log('🔍 Consultando ticket:', ticketId)
  const ticket = await RedmineService.getTicketById(ticketId)
  
  if (!ticket) {
    throw new Error(`No se encontró el ticket #${ticketId}`)
  }

  const fechaCreacion = new Date(ticket.created_on).toLocaleString('es-AR', {
    timeZone: 'America/Argentina/Buenos_Aires'
  })

  return `📋 Detalles del ticket #${ticket.id}:
🆔 ID: ${ticket.id}
📂 Categoría: ${ticket.category?.name || 'Sin categoría'}
✏️ Asunto: ${ticket.subject}
👤 Asignado al técnico: ${ticket.assigned_to?.name || 'Sin asignar'}
📅 Creado: ${fechaCreacion}
📊 Estado: ${ticket.status?.name || 'Desconocido'}

📝 Por favor, calificá la atención:
1️⃣ Mala
2️⃣ Buena
3️⃣ Muy Buena
4️⃣ Excelente`
}

const cancelarTicket = async (ticketId: number): Promise<string> => {
  console.log('🔄 Cancelando ticket:', ticketId)
  const resultado = await RedmineService.cancelarTicket(ticketId)
  
  if (!resultado.success) {
    throw new Error(resultado.message || 'No se pudo rechazar el ticket')
  }

  return `✅ El ticket #${ticketId} ha sido rechazado exitosamente.
📊 Estado: Rechazado
🤖 T-BOT ha finalizado la conversación.`
}

const crearTicket = async (_senderId: string, contexto: any) => {
  console.log('📝 Iniciando creación de ticket:', contexto)

  const asuntoMatch = contexto.ultimoMensaje.match(/🖊️ Asunto: ([^\n]+)/)
  const categoriaMatch = contexto.ultimoMensaje.match(/📂 Categoría: ([^\n]+)/)

  if (!asuntoMatch || !categoriaMatch) {
    console.error('❌ Datos del ticket incompletos:', { asuntoMatch, categoriaMatch })
    throw new Error('Datos del ticket incompletos')
  }

  const category = categoriaMatch[1].trim()
  const subjectBase = asuntoMatch[1].trim()

  // Obtener técnico aleatorio
  const miembros = await RedmineService.obtenerMiembrosSoporteIT()
  if (!miembros || miembros.length === 0) {
    throw new Error('No hay técnicos disponibles para asignar')
  }
  const miembro = miembros[Math.floor(Math.random() * miembros.length)]

  // Buscar contacto por número de teléfono
  const contacto = await RedmineService.buscarContactoPorTelefono(_senderId)
  
  const nombreEmpleado = contacto ? 
    `${contacto.first_name} ${contacto.last_name}` : 
    'Usuario WhatsApp'
  
  const oficinaEmpleado = contacto?.company || 'No especificada'

  const ticketPayload = {
    project_id: 33,
    tracker_id: 26,
    status_id: 1,
    priority_id: 2,
    subject: `${category}: ${subjectBase}`,
    description: `📋 Ticket generado vía T-BOT WhatsApp\n\n${contexto.ultimoMensaje}`,
    assigned_to_id: miembro.id,
    custom_fields: [
      {
        id: 7,
        value: oficinaEmpleado
      },
      {
        id: 4,
        value: nombreEmpleado
      },
      {
        id: 30,
        value: _senderId.replace(/[^\d]/g, '')
      }
    ]
  }

  console.log('📤 Enviando payload a Redmine:', ticketPayload)
  return await RedmineService.createTicket(ticketPayload)
}

export const handleTicketFlow = async (_senderId: string, intent: string, contexto: any): Promise<string> => {
  try {
    console.log('🎯 handleTicketFlow iniciado con:', { intent, senderId: _senderId, estado: session.estado[_senderId], contexto })

    // Manejo de confirmación de creación de ticket
    if (intent === 'si' && contexto?.ultimoMensaje?.includes('¿Deseás generar el ticket?')) {
      const ticket = await crearTicket(_senderId, contexto)
      if (!ticket) {
        throw new Error('Error al crear el ticket en Redmine')
      }

      session.estado[_senderId] = 'esperando_calificacion'
      session.contexto[_senderId].ticketConsultado = ticket.id

      const fechaCreacion = new Date(ticket.created_on).toLocaleString('es-AR', {
        timeZone: 'America/Argentina/Buenos_Aires'
      })

      return `✅ Ticket creado con éxito
🆔 ID: ${ticket.id}
📂 Categoría: ${ticket.category?.name || 'Sin categoría'}
✏️ Asunto: ${ticket.subject}
👤 Asignado al técnico: ${ticket.assigned_to?.name || 'Sin asignar'}
🕒 Creado: ${fechaCreacion}

📝 Por favor, calificá la atención:
1️⃣ Mala
2️⃣ Buena
3️⃣ Muy Buena
4️⃣ Excelente`
    }

    // Manejo de calificación
    if (/^[1-4]$/.test(intent) && session.estado[_senderId] === 'esperando_calificacion') {
      const ticketId = session.contexto[_senderId].ticketConsultado
      await RedmineService.guardarCalificacion(ticketId, intent)
      
      session.conversacionFinalizada[_senderId] = true
      return '¡Gracias por tu calificación! 🙏\nTu opinión nos ayuda a mejorar.\nLa conversación ha finalizado.'
    }

    // Manejar cancelación de ticket
    if (intent.startsWith('cancelar_')) {
      const ticketId = parseInt(intent.replace('cancelar_', ''))
      if (!ticketId || isNaN(ticketId)) {
        return '⚠️ Número de ticket inválido. Por favor, ingresá solo números.'
      }

      try {
        const respuesta = await cancelarTicket(ticketId)
        session.conversacionFinalizada[_senderId] = true
        return respuesta
      } catch (error) {
        return `❌ ${error.message}`
      }
    }

    // Procesar número de ticket para cancelar
    if (session.estado[_senderId] === 'esperando_id_cancelar' && /^\d+$/.test(intent)) {
      const ticketId = parseInt(intent)
      try {
        const respuesta = await cancelarTicket(ticketId)
        session.conversacionFinalizada[_senderId] = true
        return respuesta
      } catch (error) {
        return `⚠️ ${error.message}`
      }
    }

    // Manejar consulta de ticket
    if (intent === 'consultar') {
      session.estado[_senderId] = 'esperando_id_consulta'
      return '🔍 Por favor, ingresá el número de ticket que querés consultar:'
    }

    // Procesar número de ticket cuando estamos esperándolo
    if (session.estado[_senderId] === 'esperando_id_consulta' && /^\d+$/.test(intent)) {
      const ticketId = parseInt(intent)
      session.estado[_senderId] = 'esperando_calificacion'
      session.contexto[_senderId] = { ticketConsultado: ticketId }
      return await consultarTicket(ticketId)
    }

    // Manejar creación de ticket
    if (intent === 'si' && contexto?.ultimoMensaje?.includes('¿Deseás generar el ticket?')) {
      console.log('📝 Iniciando creación de ticket:', contexto)

      const asuntoMatch = contexto.ultimoMensaje.match(/🖊️ Asunto: ([^\n]+)/)
      const categoriaMatch = contexto.ultimoMensaje.match(/📂 Categoría: ([^\n]+)/)

      if (!asuntoMatch || !categoriaMatch) {
        console.error('❌ Datos del ticket incompletos:', { asuntoMatch, categoriaMatch })
        throw new Error('Datos del ticket incompletos')
      }

      const category = categoriaMatch[1].trim()
      const subjectBase = asuntoMatch[1].trim()

      // Obtener técnico aleatorio
      const miembros = await RedmineService.obtenerMiembrosSoporteIT()
      if (!miembros || miembros.length === 0) {
        throw new Error('No hay técnicos disponibles para asignar')
      }
      const miembro = miembros[Math.floor(Math.random() * miembros.length)]

      // Buscar contacto por número de teléfono
      const contacto = await RedmineService.buscarContactoPorTelefono(_senderId)
      
      const nombreEmpleado = contacto ? 
        `${contacto.first_name} ${contacto.last_name}` : 
        'Usuario WhatsApp'
      
      const oficinaEmpleado = contacto?.company || 'No especificada'

      const ticketPayload = {
        project_id: 33,
        tracker_id: 26,
        status_id: 1,
        priority_id: 2,
        subject: `${category}: ${subjectBase}`,
        description: `📋 Ticket generado vía T-BOT WhatsApp\n\n${contexto.ultimoMensaje}`,
        assigned_to_id: miembro.id,
        custom_fields: [
          {
            id: 7,
            value: oficinaEmpleado
          },
          {
            id: 4,
            value: nombreEmpleado
          },
          {
            id: 30,
            value: _senderId.replace(/[^\d]/g, '')
          }
        ]
      }

      console.log('📤 Enviando payload a Redmine:', ticketPayload)
      const ticket = await RedmineService.createTicket(ticketPayload)
      
      if (!ticket) {
        throw new Error('Error al crear el ticket en Redmine')
      }

      session.conversacionFinalizada[_senderId] = true

      const fechaCreacion = new Date(ticket.created_on).toLocaleString('es-AR', {
        timeZone: 'America/Argentina/Buenos_Aires'
      })

      return `✅ Ticket creado con éxito
🆔 ID: ${ticket.id}
📂 Categoría: ${category}
✏️ Asunto: ${ticket.subject}
👤 Asignado al técnico: ${miembro.name}
🕒 Creado: ${fechaCreacion}
🤖 T-BOT ha finalizado la conversación.`
    }

    // Manejar cancelación de ticket
    if (intent.startsWith('rechazar ticket')) {
      const ticketId = parseInt(intent.replace('cancelar', ''))
      
      if (!ticketId || isNaN(ticketId)) {
        return '⚠️ Número de ticket inválido. Por favor, ingresá solo números.'
      }

      const resultado = await RedmineService.cancelarTicket(ticketId)
      session.conversacionFinalizada[_senderId] = true

      if (resultado.success) {
        return `✅ El ticket #${ticketId} ha sido rechazado exitosamente.
📊 Estado: Rechazado
🤖 T-BOT ha finalizado la conversación.`
      }
      
      return `❌ ${resultado.message || 'No se pudo rechazar el ticket.'}`
    } else if (intent === 'ver_todos') {
      const pagina = session.paginaActual[_senderId] || 1
      const resultado = await RedmineService.listarIssuesDelProyecto('soporte-tecnico-mpf', pagina)
      
      session.paginaActual[_senderId] = pagina
      session.estado[_senderId] = 'mostrando_tickets'
      
      return `${resultado.mensaje}\n${resultado.hayMasPaginas ? 
        '\n➡️ Escribí "siguiente" para ver más tickets\n⬅️ Escribí "anterior" para ver tickets previos' : 
        '\n✅ No hay más tickets para mostrar'}`
    } else if (intent === 'siguiente' && session.estado[_senderId] === 'mostrando_tickets') {
      const pagina = (session.paginaActual[_senderId] || 1) + 1
      return await manejarPaginacion(_senderId, pagina)
    } else if (intent === 'anterior' && session.estado[_senderId] === 'mostrando_tickets') {
      const pagina = Math.max(1, (session.paginaActual[_senderId] || 2) - 1)
      return await manejarPaginacion(_senderId, pagina)
    } else if (intent === 'cancelar' && !contexto.confirmado) {
      session.estado[_senderId] = 'esperando_confirmacion_cancelar'
      session.contexto[_senderId] = { ...contexto, ticketId: contexto.ticketId }
      return '⚠️ ¿Estás seguro de que querés cancelar este ticket? (si/no)'
    }

    return '⚠️ Operación no reconocida'

  } catch (error) {
    console.error('❌ Error en handleTicketFlow:', error)
    session.estado[_senderId] = 'nodo_saludo' // Reset estado en caso de error
    session.conversacionFinalizada[_senderId] = true
    return '❌ Ocurrió un error. Por favor, intentá nuevamente.'
  }
}

const manejarPaginacion = async (_senderId: string, pagina: number): Promise<string> => {
  const resultado = await RedmineService.listarIssuesDelProyecto('soporte-tecnico-mpf', pagina)
  session.paginaActual[_senderId] = pagina
  
  return `${resultado.mensaje}\n${resultado.hayMasPaginas ? 
    '\n➡️ Escribí "siguiente" para ver más tickets\n⬅️ Escribí "anterior" para ver tickets previos' : 
    '\n✅ No hay más tickets para mostrar'}`
}



