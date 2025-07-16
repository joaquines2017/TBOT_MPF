import Contact from '../models/contact.model';
import History from '../models/history.model';
import TicketRating from '../models/ticketRating.model';

export default class DataService {
  
  // Gestión de contactos
  static async getOrCreateContact(phone: string, name?: string) {
    try {
      let contact = await Contact.findOne({ where: { phone } });
      if (!contact) {
        contact = await Contact.create({
          phone,
          name: name || null,
          last_interaction: new Date(),
        });
        console.log('📞 Nuevo contacto creado:', phone);
      } else {
        // Actualizar última interacción y nombre si se proporciona
        const updateData: any = { last_interaction: new Date() };
        if (name && name !== contact.name) {
          updateData.name = name;
        }
        await contact.update(updateData);
      }
      return contact;
    } catch (error) {
      console.error('❌ Error al gestionar contacto:', error);
      throw error;
    }
  }

  // Gestión de historial
  static async saveMessage(phone: string, message: string, type: 'incoming' | 'outgoing' = 'incoming') {
    try {
      const historyRecord = await History.create({
        phone,
        message,
        type,
        ref: 'message_ref',
        answer: message,
        refserialize: JSON.stringify({ type, timestamp: new Date().toISOString() })
      });
      console.log(`💬 Mensaje ${type} guardado para:`, phone);
      return historyRecord;
    } catch (error) {
      console.error('❌ Error al guardar mensaje:', error);
      throw error;
    }
  }

  // Gestión de calificaciones
  static async saveTicketRating(phone: string, ticketId: number, rating: number) {
    try {
      const ratingRecord = await TicketRating.create({
        phone,
        ticket_id: ticketId,
        rating,
        redmine_updated: false, // Se actualizará cuando se envíe a Redmine
      });
      console.log('⭐ Calificación guardada:', { phone, ticketId, rating });
      return ratingRecord;
    } catch (error) {
      console.error('❌ Error al guardar calificación:', error);
      throw error;
    }
  }

  // Marcar calificación como enviada a Redmine
  static async markRatingAsSentToRedmine(ratingId: number) {
    try {
      await TicketRating.update(
        { redmine_updated: true },
        { where: { id: ratingId } }
      );
      console.log('✅ Calificación marcada como enviada a Redmine:', ratingId);
    } catch (error) {
      console.error('❌ Error al actualizar estado de calificación:', error);
      throw error;
    }
  }

  // Obtener calificaciones por teléfono
  static async getRatingsByPhone(phone: string) {
    try {
      return await TicketRating.findAll({
        where: { phone },
        order: [['created_at', 'DESC']],
      });
    } catch (error) {
      console.error('❌ Error al obtener calificaciones:', error);
      throw error;
    }
  }

  // Obtener historial por teléfono
  static async getHistoryByPhone(phone: string, limit: number = 50) {
    try {
      return await History.findAll({
        where: { phone },
        order: [['created_at', 'DESC']],
        limit,
      });
    } catch (error) {
      console.error('❌ Error al obtener historial:', error);
      throw error;
    }
  }
}
