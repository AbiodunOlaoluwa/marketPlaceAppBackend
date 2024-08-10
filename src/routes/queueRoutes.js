import express from 'express';
import { enqueueUser, status, processPlayer } from '../controllers/queueController';
const router = express.Router();

router.post('/', enqueueUser);
router.get('/:productId/status', status);
router.post('/playerTurnFinished', processPlayer);

export default router;