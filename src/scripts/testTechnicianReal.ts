/**
 * Script para probar notificación de técnico usando la infraestructura existente
 */

// Importar servicio de notificaciones existente
import TechnicianNotificationService from '../services/technicianNotification.service'
import RedmineService from '../services/redmine.service'

// Crear un mock provider para la prueba
const mockProvider = {
  sendMessage: async (to: string, message: string, options: any) => {
    console.log('\n🎯 === SIMULANDO ENVÍO DE WHATSAPP ===')
    console.log(`📱 Para: ${to}`)
    console.log(`💬 Mensaje:`)
    console.log('─'.repeat(50))
    console.log(message)
    console.log('─'.repeat(50))
    console.log('✅ Mensaje enviado (simulado)')
    return { success: true }
  }
}

async function testTechnicianNotification() {
  console.log('🧪 === PRUEBA DE NOTIFICACIÓN A TÉCNICO ===')
  
  try {
    // 1. Obtener lista de técnicos
    console.log('👥 Obteniendo técnicos del grupo Soporte IT...')
    const technicians = await RedmineService.obtenerMiembrosSoporteIT()
    
    if (technicians.length === 0) {
      console.log('❌ No se encontraron técnicos')
      return
    }
    
    console.log(`✅ Encontrados ${technicians.length} técnicos:`)
    technicians.forEach(tech => {
      console.log(`   - ${tech.name} (ID: ${tech.id})`)
    })
    
    // 2. Probar búsqueda de teléfono para cada técnico
    console.log('\n📞 Probando búsqueda de teléfonos...')
    
    for (const tech of technicians) {
      console.log(`\n🔍 Técnico: ${tech.name} (ID: ${tech.id})`)
      
      try {
        const phone = await RedmineService.getTechnicianPhone(tech.id)
        
        if (phone) {
          console.log(`   ✅ Teléfono encontrado: ${phone}`)
          
          // Si es el número de prueba, hacer prueba específica
          if (phone.includes('5493815978765')) {
            console.log('   🎯 ¡Es el número de prueba! Probando notificación...')
            
            // Crear ticket de prueba
            const mockTicket = {
              id: 99999,
              subject: 'PRUEBA - Notificación automática de técnico',
              author: { name: 'Sistema de Pruebas' },
              priority: { name: 'Normal' },
              status: { name: 'Nuevo' },
              project: { name: 'Soporte Tecnico MPF' },
              description: 'Este es un ticket de prueba para verificar las notificaciones automáticas a técnicos.',
              created_on: new Date().toISOString()
            }
            
            // Crear instancia del servicio para la prueba
            const notificationService = new TechnicianNotificationService(RedmineService, mockProvider)
            
            // Simular notificación
            await notificationService.notifyTicketAssigned(99999, tech.id)
          }
        } else {
          console.log('   ❌ No se encontró teléfono')
        }
      } catch (error) {
        console.log(`   ❌ Error: ${error.message}`)
      }
    }
    
  } catch (error) {
    console.error('❌ Error en la prueba:', error.message)
  }
}

// Función para probar con número específico
async function testSpecificPhone() {
  console.log('\n🎯 === PRUEBA CON NÚMERO ESPECÍFICO ===')
  
  const testPhone = '5493815978765'
  const testMessage = 'hola'
  
  console.log(`📱 Probando envío a: ${testPhone}`)
  console.log(`💬 Mensaje: "${testMessage}"`)
  
  try {
    await mockProvider.sendMessage(testPhone, testMessage, {})
    console.log('✅ Prueba de envío completada')
  } catch (error) {
    console.error('❌ Error en envío:', error.message)
  }
}

// Función principal
async function runTest() {
  console.log('🚀 INICIANDO PRUEBAS DE NOTIFICACIÓN DE TÉCNICOS')
  console.log('='.repeat(60))
  
  await testTechnicianNotification()
  await testSpecificPhone()
  
  console.log('\n✨ PRUEBAS COMPLETADAS')
  console.log('📝 Verifica los logs para ver los resultados')
}

// Ejecutar si se llama directamente
if (require.main === module) {
  runTest().catch(console.error)
}

export { runTest, testTechnicianNotification, testSpecificPhone }
