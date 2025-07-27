/**
 * Script de prueba simple para envío de WhatsApp
 * Prueba específica para verificar envío al técnico 5493815978765
 */

import { createBot, createFlow, createProvider } from '@builderbot/bot'
import { BaileysProvider as Provider } from '@builderbot/provider-baileys'
import { MemoryDB as Database } from '@builderbot/bot'

// Configuración de prueba
const TEST_PHONE = '5493815978765'
const TEST_MESSAGE = 'hola'

async function simpleSendTest() {
  console.log('🧪 INICIANDO PRUEBA DE ENVÍO WHATSAPP')
  console.log(`📱 Número: ${TEST_PHONE}`)
  console.log(`💬 Mensaje: "${TEST_MESSAGE}"`)
  
  try {
    // Crear componentes básicos
    const adapterFlow = createFlow([])
    const adapterDB = new Database()
    const adapterProvider = createProvider(Provider, {
      name: 'test-bot',
      gifPlayback: false
    })
    
    console.log('🔄 Inicializando bot...')
    
    // Crear bot
    const bot = await createBot({
      flow: adapterFlow,
      provider: adapterProvider,
      database: adapterDB
    })
    
    console.log('✅ Bot creado')
    
    // Esperar a que esté listo
    await new Promise((resolve) => {
      adapterProvider.on('ready', () => {
        console.log('✅ WhatsApp conectado')
        resolve(true)
      })
      
      // Timeout de seguridad
      setTimeout(() => {
        console.log('⏰ Continuando sin esperar conexión completa...')
        resolve(true)
      }, 15000)
    })
    
    console.log('📤 Enviando mensaje de prueba...')
    
    // Enviar mensaje
    await adapterProvider.sendMessage(TEST_PHONE, TEST_MESSAGE, {})
    
    console.log('✅ Mensaje enviado exitosamente')
    console.log('📱 Verifica el WhatsApp para confirmar recepción')
    
    // Esperar antes de cerrar
    await new Promise(resolve => setTimeout(resolve, 3000))
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
  
  console.log('🏁 Prueba finalizada')
  process.exit(0)
}

// Ejecutar prueba
if (require.main === module) {
  simpleSendTest()
}

export { simpleSendTest }
