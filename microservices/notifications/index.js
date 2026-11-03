// notifi/server.js
const express = require('express');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
require('dotenv').config()
//console.log(`process evn is ${JSON.stringify(process.env)}`)

const app = express();
app.use(bodyParser.json());
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Configuration de Nodemailer
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER, // Adresse Gmail
    pass: process.env.EMAIL_APPLICATION_PASSWORD, // Mot de passe spécifique à l'application
  },
});

console.log(
  process.env.EMAIL_USER
    ? 'Service mail configuré'
    : 'Service mail : EMAIL_USER manquant'
);
// Route pour envoyer un email
app.post('/notify', async (req, res) => {
  const { to, subject, text } = req.body;
  console.log(`[audit] notify subject=${subject} to_len=${to ? String(to).length : 0}`);

  //const { message } = req.body;
    //console.log(`Notification: ${text}`);
    //res.send('Notification envoyée mail');

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject,
    text,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Email envoyé avec succès');
    return res.status(200).json({ message: 'Email envoyé avec succès.' });
  } catch (error) {
    console.error('Erreur lors de l\'envoi de l\'email', error);
    return res.status(500).json({ message: 'Erreur lors de l\'envoi de l\'email.', error });
  }
});

// Lancer le service Notification
const PORT = process.env.PORT || process.env.NOTIFI_PORT || 4002;
app.listen(PORT, () => {
  console.log(`Service de notification en écoute sur le port ${PORT}`);
});
