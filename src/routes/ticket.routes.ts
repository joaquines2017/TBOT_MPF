import { Router } from 'express';
import TicketController from '../controllers/ticket.controller';

const router = Router();

router.get('/', TicketController.getAllTickets);

export default router;
