/**
 * Servicio completo de notificaciones para técnicos
 * Gestiona notificaciones automáticas de tickets: asignación, cambios de estado, nuevos tickets
 */

import RedmineService from './redmine.service'

interface TicketEvent {
  type: 'created' | 'assigned' | 'status_changed' | 'priority_changed' | 'updated'
  ticket: any
  previousData?: any
  assignedTo?: number
}

export class TechnicianNotificationService {
  private redmineService: typeof RedmineService
  private provider: any
  private isMonitoring = false
  private monitoringInterval: NodeJS.Timeout | null = null
  private lastCheck: Date = new Date()
  private notifiedTickets: Set<string> = new Set() // Para evitar notificaciones duplicadas

  constructor(redmineService: typeof RedmineService, provider: any) {
    this.redmineService = redmineService
    this.provider = provider
  }

  /**
   * Notificar cuando un ticket es asignado a un técnico
   */
  async notifyTicketAssigned(ticketId: number, technicianId: number) {
    console.log(`📋 Procesando notificación de ticket asignado: #${ticketId} → Técnico ${technicianId}`)

    try {
      // Evitar notificaciones duplicadas
      const notificationKey = `assigned_${ticketId}_${technicianId}`
      if (this.notifiedTickets.has(notificationKey)) {
        console.log(`⚠️ Notificación ya enviada para ticket #${ticketId} al técnico ${technicianId}`)
        return true
      }

      // Obtener datos del ticket desde Redmine
      const ticket = await this.redmineService.getTicketById(ticketId)
      if (!ticket) {
        console.error(`❌ No se pudo obtener el ticket #${ticketId}`)
        return false
      }

      // Obtener teléfono del técnico
      const technicianPhone = await this.redmineService.getTechnicianPhone(technicianId)
      if (!technicianPhone) {
        console.warn(`⚠️ No se encontró teléfono para el técnico ${technicianId}`)
        return false
      }

      // Formatear y enviar mensaje
      const message = this.formatTicketAssignedMessage(ticket)
      const success = await this.sendWhatsAppMessage(technicianPhone, message)

      if (success) {
        console.log(`✅ Notificación enviada al técnico ${technicianId} (${technicianPhone})`)
        this.notifiedTickets.add(notificationKey)
      }

      return success

    } catch (error: any) {
      console.error(`❌ Error al notificar ticket asignado:`, error.message)
      return false
    }
  }

  /**
   * Notificar cambio de estado de ticket
   */
  async notifyTicketStatusChanged(ticketId: number, oldStatus: string, newStatus: string) {
    console.log(`📊 Procesando notificación de cambio de estado: #${ticketId} ${oldStatus} → ${newStatus}`)

    try {
      const notificationKey = `status_${ticketId}_${oldStatus}_${newStatus}`
      if (this.notifiedTickets.has(notificationKey)) {
        console.log(`⚠️ Notificación de cambio de estado ya enviada para ticket #${ticketId}`)
        return true
      }

      const ticket = await this.redmineService.getTicketById(ticketId)
      if (!ticket || !ticket.assigned_to) {
        console.log(`⚠️ Ticket #${ticketId} no tiene técnico asignado`)
        return false
      }

      const technicianPhone = await this.redmineService.getTechnicianPhone(ticket.assigned_to.id)
      if (!technicianPhone) {
        console.warn(`⚠️ No se encontró teléfono para el técnico ${ticket.assigned_to.id}`)
        return false
      }

      const message = this.formatTicketStatusChangeMessage(ticket, oldStatus, newStatus)
      const success = await this.sendWhatsAppMessage(technicianPhone, message)

      if (success) {
        console.log(`✅ Notificación de cambio de estado enviada al técnico ${ticket.assigned_to.id}`)
        this.notifiedTickets.add(notificationKey)
      }

      return success

    } catch (error: any) {
      console.error(`❌ Error al notificar cambio de estado:`, error.message)
      return false
    }
  }

  /**
   * Notificar comentario nuevo en ticket
   */
  async notifyTicketComment(ticketId: number, comment: string, authorName: string) {
    console.log(`💬 Procesando notificación de comentario en ticket #${ticketId}`)

    try {
      const ticket = await this.redmineService.getTicketById(ticketId)
      if (!ticket || !ticket.assigned_to) {
        console.log(`⚠️ Ticket #${ticketId} no tiene técnico asignado`)
        return false
      }

      const technicianPhone = await this.redmineService.getTechnicianPhone(ticket.assigned_to.id)
      if (!technicianPhone) {
        console.warn(`⚠️ No se encontró teléfono para el técnico ${ticket.assigned_to.id}`)
        return false
      }

      const message = this.formatTicketCommentMessage(ticket, comment, authorName)
      const success = await this.sendWhatsAppMessage(technicianPhone, message)

      if (success) {
        console.log(`✅ Notificación de comentario enviada al técnico ${ticket.assigned_to.id}`)
      }

      return success

    } catch (error: any) {
      console.error(`❌ Error al notificar comentario:`, error.message)
      return false
    }
  }

  /**
   * Notificar nuevos tickets pendientes de asignación a supervisores
   */
  async notifyNewUnassignedTickets() {
    console.log(`📋 Verificando tickets nuevos sin asignar...`)

    try {
      // Por ahora, solo enviamos notificación básica
      // TODO: Implementar cuando tengamos el método getUnassignedTickets en RedmineService
      console.log(`✅ Funcionalidad de tickets sin asignar pendiente de implementar`)
      return true

    } catch (error: any) {
      console.error(`❌ Error al notificar tickets nuevos:`, error.message)
      return false
    }
  }

  /**
   * Formatear mensaje de ticket asignado
   */
  private formatTicketAssignedMessage(ticket: any): string {
    const priority = ticket.priority?.name || 'Normal'
    const project = ticket.project?.name || 'Sin proyecto'
    const author = ticket.author?.name || 'Usuario desconocido'
    const createdDate = new Date(ticket.created_on).toLocaleString('es-AR')
    
    return `🎫 *TICKET ASIGNADO*

📋 *Ticket #${ticket.id}*
📝 *Asunto:* ${ticket.subject}
👤 *Solicitante:* ${author}
⚡ *Prioridad:* ${priority}
📊 *Estado:* ${ticket.status?.name || 'Nuevo'}
📁 *Proyecto:* ${project}

📄 *Descripción:*
${ticket.description || 'Sin descripción'}

🕒 *Creado:* ${createdDate}

¡Tienes un nuevo ticket asignado! 👨‍💻

🔗 Ver en Redmine: ${process.env.REDMINE_URL}/issues/${ticket.id}`
  }

  /**
   * Formatear mensaje de cambio de estado
   */
  private formatTicketStatusChangeMessage(ticket: any, oldStatus: string, newStatus: string): string {
    return `📊 *CAMBIO DE ESTADO*

📋 *Ticket #${ticket.id}*
📝 *Asunto:* ${ticket.subject}

🔄 *Estado anterior:* ${oldStatus}
✅ *Estado actual:* ${newStatus}

⚡ *Prioridad:* ${ticket.priority?.name || 'Normal'}
👤 *Solicitante:* ${ticket.author?.name || 'Usuario desconocido'}

🔗 Ver en Redmine: ${process.env.REDMINE_URL}/issues/${ticket.id}`
  }

  /**
   * Formatear mensaje de comentario nuevo
   */
  private formatTicketCommentMessage(ticket: any, comment: string, authorName: string): string {
    return `💬 *NUEVO COMENTARIO*

📋 *Ticket #${ticket.id}*
📝 *Asunto:* ${ticket.subject}

👤 *Comentario de:* ${authorName}
📝 *Mensaje:*
${comment}

🔗 Ver en Redmine: ${process.env.REDMINE_URL}/issues/${ticket.id}`
  }

  /**
   * Formatear notificación de tickets nuevos
   */
  private formatNewTicketsNotification(tickets: any[]): string {
    let message = `🆕 *TICKETS NUEVOS SIN ASIGNAR*\n\n`
    message += `📋 Se han creado ${tickets.length} tickets nuevos que requieren asignación:\n\n`

    tickets.slice(0, 5).forEach((ticket, index) => {
      const priority = ticket.priority?.name || 'Normal'
      const author = ticket.author?.name || 'Usuario desconocido'
      
      message += `${index + 1}. *#${ticket.id}* - ${ticket.subject}\n`
      message += `   👤 ${author} | ⚡ ${priority}\n\n`
    })

    if (tickets.length > 5) {
      message += `... y ${tickets.length - 5} tickets más.\n\n`
    }

    message += `🔗 Ver todos: ${process.env.REDMINE_URL}/projects/soporte-tecnico/issues`

    return message
  }

  /**
   * Enviar mensaje por WhatsApp
   */
  private async sendWhatsAppMessage(phone: string, message: string): Promise<boolean> {
    try {
      // Formatear número para WhatsApp
      const formattedPhone = phone.includes('@') ? phone : `${phone}@s.whatsapp.net`
      
      console.log(`📱 Enviando mensaje WhatsApp a ${formattedPhone}`)
      
      await this.provider.sendMessage(formattedPhone, message, {})
      
      console.log(`✅ Mensaje WhatsApp enviado exitosamente`)
      return true

    } catch (error: any) {
      console.error(`❌ Error al enviar mensaje WhatsApp:`, error.message)
      return false
    }
  }

  /**
   * Iniciar monitoreo automático de tickets
   */
  startGlobalMonitoring(intervalMinutes: number = 5) {
    if (this.isMonitoring) {
      console.log(`⚠️ El monitoreo ya está activo`)
      return
    }

    console.log(`🤖 Iniciando monitoreo automático de tickets (cada ${intervalMinutes} minutos)`)
    
    this.isMonitoring = true
    this.lastCheck = new Date()

    this.monitoringInterval = setInterval(async () => {
      try {
        console.log(`🔍 Ejecutando verificación automática de tickets...`)
        
        // Verificar tickets nuevos sin asignar
        await this.notifyNewUnassignedTickets()
        
        this.lastCheck = new Date()
        console.log(`✅ Verificación completada a las ${this.lastCheck.toLocaleTimeString()}`)

      } catch (error: any) {
        console.error(`❌ Error en monitoreo automático:`, error.message)
      }
    }, intervalMinutes * 60 * 1000)

    console.log(`✅ Monitoreo iniciado correctamente`)
  }

  /**
   * Detener monitoreo automático
   */
  stopGlobalMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval)
      this.monitoringInterval = null
    }
    
    this.isMonitoring = false
    console.log(`🛑 Monitoreo automático detenido`)
  }

  /**
   * Obtener estado del monitoreo
   */
  getMonitoringStatus() {
    return {
      isActive: this.isMonitoring,
      lastCheck: this.lastCheck,
      notifiedTicketsCount: this.notifiedTickets.size
    }
  }

  /**
   * Limpiar cache de notificaciones (ejecutar diariamente)
   */
  clearNotificationCache() {
    this.notifiedTickets.clear()
    console.log(`🧹 Cache de notificaciones limpiado`)
  }
}

export default TechnicianNotificationService
