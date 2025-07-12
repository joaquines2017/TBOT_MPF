/**
 * Maneja un mensaje entrante del usuario y determina la siguiente acción o estado en el flujo conversacional.
 * 
 * Esta función procesa el mensaje del usuario según su estado actual de conversación (`nodoActual`)
 * y actualiza el estado de la sesión en consecuencia. Mapea la entrada del usuario a intenciones o categorías específicas,
 * facilitando un flujo conversacional de varios pasos para la gestión de tickets (por ejemplo, generar, consultar,
 * cancelar o reabrir tickets, así como manejar subcategorías de problemas).
 * 
 * @param mensaje - El mensaje recibido del usuario.
 * @param senderId - El identificador único del usuario/sesión.
 * @returns Un string que representa la intención mapeada, acción, o el mensaje original si no se encuentra un mapeo.
 */

import { session } from "../flow/ticket.flow"


export function handleIncomingMessage(mensaje: string, senderId: string): string {
  const mensajeLimpio = mensaje.trim().toLowerCase()
  const nodoActual = session.estado[senderId] || 'nodo_saludo'
  
  // Logging mejorado
  console.log('🎯 Estado actual:', { 
    nodoActual, 
    mensajeLimpio,
    contexto: session.contexto[senderId],
    conversacionFinalizada: session.conversacionFinalizada[senderId]
  })

  // Reset de conversación finalizada
  if (session.conversacionFinalizada[senderId]) {
    limpiarEstado(senderId)
    return mensajeLimpio
  }

  switch (nodoActual) {
    case 'nodo_saludo': {
      if (mensajeLimpio === '1' || mensajeLimpio.includes('generar')) {
       session.estado[senderId] = 'esperando_categoria'
        return 'generar'  // Enviar a Botpress para mostrar categorías
      }
      if (mensajeLimpio === '2' || mensajeLimpio.includes('consultar')) {
        session.estado[senderId] = 'esperando_id_consulta'
        return 'consultar'
      }
      if (mensajeLimpio === '3' || mensajeLimpio.includes('cancelar')) {
        session.estado[senderId] = 'esperando_id_cancelar'
        return 'rechazar ticket'
      }
      if (mensajeLimpio === '4' || mensajeLimpio.includes('ver')) {
        return 'ver_todos'
      }
      if (mensajeLimpio === '5' || mensajeLimpio.includes('ayuda')) {
        return 'ayuda'
      }
      return mensajeLimpio // Default return for nodo_saludo
    }

    case 'esperando_categoria': {
      if (mensajeLimpio === '1' || mensajeLimpio.includes('impresora')) {
        session.estado[senderId] = 'subcat_impresora'
        return 'impresora'
      }
      if (mensajeLimpio === '2' || mensajeLimpio.includes('pc')) {
        session.estado[senderId] = 'subcat_pc'
        return 'problema pc'
      }
      if (mensajeLimpio === '3' || mensajeLimpio.includes('teléfono')) {
        session.estado[senderId] = 'subcat_telefonoip'
        return 'problema teléfono ip'
      }
      if (mensajeLimpio === '4' || mensajeLimpio.includes('cámara')) {
        session.estado[senderId] = 'subcat_camara'
        return 'problema cámara'
      }
      if (mensajeLimpio === '5' || mensajeLimpio.includes('audiencia')) {
        session.estado[senderId] = 'subcat_audiencia'
        return 'problema audiencia'
      }
      if (mensajeLimpio === '6') {
        session.estado[senderId] = 'nodo_saludo'
        return 'volver al menú principal'
      }
      return mensajeLimpio // Default return for esperando_categoria
    }

    // Subcategorías de impresora
    case 'subcat_impresora': {
      if (mensajeLimpio === '1') return 'Mo imprime'
      if (mensajeLimpio === '2') return 'Imprime borroso'
      if (mensajeLimpio === '3') return 'Atasco de papel'
      if (mensajeLimpio === '4') return 'Imprime símbolos raros'
      if (mensajeLimpio === '5') return 'Ruidos extraños'
      if (mensajeLimpio === '6') return 'Otro problema de impresora'
      if (mensajeLimpio === '7') {
        session.estado[senderId] = 'esperando_categoria'
        return 'volver a categoría'
      }
      break
    }

    // Subcategorías de PC
    case 'subcat_pc': {
      if (mensajeLimpio === '1') return 'PC no enciende'
      if (mensajeLimpio === '2') return 'PC lenta'
      if (mensajeLimpio === '3') return 'Problema con programas'
      if (mensajeLimpio === '4') return 'Se reinicia sola'
      if (mensajeLimpio === '5') return 'No reconoce dispositivos'
      if (mensajeLimpio === '6') return 'Otro problema pc'
      if (mensajeLimpio === '7') {
        session.estado[senderId] = 'esperando_categoria'
        return 'volver a categoría'
      }
      break
    }

    // Subcategorías de teléfono IP
    case 'subcat_telefonoip': {
      if (mensajeLimpio === '1') return 'No tiene tono'
      if (mensajeLimpio === '2') return 'No recibe llamadas'
      if (mensajeLimpio === '3') return 'No emite llamadas'
      if (mensajeLimpio === '4') return 'No tiene red'
      if (mensajeLimpio === '5') return 'Interferencia o cortes'
      if (mensajeLimpio === '6') return 'Otro problema teléfono ip'
      if (mensajeLimpio === '7') {
        session.estado[senderId] = 'esperando_categoria'
        return 'volver a categoría'
      }
      break
    }

    // Subcategorías de cámara
    case 'subcat_internet': {
      if (mensajeLimpio === '1') return 'No navega'
      if (mensajeLimpio === '2') return 'No puedo acceder a sitios web'
      if (mensajeLimpio === '3') return 'Internet lento'
      if (mensajeLimpio === '4') return 'Internet intermitente'
      if (mensajeLimpio === '5') return 'Otro problema de internet'
      if (mensajeLimpio === '6') {
        session.estado[senderId] = 'esperando_categoria'
        return 'volver a categoría'
      }
      break
    }

    // Subcategorías de audiencia
    case 'subcat_audiencia': {
      if (mensajeLimpio === '1') return 'No funciona micrófono'
      if (mensajeLimpio === '2') return 'No se escucha'
      if (mensajeLimpio === '3') return 'Problemas de audio'
      if (mensajeLimpio === '4') return 'No se ve video'
      if (mensajeLimpio === '5') return 'Pantalla negra'
      if (mensajeLimpio === '6') return 'Otro problema audiencia'
      if (mensajeLimpio === '7') {
        session.estado[senderId] = 'esperando_categoria'
        return 'volver a categoría'
      }
      break
    }

    // Confirmación de envío
    case 'nodo_confirmar_envio': {
      if (mensajeLimpio === '1' || mensajeLimpio === 'si') {
        return 'confirmar'
      }
      if (mensajeLimpio === '2' || mensajeLimpio === 'no') {
        limpiarEstado(senderId)
        return 'cancelar'
      }
      break
    }

    case 'esperando_id_consulta': {
      if (/^\d+$/.test(mensajeLimpio)) {
        const ticketId = parseInt(mensajeLimpio)
        return `consultar_${ticketId}`
      }
      return mensajeLimpio
    }
    case 'esperando_id_cancelar': {
      if (/^\d+$/.test(mensajeLimpio)) {
        const ticketId = parseInt(mensajeLimpio)
        session.contexto[senderId] = { ticketId }
        return `cancelar_${ticketId}`
      }
      return mensajeLimpio
    }

    // Mapeo de categorías a subcategorías
    case 'esperando_categoria_map': {
      const categorias = {
        '1': 'problema_impresora',
        '2': 'problema_pc',
        '3': 'problema_telefono',
        '4': 'problema_camara',
        '5': 'problema_audiencia'
      }
      const categoria = categorias[mensajeLimpio]
      if (categoria) {
        session.estado[senderId] = `subcat_${categoria}`
        return categoria
      }
      return mensajeLimpio
    }

    case 'esperando_calificacion': {
      if (/^[1-4]$/.test(mensajeLimpio)) {
        return mensajeLimpio // Retornar solo el número
      }
      return 'calificacion_invalida'
    }

    // Si no hay mapeo específico, devolver el mensaje original
    return mensajeLimpio
}

function limpiarEstado(senderId: string) {
  session.estado[senderId] = 'nodo_saludo'
  session.contexto[senderId] = {}
  delete session.conversacionFinalizada[senderId]
}
}