import BotSession from '../models/botSession.model';

export default class BotSessionService {
  static async getSessionByPhone(phone: string) {
    return await BotSession.findOne({ where: { phone } });
  }

  static async createOrUpdateSession(phone: string, values: object) {
    const now = new Date();
    let session = await BotSession.findOne({ where: { phone } });
    if (session) {
      session.values = values;
      session.updated_in = now;
      session.last_interaction = now;
      await session.save();
    } else {
      session = await BotSession.create({
        phone,
        user_id: phone, // Usar el teléfono como user_id
        current_node: 'inicio', // Nodo inicial por defecto
        values,
        updated_in: now,
        last_interaction: now,
      });
    }
    return session;
  }

  static async updateSessionValues(phone: string, values: object) {
    const session = await BotSession.findOne({ where: { phone } });
    if (session) {
      session.values = values;
      session.updated_in = new Date();
      // Actualizar current_node si está en values
      if (values && typeof values === 'object' && 'currentNode' in values) {
        session.current_node = (values as any).currentNode;
      }
      await session.save();
      return session;
    }
    return null;
  }

  static async updateLastInteraction(phone: string) {
    const session = await BotSession.findOne({ where: { phone } });
    if (session) {
      session.last_interaction = new Date();
      await session.save();
      return session;
    }
    return null;
  }
}
