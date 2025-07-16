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

  //Se quita Categoría del detalle del ticket porque subject trae la categoría y subcategoría
  //📂 Categoría: ${ticket.subject?.category?.name || 'Sin categoría'}
  return `📋 Detalles del ticket #${ticket.id}:
🆔 ID: ${ticket.id}
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
📝 Por favor, calificá la atención:
1️⃣ Mala
2️⃣ Buena
3️⃣ Muy Buena
4️⃣ Excelente`
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

    // --- Lógica restaurada para navegación y filtrado de tickets ---
    // 1. Si el estado es mostrando_tickets, procesar selección de estado
    if (session.estado[_senderId] === 'mostrando_tickets' || (contexto?.ultimoMensaje && contexto.ultimoMensaje.includes('Elija el estado de los tickets'))) {
      let intentNorm = intent;
      if (typeof intentNorm !== 'string') intentNorm = String(intentNorm);
      intentNorm = intentNorm.trim().toLowerCase();
      console.log('🟡 [DEBUG] intent recibido en mostrando_tickets:', intent, '| Normalizado:', intentNorm);
      // Mapear variantes de intent a estado Redmine
      let estadoRedmine = '';
      if (intentNorm === '1' || intentNorm === 'nuevo') {
        estadoRedmine = 'Nueva';
      } else if (intentNorm === '2' || intentNorm === 'en curso' || intentNorm === 'en_proceso' || intentNorm === 'en proceso') {
        estadoRedmine = 'En curso';
      } else if (intentNorm === '3' || intentNorm === 'salir') {
        // Opción salir
        session.conversacionFinalizada[_senderId] = true;
        limpiarEstado(_senderId);
        return '🤖 T-BOT ha finalizado la conversación. Gracias por comunicarte con nosotros. Saludos.';
      }
      if (estadoRedmine) {
        const contacto = await RedmineService.buscarContactoPorTelefono(_senderId);
        if (!contacto || !contacto.id) {
          session.estado[_senderId] = 'nodo_saludo';
          return 'No se encontró tu contacto en la base de Redmine. No se pueden filtrar tus tickets.';
        }
        // Guardar estado y página actual para paginación
        session.estado[_senderId] = 'paginando_tickets';
        session.contexto[_senderId].estadoRedmine = estadoRedmine;
        session.contexto[_senderId].contact_id = contacto.id;
        session.paginaActual[_senderId] = 1;
        return await manejarPaginacionEstado(_senderId, 1, estadoRedmine, contacto.id);
      } else {
        // Si el intent no es válido, mostrar el menú de selección de estado
        session.estado[_senderId] = 'mostrando_tickets';
        return '📋 Elija el estado de los tickets que desea ver:\n1️⃣ Nuevo\n2️⃣ En curso';
      }
    }

    // 2. Si el estado es paginando_tickets, procesar navegación
    if (session.estado[_senderId] === 'paginando_tickets') {
      const estadoRedmine = session.contexto[_senderId]?.estadoRedmine;
      const contactId = session.contexto[_senderId]?.contact_id;
      let pagina = session.paginaActual[_senderId] || 1;
      if (intent === '3') {
        console.log('🚫 Capturado salir en flujo de tickets, NO se envía a Botpress. Estado:', session.estado[_senderId]);
        session.conversacionFinalizada[_senderId] = true;
        // Enviar el mensaje de despedida ANTES de limpiar el estado para que el mensaje llegue correctamente
        const despedida = '🤖 T-BOT ha finalizado la conversación. Gracias por comunicarte con nosotros. Saludos.';
        setTimeout(() => limpiarEstado(_senderId), 100); // Limpia el estado después de enviar el mensaje
        return despedida;
      } else if (intent === '4') {
        pagina++;
        session.paginaActual[_senderId] = pagina;
        let contact_id = contactId;
        if (!contact_id) {
          const contacto = await RedmineService.buscarContactoPorTelefono(_senderId);
          contact_id = contacto?.id;
          session.contexto[_senderId].contact_id = contact_id;
        }
        return await manejarPaginacionEstado(_senderId, pagina, estadoRedmine, contact_id);
      } else if (intent === '5') {
        pagina = Math.max(1, pagina - 1);
        session.paginaActual[_senderId] = pagina;
        let contact_id = contactId;
        if (!contact_id) {
          const contacto = await RedmineService.buscarContactoPorTelefono(_senderId);
          contact_id = contacto?.id;
          session.contexto[_senderId].contact_id = contact_id;
        }
        return await manejarPaginacionEstado(_senderId, pagina, estadoRedmine, contact_id);
      } else {
        // Si la opción no es válida, mostrar menú
        return 'Opción no válida. Por favor, elige una opción del menú.\n\nOpciones:\n3️⃣ Salir\n4️⃣ Siguiente\n5️⃣ Anterior';
      }
    }

    // Guardar calificación y finalizar conversación tras ver todos/salir
    if (/^[1-4]$/.test(intent) && session.estado[_senderId] === 'esperando_calificacion_tickets') {
      await RedmineService.guardarCalificacion(null, intent, _senderId); // null porque no hay ticket específico
      session.conversacionFinalizada[_senderId] = true;
      limpiarEstado(_senderId);
      return '¡Gracias por tu calificación! 🙏\nTu opinión nos ayuda a mejorar.\nLa conversación ha finalizado.';
    }

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

      // Se quita Categoría del detalle del ticket porque subject trae la categoría y subcategoría
      //4📂 Categoría: ${ticket.subject?.name || 'Sin categoría'}
      return `✅ Ticket creado con éxito
🆔 ID: ${ticket.id}
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
      const ticketId = session.contexto[_senderId]?.ticketConsultado;
      await RedmineService.guardarCalificacion(ticketId, intent, _senderId);
      session.conversacionFinalizada[_senderId] = true;
      limpiarEstado(_senderId);
      return '¡Gracias por tu calificación! 🙏\nTu opinión nos ayuda a mejorar.\nLa conversación ha finalizado.';
    }

    // Manejar cancelación de ticket
    if (intent.startsWith('cancelar_')) {
      const ticketId = parseInt(intent.replace('cancelar_', ''));
      if (!ticketId || isNaN(ticketId)) {
        return '⚠️ Número de ticket inválido. Por favor, ingresá solo números.';
      }

      try {
        const respuesta = await cancelarTicket(ticketId);
        // Después de cancelar, pedir calificación
        session.estado[_senderId] = 'esperando_calificacion';
        session.contexto[_senderId] = { ticketConsultado: ticketId };
        return respuesta;
      } catch (error) {
        return `❌ ${error.message}`;
      }
    }

    // Procesar número de ticket para cancelar
    if (session.estado[_senderId] === 'esperando_id_cancelar' && /^\d+$/.test(intent)) {
      const ticketId = parseInt(intent);
      try {
        const respuesta = await cancelarTicket(ticketId);
        // Después de cancelar, pedir calificación
        session.estado[_senderId] = 'esperando_calificacion';
        session.contexto[_senderId] = { ticketConsultado: ticketId };
        return respuesta;
      } catch (error) {
        return `⚠️ ${error.message}`;
      }
    }

    // Manejar consulta de ticket
    if (intent === 'consultar') {
      session.estado[_senderId] = 'esperando_id_consulta'
      return '🔍Por favor, ingresá el número de ticket que querés consultarrrr:'
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
📂 Categoría: ${category?.name}
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
      // Al mostrar el menú de estados, actualiza el estado a 'mostrando_tickets'
      session.estado[_senderId] = 'mostrando_tickets';
      // Mostrar solo el menú de selección de estado
      return '📋 Elija el estado de los tickets que desea ver:\n1️⃣ Nuevo\n2️⃣ En curso';
    } else if (intent === 'siguiente' && session.estado[_senderId] === 'mostrando_tickets') {
      const pagina = (session.paginaActual[_senderId] || 1) + 1;
      return await manejarPaginacionGeneral(_senderId, pagina);
    } else if (intent === 'anterior' && session.estado[_senderId] === 'mostrando_tickets') {
      const pagina = Math.max(1, (session.paginaActual[_senderId] || 2) - 1);
      return await manejarPaginacionGeneral(_senderId, pagina);
    } else if (intent === 'cancelar' && !contexto.confirmado) {
      session.estado[_senderId] = 'esperando_confirmacion_cancelar'
      session.contexto[_senderId] = { ...contexto, ticketId: contexto.ticketId }
      return '⚠️ ¿Estás seguro de que querés cancelar este ticket? (si/no)'
    }

    // Si el intent no fue válido en los contextos anteriores, mostrar opción no válida genérica
    return 'Opción no válida. Por favor, elige una opción del menú.'

  } catch (error) {
    console.error('❌ Error en handleTicketFlow:', error)
    session.estado[_senderId] = 'nodo_saludo' // Reset estado en caso de error
    session.conversacionFinalizada[_senderId] = true
    return '❌ Ocurrió un error. Por favor, intentá nuevamente.'
  }
}

// Paginación para tickets filtrados por estado
const manejarPaginacionEstado = async (_senderId: string, pagina: number, estadoRedmine: string, contactId: number): Promise<string> => {
  const resultado = await RedmineService.listarIssuesDelProyecto('soporte-tecnico-mpf', pagina, {
    status_name: estadoRedmine,
    contact_id: contactId
  });
  session.paginaActual[_senderId] = pagina;

  // Log para depuración: mostrar estados y contactos
  const ticketsRaw = resultado.tickets || resultado.issues || resultado.data || [];
  console.log('🔎 Tickets recibidos:', ticketsRaw.map(t => ({id: t.id, estado: t.status?.name, contact: t.contact?.id, author: t.author?.id})));

  // Mejorar filtro: aceptar variantes de estado
  const estadoVariantes = {
    'nueva': ['nueva', 'nuevo'],
    'en curso': ['en curso', 'en proceso']
  };
  const estadoBuscado = estadoRedmine.trim().toLowerCase();
  const variantes = estadoVariantes[estadoBuscado] || [estadoBuscado];

  // Filtrar por estado (aceptando variantes) y número de contacto (senderId)
  const senderIdNum = _senderId.replace(/[^\d]/g, '');
  const tickets = ticketsRaw.filter(t => {
    const estadoTicket = t.status?.name?.trim().toLowerCase();
    const celularField = t.custom_fields?.find(f => f.value && f.value.replace(/[^\d]/g, '') === senderIdNum);
    return (
      estadoTicket && variantes.includes(estadoTicket) &&
      celularField
    );
  });

  let ticketsFormateados = '';
  if (Array.isArray(tickets) && tickets.length > 0) {
    ticketsFormateados = tickets.map(t =>
      `🎫 Ticket ID: ${t.id}\n✏️ Asunto: ${t.subject}\n👤 Técnico: ${t.assigned_to?.name || 'Sin asignar'}\n📊 ${t.status?.name || 'Sin estado'}\n`
    ).join('\n');
  } else {
    ticketsFormateados = 'No se encontraron tickets en esta página.';
  }

  // Opciones de navegación (actualizada: 3=Salir, 4=Siguiente, 5=Anterior)
  let opciones = '\nOpciones:';
  const ticketsPorPagina = 5;
  const hayMasPaginas = tickets.length > ticketsPorPagina;
  if (pagina === 1 && hayMasPaginas) {
    opciones += '\n3️⃣ Salir\n4️⃣ Siguiente';
  } else if (pagina > 1 && hayMasPaginas) {
    opciones += '\n3️⃣ Salir\n4️⃣ Siguiente\n5️⃣ Anterior';
  } else if (pagina > 1 && !hayMasPaginas) {
    opciones += '\n3️⃣ Salir\n5️⃣ Anterior';
  } else {
    opciones += '\n3️⃣ Salir';
  }

  // Mensaje de calificación al finalizar
  let calificacion = '';
  if (!resultado.hayMasPaginas && tickets.length === 0 && pagina > 1) {
    calificacion = '\n\n📝 ¿Cómo calificarías la atención?\n1️⃣ Mala\n2️⃣ Buena\n3️⃣ Muy Buena\n4️⃣ Excelente';
  }

  return `📋 Estos son tus tickets con estado "${estadoRedmine}":\n${ticketsFormateados}\n${opciones}${calificacion}`;
}

// Paginación para tickets generales (sin filtro de estado)
const manejarPaginacionGeneral = async (_senderId: string, pagina: number): Promise<string> => {
  // Si el usuario envía '3' (Salir) en cualquier página, despedir y finalizar
  if (session.estado[_senderId] === 'mostrando_tickets' && session.contexto[_senderId]?.salirSolicitado) {
    session.conversacionFinalizada[_senderId] = true;
    setTimeout(() => limpiarEstado(_senderId), 100);
    return '🤖 T-BOT ha finalizado la conversación. Gracias por comunicarte con nosotros. Saludos.';
  }

  const resultado = await RedmineService.listarIssuesDelProyecto('soporte-tecnico-mpf', 1); // Traer todos los tickets
  const tickets = resultado.tickets || resultado.issues || resultado.data || [];
  const ticketsPorPagina = 5;
  const totalTickets = tickets.length;
  const totalPaginas = Math.ceil(totalTickets / ticketsPorPagina);
  const paginaActual = Math.max(1, Math.min(pagina, totalPaginas));
  session.paginaActual[_senderId] = paginaActual;

  const inicio = (paginaActual - 1) * ticketsPorPagina;
  const fin = inicio + ticketsPorPagina;
  const ticketsPagina = tickets.slice(inicio, fin);

  let ticketsFormateados = '';
  if (Array.isArray(ticketsPagina) && ticketsPagina.length > 0) {
    ticketsFormateados = ticketsPagina.map(t =>
      `🎫 Ticket ID: ${t.id}\n✏️ Asunto: ${t.subject}\n👤 Técnico: ${t.author?.name || t.contact?.name || 'Sin usuario'}\n📊 ${t.status?.name || 'Sin estado'}\n`
    ).join('\n');
  } else {
    ticketsFormateados = 'No se encontraron tickets en esta página.';
  }

  // Opciones de navegación
  let opciones = '\nOpciones:';
  if (paginaActual === 1) {
    opciones += '\n1️⃣ Nuevo\n2️⃣ En curso\n3️⃣ Salir';
    if (totalTickets > ticketsPorPagina) opciones += '\n4️⃣ Siguiente';
  } else {
    opciones += '\n3️⃣ Salir';
    if (fin < totalTickets) opciones += '\n4️⃣ Siguiente';
    opciones += '\n5️⃣ Anterior';
  }

  // Mensaje de calificación al finalizar
  let calificacion = '';
  if (totalTickets === 0 || (paginaActual === totalPaginas && ticketsPagina.length === 0)) {
    calificacion = '\n\n📝 ¿Cómo calificarías la atención?\n1️⃣ Mala\n2️⃣ Buena\n3️⃣ Muy Buena\n4️⃣ Excelente';
  }

  return `📋 Tickets encontrados:\n${ticketsFormateados}\n${opciones}${calificacion}`;
}



