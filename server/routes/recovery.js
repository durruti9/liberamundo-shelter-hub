import { Router } from 'express';
import { createTransport } from 'nodemailer';
import pool from '../db.js';

const router = Router();
const ALLOWED_EMAIL = 'marko.durruti@gmail.com';

router.post('/', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || email.toLowerCase() !== ALLOWED_EMAIL) {
      return res.status(403).json({ error: 'Email no autorizado' });
    }

    // Get all users with their plain info (we can't decrypt bcrypt, so we list usernames and roles)
    const { rows } = await pool.query('SELECT email, role FROM users ORDER BY email');

    const userList = rows.map(u => `• Usuario: ${u.email} | Rol: ${u.role}`).join('\n');

    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    if (!smtpUser || !smtpPass) {
      return res.status(500).json({ error: 'SMTP no configurado en el servidor' });
    }

    const transporter = createTransport({
      service: 'gmail',
      auth: { user: smtpUser, pass: smtpPass },
    });

    await transporter.sendMail({
      from: `"LiberaMundo" <${smtpUser}>`,
      to: ALLOWED_EMAIL,
      subject: '🔑 Credenciales activas – LiberaMundo',
      text: `Usuarios activos en el sistema:\n\n${userList}\n\nNota: Las contraseñas están cifradas y no se pueden recuperar. Usa el panel de administración para restablecerlas.\n\nSi necesitas acceso de emergencia, el usuario por defecto es "admin" con contraseña "admin123" (si no se ha eliminado).`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:500px;margin:auto;padding:20px;">
          <h2 style="color:#333;">🔑 Credenciales activas</h2>
          <p>Usuarios registrados en el sistema:</p>
          <table style="width:100%;border-collapse:collapse;margin:16px 0;">
            <tr style="background:#f0f0f0;"><th style="padding:8px;text-align:left;border:1px solid #ddd;">Usuario</th><th style="padding:8px;text-align:left;border:1px solid #ddd;">Rol</th></tr>
            ${rows.map(u => `<tr><td style="padding:8px;border:1px solid #ddd;">${u.email}</td><td style="padding:8px;border:1px solid #ddd;">${u.role}</td></tr>`).join('')}
          </table>
          <p style="color:#666;font-size:13px;">Las contraseñas están cifradas (bcrypt) y no pueden recuperarse. Usa el panel de administración para restablecerlas.</p>
          <p style="color:#666;font-size:13px;">Acceso de emergencia por defecto: <strong>admin / admin123</strong> (si no se ha eliminado).</p>
          <hr style="margin:20px 0;border:none;border-top:1px solid #eee;">
          <p style="color:#999;font-size:11px;">LiberaMundo – Sistema de gestión</p>
        </div>
      `,
    });

    res.json({ ok: true });
  } catch (err) {
    console.error('Recovery email error:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
