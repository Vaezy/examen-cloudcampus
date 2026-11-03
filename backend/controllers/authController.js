// backend/controllers/authController.js
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User'); // modèle utilisateur
require('dotenv').config();

const PASSWORD_RULE =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{12,}$/;
const PASSWORD_HINT =
  'Le mot de passe doit contenir au moins 12 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial.';

/**
 * Authentifie un utilisateur et renvoie un JWT (1 h).
 * Message d'erreur unique en cas d'échec (pas d'énumération de comptes).
 * @param {Object} req - body.username, body.password
 * @param {Object} res
 */
exports.login = async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username }).select('+password');
    const invalidMsg = 'Identifiant ou mot de passe incorrect.';
    if (!user) {
      console.warn('[audit] login failed');
      return res.status(401).json({ message: invalidMsg });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.warn('[audit] login failed');
      return res.status(401).json({ message: invalidMsg });
    }

    const token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
    console.log(`[audit] login success user=${user.username} role=${user.role}`);

    res.json({ token, role: user.role, username: user.username });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};


/**
 * Inscrit un utilisateur. Mot de passe : 12 car. min., majuscule, minuscule, chiffre, spécial.
 * Le hash bcrypt (coût 12) est appliqué par le modèle User, jamais loggé.
 * @param {Object} req - body.username, body.email, body.password
 * @param {Object} res
 */
exports.register = async (req, res) => {
  const { username, email, password } = req.body;

  try {
    if (!PASSWORD_RULE.test(String(password || ''))) {
      return res.status(400).json({ message: PASSWORD_HINT });
    }

    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });
    if (existingUser) {
      return res.status(400).json({
        message: 'Inscription impossible. Vérifiez les informations saisies.',
      });
    }

    const user = new User({ username, email, password });
    await user.save();
    console.log(`[audit] register success user=${username}`);

    // Envoyer un email de bienvenue
    // await sendEmail(
    //   email,
    //   'Bienvenue dans notre application',
    //   `Bonjour ${username},\n\nMerci de vous être inscrit. Nous sommes ravis de vous accueillir !`
    // );

    // await axios.post('http://localhost:4002/notify', {
    //   to: email,
    //   subject: 'Bienvenue dans notre application',
    //   text: `Bonjour ${username},\n\nMerci de vous être inscrit. Nous sommes ravis de vous accueillir !`,
    // });

    res.status(201).json({ message: 'Utilisateur créé avec succès.' });
  } catch (error) {
    console.error('Erreur lors de l\'inscription', error);
    res.status(500).json({ message: 'Une erreur est survenue.' });
  }
};