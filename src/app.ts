
import { join } from 'path'
import { createBot, createProvider, createFlow } from '@builderbot/bot'
import { PostgreSQLAdapter as Database } from '@builderbot/database-postgres'
import { BaileysProvider as Provider } from '@builderbot/provider-baileys'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import BotSessionService from './services/botSession.service'
import { BotpressService } from './services/botpress.service'
import { handleTicketFlow, session, limpiarEstado } from './flow/ticket.flow'
import RedmineService from './services/redmine.service'
import { handleIncomingMessage, sincronizarEstadoBotpress } from './controllers/intentMapper.controller'
import DataService from './services/data.service'

// Configurar dotenv ANTES de usar process.env
console.log('📁 Buscando .env en:', path.join(process.cwd(), '.env'))
dotenv.config({ path: path.join(process.cwd(), '.env') })
console.log('✅ dotenv.config() ejecutado')

// Debug: verificar variables de entorno
console.log('🔍 Variables de entorno cargadas:')
console.log('DB_HOST:', process.env.DB_HOST)
console.log('DB_PORT:', process.env.DB_PORT)
console.log('DB_USER:', process.env.DB_USER)
console.log('DB_PASS:', process.env.DB_PASS ? '***' : 'undefined')
console.log('DB_NAME:', process.env.DB_NAME)

const PORT = process.env.PORT ?? 3008
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const mainFlow = createFlow([])

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
      
      // Guardar mensaje saliente en historial
      await DataService.saveMessage(to, text, 'outgoing');
    } catch (error) {
      console.error('❌ Error al enviar mensaje:', error);
    }
  };

  const MENSAJE_ERROR = '⚠️ Disculpá, hubo un problema al procesar tu mensaje. Por favor, intentá nuevamente.';

  adapterProvider.on('message', async (ctx) => {
    if (!ctx.fromMe && typeof ctx.body === 'string') {
      const senderId = ctx.from
      const mensajeTexto = ctx.body.trim().toLowerCase()

      // --- SESIÓN PERSISTENTE EN BASE DE DATOS ---
      // 1. Crear/actualizar contacto
      await DataService.getOrCreateContact(senderId);
      
      // 2. Guardar mensaje entrante en historial
      await DataService.saveMessage(senderId, ctx.body, 'incoming');
      
      // 3. Obtener o crear sesión en la base de datos
      let dbSession = await BotSessionService.getSessionByPhone(senderId);
      if (!dbSession) {
        dbSession = await BotSessionService.createOrUpdateSession(senderId, { currentNode: 'inicio', history: [] });
      }
      const dbState = (dbSession.values as { [key: string]: any }) || {};
      dbState.lastInput = mensajeTexto;
      dbState.history = Array.isArray(dbState.history) ? [...dbState.history, mensajeTexto] : [mensajeTexto];
      try {
        // 1. Calificación siempre primero: BuilderBot debe capturarla antes que cualquier otro flujo
        if (session.estado[senderId] === 'esperando_calificacion') {
          const respuestaTicket = await handleTicketFlow(senderId, mensajeTexto, session.contexto[senderId] || {})
          await sendMessageSafely(adapterProvider, senderId, respuestaTicket)
          if (session.conversacionFinalizada[senderId]) {
            limpiarEstado(senderId)
          }
          // Guardar estado actualizado en la base de datos
          dbState.currentNode = 'calificacion';
          await BotSessionService.updateSessionValues(senderId, dbState);
          await BotSessionService.updateLastInteraction(senderId);
          return
        }

        // 2. Saludo a nuevo usuario
        if (!session.contexto[senderId]?.saludoEnviado && !session.contexto[senderId]?.saludoEnProceso) {
          if (!session.contexto[senderId]) session.contexto[senderId] = {}
          session.contexto[senderId].saludoEnProceso = true

          console.log('👋 Enviando saludo a nuevo usuario:', senderId)
          console.log('Mensaje recibido:', mensajeTexto)

          const respuestaBot = await BotpressService.enviarMensaje(senderId, mensajeTexto)
          //console.log('🔄 Respuesta de Botpress para saludo:', respuestaBot)

          if (respuestaBot?.responses?.length > 0) {
            await sendMessageSafely(adapterProvider, senderId, respuestaBot.responses[0].text)
          }

          session.contexto[senderId].saludoEnviado = true
          delete session.contexto[senderId].saludoEnProceso
          // Guardar estado actualizado en la base de datos
          dbState.currentNode = 'saludo';
          await BotSessionService.updateSessionValues(senderId, dbState);
          await BotSessionService.updateLastInteraction(senderId);
          return
        }

        if (session.contexto[senderId]?.saludoEnProceso) {
          console.log('⌛ Saludo ya en proceso, ignorando mensaje duplicado de:', senderId)
          return
        }

        // 3. Cancelar ticket
        if (session.estado[senderId] === 'esperando_id_cancelar' && /^\d+$/.test(mensajeTexto)) {
          const respuestaTicket = await handleTicketFlow(senderId, `cancelar_${mensajeTexto}`, {})
          await sendMessageSafely(adapterProvider, senderId, respuestaTicket)
          if (session.conversacionFinalizada[senderId]) {
            limpiarEstado(senderId)
          }
          dbState.currentNode = 'cancelar_ticket';
          await BotSessionService.updateSessionValues(senderId, dbState);
          await BotSessionService.updateLastInteraction(senderId);
          return
        }

        // 4. Consultar ticket
        if (session.estado[senderId] === 'esperando_id_consulta' && /^\d+$/.test(mensajeTexto)) {
          const respuestaTicket = await handleTicketFlow(senderId, mensajeTexto, {})
          await sendMessageSafely(adapterProvider, senderId, respuestaTicket)
          if (session.conversacionFinalizada[senderId]) {
            limpiarEstado(senderId)
          }
          dbState.currentNode = 'consultar_ticket';
          await BotSessionService.updateSessionValues(senderId, dbState);
          await BotSessionService.updateLastInteraction(senderId);
          return
        }

        // 5. Confirmar generación de ticket
        if ((mensajeTexto === 'si' || mensajeTexto === '1') && 
            session.contexto[senderId]?.ultimoMensaje?.includes('¿Deseás generar el ticket?')) {
          const respuestaTicket = await handleTicketFlow(senderId, 'si', session.contexto[senderId])
          await sendMessageSafely(adapterProvider, senderId, respuestaTicket)
          if (session.conversacionFinalizada[senderId]) {
            delete session.estado[senderId]
            delete session.contexto[senderId]
            delete session.conversacionFinalizada[senderId]
          }
          dbState.currentNode = 'ticket_generado';
          await BotSessionService.updateSessionValues(senderId, dbState);
          await BotSessionService.updateLastInteraction(senderId);
          
          return
        }


      // 6. Procesamiento normal: mapping de intents y Botpress
      // Si el usuario responde '3' en los estados de tickets, BuilderBot debe capturar y NO pasar a Botpress
      if ((mensajeTexto === '3') && (session.estado[senderId] === 'mostrando_tickets' || session.estado[senderId] === 'paginando_tickets')) {
        console.log('🚫 [DEBUG] Opción 3=Salir capturada por BuilderBot. Estado:', session.estado[senderId]);
        const respuestaTicket = await handleTicketFlow(senderId, '3', session.contexto[senderId] || {});
        await sendMessageSafely(adapterProvider, senderId, respuestaTicket);
        if (session.conversacionFinalizada[senderId]) {
          limpiarEstado(senderId);
        }
        return;
      }

      // Si el último mensaje fue el menú de estados y el usuario responde '1' o '2', BuilderBot captura SIEMPRE y NO pasa a Botpress
      if (session.contexto[senderId]?.ultimoMensaje?.includes('Elija el estado de los tickets') && (mensajeTexto === '1' || mensajeTexto === '2')) {
        const intentEstado = mensajeTexto === '1' ? 'nuevo' : 'en_proceso';
        console.log('🔄 Capturado por BuilderBot:', { original: mensajeTexto, transformado: intentEstado });
        const respuestaTicket = await handleTicketFlow(senderId, intentEstado, session.contexto[senderId] || {});
        await sendMessageSafely(adapterProvider, senderId, respuestaTicket);
        if (session.conversacionFinalizada[senderId]) {
          limpiarEstado(senderId);
        }
        return;
      }

      // Procesos normales de BuilderBot
      // MAPEO DE INTENTS: Usar el controlador intentMapper para transformar opciones numéricas a texto
      const mensajeTransformado = handleIncomingMessage(mensajeTexto, senderId);
      const intentFinal = mensajeTransformado;
      console.log('🔄 Mensaje transformado:', { original: mensajeTexto, transformado: intentFinal });

      // Actualizar estado en base de datos después de procesar con intent mapper
      if (session.estado[senderId]) {
        dbState.currentNode = session.estado[senderId];
        await BotSessionService.updateSessionValues(senderId, dbState);
      }

      if (
        (intentFinal === 'siguiente' && session.estado[senderId] === 'mostrando_tickets') ||
        (intentFinal === 'salir' && session.estado[senderId] === 'mostrando_tickets')
      ) {
        const respuestaTicket = await handleTicketFlow(senderId, intentFinal, session.contexto[senderId] || {});
        await sendMessageSafely(adapterProvider, senderId, respuestaTicket);
        if (session.conversacionFinalizada[senderId]) {
          limpiarEstado(senderId);
        }
        return;
      }

        if (session.estado[senderId] === 'nodo_confirmar_envio' && mensajeTransformado === 'si') {
          const respuestaTicket = await handleTicketFlow(senderId, mensajeTransformado, session.contexto[senderId])
          await sendMessageSafely(adapterProvider, senderId, respuestaTicket)
          if (session.conversacionFinalizada[senderId]) {
            delete session.estado[senderId]
            delete session.contexto[senderId]
            delete session.conversacionFinalizada[senderId]
          }
          dbState.currentNode = 'confirmar_envio';
          await BotSessionService.updateSessionValues(senderId, dbState);
          await BotSessionService.updateLastInteraction(senderId);
          return
        }

        const respuestaBot = await BotpressService.enviarMensaje(senderId, mensajeTransformado)
        
        // Sincronizar estado con Botpress si se recibieron variables de sesión
        if (respuestaBot?.estado || respuestaBot?.responses?.[0]?.text) {
          sincronizarEstadoBotpress(
            senderId, 
            respuestaBot.estado, 
            respuestaBot.responses?.[0]?.text
          );
        }
        
        if (respuestaBot?.responses?.[0]?.text) {
          if (!session.contexto[senderId]) {
            session.contexto[senderId] = {}
          }
          session.contexto[senderId].ultimoMensaje = respuestaBot.responses[0].text
          dbState.ultimoMensaje = respuestaBot.responses[0].text;
          
          // Actualizar estado en base de datos
          if (session.estado[senderId]) {
            dbState.currentNode = session.estado[senderId];
          }
          
          await BotSessionService.updateSessionValues(senderId, dbState);
          await BotSessionService.updateLastInteraction(senderId);
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
            await bot.sendMessage(number, message, { media: urlMedia ?? null })
            return res.end('sended')
        })
    )

    adapterProvider.server.post(
        '/v1/register',
        handleCtx(async (bot, req, res) => {
            const { number, name } = req.body
            await bot.dispatch('REGISTER_FLOW', { from: number, name })
            return res.end('trigger')
        })
    )

    adapterProvider.server.post(
        '/v1/samples',
        handleCtx(async (bot, req, res) => {
            const { number, name } = req.body
            await bot.dispatch('SAMPLES', { from: number, name })
            return res.end('trigger')
        })
    )

    adapterProvider.server.post(
        '/v1/blacklist',
        handleCtx(async (bot, req, res) => {
            const { number, intent } = req.body
            if (intent === 'remove') bot.blacklist.remove(number)
            if (intent === 'add') bot.blacklist.add(number)

            res.writeHead(200, { 'Content-Type': 'application/json' })
            return res.end(JSON.stringify({ status: 'ok', number, intent }))
        })
    )

    httpServer(+PORT)
}

main()
