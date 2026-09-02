import { Router } from 'express';
import {
  restoreUserNotes,
  backupNote,
  backupDomainPin,
} from '../controllers/note.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';

const router = Router();

// Protect all note routes with verifyJWT
router.use(verifyJWT);

router.get('/restore', restoreUserNotes);
router.post('/backup', backupNote);
router.post('/pin', backupDomainPin);

export default router;
