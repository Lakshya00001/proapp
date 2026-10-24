import dotenv from 'dotenv';
dotenv.config();

import { handleSendEmail, handleVerifyConfig, handleSendOtp, handleVerifyOtp } from './emailHandler.mjs';

export function zohoEmailPlugin() {
  return {
    name: 'zoho-email-service',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        // Set CORS headers
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

        if (req.method === 'OPTIONS') {
          res.statusCode = 204;
          res.end();
          return;
        }

        const pathname = (req.url || '').split('?')[0].replace(/\/+$/, '');

        // Helper to parse JSON body
        const parseJsonBody = () => new Promise((resolve) => {
          let body = '';
          req.on('data', chunk => { body += chunk; });
          req.on('end', () => {
            try {
              resolve(JSON.parse(body || '{}'));
            } catch (e) {
              resolve({});
            }
          });
          req.on('error', () => resolve({}));
        });

        // Express-compatible response helpers
        res.status = (code) => {
          res.statusCode = code;
          return res;
        };
        res.json = (data) => {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(data));
          return res;
        };

        // 1. Auth: Send OTP
        if (pathname === '/api/auth/send-otp' && req.method === 'POST') {
          req.body = await parseJsonBody();
          await handleSendOtp(req, res);
          return;
        }

        // 2. Auth: Verify OTP
        if (pathname === '/api/auth/verify-otp' && req.method === 'POST') {
          req.body = await parseJsonBody();
          await handleVerifyOtp(req, res);
          return;
        }

        // 3. Email: Send Bill / Report
        if (pathname === '/api/email/send' && req.method === 'POST') {
          req.body = await parseJsonBody();
          await handleSendEmail(req, res);
          return;
        }

        // 4. Email: Verify Config
        if (pathname === '/api/email/verify' && req.method === 'POST') {
          req.body = await parseJsonBody();
          await handleVerifyConfig(req, res);
          return;
        }

        next();
      });
    }
  };
}
