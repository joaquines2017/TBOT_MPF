/**
 * RedmineService proporciona un conjunto de métodos para interactuar con la API de Redmine para la gestión de incidencias y proyectos.
 *
 * @remarks
 * Este servicio incluye funcionalidades para crear, actualizar, eliminar y recuperar tickets (incidencias), así como listar miembros e incidencias de proyectos.
 * Está diseñado para funcionar con una instancia de Redmine y asume la existencia de un objeto `api` para las solicitudes HTTP.
 *
 * @example
 * ```typescript
 * const ticket = await RedmineService.createTicket({ project_id: 1, subject: "Nueva incidencia" });
 * const miembros = await RedmineService.obtenerMiembrosSoporteIT();
 * const issues = await RedmineService.listarIssuesDelProyecto("mi-proyecto");
 * const detallesTicket = await RedmineService.getTicketById(123);
 * const eliminado = await RedmineService.deleteTicketById(123);
 * const actualizado = await RedmineService.updateTicket(123, { subject: "Asunto actualizado" });
 * const ticketsUsuario = await RedmineService.getUserTickets(42);
 * const reabierto = await RedmineService.reabrirTicket(123);
 * ```
 *
 * @property createTicket - Crea un nuevo ticket (incidencia) en Redmine con los datos proporcionados.
 * @property obtenerMiembrosSoporteIT - Obtiene los miembros con el rol "Soporte IT" del proyecto de soporte.
 * @property listarIssuesDelProyecto - Lista las incidencias de un proyecto determinado, paginadas.
 * @property getTicketById - Recupera una incidencia por su ID.
 * @property deleteTicketById - Elimina una incidencia por su ID.
 * @property updateTicket - Actualiza una incidencia con los datos proporcionados.
 * @property getUserTickets - Recupera todas las incidencias asignadas a un usuario específico.
 * @property reabrirTicket - Reabre una incidencia cambiando su estado a "En progreso".
 */


import axios from 'axios'
import chalk from 'chalk'
import DataService from './data.service.js'

// Inicialización perezosa del cliente axios y las variables de entorno
function getApi() {
  let baseURL = process.env.REDMINE_URL || '';
  const apiKey = process.env.REDMINE_API_KEY || '';
  //console.log('DEBUG Redmine baseURL:', baseURL);
  //console.log('DEBUG Redmine apiKey:', apiKey);
  if (!baseURL.endsWith('/')) baseURL += '/';
  try {
    new URL(baseURL);
  } catch (e) {
    throw new Error('La variable REDMINE_URL no es una URL válida: ' + baseURL);
  }
  return axios.create({
    baseURL,
    headers: {
      'X-Redmine-API-Key': apiKey,
      'Content-Type': 'application/json'
    }
  });
}

const RedmineService = {
  // Métodos principales
  async getTicketById(ticketId: number) {
    try {
      const api = getApi();
      const res = await api.get(`/issues/${ticketId}.json`, {
        params: { include: 'journals,watchers,relations' }
      })
      return res.data.issue
    } catch (error: any) {
      console.error('❌ Error al consultar ticket:', error.response?.data || error)
      return null
    }
  },

  async cancelarTicket(ticketId: number) {
    try {
      console.log('🎯 Iniciando cancelación de ticket:', ticketId)
      const api = getApi();
      const ticket = await this.getTicketById(ticketId)
      if (!ticket) {
        throw new Error(`No se encontró el ticket #${ticketId}`)
      }
      if (ticket.status.id === 6) {
        throw new Error(`El ticket #${ticketId} ya está rechazado`)
      }
      await api.put(`/issues/${ticketId}.json`, {
        issue: {
          status_id: 6, // Rechazado
          notes: '🚫 Ticket rechazado vía T-BOT WhatsApp',
          private_notes: true
        }
      })
      console.log('✅ Ticket rechazado exitosamente:', ticketId)
      return {
        success: true,
        ticketId,
        message: '✅ Ticket rechazado exitosamente'
      }
    } catch (error: any) {
      console.error('❌ Error al rechazar ticket:', error)
      return {
        success: false,
        message: error.message || 'Error al rechazar ticket'
      }
    }
  },

  async buscarContactoPorTelefono(phone: string): Promise<any> {
    try {
      const api = getApi();
      console.log(`🔍 Buscando contacto para teléfono: ${phone}`);
      
      const responseContacts = await api.get('/contacts.json', {
        params: { 
          project_id: 33,
          include: 'custom_fields'
        }
      })
      
      const contacts = responseContacts.data?.contacts || []
      console.log(`📞 Total de contactos encontrados: ${contacts.length}`);
      
      // Normalizar el número de entrada (remover todo excepto dígitos)
      const phoneNormalized = phone.replace(/\D/g, '');
      console.log(`📱 Número normalizado para búsqueda: ${phoneNormalized}`);
      
      const contactFound = contacts.find((contact: any) => {
        if (!contact.phones || !Array.isArray(contact.phones)) {
          return false;
        }
        
        return contact.phones.some((p: any) => {
          if (!p.number) return false;
          
          // Normalizar el número del contacto
          const contactPhoneNormalized = p.number.replace(/\D/g, '');
          console.log(`🔍 Comparando: ${phoneNormalized} vs ${contactPhoneNormalized}`);
          
          // Buscar coincidencia (puede ser que el número contenga o esté contenido)
          return contactPhoneNormalized.includes(phoneNormalized) || 
                 phoneNormalized.includes(contactPhoneNormalized);
        });
      });
      
      if (contactFound) {
        console.log(`✅ Contacto encontrado:`, {
          id: contactFound.id,
          nombre: `${contactFound.first_name} ${contactFound.last_name}`,
          compania: contactFound.company,
          telefonos: contactFound.phones?.map((p: any) => p.number)
        });
      } else {
        console.log(`❌ No se encontró contacto para el número: ${phone}`);
      }
      
      return contactFound;
    } catch (error) {
      console.error('❌ Error buscando contacto:', error);
      return null;
    }
  },

  async createTicket(ticketData: any) {
    try {
      console.log(`🎫 Creando ticket para senderId: ${ticketData.senderId}`);
      
      if (ticketData.senderId) {
        const contacto = await this.buscarContactoPorTelefono(ticketData.senderId);
        
        if (contacto) {
          console.log('✅ Contacto encontrado en Redmine:', {
            nombre: `${contacto.first_name} ${contacto.last_name}`,
            compania: contacto.company,
            id: contacto.id
          });
          
          // Preparar los campos personalizados
          const camposPersonalizados = [
            {
              id: 4, // ID del campo "Empleado"
              value: `${contacto.first_name} ${contacto.last_name}`
            },
            {
              id: 7, // ID del campo "Oficina"
              value: contacto.company || "No especificada"
            },
            {
              id: 30, // ID del campo "Nro de Contacto"
              value: ticketData.senderId.replace(/\D/g, '') // Solo dígitos
            }
          ];
          
          // Agregar campos personalizados al ticket
          ticketData.custom_fields = [
            ...(ticketData.custom_fields || []),
            ...camposPersonalizados
          ];
          
          console.log('📝 Campos personalizados agregados:', camposPersonalizados);
        } else {
          console.log('⚠️ No se encontró contacto en Redmine para el número:', ticketData.senderId);
          console.log('📝 El ticket se creará sin datos de empleado/oficina');
          
          // Aún así, agregar el número de contacto
          ticketData.custom_fields = [
            ...(ticketData.custom_fields || []),
            {
              id: 30, // ID del campo "Nro de Contacto"
              value: ticketData.senderId.replace(/\D/g, '') // Solo dígitos
            }
          ];
        }
      }
      console.log('📤 RedmineService - Enviando solicitud de creación:', 
        JSON.stringify(ticketData, null, 2))
      if (!ticketData.project_id || !ticketData.subject) {
        throw new Error('Faltan datos requeridos para crear el ticket')
      }
      const api = getApi();
      const response = await api.post('/issues.json', { 
        issue: ticketData 
      })
      console.log('📥 RedmineService - Respuesta recibida:', 
        JSON.stringify(response.data, null, 2))
      if (!response.data?.issue?.id) {
        throw new Error('Redmine no devolvió un ID de ticket válido')
      }
      return response.data.issue
    } catch (error: any) {
      console.error('❌ Error en RedmineService.createTicket:', error)
      if (error.response?.data) {
        console.error('Detalles del error:', error.response.data)
      }
      return null
    }
  },

  async obtenerMiembrosSoporteIT(): Promise<{ id: number; name: string }[]> {
    try {
      const api = getApi();
      const response = await api.get(`/projects/soporte-tecnico-mpf/memberships.json`)
      const members = response.data.memberships || []
      const soporteIT = members
        .filter((m: any) => m.user && m.roles?.some((r: any) => r.id === 5))
        .map((m: any) => ({
          id: m.user.id,
          name: m.user.name
        }))
      return soporteIT
    } catch (error) {
      console.error('❌ Error al obtener miembros Soporte IT:', error.response?.data || error)
      return []
    }
  },

  async listarIssuesDelProyecto(projectIdentifier: string, pagina: number = 1, filtros: any = {}): Promise<any> {
    try {
      const api = getApi();
      const response = await api.get(`/issues.json`, {
        params: {
          project_id: projectIdentifier,
          limit: 5,
          offset: (pagina - 1) * 5,
          sort: 'updated_on:desc',
          ...filtros
        }
      })
      const issues = response.data.issues || [];
      const total = response.data.total_count;
      const totalPaginas = Math.ceil(total / 5);
      const ticketsFormateados = issues.map((ticket: any) => `
        🎫 #${ticket.id} - ${ticket.subject}
        👤 ${ticket.assigned_to?.name || 'Sin asignar'}
        📊 ${ticket.status?.name || 'Estado desconocido'}
      `).join('\n');
      return {
        mensaje: `📋 Tickets (${pagina}/${totalPaginas}):\n${ticketsFormateados}`,
        hayMasPaginas: pagina < totalPaginas,
        paginaActual: pagina,
        total,
        tickets: issues // <-- Aquí se expone el array de tickets
      };
    } catch (error) {
      console.error('❌ Error al listar tickets:', error);
      throw error;
    }
  },

  async updateTicket(ticketId: number, updateData: any) {
    try {
      const api = getApi();
      const response = await api.put(`/issues/${ticketId}.json`, {
        issue: updateData
      })
      return true
    } catch (error: any) {
      console.error('❌ Error al actualizar ticket:', error.response?.data || error)
      return false
    }
  },

  async getUserTickets(userId: number) {
    try {
      const api = getApi();
      const response = await api.get('/issues.json', {
        params: {
          assigned_to_id: userId,
          limit: 100
        }
      })
      return response.data.issues || []
    } catch (error: any) {
      console.error('❌ Error al obtener tickets del usuario:', error.response?.data || error)
      return []
    }
  },

  async reabrirTicket(ticketId: number): Promise<{success: boolean, message: string}> {
    try {
      const api = getApi();
      const ticket = await this.getTicketById(ticketId)
      if (!ticket) {
        return { success: false, message: `No se encontró el ticket #${ticketId}` }
      }
      if (ticket.status.id === 2) {
        return { success: false, message: `El ticket #${ticketId} ya está abierto` }
      }
      await api.put(`/issues/${ticketId}.json`, {
        issue: {
          status_id: 2,
          notes: '🔄 Ticket reabierto vía T-BOT WhatsApp',
          private_notes: true
        }
      })
      return {
        success: true,
        message: `✅ Ticket #${ticketId} reabierto exitosamente`
      }
    } catch (error) {
      console.error('❌ Error al reabrir ticket:', error)
      return {
        success: false,
        message: 'Error al reabrir el ticket'
      }
    }
  },

  async listarTicketsUsuario(userId: string): Promise<{success: boolean, tickets?: any[], message?: string}> {
    try {
      const api = getApi();
      const response = await api.get('/issues.json', {
        params: {
          assigned_to_id: userId,
          status_id: 'open',
          sort: 'updated_on:desc',
          limit: 10
        }
      })
      const tickets = response.data.issues || []
      return {
        success: true,
        tickets: tickets.map((t: any) => ({
          id: t.id,
          subject: t.subject,
          status: t.status.name,
          updated: new Date(t.updated_on).toLocaleString('es-AR')
        }))
      }
    } catch (error) {
      console.error('❌ Error al listar tickets:', error)
      return { success: false, message: 'Error al obtener tickets' }
    }
  },

  async listarCamposIssue() {
    try {
      const api = getApi();
      const response = await api.get('/issues.json', {
        params: {
          project_id: 33,
          limit: 1,
          include: 'custom_fields'
        }
      })
      if (!response.data?.issues?.[0]) {
        console.log(chalk.red('❌ No se encontraron issues en el proyecto 33'))
        return
      }
      const issue = response.data.issues[0]
      console.log(chalk.blue('\n📋 CAMPOS ESTÁNDAR DEL ISSUE:'))
      console.log(chalk.gray('======================'))
      Object.entries(issue).forEach(([key, value]) => {
        if (key !== 'custom_fields') {
          console.log(chalk.cyan(`${key}:`), chalk.white(JSON.stringify(value, null, 2)))
        }
      })
      console.log(chalk.yellow('\n🔧 CUSTOM FIELDS:'))
      console.log(chalk.gray('======================'))
      issue.custom_fields?.forEach((field: any) => {
        console.log(chalk.magenta('\nField ID:'), chalk.white(field.id))
        console.log(chalk.magenta('Name:'), chalk.white(field.name))
        console.log(chalk.magenta('Value:'), chalk.white(field.value))
      })
    } catch (error: any) {
      console.error(chalk.red('❌ Error al obtener campos:'), error.response?.data || error)
    }
  },

  async guardarCalificacion(ticketId: number | null, calificacion: string, userId?: string): Promise<boolean> {
    try {
      const calificaciones = {
        '1': 'Mala 😞',
        '2': 'Buena 🙂', 
        '3': 'Muy Buena 😊',
        '4': 'Excelente 🌟'
      }
      
      const calificacionTexto = calificaciones[calificacion] || 'No especificada';
      
      // Guardar en Redmine solo si hay ticketId
      if (ticketId) {
        const api = getApi();
        await api.put(`/issues/${ticketId}.json`, {
          issue: {
            notes: `📊 Calificación del servicio: ${calificacionTexto}`,
            private_notes: true
          }
        });
        console.log(`✅ Calificación guardada en Redmine para ticket #${ticketId}: ${calificacionTexto}`);
      }
      
      // Guardar en nuestra base de datos
      if (userId) {
        await DataService.saveTicketRating(userId, ticketId || 0, parseInt(calificacion));
        console.log(`✅ Calificación guardada en BD para usuario ${userId}: ${calificacionTexto}`);
      }
      
      return true;
    } catch (error) {
      console.error('❌ Error al guardar calificación:', error);
      return false;
    }
  },

  async listarUsuariosYContactos(): Promise<void> {
    try {
      const api = getApi();
      console.log(chalk.blue('\n📋 USUARIOS Y CONTACTOS DEL PROYECTO:'))
      console.log(chalk.gray('================================'))
      const responseUsers = await api.get('/projects/33/memberships.json')
      const memberships = responseUsers.data?.memberships || []
      console.log(chalk.yellow('\n👥 MIEMBROS DEL PROYECTO:'))
      memberships.forEach((member: any) => {
        if (member.user) {
          console.log(chalk.cyan('\nUsuario:'), chalk.white(member.user.name))
          console.log(chalk.cyan('ID:'), chalk.white(member.user.id))
          console.log(chalk.cyan('Roles:'), chalk.white(member.roles.map((r: any) => r.name).join(', ')))
        }
      })
      const responseContacts = await api.get('/contacts.json', {
        params: { 
          project_id: 33,
          include: 'custom_fields,tags,notes,address'
        }
      })
      const contacts = responseContacts.data?.contacts || []
      console.log(chalk.yellow('\n📞 CONTACTOS DETALLADOS:'))
      console.log(chalk.gray('======================'))
      contacts.forEach((contact: any) => {
        console.log(chalk.blue('\n🔍 DATOS BÁSICOS:'))
        console.log(chalk.magenta('ID:'), chalk.white(contact.id))
        console.log(chalk.magenta('Nombre:'), chalk.white(contact.first_name))
        console.log(chalk.magenta('Apellido:'), chalk.white(contact.last_name))
        console.log(chalk.magenta('\nTeléfonos:'))
        if (contact.phones && Array.isArray(contact.phones)) {
          contact.phones.forEach((phone: any, index: number) => {
            if (phone && phone.number) {
              console.log(chalk.cyan(`  ${index + 1}.`), chalk.white(phone.number))
            }
          })
        } else {
          console.log(chalk.gray('  No especificado'))
        }
        console.log(chalk.magenta('Oficina:'), chalk.white(contact.company || 'No especificado'))
        console.log(chalk.magenta('Emails:'), chalk.white(contact.emails || 'No especificado'))
        console.log(chalk.magenta('Estado:'), chalk.white(contact.is_active ? 'Activo' : 'Inactivo'))
        console.log(chalk.magenta('Visible:'), chalk.white(contact.visibility || 'Default'))
        if (contact.address) {
          console.log(chalk.blue('\n📍 DIRECCIÓN:'))
          console.log(chalk.magenta('Calle:'), chalk.white(contact.address.street1 || 'No especificado'))
          console.log(chalk.magenta('Ciudad:'), chalk.white(contact.address.city || 'No especificado'))
          console.log(chalk.magenta('Región:'), chalk.white(contact.address.region || 'No especificado'))
          console.log(chalk.magenta('País:'), chalk.white(contact.address.country_code || 'No especificado'))
        }
        if (contact.custom_fields?.length > 0) {
          console.log(chalk.blue('\n🔧 CAMPOS PERSONALIZADOS:'))
          contact.custom_fields.forEach((field: any) => {
            console.log(chalk.magenta(`${field.name}:`), chalk.white(field.value || 'No especificado'))
          })
        }
        if (contact.tags?.length > 0) {
          console.log(chalk.blue('\n🏷️ ETIQUETAS:'))
          console.log(chalk.white(contact.tags.join(', ')))
        }
        if (contact.notes) {
          console.log(chalk.blue('\n📝 NOTAS:'))
          console.log(chalk.white(contact.notes))
        }
        console.log(chalk.gray('\n------------------------'))
      })
    } catch (error: any) {
      console.error(chalk.red('❌ Error al obtener datos:'), error.response?.data || error)
    }
  },

  /**
   * Obtiene información detallada de un usuario por su ID
   */
  async getUserById(userId: number) {
    const api = getApi()
    try {
      const response = await api.get(`/users/${userId}.json`)
      return response.data.user
    } catch (error: any) {
      console.error(chalk.red(`❌ Error al obtener usuario ${userId}:`), error.response?.data || error.message)
      throw error
    }
  },

  /**
   * Busca el teléfono de un técnico en sus campos personalizados de Redmine
   */
  async getTechnicianPhone(userId: number): Promise<string | null> {
    try {
      // Obtener información detallada del usuario incluyendo campos personalizados
      const api = getApi()
      const response = await api.get(`/users/${userId}.json`, {
        params: {
          include: 'custom_fields'
        }
      })
      
      const user = response.data.user
      console.log(chalk.blue(`🔍 Buscando teléfono para técnico: ${user.firstname} ${user.lastname} (ID: ${userId})`))
      
      // Buscar en los campos personalizados del usuario
      if (user.custom_fields && Array.isArray(user.custom_fields)) {
        for (const field of user.custom_fields) {
          // Buscar campos que puedan contener teléfono
          const fieldName = field.name?.toLowerCase() || ''
          if ((fieldName.includes('telefono') || 
               fieldName.includes('teléfono') || 
               fieldName.includes('phone') || 
               fieldName.includes('celular') || 
               fieldName.includes('móvil') || 
               fieldName.includes('movil') ||
               fieldName.includes('whatsapp')) && field.value) {
            
            console.log(chalk.green(`📞 Teléfono encontrado en campo "${field.name}": ${field.value}`))
            // Limpiar el número (mantener solo dígitos y el signo +)
            let cleanPhone = field.value.replace(/[^\d+]/g, '')
            
            // Asegurar formato argentino
            if (cleanPhone.startsWith('0')) {
              cleanPhone = '+549' + cleanPhone.substring(1)
            } else if (cleanPhone.startsWith('549')) {
              cleanPhone = '+' + cleanPhone
            } else if (!cleanPhone.startsWith('+')) {
              cleanPhone = '+549' + cleanPhone
            }
            
            return cleanPhone
          }
        }
      }
      
      // Si no se encuentra en campos personalizados, buscar en el campo email por si tiene formato de WhatsApp
      if (user.mail && user.mail.includes('whatsapp')) {
        console.log(chalk.yellow(`📧 Revisando email para WhatsApp: ${user.mail}`))
        // Extraer número del email si tiene formato como "5493815142328@whatsapp.com"
        const phoneMatch = user.mail.match(/(\d+)@/)
        if (phoneMatch) {
          let phone = phoneMatch[1]
          if (!phone.startsWith('+')) {
            phone = '+' + phone
          }
          console.log(chalk.green(`📞 Teléfono extraído del email: ${phone}`))
          return phone
        }
      }
      
      console.log(chalk.yellow(`⚠️ No se encontró teléfono para el técnico ${user.firstname} ${user.lastname} (ID: ${userId})`))
      console.log(chalk.gray(`Campos personalizados disponibles:`, 
        user.custom_fields?.map((f: any) => `${f.name}: ${f.value || 'vacío'}`)))
      
      return null
    } catch (error: any) {
      console.error(chalk.red('❌ Error al buscar teléfono del técnico:'), error.response?.data || error.message)
      return null
    }
  },

  /**
   * Obtiene tickets asignados a un técnico específico
   */
  async getTicketsByAssignee(assigneeId: number, statusFilter?: string) {
    const api = getApi()
    try {
      let url = `/issues.json?assigned_to_id=${assigneeId}&limit=100`
      if (statusFilter) {
        url += `&status_id=${statusFilter}`
      }
      
      const response = await api.get(url)
      return response.data.issues
    } catch (error: any) {
      console.error(chalk.red(`❌ Error al obtener tickets del técnico ${assigneeId}:`), error.response?.data || error.message)
      throw error
    }
  },

  /**
   * Obtiene tickets nuevos (creados en los últimos X minutos)
   */
  async getNewTicketsByAssignee(assigneeId: number, minutesAgo: number = 5) {
    try {
      const cutoffTime = new Date(Date.now() - minutesAgo * 60 * 1000)
      const tickets = await this.getTicketsByAssignee(assigneeId)
      
      return tickets.filter((ticket: any) => {
        const createdAt = new Date(ticket.created_on)
        return createdAt >= cutoffTime
      })
    } catch (error: any) {
      console.error(chalk.red('❌ Error al obtener tickets nuevos:'), error.message)
      return []
    }
  },

  /**
   * Obtiene tickets que cambiaron de estado en los últimos X minutos
   */
  async getUpdatedTicketsByAssignee(assigneeId: number, minutesAgo: number = 5) {
    try {
      const cutoffTime = new Date(Date.now() - minutesAgo * 60 * 1000)
      const tickets = await this.getTicketsByAssignee(assigneeId)
      
      return tickets.filter((ticket: any) => {
        const updatedAt = new Date(ticket.updated_on)
        const createdAt = new Date(ticket.created_on)
        return updatedAt >= cutoffTime && updatedAt > createdAt
      })
    } catch (error: any) {
      console.error(chalk.red('❌ Error al obtener tickets actualizados:'), error.message)
      return []
    }
  }
}

export default RedmineService
