import { Request, Response } from 'express';
import TicketService from '../services/ticket.service';

class TicketController {
    static async getAllTickets(req: Request, res: Response) {
        try {
            const tickets = await TicketService.getAllTickets();
            res.json(tickets);
        } catch (error) {
            res.status(500).json({ error: 'Error obteniendo tickets' });
        }
    }
}

export default TicketController;
