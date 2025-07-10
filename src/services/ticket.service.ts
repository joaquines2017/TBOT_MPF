import Ticket from '../models/ticket.model';

class TicketService {
    static async getAllTickets() {
        return await Ticket.findAll();
    }
}

export default TicketService;
