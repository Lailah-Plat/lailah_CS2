import { Router } from 'express';
import { 
  getAllUsers, 
  createUser, 
  updateUser, 
  deleteUser, 
  completeProfile, 
  profileSync,
  migrateProviders,
  getRedisStats,
  flushRedis
} from './user.controller.js';
import { ProfileUpdateController } from './profileUpdate.controller.js';

const router = Router();
const profileUpdateController = new ProfileUpdateController();

router.get('/redis/stats', getRedisStats);
router.post('/redis/flush', flushRedis);

// Sensitive profile updates & approval flow
router.post('/profile-update-request', (req, res) => profileUpdateController.submitProfileUpdate(req, res));
router.get('/pending-profile-updates', (req, res) => profileUpdateController.getPendingUpdates(req, res));
router.post('/pending-profile-updates/:id/approve', (req, res) => profileUpdateController.approveUpdate(req, res));
router.post('/pending-profile-updates/:id/reject', (req, res) => profileUpdateController.rejectUpdate(req, res));
router.post('/pending-profile-updates/:id/request-revision', (req, res) => profileUpdateController.requestRevision(req, res));
router.post('/pending-profile-updates/:id/notes', (req, res) => profileUpdateController.addNoteThread(req, res));
router.get('/profile-history/:userId', (req, res) => profileUpdateController.getProfileHistory(req, res));
router.delete('/profile-history/cleanup', (req, res) => profileUpdateController.cleanupHistory(req, res));

router.get('/', getAllUsers);
router.post('/', createUser);
router.post('/complete-profile', completeProfile);
router.post('/profile-sync', profileSync);
router.post('/migrate-providers', migrateProviders);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);

export default router;
