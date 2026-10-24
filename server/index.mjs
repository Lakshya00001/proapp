import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { handleSendEmail, handleVerifyConfig, handleSendOtp, handleVerifyOtp } from './emailHandler.mjs';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '100mb' }));

// Auth endpoints
app.post('/api/auth/send-otp', handleSendOtp);
app.post('/api/auth/verify-otp', handleVerifyOtp);

// Email dispatch endpoints
app.post('/api/email/send', handleSendEmail);
app.post('/api/email/verify', handleVerifyConfig);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`BillSnap AI Server listening on port ${PORT}`);
  console.log(`Zoho Mail & OTP Authentication Service active`);
});
