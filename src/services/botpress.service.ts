/**
 * Envía un mensaje de texto a la API de Botpress para un remitente específico y retorna la respuesta.
 *
 * @param senderId - El identificador único del remitente (usuario) asociado al mensaje.
 * @param message - El mensaje de texto que se enviará a Botpress.
 * @returns Una promesa que resuelve con la respuesta de Botpress, o un objeto vacío si ocurre un error o la respuesta no es JSON válido.
 *
 * @remarks
 * - Muestra en consola el mensaje enviado y la respuesta recibida de Botpress.
 * - Maneja y muestra en consola errores relacionados con la red o respuestas JSON inválidas.
 */

import fetch from 'node-fetch'
import chalk from 'chalk'

const BOTPRESS_URL = 'http://botpress:3000'
const BOT_ID = 'tbotv2' // ⚠️ Verificá que este sea el nombre exacto de tu bot en Botpress CE

interface BotpressResponse {
  responses?: Array<{
    text?: string;
    type: string;
    workflow?: any;
    variations?: string[];
    typing?: boolean;
  }>;
  context?: {
    currentFlow?: string;
    currentNode?: string;
  };
}

export class BotpressService {
  static async enviarMensaje(senderId: string, message: string): Promise<BotpressResponse> {
    console.log(chalk.cyan(`📨 Enviando mensaje a Botpress: { senderId: '${senderId}', message: '${message}' }`))

    try {
      const res = await fetch(`${BOTPRESS_URL}/api/v1/bots/${BOT_ID}/converse/${senderId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'text', text: message })
      })

      const text = await res.text()

      let data: any
      try {
        data = JSON.parse(text)
      } catch (err) {
        console.error(chalk.red('❌ Error: Botpress devolvió una respuesta que no es JSON válido.'))
        console.error(chalk.gray(text.slice(0, 300)))
        return {}
      }

      // Validar respuesta
      if (!data || !Array.isArray(data.responses)) {
        console.warn(chalk.yellow('⚠️ Respuesta de Botpress inválida:'), data)
        return {
          responses: [{
            type: 'text',
            text: '⚠️ Error de comunicación con el bot.'
          }]
        }
      }

      console.log(chalk.greenBright(`📩 Respuesta de Botpress:`))
      console.dir(data, { depth: null, colors: true })

      return data
    } catch (error) {
      console.error(chalk.red('❌ Error inesperado al comunicarse con Botpress:'), error)
      return {
        responses: [{
          type: 'text',
          text: '❌ Error de conexión con el servicio de chat.'
        }]
      }
    }
  }
}
