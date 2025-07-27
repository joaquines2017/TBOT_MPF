/**
 * Script de demostración y utilidades para el sistema de notificaciones
 * Permite verificar el estado del monitoreo y obtener estadísticas
 */

import TechnicianNotificationService from '../services/technicianNotification.service'
import RedmineService from '../services/redmine.service'

/**
 * Muestra estadísticas del sistema de notificaciones
 */
export async function showNotificationStats(notificationService?: InstanceType<typeof TechnicianNotificationService>) {
  console.log('\n📊 === ESTADÍSTICAS DEL SISTEMA DE NOTIFICACIONES ===')
  
  try {
    if (notificationService) {
      // Obtener estadísticas de monitoreo si hay una instancia activa
      const stats = notificationService.getMonitoringStatus()
      
      console.log(`\n🔄 Estado del monitoreo: ${stats.isActive ? '✅ Activo' : '❌ Inactivo'}`)
      console.log(`📅 Última verificación: ${stats.lastCheck.toLocaleString('es-AR')}`)
      console.log(`� Notificaciones enviadas: ${stats.notifiedTicketsCount}`)
    } else {
      console.log('\n⚠️ No hay instancia activa del servicio de notificaciones')
    }
    
    // Obtener lista de técnicos disponibles
    const members = await RedmineService.obtenerMiembrosSoporteIT()
    console.log(`\n👥 Total de técnicos disponibles: ${members.length}`)
    
    for (const member of members) {
      const phone = await RedmineService.getTechnicianPhone(member.id)
      console.log(`   - ${member.name} (ID: ${member.id}) - Tel: ${phone || 'No encontrado'}`)
    }
    
  } catch (error: any) {
    console.error('❌ Error obteniendo estadísticas:', error.message)
  }
}

/**
 * Función para probar notificaciones manualmente
 */
export async function testNotification(technicianId: number, notificationService: InstanceType<typeof TechnicianNotificationService>) {
  console.log(`\n🧪 === PRUEBA DE NOTIFICACIÓN PARA TÉCNICO ${technicianId} ===`)
  
  try {
    // Usar el servicio de notificaciones instanciado
    await notificationService.notifyTicketAssigned(9999, technicianId)
    console.log('✅ Notificación de prueba enviada correctamente')
    
  } catch (error: any) {
    console.error('❌ Error enviando notificación de prueba:', error.message)
  }
}

/**
 * Exportar funciones principales para uso desde consola
 */
export default {
  showStats: showNotificationStats,
  testNotification,
  TechnicianNotificationService
}
