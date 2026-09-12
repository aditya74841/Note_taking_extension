import { Router } from 'express';
import {
  restoreUserNotes,
  backupNote,
  backupDomainPin,
  getCloudBackupExplorer,
  restoreDeletedNote,
  purgeCloudNote,
} from '../controllers/note.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';
import { validateBody, validateQuery } from '../middlewares/validation.middleware.js';
import {
  backupNoteSchema,
  backupPinSchema,
  urlKeyBodySchema,
  explorerQuerySchema,
  restoreQuerySchema,
} from '../schemas/note.schema.js';

const router = Router();

// Protect all note routes with verifyJWT
router.use(verifyJWT);

router.get('/restore', validateQuery(restoreQuerySchema), restoreUserNotes);
router.post('/backup', validateBody(backupNoteSchema), backupNote);
router.post('/pin', validateBody(backupPinSchema), backupDomainPin);
router.get('/backup-explorer', validateQuery(explorerQuerySchema), getCloudBackupExplorer);
router.post('/restore-deleted', validateBody(urlKeyBodySchema), restoreDeletedNote);
router.post('/purge', validateBody(urlKeyBodySchema), purgeCloudNote);

export default router;
