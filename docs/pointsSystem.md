# Système de Calcul des Points

## Vue d'ensemble

Le système de calcul des points permet de récompenser les utilisateurs pour leur participation et complétion des défis. Les points sont calculés en fonction de la difficulté du défi et du type de participation.

## Barème des Points

### Points de Base par Difficulté

| Difficulté | Points |
|-----------|--------|
| Beginner (Débutant) | 10 points |
| Intermediate (Intermédiaire) | 20 points |
| Advanced (Avancé) | 30 points |

### Bonus

- **Défi Social** : +15 points (en plus des points de base)
  - Les défis sociaux sont ceux où un utilisateur invite un autre utilisateur
  - Les deux participants (inviteur et invité) reçoivent le bonus

## Exemples de Calcul

### Défi Standard
- Défi débutant complété : **10 points**
- Défi intermédiaire complété : **20 points**
- Défi avancé complété : **30 points**

### Défi Social
- Défi social débutant : 10 + 15 = **25 points** (pour chaque participant)
- Défi social intermédiaire : 20 + 15 = **35 points** (pour chaque participant)
- Défi social avancé : 30 + 15 = **45 points** (pour chaque participant)

## API Endpoints

### 1. Compléter un Défi Standard

```http
POST /api/challenges/:id/complete
Authorization: Bearer <token>
Content-Type: application/json

{
  "userId": "user_id_here"
}
```

**Réponse :**
```json
{
  "message": "Défi complété avec succès",
  "pointsEarned": 20
}
```

### 2. Compléter un Défi Social

```http
POST /api/social-challenges/:id/complete
Authorization: Bearer <token>
```

**Réponse :**
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

### 3. Consulter le Score d'un Utilisateur

```http
GET /api/scores/user/:userId
```

**Réponse :**
```json
{
  "_id": "score_id",
  "user": "user_id",
  "totalPoints": 145,
  "challengesCompleted": 5,
  "badgesEarned": 2,
  "createdAt": "2025-12-16T...",
  "updatedAt": "2025-12-16T..."
}
```

### 4. Consulter le Leaderboard

```http
GET /api/scores/leaderboard
```

**Réponse :**
```json
[
  {
    "_id": "score_id",
    "user": {
      "_id": "user_id",
      "firstname": "John",
      "lastname": "Doe",
      "email": "john@example.com"
    },
    "totalPoints": 245,
    "challengesCompleted": 10,
    "badgesEarned": 3
  },
  ...
]
```

## Service de Calcul

Le service `scoreService.ts` fournit les fonctions suivantes :

### `addPointsForChallenge(userId, difficulty, isSocialChallenge)`
Ajoute des points pour un seul participant.

**Paramètres :**
- `userId` : ID de l'utilisateur (string ou ObjectId)
- `difficulty` : "beginner" | "intermediate" | "advanced"
- `isSocialChallenge` : boolean (défaut: false)

### `addPointsForMultipleParticipants(participantIds, difficulty, isSocialChallenge)`
Ajoute des points pour plusieurs participants simultanément.

**Paramètres :**
- `participantIds` : Tableau d'IDs des participants
- `difficulty` : "beginner" | "intermediate" | "advanced"
- `isSocialChallenge` : boolean (défaut: false)

### `getPointsForDifficulty(difficulty, isSocialChallenge)`
Calcule le nombre de points sans les attribuer.

**Paramètres :**
- `difficulty` : "beginner" | "intermediate" | "advanced"
- `isSocialChallenge` : boolean (défaut: false)

**Retour :** number

## Workflow de Complétion

### Défi Standard
1. L'utilisateur rejoint un défi via `POST /challenges/:id/join`
2. L'utilisateur complète le défi
3. L'utilisateur appelle `POST /challenges/:id/complete` avec son userId
4. Le système :
   - Vérifie que l'utilisateur est participant
   - Calcule les points selon la difficulté
   - Met à jour le score de l'utilisateur
   - Incrémente le compteur de défis complétés

### Défi Social
1. Un utilisateur (inviteur) crée une invitation via `POST /social-challenges/invite`
2. L'invité accepte via `PATCH /social-challenges/:id/status` avec `status: "accepted"`
3. Les deux participants complètent le défi
4. L'un des deux appelle `POST /social-challenges/:id/complete`
5. Le système :
   - Vérifie que le défi est accepté
   - Calcule les points avec bonus social
   - Attribue les points aux DEUX participants
   - Met à jour le statut à "completed"

## Évolutions Futures Possibles

- Bonus pour les séries de défis consécutifs
- Points multipliés lors d'événements spéciaux
- Réductions de points en cas d'abandon
- Système de niveaux basé sur les points totaux
- Défis en équipe avec répartition des points
