export async function createZohoTransporter(user, pass) {
  const nodemailer = (await import('nodemailer')).default;
  const zohoUser = user || process.env.ZOHO_USER || '';
  const zohoPass = pass || process.env.ZOHO_PASS || '';

  return nodemailer.createTransport({
    host: 'smtp.zoho.in',
    port: 465,
    secure: true, // SSL
    auth: {
      user: zohoUser,
      pass: zohoPass
    },
    tls: {
      rejectUnauthorized: false
    }
  });
}

export async function handleSendEmail(req, res) {
  try {
    const {
      to,
      subject,
      notes,
      bill,
      pdfBase64,
      pdfFileName,
      excelBase64,
      excelFileName,
      zipBase64,
      zipFileName,
      zohoUser,
      zohoPass
    } = req.body;

    if (!to) {
      return res.status(400).json({ error: 'Recipient email address ("to") is required.' });
    }

    const authUser = zohoUser || process.env.ZOHO_USER;
    const authPass = zohoPass || process.env.ZOHO_PASS || '';

    if (!authUser) {
      return res.status(400).json({
        error: 'Zoho Mail user email is not configured. Please set your Zoho email address in Settings or .env'
      });
    }

    const transporter = await createZohoTransporter(authUser, authPass);

    // Format attachments
    const attachments = [];

    if (pdfBase64) {
      attachments.push({
        filename: pdfFileName || `Digital_Bill_${bill?.invoiceNumber || 'Receipt'}.pdf`,
        content: pdfBase64.replace(/^data:application\/pdf;base64,/, ''),
        encoding: 'base64'
      });
    }

    if (excelBase64) {
      attachments.push({
        filename: excelFileName || 'Bills_Report.xlsx',
        content: excelBase64.replace(/^data:.*?;base64,/, ''),
        encoding: 'base64'
      });
    }

    if (zipBase64) {
      attachments.push({
        filename: zipFileName || 'PowerBI_Package.zip',
        content: zipBase64.replace(/^data:.*?;base64,/, ''),
        encoding: 'base64'
      });
    }

    // Build rich HTML email body
    let htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0f172a; color: #f8fafc; border-radius: 16px; overflow: hidden; border: 1px solid #1e293b;">
      <div style="background: linear-gradient(135deg, #4f46e5, #7c3aed); padding: 24px; text-align: center;">
        <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">BillSnap AI Pro</h1>
        <p style="margin: 4px 0 0 0; color: #e0e7ff; font-size: 13px;">Automated Invoice & Document Service via Zoho Mail</p>
      </div>

      <div style="padding: 24px;">
    `;

    if (notes) {
      htmlContent += `
        <div style="background-color: #1e293b; padding: 14px; border-radius: 8px; margin-bottom: 20px; font-size: 14px; border-left: 4px solid #6366f1;">
          <strong>Message from sender:</strong><br />
          ${notes.replace(/\n/g, '<br/>')}
        </div>
      `;
    }

    if (bill) {
      htmlContent += `
        <div style="background-color: #1e293b; padding: 18px; border-radius: 12px; margin-bottom: 20px;">
          <h2 style="margin: 0 0 8px 0; color: #ffffff; font-size: 18px; text-transform: uppercase;">${bill.vendorName}</h2>
          ${bill.vendorAddress ? `<p style="margin: 0; color: #94a3b8; font-size: 12px;">${bill.vendorAddress}</p>` : ''}
          <div style="display: flex; justify-content: space-between; margin-top: 12px; padding-top: 12px; border-top: 1px dashed #334155; font-size: 12px; color: #cbd5e1;">
            <span><strong>Bill #:</strong> ${bill.invoiceNumber}</span>
            <span><strong>Date:</strong> ${bill.date}</span>
          </div>
        </div>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 13px;">
          <thead>
            <tr style="border-bottom: 2px solid #334155; color: #94a3b8; text-align: left;">
              <th style="padding: 8px 4px;">Item</th>
              <th style="padding: 8px 4px; text-align: center;">Qty</th>
              <th style="padding: 8px 4px; text-align: right;">Rate</th>
              <th style="padding: 8px 4px; text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${bill.items.map(it => `
              <tr style="border-bottom: 1px solid #1e293b; color: #e2e8f0;">
                <td style="padding: 8px 4px;">${it.description}</td>
                <td style="padding: 8px 4px; text-align: center; color: #94a3b8;">${it.quantity}</td>
                <td style="padding: 8px 4px; text-align: right; color: #94a3b8;">${bill.currency}${it.unitPrice.toFixed(2)}</td>
                <td style="padding: 8px 4px; text-align: right; font-weight: bold;">${bill.currency}${it.totalPrice.toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
          <tfoot>
            <tr style="border-top: 2px dashed #334155;">
              <td colspan="3" style="padding: 12px 4px 4px 4px; text-align: right; color: #94a3b8; font-size: 12px;">Subtotal:</td>
              <td style="padding: 12px 4px 4px 4px; text-align: right; color: #f8fafc; font-size: 12px;">${bill.currency}${bill.subtotal.toFixed(2)}</td>
            </tr>
            <tr>
              <td colspan="3" style="padding: 4px; text-align: right; color: #94a3b8; font-size: 12px;">Tax:</td>
              <td style="padding: 4px; text-align: right; color: #f8fafc; font-size: 12px;">${bill.currency}${bill.taxAmount.toFixed(2)}</td>
            </tr>
            <tr style="font-size: 16px; font-weight: 800; color: #34d399;">
              <td colspan="3" style="padding: 8px 4px; text-align: right;">GRAND TOTAL:</td>
              <td style="padding: 8px 4px; text-align: right;">${bill.currency}${bill.totalAmount.toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>
      `;
    }

    htmlContent += `
        <div style="text-align: center; margin-top: 24px; padding-top: 16px; border-top: 1px solid #1e293b; font-size: 11px; color: #64748b;">
          Sent securely via <strong>Zoho Mail</strong> (smtp.zoho.in) • Generated by BillSnap AI Pro
        </div>
      </div>
    </div>
    `;

    const mailOptions = {
      from: `"BillSnap Invoice Service" <${authUser}>`,
      to,
      subject: subject || (bill ? `Invoice ${bill.invoiceNumber} from ${bill.vendorName}` : 'Expense Report from BillSnap AI'),
      html: htmlContent,
      attachments
    };

    const info = await transporter.sendMail(mailOptions);
    return res.json({
      success: true,
      message: `Email dispatched successfully to ${to} via Zoho Mail!`,
      messageId: info.messageId
    });
  } catch (error) {
    console.error('Zoho Mail Sending Error:', error);
    return res.status(500).json({
      error: error.message || 'Failed to send email via Zoho Mail.'
    });
  }
}

export async function handleVerifyConfig(req, res) {
  try {
    const { zohoUser, zohoPass } = req.body;
    const authUser = zohoUser || process.env.ZOHO_USER;
    const authPass = zohoPass || process.env.ZOHO_PASS || '';

    if (!authUser) {
      return res.status(400).json({ error: 'Zoho Mail user email is not set.' });
    }

    const transporter = await createZohoTransporter(authUser, authPass);
    await transporter.verify();

    return res.json({
      success: true,
      message: `Zoho Mail SMTP connection verified for ${authUser} on smtp.zoho.in:465!`
    });
  } catch (error) {
    return res.status(500).json({
      error: `Zoho SMTP Verification Failed: ${error.message}`
    });
  }
}
