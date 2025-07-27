/**
 * Script de prueba para el sistema de notificaciones de técnicos
 */

import chalk from 'chalk'
import RedmineService from '../services/redmine.service'
import TechnicianNotificationService from '../services/technicianNotification.service'

async function testTechnicianPhoneLookup() {
  console.log(chalk.blue('\n🧪 === PRUEBA DE BÚSQUEDA DE TELÉFONOS DE TÉCNICOS ==='))
  
  try {
    // Obtener lista de técnicos del grupo Soporte IT
    const technicians = await RedmineService.obtenerMiembrosSoporteIT()
    console.log(chalk.cyan(`\n👥 Técnicos encontrados: ${technicians.length}`))
    
    for (const tech of technicians) {
      console.log(chalk.white(`\n🔍 Probando técnico: ${tech.name} (ID: ${tech.id})`))
      
      // Buscar teléfono
      const phone = await RedmineService.getTechnicianPhone(tech.id)
      
      if (phone) {
        console.log(chalk.green(`  ✅ Teléfono encontrado: ${phone}`))
      } else {
        console.log(chalk.red(`  ❌ No se encontró teléfono`))
      }
    }
    
  } catch (error: any) {
    console.error(chalk.red('❌ Error en prueba:'), error.message)
  }
}

async function testNotificationMessage() {
  console.log(chalk.blue('\n🧪 === PRUEBA DE FORMATO DE MENSAJE ==='))
  
  // Simular datos de ticket de prueba
  const mockTicket = {
    id: 9999,
    subject: 'Problema con impresora - PRUEBA',
    author: { name: 'Usuario de Prueba' },
    priority: { name: 'Alta' },
    status: { name: 'Nuevo' },
    project: { name: 'Soporte Tecnico MPF' },
    description: 'Esta es una descripción de prueba para verificar el formato del mensaje de notificación.',
    created_on: new Date().toISOString()
  }
  
  // Acceder al método privado usando reflexión para pruebas
  const message = (TechnicianNotificationService as any).formatTicketAssignedMessage(mockTicket)
  
  console.log(chalk.yellow('\n📱 Mensaje que se enviaría por WhatsApp:'))
  console.log(chalk.white('─'.repeat(50)))
  console.log(chalk.white(message))
  console.log(chalk.white('─'.repeat(50)))
}

async function testFullNotificationFlow() {
  console.log(chalk.blue('\n🧪 === PRUEBA DEL FLUJO COMPLETO DE NOTIFICACIÓN ==='))
  
  try {
    // Obtener un técnico para la prueba
    const technicians = await RedmineService.obtenerMiembrosSoporteIT()
    
    if (technicians.length === 0) {
      console.log(chalk.red('❌ No se encontraron técnicos para la prueba'))
      return
    }
    
    const techTest = technicians[0]
    console.log(chalk.cyan(`\n👤 Usando técnico de prueba: ${techTest.name} (ID: ${techTest.id})`))
    
    // Verificar teléfono
    const phone = await RedmineService.getTechnicianPhone(techTest.id)
    
    if (!phone) {
      console.log(chalk.red(`❌ El técnico ${techTest.name} no tiene teléfono configurado`))
      return
    }
    
    console.log(chalk.green(`📞 Teléfono encontrado: ${phone}`))
    
    // Simular provider mock para no enviar mensaje real
    const mockProvider = {
      sendMessage: async (to: string, message: string, options: any) => {
        console.log(chalk.blue('\n📱 SIMULACIÓN DE ENVÍO:'))
        console.log(chalk.white(`Para: ${to}`))
        console.log(chalk.white(`Mensaje: ${message.substring(0, 100)}...`))
        console.log(chalk.green('✅ Mensaje enviado exitosamente (simulado)'))
        return { success: true }
      }
    }
    
    // Crear instancia del servicio de notificaciones para la prueba
    const notificationService = new TechnicianNotificationService(RedmineService, mockProvider)
    
    // Probar notificación
    await notificationService.notifyTicketAssigned(9999, techTest.id)
    
  } catch (error: any) {
    console.error(chalk.red('❌ Error en prueba del flujo completo:'), error.message)
  }
}

// Función principal
async function runTests() {
  console.log(chalk.magenta('🚀 INICIANDO PRUEBAS DEL SISTEMA DE NOTIFICACIONES'))
  console.log(chalk.gray('='.repeat(60)))
  
  await testTechnicianPhoneLookup()
  await testNotificationMessage()
  await testFullNotificationFlow()
  
  console.log(chalk.magenta('\n✨ PRUEBAS COMPLETADAS'))
}

// Ejecutar si se llama directamente
if (require.main === module) {
  runTests().catch(console.error)
}

export { runTests, testTechnicianPhoneLookup, testNotificationMessage, testFullNotificationFlow }
