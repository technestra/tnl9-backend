// routes/import.js
import express from 'express';
const router = express.Router();

import { bulkImportLeads } from '../controllers/importController.js';
import { protect } from '../middlewares/authMiddleware.js';

// Optional: if you have role middleware
// import { restrictTo } from '../middleware/role.js';

router.post(
  '/bulk-leads',
  protect,
  // restrictTo('ADMIN', 'SUPER_ADMIN'),   // ← uncomment if needed
  bulkImportLeads
);

export default router;