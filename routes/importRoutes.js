import express from 'express';
const router = express.Router();

import { bulkImportLeads } from '../controllers/importController.js';
import { protect } from '../middlewares/authMiddleware.js';

router.post(
  '/bulk-leads',
  protect,
  bulkImportLeads
);

export default router;