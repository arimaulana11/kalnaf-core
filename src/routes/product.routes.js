import { Router } from 'express';
import * as controller from '../controllers/product.controller.js';

const router = Router();

router.get('/', controller.getAll);
router.post('/', controller.create);

router.post('/import/sheet', controller.importSheet)

export default router;
