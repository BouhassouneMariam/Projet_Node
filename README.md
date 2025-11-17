# 🚀 GUIDE DE LANCEMENT - TSPARK PROJECT

## 📋 Prérequis

- **Docker** : Version 20.10+ ([Installer Docker](https://docs.docker.com/get-docker/))
- **Docker Compose** : Version 2.0+ (inclus avec Docker Desktop)
- **Git** : Pour cloner le projet

---

## 🛠️ Installation et Configuration

### 1️⃣ Cloner le projet

```bash
git clone <votre-repo-url>
cd Projet_Node
```

### 2️⃣ Configurer les variables d'environnement

```bash
# Copier le fichier d'exemple
cp .env.example .env

# Éditer le fichier .env avec vos propres valeurs
nano .env  # ou vim, code, etc.
```

### 3️⃣ Vérifier la structure du projet

```bash
.
├── docker-compose.yml
├── Dockerfile
├── .dockerignore
├── .env
├── package.json
├── tsconfig.json
├── index.ts
└── src/
    └── mongoClient.ts
```

---

## 🐳 Lancement du projet

### ✅ Mode Développement (avec hot-reload)

```bash
# Construire et lancer tous les services
docker compose up -d --build

# Voir les logs en temps réel
docker compose logs -f

# Voir uniquement les logs de l'API
docker compose logs -f web
```

### ✅ Commandes essentielles

```bash
# Démarrer les services
docker compose up -d

# Arrêter les services
docker compose down

# Arrêter et supprimer les volumes (⚠️ SUPPRIME LES DONNÉES)
docker compose down -v

# Reconstruire l'image après modifications
docker compose up -d --build

# Redémarrer un service spécifique
docker compose restart web

# Voir l'état des containers
docker compose ps

# Entrer dans le container de l'API
docker compose exec web sh

# Entrer dans MongoDB
docker compose exec mongo mongosh
```

---

## 🌐 Accès aux services

| Service           | URL                       | Description           |
| ----------------- | ------------------------- | --------------------- |
| **API**           | http://localhost:3000     | Votre API Express     |
| **MongoDB**       | mongodb://localhost:27017 | Base de données       |
| **Mongo Express** | http://localhost:8081     | Interface web MongoDB |

### Credentials Mongo Express :

- **Username** : `admin` (défini dans .env)
- **Password** : `pass` (défini dans .env)

---

## 🧪 Tester l'API

### Avec curl :

```bash
# Test de l'endpoint racine
curl http://localhost:3000/

# Réponse attendue : "shany fox man!"
```

### Avec un navigateur :

Ouvrir : http://localhost:3000/

### Avec Postman :

1. Créer une requête GET
2. URL : `http://localhost:3000/`
3. Envoyer

---
