# Changelog

Toutes les évolutions notables du projet examen CloudCampus (e-commerce MERN).

## [Unreleased]

### Added
- Documentation JSDoc générée depuis le code API (`npm run docs` dans `backend/`).

## [1.1.0] - 2026-11-03

### Added
- Health check `/health` sur API, gateway, notifications, stock et frontend nginx.
- Journalisation HTTP morgan + lignes `[audit]` (login, commande).
- CI GitHub Actions : `docker compose config` et build des images.
- Sondes UptimeRobot `/health` préprod et prod, alertes e-mail.
- Politique de mot de passe CNIL : 12 caractères, majuscule, minuscule, chiffre, caractère spécial.
- Limitation de débit sur `/api/auth` (10 essais / 15 min).
- Overrides npm frontend (nth-check, underscore, etc.) sans casser Create React App.

### Changed
- Commande : contrôle et décrément du stock Mongo, appel gateway `update-stock`, e-mail au compte client.
- `deleteOrder` / `validateOrder` branchés sur Mongo ; suppression réservée admin.
- Route frontend `shipping_payment` (correction de `shippig_payment`).
- `react-router-dom` 6.30.3.
- Logs : plus de dump d’adresse ni d’e-mail en clair.

### Fixed
- Liste produits : `Array.isArray` + message d’erreur (plus de `e.map is not a function`).
- Page admin : même protection si l’API ne renvoie pas un tableau.

### Security
- Helmet, CORS (`FRONTEND_URL`), `JWT_SECRET` obligatoire, bcrypt coût 12, mot de passe `select: false`.
- `npm audit fix` : backend, gateway, stock à 0 vulnérabilité. Reliquat CRA et Nodemailer documentés.

## [1.0.0] - 2026-11-03

### Added
- Conteneurisation Docker Compose (frontend nginx, backend, gateway, notifications, stock, Mongo authentifié).
- Déploiement Render : `develop` = préprod, `main` = production.
- MongoDB Atlas : bases `exam1Db` (préprod) et `exam1Prod` (prod).
