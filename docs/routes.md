# Documentation des Routes API

Documentation complète de toutes les routes de l'API Gym Management.

## Authentification

Les routes marquées 🔒 nécessitent un token JWT dans l'en-tête :
```
Authorization: Bearer <token>
```

Les rôles disponibles : `admin`, `manager`, `member`

---

## Routes User (`/user`)

### Authentification

| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| POST | `/auth` | - | Connexion (retourne un JWT token) |

**Body `/auth` :**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Réponse :**
```json
{
  "ok": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "id": "507f1f77bcf86cd799439011"
}
```

### CRUD Utilisateurs

| Méthode | Route | Auth | Rôle | Description |
|---------|-------|------|------|-------------|
| GET | `/getAll` | 🔒 | - | Récupérer tous les utilisateurs |
| GET | `/get/:id` | 🔒 | - | Récupérer un utilisateur par ID |
| POST | `/create` | 🔒 | - | Créer un utilisateur |
| PATCH | `/update/:id` | 🔒 | - | Mettre à jour un utilisateur |
| DELETE | `/delete/:id` | 🔒 | - | Supprimer un utilisateur |
| DELETE | `/deleteAll` | 🔒 | - | Supprimer tous les utilisateurs |

**Body `/create` :**
```json
{
  "firstname": "John",
  "lastname": "Doe",
  "email": "john@example.com",
  "password": "Password123!",
  "role": "member",
  "active": true
}
```

### Gestion des comptes (Admin)

| Méthode | Route | Auth | Rôle | Description |
|---------|-------|------|------|-------------|
| PATCH | `/toggle-active/:id` | 🔒 | admin | Activer/désactiver un compte |
| GET | `/status/:id` | 🔒 | admin | Voir le statut d'un utilisateur |

---

## Routes Gym (`/gym`)

### Consultation

| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| GET | `/getAll` | - | Récupérer toutes les salles |
| GET | `/approved` | - | Récupérer les salles approuvées |
| GET | `/:id` | - | Récupérer une salle par ID |

### Gestion des salles

| Méthode | Route | Auth | Rôle | Description |
|---------|-------|------|------|-------------|
| POST | `/create` | 🔒 | admin/manager | Créer une salle |
| PATCH | `/:id` | 🔒 | owner/admin | Mettre à jour une salle |
| PATCH | `/:id/exerciseTypes` | 🔒 | owner/admin | Attribuer des exercices |
| DELETE | `/:id` | 🔒 | owner/admin | Supprimer une salle |
| DELETE | `/admin/deleteAll` | 🔒 | admin | Supprimer toutes les salles |

**Body `/create` :**
```json
{
  "name": "FitZone Paris",
  "address": "15 Rue de la République, 75001 Paris",
  "capacity": 150,
  "equipment": ["Tapis de course", "Haltères"],
  "facilities": ["Vestiaires", "Douches", "Sauna"],
  "owner": "507f1f77bcf86cd799439011",
  "description": "Salle moderne",
  "phone": "0123456789",
  "email": "contact@fitzone.fr",
  "exerciseTypes": ["507f...", "507f..."]
}
```

### Approbation (Admin)

| Méthode | Route | Auth | Rôle | Description |
|---------|-------|------|------|-------------|
| PATCH | `/approve/:id` | 🔒 | admin | Approuver/rejeter une salle |

**Body `/approve/:id` :**
```json
{
  "approved": true
}
```

---

## Routes ExerciseType (`/exerciseType`)

| Méthode | Route | Auth | Rôle | Description |
|---------|-------|------|------|-------------|
| GET | `/getAll` | - | - | Récupérer tous les types d'exercices |
| GET | `/:id` | - | - | Récupérer un type par ID |
| POST | `/create` | 🔒 | admin | Créer un type d'exercice |
| PATCH | `/update/:id` | 🔒 | admin | Mettre à jour un type |
| DELETE | `/:id` | 🔒 | admin | Supprimer un type |

**Body `/create` :**
```json
{
  "name": "Push-ups",
  "description": "Exercice pour le haut du corps",
  "targetedMuscles": ["pectoraux", "triceps"],
  "difficulty": "beginner"
}
```

**Valeurs `difficulty` :** `beginner`, `intermediate`, `advanced`

---

## Routes Badge (`/badge`)

| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| GET | `/getAll` | 🔒 | Récupérer tous les badges |
| GET | `/get/:id` | 🔒 | Récupérer un badge par ID |
| POST | `/create` | 🔒 | Créer un badge |
| PATCH | `/update/:id` | 🔒 | Mettre à jour un badge |
| DELETE | `/delete/:id` | 🔒 | Supprimer un badge |
| DELETE | `/deleteAll` | 🔒 | Supprimer tous les badges |

**Body `/create` :**
```json
{
  "name": "Première Séance",
  "description": "Complétez votre première séance",
  "iconUrl": "/badges/first-session.svg"
}
```

---

## Routes BadgeRule (`/badgeRule`)

Gestion dynamique des règles d'attribution de badges.

**Association Badge ↔ Règle :**
Les règles sont liées aux badges via le champ `badgeName` qui doit correspondre exactement au champ `name` du badge. Un badge peut avoir plusieurs règles (conditions alternatives).

**Workflow :**
1. Créer le badge via `/badge/create`
2. Créer une ou plusieurs règles via `/badgeRule/create` avec le même `badgeName`
3. Les règles actives sont automatiquement évaluées lors des entraînements

### Consultation

**Exemples d'utilisation :**
- Récupérer les règles du badge "Marathonien" : `GET /badgeRule/badge?name=Marathonien`
- Avec des espaces : `GET /badgeRule/badge?name=Première Séance`

| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| GET | `/getAll` | 🔒 | Récupérer toutes les règles |
| GET | `/active` | 🔒 | Récupérer les règles actives uniquement |
| GET | `/get/:id` | 🔒 | Récupérer une règle par ID |
| GET | `/badge?name=<badgeName>` | 🔒 | Récupérer les règles d'un badge |

### Gestion

| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| POST | `/create` | 🔒 | Créer une nouvelle règle |
| PATCH | `/update/:id` | 🔒 | Mettre à jour une règle |
| PATCH | `/toggle/:id` | 🔒 | Activer/désactiver une règle |
| DELETE | `/delete/:id` | 🔒 | Supprimer une règle |
| DELETE | `/deleteAll` | 🔒 | Supprimer toutes les règles |

**Body `/create` :**
```json
{
  "badgeName": "Marathon",
  "conditionType": "totalPoints",
  "conditionField": "totalPoints",
  "operator": ">=",
  "value": 5000,
  "isActive": true
}
```

**Champs détaillés :**
- `badgeName` (string) : Nom du badge associé
- `conditionType` (enum) : `"totalPoints"` | `"completedTrainings"` | `"custom"`
- `conditionField` (string) : Champ à évaluer (ex: `"totalPoints"`, `"completedTrainings"`)
- `operator` (enum) : `">="` | `">"` | `"="` | `"<"` | `"<="`
- `value` (number) : Valeur seuil à atteindre
- `customCondition` (string, optionnel) : Condition personnalisée pour règles complexes
- `isActive` (boolean) : Statut de la règle (défaut: `true`)

**Exemples de règles :**

*Règle basée sur les points :*
```json
{
  "badgeName": "Expert",
  "conditionType": "totalPoints",
  "conditionField": "totalPoints",
  "operator": ">=",
  "value": 1000
}
```

*Règle basée sur les entraînements :*
```json
{
  "badgeName": "Acharné",
  "conditionType": "completedTrainings",
  "conditionField": "completedTrainings",
  "operator": ">=",
  "value": 10
}
```

**Réponse `/toggle/:id` :**
```json
{
  "message": "Rule activated",
  "data": {
    "_id": "507f...",
    "badgeName": "Marathon",
    "isActive": true,
    ...
  }
}
```

**⚡ Évaluation automatique :**
- Les règles actives sont automatiquement évaluées lors de la création d'un `TrainingStat`
- Le système attribue les badges correspondants si les conditions sont remplies
- Les règles peuvent être activées/désactivées sans suppression

**📦 Règles par défaut (seeder) :**
- **Premier Pas** : 1 entraînement complété
- **Débutant Motivé** : 3 entraînements complétés
- **Acharné** : 10 entraînements complétés
- **Expert** : 1000 points
- **Marathon** : 5000 points
- **Champion** : 10000 points

**🔗 Exemple complet - Créer un nouveau badge avec sa règle :**

```bash
# Étape 1 : Créer le badge
POST /badge/create
{
  "name": "Ultra Marathon",
  "description": "Dépassez les 10000 points",
  "iconUrl": "/badges/ultra-marathon.svg"
}

# Étape 2 : Créer la règle d'attribution
POST /badgeRule/create
{
  "badgeName": "Ultra Marathon",
  "conditionType": "totalPoints",
  "conditionField": "totalPoints",
  "operator": ">=",
  "value": 10000
}

# Étape 3 : Vérifier les règles du badge
GET /badgeRule/badge?name=Ultra Marathon
```

---

## Routes Challenge (`/challenge`)

### Consultation

| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| GET | `/getAll` | - | Récupérer tous les défis |
| GET | `/filter` | - | Filtrer les défis (query params) |
| GET | `/:id` | - | Récupérer un défi par ID |
| GET | `/shared/received` | 🔒 | Défis partagés reçus |
| GET | `/shared/sent` | 🔒 | Défis partagés envoyés |

**Query params `/filter` :**
- `difficulty` : beginner, intermediate, advanced
- `exerciseType` : ID du type d'exercice
- `duration` : durée maximale (en jours)
- `gymId` : ID de la salle

**Query params `/shared/received` :**
- `unseen` : `true` pour voir uniquement les défis non vus

### Gestion

| Méthode | Route | Auth | Rôle | Description |
|---------|-------|------|------|-------------|
| POST | `/create` | 🔒 | - | Créer un défi |
| POST | `/:id/share` | 🔒 | - | Partager un défi avec d'autres utilisateurs |
| POST | `/:id/join` | 🔒 | - | Rejoindre un défi |
| POST | `/:id/complete` | 🔒 | - | Compléter un défi et gagner des points |
| PATCH | `/update/:id` | 🔒 | - | Mettre à jour un défi |
| PATCH | `/shared/:shareId/seen` | 🔒 | admin/manager | Marquer un défi partagé comme vu/non vu |
| DELETE | `/:id` | 🔒 | admin/manager | Supprimer un défi |

**Body `/create` :**
```json
{
  "title": "Défi Push-ups 100",
  "description": "Réalisez 100 push-ups",
  "creator": "507f1f77bcf86cd799439011",
  "exerciseType": "507f1f77bcf86cd799439011",
  "difficulty": "beginner",
  "duration": 7,
  "objectives": "Atteindre 100 push-ups en une séance",
  "participants": [],
  "gym": "507f1f77bcf86cd799439011",
  "startDate": "2025-12-14T00:00:00Z",
  "endDate": "2025-12-21T00:00:00Z"
}
```

**Body `/:id/join` :**
```json
{
  "userId": "507f1f77bcf86cd799439011"
}
```

**Body `/:id/share` :**
```json
{
  "sharedWith": "507f1f77bcf86cd799439011",
  "message": "Essaie ce défi !"
}
```

**Ou pour partager avec plusieurs utilisateurs :**
```json
{
  "sharedWith": ["507f1...", "507f2...", "507f3..."],
  "message": "Relevons ce défi ensemble !"
}
```

**Réponse `/:id/share` :**
```json
{
  "message": "Défi partagé avec succès",
  "shared": 3,
  "alreadyShared": 0,
  "recipients": 3
}
```

**Body `/shared/:shareId/seen` :**
```json
{
  "seen": true
}
```

**Réponse `/shared/received` :**
```json
[
  {
    "_id": "675f...",
    "challenge": {
      "_id": "675e...",
      "title": "Défi Push-ups",
      "creator": {
        "firstname": "John",
        "lastname": "Doe"
      },
      "exerciseType": {
        "name": "Push-ups",
        "difficulty": "beginner"
      },
      "gym": {
        "name": "FitZone Paris"
      }
    },
    "sharedBy": {
      "firstname": "Marie",
      "lastname": "Martin",
      "email": "marie@example.com"
    },
    "sharedWith": "507f1f77bcf86cd799439011",
    "message": "Essaie ce défi !",
    "seen": false,
    "created_at": "2025-12-21T10:00:00Z"
  }
]
```

**Body `/:id/complete` :**
```json
{
  "userId": "507f1f77bcf86cd799439011"
}
```

**Réponse `/:id/complete` :**
```json
{
  "message": "Défi complété avec succès",
  "pointsEarned": 20
}
```

**🎯 Calcul des points par difficulté :**
- **beginner** : 10 points
- **intermediate** : 20 points
- **advanced** : 30 points

**✅ Validations :**
- L'`userId` doit être un ObjectId MongoDB valide (24 caractères hexadécimaux)
- L'utilisateur doit être participant du défi
- L'utilisateur ne peut compléter le défi que pour lui-même
- Les points sont automatiquement ajoutés au score de l'utilisateur
- Les récompenses et badges sont automatiquement vérifiés et attribués

**📤 Partage de défis :**
- Vous ne pouvez pas partager un défi avec vous-même
- Les utilisateurs partagés doivent exister dans la base de données
- Un défi ne peut être partagé qu'une seule fois avec le même utilisateur (évite les doublons)
- Le partage inclut un message optionnel

---

## Routes Score (`/score`)

| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| GET | `/leaderboard` | - | Top 10 des meilleurs scores |
| GET | `/user/:userId` | - | Score d'un utilisateur |
| POST | `/add-points` | 🔒 | Ajouter manuellement des points (admin) |

**Réponse `/leaderboard` :**
```json
[
  {
    "_id": "507f...",
    "user": {
      "_id": "507f...",
      "firstname": "Marie",
      "lastname": "Dupont",
      "email": "marie@example.com"
    },
    "totalPoints": 1500,
    "challengesCompleted": 10,
    "badgesEarned": 3
  }
]
```

**Réponse `/user/:userId` :**
```json
{
  "_id": "507f...",
  "user": "507f1f77bcf86cd799439011",
  "totalPoints": 145,
  "challengesCompleted": 5,
  "badgesEarned": 2,
  "createdAt": "2025-12-16T10:00:00Z",
  "updatedAt": "2025-12-16T15:30:00Z"
}
```

**Body `/add-points` :**
```json
{
  "userId": "507f1f77bcf86cd799439011",
  "points": 50
}
```

**Réponse `/add-points` :**
```json
{
  "message": "Points ajoutés avec succès",
  "points": 50
}
```

**✅ Validations :**
- L'`userId` doit être un ObjectId MongoDB valide
- Les `points` doivent être un nombre entier ≥ 1

---

## Routes TrainingStat (`/trainingStat`)

| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| POST | `/create` | 🔒 | Enregistrer une séance (auto-calcul points) |
| GET | `/user/:userId` | 🔒 | Historique d'un utilisateur |
| PATCH | `/update/:id` | 🔒 | Mettre à jour une stat |
| DELETE | `/:id` | 🔒 | Supprimer une stat |

**Body `/create` :**
```json
{
  "user": "507f1f77bcf86cd799439011",
  "challenge": "507f1f77bcf86cd799439011",
  "duration": 45,
  "repetitions": 100,
  "weight": 50,
  "completed": true,
  "sessionDate": "2025-12-14T10:00:00Z",
  "notes": "Bonne séance"
}
```

**Calcul automatique :**
- Points attribués : `duration * 10` points
- Incrémente `challengesCompleted`
- Vérifie et attribue les badges automatiquement

---

## Routes SocialChallenge (`/social`)

| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| POST | `/invite` | 🔒 | Inviter à un défi social |
| PATCH | `/:id/status` | 🔒 | Modifier le statut (accepter/refuser) |
| POST | `/:id/complete` | 🔒 | Compléter un défi social et gagner des points avec bonus |
| GET | `/invitations/:userId` | 🔒 | Invitations en attente d'un utilisateur |

**Body `/invite` :**
```json
{
  "challenge": "507f1f77bcf86cd799439011",
  "inviter": "507f1f77bcf86cd799439011",
  "invitee": "507f1f77bcf86cd799439011"
}
```

**Body `/:id/status` :**
```json
{
  "status": "accepted"
}
```

**Valeurs `status` :** `pending`, `accepted`, `declined`, `completed`

**Réponse `/:id/complete` :**
```json
{
  "message": "Défi social complété avec succès",
  "pointsEarned": 35,
  "breakdown": {
    "basePoints": 20,
    "socialBonus": 15
  }
}
```

**🎯 Calcul des points pour défis sociaux :**

Les défis sociaux donnent un **bonus de +15 points** en plus des points de base :

| Difficulté | Points de base | Bonus social | Total |
|------------|----------------|--------------|-------|
| beginner | 10 | +15 | **25 points** |
| intermediate | 20 | +15 | **35 points** |
| advanced | 30 | +15 | **45 points** |

**✨ Avantages :**
- Les **deux participants** (inviteur + invité) reçoivent les points
- Le bonus social encourage la collaboration
- Le défi doit être au statut `accepted` avant d'être complété

**✅ Validations :**
- Les ObjectIds doivent être valides (24 caractères hexadécimaux)
- Le statut doit être `pending`, `accepted`, `declined` ou `completed`
- Pour compléter, le défi doit être accepté (status = `accepted`)

---

## Routes Reward (`/reward`)

Gestion du système de récompenses (trophées, médailles, objets, titres).

### Consultation

| Méthode | Route | Auth | Rôle | Description |
|---------|-------|------|------|-------------|
| GET | `/getAll` | 🔒 | admin | Récupérer toutes les récompenses |
| GET | `/active` | - | - | Récupérer les récompenses actives |
| GET | `/get/:id` | 🔒 | - | Récupérer une récompense par ID |
| GET | `/my` | 🔒 | - | Récupérer mes récompenses |
| GET | `/user/:userId` | 🔒 | - | Récupérer les récompenses d'un utilisateur |

### Gestion (Admin)

| Méthode | Route | Auth | Rôle | Description |
|---------|-------|------|------|-------------|
| POST | `/create` | 🔒 | admin | Créer une récompense |
| PATCH | `/update/:id` | 🔒 | admin | Mettre à jour une récompense |
| PATCH | `/toggle/:id` | 🔒 | admin | Activer/désactiver une récompense |
| DELETE | `/delete/:id` | 🔒 | admin | Supprimer une récompense |
| DELETE | `/deleteAll` | 🔒 | admin | Supprimer toutes les récompenses |
| POST | `/:id/award` | 🔒 | admin | Attribuer manuellement une récompense |

**Body `/create` :**
```json
{
  "name": "Trophée du Champion",
  "description": "Récompense pour avoir atteint 10000 points",
  "type": "trophy",
  "iconUrl": "/rewards/champion-trophy.svg",
  "rarity": "legendary",
  "conditionType": "pointsThreshold",
  "conditionValue": 10000,
  "isActive": true
}
```

**Champs détaillés :**
- `name` (string) : Nom de la récompense (doit être unique)
- `description` (string) : Description de la récompense
- `type` (enum) : `"trophy"` | `"medal"` | `"item"` | `"title"`
- `iconUrl` (string) : URL de l'icône
- `rarity` (enum) : `"common"` | `"rare"` | `"epic"` | `"legendary"` (défaut: `"common"`)
- `conditionType` (enum) : `"challengeComplete"` | `"socialComplete"` | `"pointsThreshold"` | `"manual"`
- `conditionValue` (number, optionnel) : Valeur seuil (ex: nombre de points)
- `conditionDifficulty` (enum, optionnel) : `"beginner"` | `"intermediate"` | `"advanced"`
- `isActive` (boolean) : Statut actif/inactif (défaut: `true`)

**Exemples de récompenses :**

*Récompense basée sur les points :*
```json
{
  "name": "Médaille d'Or",
  "description": "Atteignez 5000 points",
  "type": "medal",
  "iconUrl": "/rewards/gold-medal.svg",
  "rarity": "epic",
  "conditionType": "pointsThreshold",
  "conditionValue": 5000
}
```

*Récompense pour défi complété :*
```json
{
  "name": "Maître du Cardio",
  "description": "Complétez un défi de difficulté avancée",
  "type": "title",
  "iconUrl": "/rewards/cardio-master.svg",
  "rarity": "rare",
  "conditionType": "challengeComplete",
  "conditionDifficulty": "advanced"
}
```

*Récompense pour défi social :*
```json
{
  "name": "Ami Motivé",
  "description": "Complétez un défi social",
  "type": "item",
  "iconUrl": "/rewards/social-badge.svg",
  "rarity": "common",
  "conditionType": "socialComplete"
}
```

*Récompense manuelle :*
```json
{
  "name": "Récompense Spéciale",
  "description": "Récompense attribuée manuellement par un admin",
  "type": "trophy",
  "iconUrl": "/rewards/special.svg",
  "rarity": "legendary",
  "conditionType": "manual"
}
```

**Body `/:id/award` :**
```json
{
  "userId": "507f1f77bcf86cd799439011",
  "reason": "Performance exceptionnelle"
}
```

**Réponse `/:id/award` :**
```json
{
  "message": "Récompense attribuée avec succès"
}
```

**Réponse `/my` ou `/user/:userId` :**
```json
[
  {
    "_id": "675f...",
    "reward": {
      "_id": "675e...",
      "name": "Trophée du Champion",
      "description": "Récompense pour avoir atteint 10000 points",
      "type": "trophy",
      "iconUrl": "/rewards/champion-trophy.svg",
      "rarity": "legendary"
    },
    "user": "507f1f77bcf86cd799439011",
    "dateEarned": "2025-12-21T10:00:00Z"
  }
]
```

**⚡ Attribution automatique :**
- Les récompenses sont automatiquement vérifiées et attribuées lors de :
  - La complétion d'un défi (`/challenge/:id/complete`)
  - La complétion d'un défi social (`/social/:id/complete`)
  - L'ajout de points (`/score/add-points`)
- Les récompenses avec `conditionType: "manual"` doivent être attribuées manuellement

**✅ Validations :**
- Le nom de la récompense doit être unique
- Tous les champs enum doivent respecter les valeurs autorisées
- Le `userId` doit être un ObjectId MongoDB valide
- Une récompense ne peut être attribuée qu'une seule fois à un utilisateur

**🎁 Types de conditions :**
- **challengeComplete** : Attribuée lors de la complétion d'un défi (peut filtrer par difficulté)
- **socialComplete** : Attribuée lors de la complétion d'un défi social
- **pointsThreshold** : Attribuée quand l'utilisateur atteint un seuil de points
- **manual** : Doit être attribuée manuellement par un admin

---

## Codes de statut HTTP

| Code | Signification |
|------|---------------|
| 200 | Succès (GET, PATCH) |
| 201 | Créé (POST) |
| 204 | Succès sans contenu (DELETE) |
| 400 | Requête invalide (validation échouée) |
| 401 | Non authentifié (token manquant/invalide) |
| 403 | Accès refusé (rôle insuffisant) |
| 404 | Ressource non trouvée |
| 500 | Erreur serveur |

---

## Tester les routes

### Avec cURL

**Login :**
```bash
curl -X POST http://localhost:3000/user/auth \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@gym.com","password":"Admin123!"}'
```

**Récupérer les salles (avec token) :**
```bash
curl http://localhost:3000/gym/getAll \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Avec Postman / Insomnia

1. Créer une requête POST vers `/user/auth`
2. Copier le token reçu
3. Ajouter le header `Authorization: Bearer <token>` aux requêtes protégées

---

## Notes importantes

### Validation des données
- Tous les endpoints avec body utilisent Zod pour la validation
- Les erreurs de validation retournent un code 400 avec les détails

### Permissions
- **Admin** : accès complet à toutes les routes
- **Manager** : peut créer des salles (soumises à approbation admin)
- **Member** : accès limité aux routes de consultation et ses propres données

### Relations entre entités
- Les gyms référencent des `owner` (User) et `exerciseTypes`
- Les challenges référencent `creator`, `exerciseType`, `gym`, et `participants`
- Les training stats référencent `user` et `challenge`

### Populate automatique
Plusieurs routes incluent automatiquement les relations :
- Gyms : populate `owner` et `exerciseTypes`
- Challenges : populate `creator`, `gym`, `exerciseType`
- Scores : populate `user`

---

## Base URL

**Développement :** `http://localhost:3000`

**Production :** À définir selon le déploiement

---