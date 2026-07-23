import { Router } from 'express';
import { analyzeUrl } from '../controllers/analyzeController';

const router = Router();

router.post('/', analyzeUrl);

export default router;
