import { Router } from 'express';
import { registerUser, verifyRegistrationOtp, getSecuritySettings, updateSecuritySettings, loginUser, updateUserRole, forgotPassword, resetPassword, socialLogin } from './auth.controller.js';

const router = Router();

router.post('/register', registerUser);
router.post('/verify-otp', verifyRegistrationOtp);
router.post('/login', loginUser);
router.post('/social-login', socialLogin);
router.post('/update-role', updateUserRole);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

router.get('/settings/security', getSecuritySettings);
router.post('/settings/security', updateSecuritySettings);

export default router;
