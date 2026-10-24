import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { handleSendEmail, handleVerifyConfig } from './emailHandler.mjs';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '100mb' }));

app.post('/api/email/send', handleSendEmail);
app.post('/api/email/verify', handleVerifyConfig);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Zoho Mail Service listening on port ${PORT}`);
  console.log(`Connected to Zoho SMTP: smtp.zoho.in:465`);
});
