/**
 * Inicializa y ejecuta la lógica principal de la aplicación, incluyendo la conexión a la base de datos,
 * la configuración del proveedor, la creación del bot y el manejo de mensajes.
 *
 * - Se conecta a la base de datos utilizando variables de entorno para la configuración.
 * - Configura el proveedor de mensajería y el flujo del bot.
 * - Maneja mensajes entrantes, incluyendo cancelación y consulta de tickets,
 *   y flujos de confirmación, gestionando el estado de la sesión.
 * - Se integra con Botpress para el procesamiento avanzado de mensajes y respuestas.
 * - Maneja errores de forma controlada y envía mensajes de error a los usuarios si es necesario.
 * - Expone un endpoint HTTP para enviar mensajes mediante solicitudes POST.
 *
 * @async
 * @function main
 * @returns {Promise<void>} Se resuelve cuando el servidor HTTP está iniciado y el bot en funcionamiento.
 */




import { join } from 'path'
import { createBot, createProvider, createFlow } from '@builderbot/bot'
import { PostgreSQLAdapter as Database } from '@builderbot/database-postgres'
import { BaileysProvider as Provider } from '@builderbot/provider-baileys'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import { handleIncomingMessage } from './controllers/intentMapper.controller'
import { BotpressService } from './services/botpress.service'
import { handleTicketFlow, session, limpiarEstado } from './flow/ticket.flow'
import RedmineService from './services/redmine.service'

const PORT = process.env.PORT ?? 3008
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({ path: path.join(process.cwd(), '.env') })
console.log(await RedmineService.listarCamposIssue())
console.log(await RedmineService.listarUsuariosYContactos())
const mainFlow = createFlow([])


const simulateTyping = async (provider: any, to: string, durationMs: number = 1000) => {
  try {
    const socket = provider.getInstance()
    if (socket?.sendPresenceUpdate) {
      await socket.sendPresenceUpdate('composing', `${to}@s.whatsapp.net`)
      await new Promise(resolve => setTimeout(resolve, durationMs))
      await socket.sendPresenceUpdate('paused', `${to}@s.whatsapp.net`)
    }
  } catch (error) {
    console.warn('⚠️ No se pudo simular typing:', error)
  }
}

const sendMessageSafely = async (provider: any, to: string, text: string | undefined) => {
  if (!text) {
    console.warn('⚠️ Intento de enviar mensaje vacío')
    return
  }
  try {
    const typingDuration = Math.min(Math.max(text.length * 50, 1000), 3000)
    await simulateTyping(provider, to, typingDuration)
    await provider.sendMessage(to, text, {})
  } catch (error) {
    console.error('❌ Error al enviar mensaje:', error)
  }
}

const MENSAJE_ERROR = '⚠️ Disculpá, hubo un problema al procesar tu mensaje. Por favor, intentá nuevamente.'

const main = async () => {
  const adapterDB = new Database({
    host: process.env.DB_HOST!,
    port: Number(process.env.DB_PORT!),
    user: process.env.DB_USER!,
    password: process.env.DB_PASS!,
    database: process.env.DB_NAME!,
  })

  const adapterProvider = createProvider(Provider)

  const { handleCtx, httpServer } = await createBot({
    flow: mainFlow,
    provider: adapterProvider,
    database: adapterDB,
  })


  // Helpers y constantes deben estar dentro de main para el scope correcto
  const simulateTyping = async (provider: any, to: string, durationMs: number = 1000) => {
    try {
      const socket = provider.getInstance();
      if (socket?.sendPresenceUpdate) {
        await socket.sendPresenceUpdate('composing', `${to}@s.whatsapp.net`);
        await new Promise(resolve => setTimeout(resolve, durationMs));
        await socket.sendPresenceUpdate('paused', `${to}@s.whatsapp.net`);
      }
    } catch (error) {
      console.warn('⚠️ No se pudo simular typing:', error);
    }
  };

  const sendMessageSafely = async (provider: any, to: string, text: string | undefined) => {
    if (!text) {
      console.warn('⚠️ Intento de enviar mensaje vacío');
      return;
    }
    try {
      const typingDuration = Math.min(Math.max(text.length * 50, 1000), 3000);
      await simulateTyping(provider, to, typingDuration);
      await provider.sendMessage(to, text, {});
    } catch (error) {
      console.error('❌ Error al enviar mensaje:', error);
    }
  };

  const MENSAJE_ERROR = '⚠️ Disculpá, hubo un problema al procesar tu mensaje. Por favor, intentá nuevamente.';

  adapterProvider.on('message', async (ctx) => {
    if (!ctx.fromMe && typeof ctx.body === 'string') {
      const senderId = ctx.from
      const mensajeTexto = ctx.body.trim().toLowerCase()

      try {
        // Verificar si es un nuevo usuario y enviar saludo
        if (!session.contexto[senderId]?.saludoEnviado && !session.contexto[senderId]?.saludoEnProceso) {
          if (!session.contexto[senderId]) session.contexto[senderId] = {}
          session.contexto[senderId].saludoEnProceso = true

          console.log('👋 Enviando saludo a nuevo usuario:', senderId)
          console.log('Mensaje recibido:', mensajeTexto)

          const respuestaBot = await BotpressService.enviarMensaje(senderId, mensajeTexto)
          console.log('🔄 Respuesta de Botpress para saludo:', respuestaBot)

          if (respuestaBot?.responses?.length > 0) {
            await sendMessageSafely(adapterProvider, senderId, respuestaBot.responses[0].text)
          }

          session.contexto[senderId].saludoEnviado = true
          delete session.contexto[senderId].saludoEnProceso
          return
        }

        if (session.contexto[senderId]?.saludoEnProceso) {
          console.log('⌛ Saludo ya en proceso, ignorando mensaje duplicado de:', senderId)
          return
        }

        if (session.estado[senderId] === 'esperando_calificacion') {
          if (/^[1-4]$/.test(mensajeTexto)) {
            const ticketId = session.contexto[senderId].ticketConsultado
            await RedmineService.guardarCalificacion(ticketId, mensajeTexto)

            await sendMessageSafely(
              adapterProvider, 
              senderId, 
              '¡Gracias por tu calificación! 🙏\nTu opinión nos ayuda a mejorar.\nLa conversación ha finalizado.'
            )

            session.conversacionFinalizada[senderId] = true
            limpiarEstado(senderId)
            return
          } else {
            await sendMessageSafely(
              adapterProvider,
              senderId,
              'Por favor, ingresá un número del 1 al 4 para calificar la atención.'
            )
            return
          }
        }

        if (session.estado[senderId] === 'esperando_id_cancelar' && /^\d+$/.test(mensajeTexto)) {
          const respuestaTicket = await handleTicketFlow(senderId, `cancelar_${mensajeTexto}`, {})
          await sendMessageSafely(adapterProvider, senderId, respuestaTicket)
          if (session.conversacionFinalizada[senderId]) {
            limpiarEstado(senderId)
          }
          return
        }

        if (session.estado[senderId] === 'esperando_id_consulta' && /^\d+$/.test(mensajeTexto)) {
          const respuestaTicket = await handleTicketFlow(senderId, mensajeTexto, {})
          await sendMessageSafely(adapterProvider, senderId, respuestaTicket)
          if (session.conversacionFinalizada[senderId]) {
            limpiarEstado(senderId)
          }
          return
        }

        if ((mensajeTexto === 'si' || mensajeTexto === '1') && 
            session.contexto[senderId]?.ultimoMensaje?.includes('¿Deseás generar el ticket?')) {
          const respuestaTicket = await handleTicketFlow(senderId, 'si', session.contexto[senderId])
          await sendMessageSafely(adapterProvider, senderId, respuestaTicket)
          if (session.conversacionFinalizada[senderId]) {
            delete session.estado[senderId]
            delete session.contexto[senderId]
            delete session.conversacionFinalizada[senderId]
          }
          return
        }
      
        const mensajeTransformado = handleIncomingMessage(mensajeTexto, senderId)
        console.log('🔄 Mensaje transformado:', { original: mensajeTexto, transformado: mensajeTransformado })

        if (session.estado[senderId] === 'nodo_confirmar_envio' && mensajeTransformado === 'si') {
          const respuestaTicket = await handleTicketFlow(senderId, mensajeTransformado, session.contexto[senderId])
          await sendMessageSafely(adapterProvider, senderId, respuestaTicket)
          if (session.conversacionFinalizada[senderId]) {
            delete session.estado[senderId]
            delete session.contexto[senderId]
            delete session.conversacionFinalizada[senderId]
          }
          return
        }

        const respuestaBot = await BotpressService.enviarMensaje(senderId, mensajeTransformado)
        if (respuestaBot?.responses?.[0]?.text) {
          if (!session.contexto[senderId]) {
            session.contexto[senderId] = {}
          }
          session.contexto[senderId].ultimoMensaje = respuestaBot.responses[0].text
        }

        if (respuestaBot?.responses?.length > 0) {
          for (const respuesta of respuestaBot.responses) {
            if (respuesta?.text) {
              await sendMessageSafely(adapterProvider, senderId, respuesta.text)
            }
          }
        }

        if (session.conversacionFinalizada[senderId]) {
          console.log('🏁 Finalizando conversación para:', senderId)
          limpiarEstado(senderId)
          return
        }

      } catch (error) {
        console.error('❌ Error en el flujo principal:', error)
        await sendMessageSafely(
          adapterProvider,
          senderId,
          MENSAJE_ERROR
        )
      }
    }
  })

  adapterProvider.server.post(
    '/v1/messages',
    handleCtx(async (bot, req, res) => {
      const { number, message, urlMedia } = req.body
      await bot.sendMessage(number, message, { media: urlMedia ?? null });
      return res.end('sended');
    })
  );

  httpServer(+PORT);
};

main();
