import { BillData } from '../types/bill';

export interface EmailPayload {
  to: string;
  subject: string;
  notes?: string;
  bill?: BillData;
  pdfBase64?: string;
  pdfFileName?: string;
  excelBase64?: string;
  excelFileName?: string;
  zipBase64?: string;
  zipFileName?: string;
  zohoUser?: string;
  zohoPass?: string;
}

export const ZOHO_CONFIG_KEY_USER = 'proapp_zoho_user';
export const ZOHO_CONFIG_KEY_PASS = 'proapp_zoho_pass';
export const DEFAULT_ZOHO_PASS = import.meta.env.VITE_ZOHO_PASS || '';

export function getZohoUser(): string {
  return localStorage.getItem(ZOHO_CONFIG_KEY_USER) || import.meta.env.VITE_ZOHO_USER || '';
}

export function setZohoUser(user: string): void {
  localStorage.setItem(ZOHO_CONFIG_KEY_USER, user.trim());
}

export function getZohoPass(): string {
  return localStorage.getItem(ZOHO_CONFIG_KEY_PASS) || import.meta.env.VITE_ZOHO_PASS || DEFAULT_ZOHO_PASS;
}

export function setZohoPass(pass: string): void {
  localStorage.setItem(ZOHO_CONFIG_KEY_PASS, pass.trim());
}

/**
 * Sends digital bill or expense reports via Zoho Mail SMTP backend
 */
export async function sendEmailViaZoho(payload: EmailPayload): Promise<{ success: boolean; message: string; messageId?: string }> {
  try {
    const zohoUser = getZohoUser();
    const zohoPass = getZohoPass();

    const response = await fetch('/api/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...payload,
        zohoUser: payload.zohoUser || zohoUser,
        zohoPass: payload.zohoPass || zohoPass
      })
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to dispatch email via Zoho Mail.');
    }

    return {
      success: true,
      message: data.message || 'Email successfully sent via Zoho Mail!',
      messageId: data.messageId
    };
  } catch (err: any) {
    console.error('Error sending email:', err);
    throw err;
  }
}

/**
 * Tests Zoho Mail SMTP connection
 */
export async function testZohoSmtp(user?: string, pass?: string): Promise<{ success: boolean; message: string }> {
  const zohoUser = user || getZohoUser();
  const zohoPass = pass || getZohoPass();

  const response = await fetch('/api/email/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ zohoUser, zohoPass })
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Zoho SMTP authentication check failed.');
  }

  return data;
}

/**
 * Generates direct Zoho Mail Web compose link
 */
export function getZohoWebmailComposeUrl(to = '', subject = '', body = ''): string {
  const params = new URLSearchParams();
  if (to) params.set('to', to);
  if (subject) params.set('subject', subject);
  if (body) params.set('body', body);

  return `https://mail.zoho.in/zm/#mail/compose?${params.toString()}`;
}
