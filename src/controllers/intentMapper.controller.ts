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

// Función para mapear estados de Botpress a estados locales del intent mapper
export function mapearEstadoBotpress(estadoBotpress: string): string | null {
  const mapeoEstados: { [key: string]: string } = {
    'nodo_saludo': 'nodo_saludo',
    'nodo_generar_ticket': 'esperando_categoria',
    'nodo_cat_impresora': 'subcat_impresora',
    'nodo_cat_pc': 'subcat_pc',
    'nodo_cat_telefonoIP': 'subcat_telefonoip',
    'nodo_cat_internet': 'subcat_internet',
    'nodo_cat_audiencia': 'subcat_audiencia',
    'nodo_confirmar_envio': 'nodo_confirmar_envio',
    'nodo_consultar_ticket': 'esperando_id_consulta',
    'nodo_cancelar_ticket': 'esperando_id_cancelar',
    'nodo_ver_todos_tickets': 'mostrando_tickets',
    'nodo_ayuda': 'nodo_ayuda',
  };
  
  return mapeoEstados[estadoBotpress] || null;
}

// Función para inferir estado basado en la respuesta de Botpress
export function inferirEstadoPorRespuesta(respuestaTexto: string): string | null {
  if (!respuestaTexto) return null;
  
  // Detectar nodos basados en contenido de la respuesta
  if (respuestaTexto.includes('seleccioná la categoría de tu problema')) {
    return 'esperando_categoria';
  }
  if (respuestaTexto.includes('¿Qué problema tenés con la impresora?')) {
    return 'subcat_impresora';
  }
  if (respuestaTexto.includes('¿Qué problema tenés con la PC?')) {
    return 'subcat_pc';
  }
  if (respuestaTexto.includes('¿Qué problema tenés con el teléfono IP?')) {
    return 'subcat_telefonoip';
  }
  if (respuestaTexto.includes('¿Qué problema tenés con internet?')) {
    return 'subcat_internet';
  }
  if (respuestaTexto.includes('¿Qué problema tenés con la audiencia virtual?')) {
    return 'subcat_audiencia';
  }
  if (respuestaTexto.includes('¿Deseás generar el ticket?')) {
    return 'nodo_confirmar_envio';
  }
  if (respuestaTexto.includes('¿Qué te gustaría hacer?')) {
    return 'nodo_saludo';
  }
  if (respuestaTexto.includes('🆘 Estoy para ayudarte') || respuestaTexto.includes('Estas son las opciones disponibles')) {
    return 'nodo_ayuda';
  }
  
  return null;
}

// Función para sincronizar estado local con estado de Botpress
export function sincronizarEstadoBotpress(senderId: string, estadoBotpress?: string, respuestaTexto?: string): boolean {
  let estadoLocal: string | null = null;
  
  // Primero intentar con el estado de Botpress
  if (estadoBotpress) {
    estadoLocal = mapearEstadoBotpress(estadoBotpress);
  }
  
  // Si no funciona, inferir por el contenido de la respuesta
  if (!estadoLocal && respuestaTexto) {
    estadoLocal = inferirEstadoPorRespuesta(respuestaTexto);
  }
  
  if (estadoLocal) {
    session.estado[senderId] = estadoLocal;
    console.log('🔄 Estado sincronizado:', { 
      metodo: estadoBotpress ? 'botpress_variable' : 'inferencia_contenido',
      estadoBotpress: estadoBotpress || 'N/A', 
      estadoLocal,
      respuestaPreview: respuestaTexto?.substring(0, 50) + '...'
    });
    return true;
  }
  
  console.log('⚠️ No se pudo sincronizar el estado');
  return false;
}


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
      // Solo mapear opciones numéricas exactas, NO texto libre
      if (mensajeLimpio === '1') {
        session.estado[senderId] = 'esperando_categoria'
        return 'generar'
      }
      if (mensajeLimpio === '2') {
        session.estado[senderId] = 'esperando_id_consulta'
        return 'consultar'
      }
      if (mensajeLimpio === '3') {
        session.estado[senderId] = 'esperando_id_cancelar'
        return 'rechazar ticket'
      }
      if (mensajeLimpio === '4') {
        return 'ver_todos'
      }
      if (mensajeLimpio === '5') {
        return 'ayuda'
      }
      
      // TODO: texto libre va directamente a Botpress sin transformación
      return mensajeLimpio
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
      if (mensajeLimpio === '4' || mensajeLimpio.includes('Internet')) {
        session.estado[senderId] = 'subcat_internet'
        return 'problema Internet'
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
      if (mensajeLimpio === '1') {
        session.estado[senderId] = 'nodo_confirmar_envio'
        return 'No imprime'
      }
      if (mensajeLimpio === '2') {
        session.estado[senderId] = 'nodo_confirmar_envio'
        return 'Imprime borroso'
      }
      if (mensajeLimpio === '3') {
        session.estado[senderId] = 'nodo_confirmar_envio'
        return 'Atasco de papel'
      }
      if (mensajeLimpio === '4') {
        session.estado[senderId] = 'nodo_confirmar_envio'
        return 'Imprime símbolos raros'
      }
      if (mensajeLimpio === '5') {
        session.estado[senderId] = 'nodo_confirmar_envio'
        return 'Ruidos extraños'
      }
      if (mensajeLimpio === '6') {
        session.estado[senderId] = 'nodo_confirmar_envio'
        return 'Otro problema'
      }
      if (mensajeLimpio === '7') {
        session.estado[senderId] = 'esperando_categoria'
        return 'volver a al menú categorías'
      }
      break
    }

    // Subcategorías de PC
    case 'subcat_pc': {
      if (mensajeLimpio === '1') {
        session.estado[senderId] = 'nodo_confirmar_envio'
        return 'PC no enciende'
      }
      if (mensajeLimpio === '2') {
        session.estado[senderId] = 'nodo_confirmar_envio'
        return 'PC lenta'
      }
      if (mensajeLimpio === '3') {
        session.estado[senderId] = 'nodo_confirmar_envio'
        return 'Problema con programas'
      }
      if (mensajeLimpio === '4') {
        session.estado[senderId] = 'nodo_confirmar_envio'
        return 'Se reinicia sola'
      }
      if (mensajeLimpio === '5') {
        session.estado[senderId] = 'nodo_confirmar_envio'
        return 'No reconoce dispositivos'
      }
      if (mensajeLimpio === '6') {
        session.estado[senderId] = 'nodo_confirmar_envio'
        return 'Otro problema pc'
      }
      if (mensajeLimpio === '7') {
        session.estado[senderId] = 'esperando_categoria'
        return 'volver a al menú categorías'
      }
      break
    }

    // Subcategorías de teléfono IP
    case 'subcat_telefonoip': {
      if (mensajeLimpio === '1') {
        session.estado[senderId] = 'nodo_confirmar_envio'
        return 'No tiene tono'
      }
      if (mensajeLimpio === '2') {
        session.estado[senderId] = 'nodo_confirmar_envio'
        return 'No recibe llamadas'
      }
      if (mensajeLimpio === '3') {
        session.estado[senderId] = 'nodo_confirmar_envio'
        return 'No emite llamadas'
      }
      if (mensajeLimpio === '4') {
        session.estado[senderId] = 'nodo_confirmar_envio'
        return 'No tiene conexión'
      }
      if (mensajeLimpio === '5') {
        session.estado[senderId] = 'nodo_confirmar_envio'
        return 'Otro problema'
      }
      if (mensajeLimpio === '6') {
        session.estado[senderId] = 'esperando_categoria'
        return 'volver a al menú categorías'
      }
      break
    }

    // Subcategorías de Internet
    case 'subcat_internet': {
      if (mensajeLimpio === '1') {
        session.estado[senderId] = 'nodo_confirmar_envio'
        return 'No navega'
      }
      if (mensajeLimpio === '2') {
        session.estado[senderId] = 'nodo_confirmar_envio'
        return 'No puedo acceder a sitios web'
      }
      if (mensajeLimpio === '3') {
        session.estado[senderId] = 'nodo_confirmar_envio'
        return 'Internet lento'
      }
      if (mensajeLimpio === '4') {
        session.estado[senderId] = 'nodo_confirmar_envio'
        return 'Internet intermitente'
      }
      if (mensajeLimpio === '5') {
        session.estado[senderId] = 'nodo_confirmar_envio'
        return 'Otro problema'
      }
      if (mensajeLimpio === '6') {
        session.estado[senderId] = 'esperando_categoria'
        return 'volver a al menú categorías'
      }
      break
    }

    // Subcategorías de audiencia
    case 'subcat_audiencia': {
      if (mensajeLimpio === '1') {
        session.estado[senderId] = 'nodo_confirmar_envio'
        return 'No funciona micrófono'
      }
      if (mensajeLimpio === '2') {
        session.estado[senderId] = 'nodo_confirmar_envio'
        return 'No se escucha sonido'
      }
      if (mensajeLimpio === '3') {
        session.estado[senderId] = 'nodo_confirmar_envio'
        return 'No se ve video'
      }
      if (mensajeLimpio === '4') {
        session.estado[senderId] = 'nodo_confirmar_envio'
        return 'No se conecta a la audiencia'
      }
      if (mensajeLimpio === '5') {
        session.estado[senderId] = 'nodo_confirmar_envio'
        return 'Otro problema'
      }
      if (mensajeLimpio === '6') {
        session.estado[senderId] = 'esperando_categoria'
        return 'volver a al menú categorías'
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
        '4': 'problema_internet',
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

    case 'nodo_ayuda': {
      // Manejo del nodo ayuda - similar al nodo_saludo pero desde ayuda
      if (mensajeLimpio === '1') {
        session.estado[senderId] = 'esperando_categoria'
        return 'generar'
      }
      if (mensajeLimpio === '2') {
        session.estado[senderId] = 'esperando_id_consulta'
        return 'consultar'
      }
      if (mensajeLimpio === '3') {
        session.estado[senderId] = 'esperando_id_cancelar'
        return 'rechazar ticket'
      }
      if (mensajeLimpio === '4') {
        return 'ver_todos'
      }
      if (mensajeLimpio === '5') {
        session.estado[senderId] = 'nodo_saludo'
        return 'menu principal'
      }
      
      // Texto libre va directamente a Botpress
      return mensajeLimpio
    }

   } // Si no hay mapeo específico, devolver el mensaje original
    return mensajeLimpio
}

function limpiarEstado(senderId: string) {
  session.estado[senderId] = 'nodo_saludo'
  session.contexto[senderId] = {}
  delete session.conversacionFinalizada[senderId]
}
