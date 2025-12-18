// Configuration API
const API_URL = 'http://localhost:3000';
let authToken = localStorage.getItem('authToken');
let currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');

// ========== GESTION AUTHENTIFICATION ==========
document.getElementById('login-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch(`${API_URL}/user/auth`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        if (!response.ok) {
            throw new Error('Email ou mot de passe incorrect');
        }

        const data = await response.json();
        authToken = data.token;
        currentUser = { email, id: data.id };
        
        localStorage.setItem('authToken', authToken);
        localStorage.setItem('currentUser', JSON.stringify(currentUser));

        document.getElementById('auth-page').style.display = 'none';
        document.getElementById('dashboard').style.display = 'flex';
        document.getElementById('current-user-email').textContent = email;

        loadPage('users');
    } catch (error) {
        showAuthError(error.message);
    }
});

// ========== GESTION INSCRIPTION ==========
document.getElementById('register-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);

    try {
        const response = await fetch(`${API_URL}/user/create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Erreur lors de la création du compte');
        }

        showAuthSuccess('Compte créé avec succès ! Vous pouvez maintenant vous connecter.');
        
        // Basculer vers le formulaire de connexion après 2 secondes
        setTimeout(() => {
            toggleAuthForm();
            // Pré-remplir l'email
            document.getElementById('email').value = data.email;
        }, 2000);
    } catch (error) {
        showAuthError(error.message);
    }
});

// ========== TOGGLE ENTRE CONNEXION ET INSCRIPTION ==========
document.getElementById('toggle-link')?.addEventListener('click', (e) => {
    e.preventDefault();
    toggleAuthForm();
});

function toggleAuthForm() {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const toggleText = document.getElementById('toggle-text');
    const toggleLink = document.getElementById('toggle-link');
    const testAccounts = document.getElementById('test-accounts');

    if (loginForm.style.display === 'none') {
        // Afficher connexion
        loginForm.style.display = 'block';
        registerForm.style.display = 'none';
        toggleText.innerHTML = 'Pas encore de compte ? <a href="#" id="toggle-link">Créer un compte</a>';
        testAccounts.style.display = 'block';
        
        // Réattacher l'event listener au nouveau lien
        document.getElementById('toggle-link').addEventListener('click', (e) => {
            e.preventDefault();
            toggleAuthForm();
        });
    } else {
        // Afficher inscription
        loginForm.style.display = 'none';
        registerForm.style.display = 'block';
        toggleText.innerHTML = 'Déjà un compte ? <a href="#" id="toggle-link">Se connecter</a>';
        testAccounts.style.display = 'none';
        
        // Réattacher l'event listener au nouveau lien
        document.getElementById('toggle-link').addEventListener('click', (e) => {
            e.preventDefault();
            toggleAuthForm();
        });
    }

    // Effacer les messages d'erreur/succès
    document.getElementById('auth-error').style.display = 'none';
    document.getElementById('auth-success').style.display = 'none';
}

function fillCredentials(email, password) {
    document.getElementById('email').value = email;
    document.getElementById('password').value = password;
}

function showAuthError(message) {
    const errorDiv = document.getElementById('auth-error');
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    setTimeout(() => errorDiv.style.display = 'none', 5000);
}

function showAuthSuccess(message) {
    const successDiv = document.getElementById('auth-success');
    successDiv.textContent = message;
    successDiv.style.display = 'block';
    setTimeout(() => successDiv.style.display = 'none', 5000);
}

function logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    window.location.reload();
}

// ========== HELPERS API ==========
async function apiCall(endpoint, method = 'GET', body = null) {
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
        }
    };

    if (body) {
        options.body = JSON.stringify(body);
    }

    const response = await fetch(`${API_URL}${endpoint}`, options);
    
    if (response.status === 204) {
        return null;
    }

    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Erreur serveur' }));
        throw new Error(error.error || 'Une erreur est survenue');
    }

    return response.json();
}

// ========== NAVIGATION ==========
document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();
        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
        item.classList.add('active');
        const page = item.dataset.page;
        loadPage(page);
    });
});

function loadPage(page) {
    const titles = {
        'users': 'Utilisateurs',
        'gyms': 'Salles de Sport',
        'exercises': 'Types d\'Exercices',
        'challenges': 'Défis',
        'badges': 'Badges',
        'badgeRules': 'Règles de Badges',
        'trainings': 'Entraînements',
        'scores': 'Classement'
    };

    document.getElementById('page-title').textContent = titles[page] || page;
    
    const pages = {
        'users': renderUsersPage,
        'gyms': renderGymsPage,
        'exercises': renderExercisesPage,
        'challenges': renderChallengesPage,
        'badges': renderBadgesPage,
        'badgeRules': renderBadgeRulesPage,
        'trainings': renderTrainingsPage,
        'scores': renderScoresPage
    };

    if (pages[page]) {
        pages[page]();
    }
}

// ========== PAGE UTILISATEURS ==========
async function renderUsersPage() {
    const content = document.getElementById('content-area');
    content.innerHTML = '<div class="loading"><div class="spinner"></div></div>';

    try {
        const users = await apiCall('/user/getAll');
        
        content.innerHTML = `
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Liste des utilisateurs</h3>
                    <button class="btn btn-primary" onclick="showCreateUserModal()">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="12" y1="5" x2="12" y2="19"></line>
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                        </svg>
                        Nouvel utilisateur
                    </button>
                </div>
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Nom</th>
                                <th>Email</th>
                                <th>Rôle</th>
                                <th>Statut</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${users.map(user => `
                                <tr>
                                    <td>${user.firstname} ${user.lastname}</td>
                                    <td>${user.email}</td>
                                    <td><span class="badge badge-info">${user.role}</span></td>
                                    <td><span class="badge ${user.active ? 'badge-success' : 'badge-danger'}">
                                        ${user.active ? 'Actif' : 'Inactif'}
                                    </span></td>
                                    <td>
                                        <div class="btn-group">
                                            <button class="btn btn-sm btn-secondary" onclick="editUser('${user._id}')">Modifier</button>
                                            <button class="btn btn-sm btn-danger" onclick="deleteUser('${user._id}')">Supprimer</button>
                                        </div>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    } catch (error) {
        content.innerHTML = `<div class="error-message">${error.message}</div>`;
    }
}

function showCreateUserModal() {
    showModal('Créer un utilisateur', `
        <form id="create-user-form">
            <div class="form-group">
                <label>Prénom</label>
                <input type="text" name="firstname" required>
            </div>
            <div class="form-group">
                <label>Nom</label>
                <input type="text" name="lastname" required>
            </div>
            <div class="form-group">
                <label>Email</label>
                <input type="email" name="email" required>
            </div>
            <div class="form-group">
                <label>Mot de passe</label>
                <input type="password" name="password" required minlength="8">
            </div>
            <div class="form-group">
                <label>Rôle</label>
                <select name="role" required>
                    <option value="member">Member</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                </select>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" onclick="closeModal()">Annuler</button>
                <button type="submit" class="btn btn-primary">Créer</button>
            </div>
        </form>
    `);

    document.getElementById('create-user-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData);

        try {
            await apiCall('/user/create', 'POST', data);
            closeModal();
            renderUsersPage();
            showSuccess('Utilisateur créé avec succès');
        } catch (error) {
            alert(error.message);
        }
    });
}

async function deleteUser(id) {
    if (!confirm('Voulez-vous vraiment supprimer cet utilisateur ?')) return;

    try {
        await apiCall(`/user/delete/${id}`, 'DELETE');
        renderUsersPage();
        showSuccess('Utilisateur supprimé');
    } catch (error) {
        alert(error.message);
    }
}

// ========== PAGE SALLES ==========
async function renderGymsPage() {
    const content = document.getElementById('content-area');
    content.innerHTML = '<div class="loading"><div class="spinner"></div></div>';

    try {
        const gyms = await apiCall('/gym/getAll');
        
        content.innerHTML = `
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Salles de sport</h3>
                    <button class="btn btn-primary" onclick="showCreateGymModal()">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="12" y1="5" x2="12" y2="19"></line>
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                        </svg>
                        Nouvelle salle
                    </button>
                </div>
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Nom</th>
                                <th>Adresse</th>
                                <th>Capacité</th>
                                <th>Propriétaire</th>
                                <th>Statut</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${gyms.map(gym => `
                                <tr>
                                    <td><strong>${gym.name}</strong></td>
                                    <td>${gym.address}</td>
                                    <td>${gym.capacity} personnes</td>
                                    <td>${gym.owner?.firstname} ${gym.owner?.lastname}</td>
                                    <td><span class="badge ${gym.approved ? 'badge-success' : 'badge-warning'}">
                                        ${gym.approved ? 'Approuvée' : 'En attente'}
                                    </span></td>
                                   <td>
    <div class="btn-group">
        ${!gym.approved ? `<button class="btn btn-sm btn-success" onclick="approveGym('${gym._id}')">Approuver</button>` : ''}
        <button class="btn btn-sm btn-secondary" onclick="editGym('${gym._id}')">Modifier</button>
        <button class="btn btn-sm btn-danger" onclick="deleteGym('${gym._id}')">Supprimer</button>
    </div>
</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    } catch (error) {
        content.innerHTML = `<div class="error-message">${error.message}</div>`;
    }
}

async function showCreateGymModal() {
    const users = await apiCall('/user/getAll');
    const exercises = await apiCall('/exerciseType/getAll');

    showModal('Créer une salle', `
        <form id="create-gym-form">
            <div class="form-group">
                <label>Nom</label>
                <input type="text" name="name" required>
            </div>
            <div class="form-group">
                <label>Adresse</label>
                <input type="text" name="address" required>
            </div>
            <div class="form-group">
                <label>Capacité</label>
                <input type="number" name="capacity" required min="1">
            </div>
            <div class="form-group">
                <label>Propriétaire</label>
                <select name="owner" required>
                    ${users.map(u => `<option value="${u._id}">${u.firstname} ${u.lastname}</option>`).join('')}
                </select>
            </div>
            <div class="form-group">
                <label>Description</label>
                <textarea name="description"></textarea>
            </div>
            <div class="form-group">
                <label>Téléphone</label>
                <input type="tel" name="phone">
            </div>
            <div class="form-group">
                <label>Email</label>
                <input type="email" name="email">
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" onclick="closeModal()">Annuler</button>
                <button type="submit" class="btn btn-primary">Créer</button>
            </div>
        </form>
    `);

    document.getElementById('create-gym-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData);
        data.capacity = parseInt(data.capacity);
        data.equipment = [];
        data.facilities = [];
        data.exerciseTypes = [];

        try {
            await apiCall('/gym/create', 'POST', data);
            closeModal();
            renderGymsPage();
            showSuccess('Salle créée avec succès');
        } catch (error) {
            alert(error.message);
        }
    });
}

async function approveGym(id) {
    try {
        await apiCall(`/gym/approve/${id}`, 'PATCH', { approved: true });
        renderGymsPage();
        showSuccess('Salle approuvée');
    } catch (error) {
        alert(error.message);
    }
}

async function deleteGym(id) {
    if (!confirm('Voulez-vous vraiment supprimer cette salle ?')) return;

    try {
        await apiCall(`/gym/${id}`, 'DELETE');
        renderGymsPage();
        showSuccess('Salle supprimée');
    } catch (error) {
        alert(error.message);
    }
}

// ========== PAGE EXERCICES ==========
async function renderExercisesPage() {
    const content = document.getElementById('content-area');
    content.innerHTML = '<div class="loading"><div class="spinner"></div></div>';

    try {
        const exercises = await apiCall('/exerciseType/getAll');
        
        content.innerHTML = `
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Types d'exercices</h3>
                    <button class="btn btn-primary" onclick="showCreateExerciseModal()">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="12" y1="5" x2="12" y2="19"></line>
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                        </svg>
                        Nouvel exercice
                    </button>
                </div>
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Nom</th>
                                <th>Description</th>
                                <th>Muscles ciblés</th>
                                <th>Difficulté</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${exercises.map(ex => `
                                <tr>
                                    <td><strong>${ex.name}</strong></td>
                                    <td>${ex.description}</td>
                                    <td>${ex.targetedMuscles?.join(', ') || '-'}</td>
                                    <td><span class="badge badge-${ex.difficulty === 'beginner' ? 'success' : ex.difficulty === 'intermediate' ? 'warning' : 'danger'}">
                                        ${ex.difficulty}
                                    </span></td>
                              <td>
    <div class="btn-group">
        <button class="btn btn-sm btn-secondary" onclick="editExercise('${ex._id}')">Modifier</button>
        <button class="btn btn-sm btn-danger" onclick="deleteExercise('${ex._id}')">Supprimer</button>
    </div>
</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    } catch (error) {
        content.innerHTML = `<div class="error-message">${error.message}</div>`;
    }
}

function showCreateExerciseModal() {
    showModal('Créer un exercice', `
        <form id="create-exercise-form">
            <div class="form-group">
                <label>Nom</label>
                <input type="text" name="name" required>
            </div>
            <div class="form-group">
                <label>Description</label>
                <textarea name="description" required></textarea>
            </div>
            <div class="form-group">
                <label>Muscles ciblés (séparés par des virgules)</label>
                <input type="text" name="targetedMuscles" placeholder="pectoraux, triceps, épaules">
            </div>
            <div class="form-group">
                <label>Difficulté</label>
                <select name="difficulty" required>
                    <option value="beginner">Débutant</option>
                    <option value="intermediate">Intermédiaire</option>
                    <option value="advanced">Avancé</option>
                </select>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" onclick="closeModal()">Annuler</button>
                <button type="submit" class="btn btn-primary">Créer</button>
            </div>
        </form>
    `);

    document.getElementById('create-exercise-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData);
        data.targetedMuscles = data.targetedMuscles ? data.targetedMuscles.split(',').map(m => m.trim()) : [];

        try {
            await apiCall('/exerciseType/create', 'POST', data);
            closeModal();
            renderExercisesPage();
            showSuccess('Exercice créé avec succès');
        } catch (error) {
            alert(error.message);
        }
    });
}

async function deleteExercise(id) {
    if (!confirm('Voulez-vous vraiment supprimer cet exercice ?')) return;

    try {
        await apiCall(`/exerciseType/${id}`, 'DELETE');
        renderExercisesPage();
        showSuccess('Exercice supprimé');
    } catch (error) {
        alert(error.message);
    }
}

// ========== PAGE DÉFIS ==========
async function renderChallengesPage() {
    const content = document.getElementById('content-area');
    content.innerHTML = '<div class="loading"><div class="spinner"></div></div>';

    try {
        const challenges = await apiCall('/challenge/getAll');
        
        content.innerHTML = `
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Défis</h3>
                    <button class="btn btn-primary" onclick="showCreateChallengeModal()">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="12" y1="5" x2="12" y2="19"></line>
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                        </svg>
                        Nouveau défi
                    </button>
                </div>
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Titre</th>
                                <th>Exercice</th>
                                <th>Difficulté</th>
                                <th>Durée (jours)</th>
                                <th>Participants</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${challenges.map(ch => `
                                <tr>
                                    <td><strong>${ch.title}</strong></td>
                                    <td>${ch.exerciseType?.name || '-'}</td>
                                    <td><span class="badge badge-${ch.difficulty === 'beginner' ? 'success' : ch.difficulty === 'intermediate' ? 'warning' : 'danger'}">
                                        ${ch.difficulty}
                                    </span></td>
                                    <td>${ch.duration}</td>
                                    <td>${ch.participants?.length || 0} / ${ch.maxParticipants || '∞'}</td>
                                  <td>
    <div class="btn-group">
        <button class="btn btn-sm btn-secondary" onclick="editChallenge('${ch._id}')">Modifier</button>
        <button class="btn btn-sm btn-danger" onclick="deleteChallenge('${ch._id}')">Supprimer</button>
    </div>
</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    } catch (error) {
        content.innerHTML = `<div class="error-message">${error.message}</div>`;
    }
}

async function showCreateChallengeModal() {
    const users = await apiCall('/user/getAll');
    const exercises = await apiCall('/exerciseType/getAll');
    const gyms = await apiCall('/gym/getAll');

    showModal('Créer un défi', `
        <form id="create-challenge-form">
            <div class="form-group">
                <label>Titre</label>
                <input type="text" name="title" required>
            </div>
            <div class="form-group">
                <label>Description</label>
                <textarea name="description" required></textarea>
            </div>
            <div class="form-group">
                <label>Créateur</label>
                <select name="creator" required>
                    ${users.map(u => `<option value="${u._id}">${u.firstname} ${u.lastname}</option>`).join('')}
                </select>
            </div>
            <div class="form-group">
                <label>Type d'exercice</label>
                <select name="exerciseType" required>
                    ${exercises.map(e => `<option value="${e._id}">${e.name}</option>`).join('')}
                </select>
            </div>
            <div class="form-group">
                <label>Salle (optionnel)</label>
                <select name="gym">
                    <option value="">Aucune</option>
                    ${gyms.map(g => `<option value="${g._id}">${g.name}</option>`).join('')}
                </select>
            </div>
            <div class="form-group">
                <label>Difficulté</label>
                <select name="difficulty" required>
                    <option value="beginner">Débutant</option>
                    <option value="intermediate">Intermédiaire</option>
                    <option value="advanced">Avancé</option>
                </select>
            </div>
            <div class="form-group">
                <label>Durée (jours)</label>
                <input type="number" name="duration" required min="1">
            </div>
            <div class="form-group">
                <label>Objectifs</label>
                <textarea name="objectives" required></textarea>
            </div>
            <div class="form-group">
                <label>Max participants (optionnel)</label>
                <input type="number" name="maxParticipants" min="1">
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" onclick="closeModal()">Annuler</button>
                <button type="submit" class="btn btn-primary">Créer</button>
            </div>
        </form>
    `);

    document.getElementById('create-challenge-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData);
        
        data.duration = parseInt(data.duration);
        if (data.maxParticipants) data.maxParticipants = parseInt(data.maxParticipants);
        if (!data.gym) delete data.gym;

        try {
            await apiCall('/challenge/create', 'POST', data);
            closeModal();
            renderChallengesPage();
            showSuccess('Défi créé avec succès');
        } catch (error) {
            alert(error.message);
        }
    });
}

async function deleteChallenge(id) {
    if (!confirm('Voulez-vous vraiment supprimer ce défi ?')) return;

    try {
        await apiCall(`/challenge/${id}`, 'DELETE');
        renderChallengesPage();
        showSuccess('Défi supprimé');
    } catch (error) {
        alert(error.message);
    }
}

// ========== PAGE BADGES ==========
async function renderBadgesPage() {
    const content = document.getElementById('content-area');
    content.innerHTML = '<div class="loading"><div class="spinner"></div></div>';

    try {
        const badges = await apiCall('/badge/getAll');
        
        content.innerHTML = `
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Badges</h3>
                    <button class="btn btn-primary" onclick="showCreateBadgeModal()">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="12" y1="5" x2="12" y2="19"></line>
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                        </svg>
                        Nouveau badge
                    </button>
                </div>
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Nom</th>
                                <th>Description</th>
                                <th>Icon URL</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${badges.map(badge => `
                                <tr>
                                    <td><strong>${badge.name}</strong></td>
                                    <td>${badge.description}</td>
                                    <td>${badge.iconUrl}</td>
                                  <td>
    <div class="btn-group">
        <button class="btn btn-sm btn-secondary" onclick="editBadge('${badge._id}')">Modifier</button>
        <button class="btn btn-sm btn-danger" onclick="deleteBadge('${badge._id}')">Supprimer</button>
    </div>
</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    } catch (error) {
        content.innerHTML = `<div class="error-message">${error.message}</div>`;
    }
}

function showCreateBadgeModal() {
    showModal('Créer un badge', `
        <form id="create-badge-form">
            <div class="form-group">
                <label>Nom</label>
                <input type="text" name="name" required>
            </div>
            <div class="form-group">
                <label>Description</label>
                <textarea name="description" required></textarea>
            </div>
            <div class="form-group">
                <label>URL de l'icône</label>
                <input type="url" name="iconUrl" required placeholder="https://example.com/badge.svg">
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" onclick="closeModal()">Annuler</button>
                <button type="submit" class="btn btn-primary">Créer</button>
            </div>
        </form>
    `);

    document.getElementById('create-badge-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData);

        try {
            await apiCall('/badge/create', 'POST', data);
            closeModal();
            renderBadgesPage();
            showSuccess('Badge créé avec succès');
        } catch (error) {
            alert(error.message);
        }
    });
}

async function deleteBadge(id) {
    if (!confirm('Voulez-vous vraiment supprimer ce badge ?')) return;

    try {
        await apiCall(`/badge/delete/${id}`, 'DELETE');
        renderBadgesPage();
        showSuccess('Badge supprimé');
    } catch (error) {
        alert(error.message);
    }
}

// ========== PAGE RÈGLES BADGES ==========
async function renderBadgeRulesPage() {
    const content = document.getElementById('content-area');
    content.innerHTML = '<div class="loading"><div class="spinner"></div></div>';

    try {
        const rules = await apiCall('/badgeRule/getAll');
        
        content.innerHTML = `
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Règles d'attribution des badges</h3>
                    <button class="btn btn-primary" onclick="showCreateBadgeRuleModal()">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="12" y1="5" x2="12" y2="19"></line>
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                        </svg>
                        Nouvelle règle
                    </button>
                </div>
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Badge</th>
                                <th>Condition</th>
                                <th>Champ</th>
                                <th>Opérateur</th>
                                <th>Valeur</th>
                                <th>Statut</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${rules.map(rule => `
                                <tr>
                                    <td><strong>${rule.badgeName}</strong></td>
                                    <td>${rule.conditionType}</td>
                                    <td>${rule.conditionField}</td>
                                    <td>${rule.operator}</td>
                                    <td>${rule.value}</td>
                                    <td><span class="badge ${rule.isActive ? 'badge-success' : 'badge-secondary'}">
                                        ${rule.isActive ? 'Active' : 'Inactive'}
                                    </span></td>
                                  <td>
    <div class="btn-group">
        <button class="btn btn-sm btn-info" onclick="editBadgeRule('${rule._id}')">Modifier</button>
        <button class="btn btn-sm btn-secondary" onclick="toggleBadgeRule('${rule._id}')">
            ${rule.isActive ? 'Désactiver' : 'Activer'}
        </button>
        <button class="btn btn-sm btn-danger" onclick="deleteBadgeRule('${rule._id}')">Supprimer</button>
    </div>
</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    } catch (error) {
        content.innerHTML = `<div class="error-message">${error.message}</div>`;
    }
}

async function showCreateBadgeRuleModal() {
    const badges = await apiCall('/badge/getAll');

    showModal('Créer une règle de badge', `
        <form id="create-badge-rule-form">
            <div class="form-group">
                <label>Badge</label>
                <select name="badgeName" required>
                    ${badges.map(b => `<option value="${b.name}">${b.name}</option>`).join('')}
                </select>
            </div>
            <div class="form-group">
                <label>Type de condition</label>
                <select name="conditionType" required>
                    <option value="totalPoints">Points totaux</option>
                    <option value="completedTrainings">Entraînements complétés</option>
                    <option value="custom">Personnalisé</option>
                </select>
            </div>
            <div class="form-group">
                <label>Champ à évaluer</label>
                <input type="text" name="conditionField" required placeholder="totalPoints ou completedTrainings">
            </div>
            <div class="form-group">
                <label>Opérateur</label>
                <select name="operator" required>
                    <option value=">=">&gt;=</option>
                    <option value=">">&gt;</option>
                    <option value="=">=</option>
                    <option value="<">&lt;</option>
                    <option value="<=">&lt;=</option>
                </select>
            </div>
            <div class="form-group">
                <label>Valeur seuil</label>
                <input type="number" name="value" required min="0">
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" onclick="closeModal()">Annuler</button>
                <button type="submit" class="btn btn-primary">Créer</button>
            </div>
        </form>
    `);

    document.getElementById('create-badge-rule-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData);
        data.value = parseInt(data.value);

        try {
            await apiCall('/badgeRule/create', 'POST', data);
            closeModal();
            renderBadgeRulesPage();
            showSuccess('Règle créée avec succès');
        } catch (error) {
            alert(error.message);
        }
    });
}

async function toggleBadgeRule(id) {
    try {
        await apiCall(`/badgeRule/toggle/${id}`, 'PATCH');
        renderBadgeRulesPage();
        showSuccess('Règle mise à jour');
    } catch (error) {
        alert(error.message);
    }
}

async function deleteBadgeRule(id) {
    if (!confirm('Voulez-vous vraiment supprimer cette règle ?')) return;

    try {
        await apiCall(`/badgeRule/delete/${id}`, 'DELETE');
        renderBadgeRulesPage();
        showSuccess('Règle supprimée');
    } catch (error) {
        alert(error.message);
    }
}

// ========== PAGE ENTRAÎNEMENTS ==========
async function renderTrainingsPage() {
    const content = document.getElementById('content-area');
    content.innerHTML = '<div class="loading"><div class="spinner"></div></div>';

    try {
        const users = await apiCall('/user/getAll');
        const user = users[0]; // Premier utilisateur pour la démo
        const trainings = await apiCall(`/trainingStat/user/${user._id}`);
        
        content.innerHTML = `
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Entraînements de ${user.firstname} ${user.lastname}</h3>
                    <button class="btn btn-primary" onclick="showCreateTrainingModal('${user._id}')">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="12" y1="5" x2="12" y2="19"></line>
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                        </svg>
                        Nouvel entraînement
                    </button>
                </div>
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Défi</th>
                                <th>Durée (min)</th>
                                <th>Calories</th>
                                <th>Complété</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${trainings.length === 0 ? `
                                <tr><td colspan="6" style="text-align: center; padding: 40px;">
                                    Aucun entraînement enregistré
                                </td></tr>
                            ` : trainings.map(t => `
                                <tr>
                                    <td>${new Date(t.sessionDate).toLocaleDateString('fr-FR')}</td>
                                    <td>${t.challenge?.title || '-'}</td>
                                    <td>${t.duration}</td>
                                    <td>${t.caloriesBurned}</td>
                                    <td><span class="badge ${t.completed ? 'badge-success' : 'badge-warning'}">
                                        ${t.completed ? 'Oui' : 'Non'}
                                    </span></td>
                                    <td>
                                        <button class="btn btn-sm btn-danger" onclick="deleteTraining('${t._id}')">Supprimer</button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    } catch (error) {
        content.innerHTML = `<div class="error-message">${error.message}</div>`;
    }
}

async function showCreateTrainingModal(userId) {
    const challenges = await apiCall('/challenge/getAll');

    showModal('Enregistrer un entraînement', `
        <form id="create-training-form">
            <input type="hidden" name="user" value="${userId}">
            <div class="form-group">
                <label>Défi</label>
                <select name="challenge" required>
                    ${challenges.map(c => `<option value="${c._id}">${c.title}</option>`).join('')}
                </select>
            </div>
            <div class="form-group">
                <label>Date de la séance</label>
                <input type="datetime-local" name="sessionDate" required>
            </div>
            <div class="form-group">
                <label>Durée (minutes)</label>
                <input type="number" name="duration" required min="1">
            </div>
            <div class="form-group">
                <label>Calories brûlées</label>
                <input type="number" name="caloriesBurned" required min="0">
            </div>
            <div class="form-group">
                <label>Notes</label>
                <textarea name="notes"></textarea>
            </div>
            <div class="form-group">
                <label>
                    <input type="checkbox" name="completed" checked>
                    Entraînement complété
                </label>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" onclick="closeModal()">Annuler</button>
                <button type="submit" class="btn btn-primary">Enregistrer</button>
            </div>
        </form>
    `);

    // Définir la date/heure actuelle par défaut
    document.querySelector('input[name="sessionDate"]').value = new Date().toISOString().slice(0, 16);

    document.getElementById('create-training-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData);
        
        data.duration = parseInt(data.duration);
        data.caloriesBurned = parseInt(data.caloriesBurned);
        data.completed = formData.has('completed');

        try {
            await apiCall('/trainingStat/create', 'POST', data);
            closeModal();
            renderTrainingsPage();
            showSuccess('Entraînement enregistré avec succès');
        } catch (error) {
            alert(error.message);
        }
    });
}

async function deleteTraining(id) {
    if (!confirm('Voulez-vous vraiment supprimer cet entraînement ?')) return;

    try {
        await apiCall(`/trainingStat/${id}`, 'DELETE');
        renderTrainingsPage();
        showSuccess('Entraînement supprimé');
    } catch (error) {
        alert(error.message);
    }
}

// ========== PAGE CLASSEMENT ==========
async function renderScoresPage() {
    const content = document.getElementById('content-area');
    content.innerHTML = '<div class="loading"><div class="spinner"></div></div>';

    try {
        const leaderboard = await apiCall('/score/leaderboard');
        
        content.innerHTML = `
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">🏆 Top 10 Classement</h3>
                </div>
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Rang</th>
                                <th>Utilisateur</th>
                                <th>Points totaux</th>
                                <th>Défis complétés</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${leaderboard.length === 0 ? `
                                <tr><td colspan="4" style="text-align: center; padding: 40px;">
                                    Aucun score enregistré
                                </td></tr>
                            ` : leaderboard.map((score, index) => `
                                <tr>
                                    <td>
                                        ${index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                                    </td>
                                    <td><strong>${score.user?.firstname} ${score.user?.lastname}</strong></td>
                                    <td><span class="badge badge-primary">${score.totalPoints} pts</span></td>
                                    <td>${score.challengesCompleted}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    } catch (error) {
        content.innerHTML = `<div class="error-message">${error.message}</div>`;
    }
}

// ========== MODAL SYSTEM ==========
let currentModal = null;

function showModal(title, content) {
    closeModal(); // Fermer toute modal existante

    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3 class="modal-title">${title}</h3>
                <button class="modal-close" onclick="closeModal()">×</button>
            </div>
            <div class="modal-body">
                ${content}
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    currentModal = modal;

    // Fermer au clic sur le fond
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });
}

function closeModal() {
    if (currentModal) {
        currentModal.remove();
        currentModal = null;
    }
}

// ========== NOTIFICATIONS ==========
function showSuccess(message) {
    const notification = document.createElement('div');
    notification.className = 'success-message';
    notification.textContent = message;
    notification.style.position = 'fixed';
    notification.style.top = '20px';
    notification.style.right = '20px';
    notification.style.zIndex = '9999';
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// ========== INIT ==========
if (authToken) {
    document.getElementById('auth-page').style.display = 'none';
    document.getElementById('dashboard').style.display = 'flex';
    document.getElementById('current-user-email').textContent = currentUser.email;
    loadPage('users');
}


// ✅ FONCTION EDIT USER
async function editUser(id) {
    try {
        const user = await apiCall(`/user/get/${id}`);
        
        showModal('Modifier l\'utilisateur', `
            <form id="edit-user-form">
                <div class="form-group">
                    <label>Prénom</label>
                    <input type="text" name="firstname" value="${user.firstname}" required>
                </div>
                <div class="form-group">
                    <label>Nom</label>
                    <input type="text" name="lastname" value="${user.lastname}" required>
                </div>
                <div class="form-group">
                    <label>Email</label>
                    <input type="email" name="email" value="${user.email}" required>
                </div>
                <div class="form-group">
                    <label>Mot de passe (laisser vide pour ne pas modifier)</label>
                    <input type="password" name="password" minlength="8">
                </div>
                <div class="form-group">
                    <label>Rôle</label>
                    <select name="role" required>
                        <option value="member" ${user.role === 'member' ? 'selected' : ''}>Member</option>
                        <option value="manager" ${user.role === 'manager' ? 'selected' : ''}>Manager</option>
                        <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Admin</option>
                    </select>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" onclick="closeModal()">Annuler</button>
                    <button type="submit" class="btn btn-primary">Modifier</button>
                </div>
            </form>
        `);

        document.getElementById('edit-user-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const data = Object.fromEntries(formData);
            
            if (!data.password) {
                delete data.password;
            }

            try {
                await apiCall(`/user/update/${id}`, 'PATCH', data);
                closeModal();
                renderUsersPage();
                showSuccess('Utilisateur modifié avec succès');
            } catch (error) {
                alert(error.message);
            }
        });
    } catch (error) {
        alert(error.message);
    }
}

// ✅ FONCTION EDIT GYM
async function editGym(id) {
    try {
        const gym = await apiCall(`/gym/${id}`);
        const users = await apiCall('/user/getAll');
        
        showModal('Modifier la salle', `
            <form id="edit-gym-form">
                <div class="form-group">
                    <label>Nom</label>
                    <input type="text" name="name" value="${gym.name}" required>
                </div>
                <div class="form-group">
                    <label>Adresse</label>
                    <input type="text" name="address" value="${gym.address}" required>
                </div>
                <div class="form-group">
                    <label>Capacité</label>
                    <input type="number" name="capacity" value="${gym.capacity}" required min="1">
                </div>
                <div class="form-group">
                    <label>Description</label>
                    <textarea name="description">${gym.description || ''}</textarea>
                </div>
                <div class="form-group">
                    <label>Téléphone</label>
                    <input type="tel" name="phone" value="${gym.phone || ''}">
                </div>
                <div class="form-group">
                    <label>Email</label>
                    <input type="email" name="email" value="${gym.email || ''}">
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" onclick="closeModal()">Annuler</button>
                    <button type="submit" class="btn btn-primary">Modifier</button>
                </div>
            </form>
        `);

        document.getElementById('edit-gym-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const data = Object.fromEntries(formData);
            data.capacity = parseInt(data.capacity);

            try {
                await apiCall(`/gym/${id}`, 'PATCH', data);
                closeModal();
                renderGymsPage();
                showSuccess('Salle modifiée avec succès');
            } catch (error) {
                alert(error.message);
            }
        });
    } catch (error) {
        alert(error.message);
    }
}

// ✅ FONCTION EDIT EXERCISE
async function editExercise(id) {
    try {
        const exercise = await apiCall(`/exerciseType/${id}`);
        
        showModal('Modifier l\'exercice', `
            <form id="edit-exercise-form">
                <div class="form-group">
                    <label>Nom</label>
                    <input type="text" name="name" value="${exercise.name}" required>
                </div>
                <div class="form-group">
                    <label>Description</label>
                    <textarea name="description" required>${exercise.description}</textarea>
                </div>
                <div class="form-group">
                    <label>Muscles ciblés (séparés par des virgules)</label>
                    <input type="text" name="targetedMuscles" value="${exercise.targetedMuscles.join(', ')}" required>
                </div>
                <div class="form-group">
                    <label>Difficulté</label>
                    <select name="difficulty" required>
                        <option value="easy" ${exercise.difficulty === 'easy' ? 'selected' : ''}>Facile</option>
                        <option value="medium" ${exercise.difficulty === 'medium' ? 'selected' : ''}>Moyen</option>
                        <option value="hard" ${exercise.difficulty === 'hard' ? 'selected' : ''}>Difficile</option>
                    </select>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" onclick="closeModal()">Annuler</button>
                    <button type="submit" class="btn btn-primary">Modifier</button>
                </div>
            </form>
        `);

        document.getElementById('edit-exercise-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const data = Object.fromEntries(formData);
            data.targetedMuscles = data.targetedMuscles.split(',').map(s => s.trim());

            try {
                await apiCall(`/exerciseType/update/${id}`, 'PATCH', data);
                closeModal();
                renderExercisesPage();
                showSuccess('Exercice modifié avec succès');
            } catch (error) {
                alert(error.message);
            }
        });
    } catch (error) {
        alert(error.message);
    }
}

// ✅ FONCTION EDIT CHALLENGE
async function editChallenge(id) {
    try {
        const challenge = await apiCall(`/challenge/${id}`);
        const gyms = await apiCall('/gym/getAll');
        const exercises = await apiCall('/exerciseType/getAll');
        
        showModal('Modifier le défi', `
            <form id="edit-challenge-form">
                <div class="form-group">
                    <label>Titre</label>
                    <input type="text" name="title" value="${challenge.title}" required>
                </div>
                <div class="form-group">
                    <label>Description</label>
                    <textarea name="description" required>${challenge.description}</textarea>
                </div>
                <div class="form-group">
                    <label>Salle</label>
                    <select name="gym" required>
                        ${gyms.map(g => `<option value="${g._id}" ${challenge.gym?._id === g._id ? 'selected' : ''}>${g.name}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label>Type d'exercice</label>
                    <select name="exerciseType" required>
                        ${exercises.map(e => `<option value="${e._id}" ${challenge.exerciseType?._id === e._id ? 'selected' : ''}>${e.name}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label>Difficulté</label>
                    <select name="difficulty" required>
                        <option value="easy" ${challenge.difficulty === 'easy' ? 'selected' : ''}>Facile</option>
                        <option value="medium" ${challenge.difficulty === 'medium' ? 'selected' : ''}>Moyen</option>
                        <option value="hard" ${challenge.difficulty === 'hard' ? 'selected' : ''}>Difficile</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Durée (minutes)</label>
                    <input type="number" name="duration" value="${challenge.duration}" required min="1">
                </div>
                <div class="form-group">
                    <label>Objectif</label>
                    <input type="text" name="objectives" value="${challenge.objectives}" required>
                </div>
                <div class="form-group">
                    <label>Participants max (optionnel)</label>
                    <input type="number" name="maxParticipants" value="${challenge.maxParticipants || ''}" min="1">
                </div>
                <div class="form-group">
                    <label>Date de début</label>
                    <input type="date" name="startDate" value="${challenge.startDate ? new Date(challenge.startDate).toISOString().split('T')[0] : ''}" required>
                </div>
                <div class="form-group">
                    <label>Date de fin</label>
                    <input type="date" name="endDate" value="${challenge.endDate ? new Date(challenge.endDate).toISOString().split('T')[0] : ''}" required>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" onclick="closeModal()">Annuler</button>
                    <button type="submit" class="btn btn-primary">Modifier</button>
                </div>
            </form>
        `);

        document.getElementById('edit-challenge-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const data = Object.fromEntries(formData);
            data.duration = parseInt(data.duration);
            if (data.maxParticipants) {
                data.maxParticipants = parseInt(data.maxParticipants);
            } else {
                delete data.maxParticipants;
            }

            try {
                await apiCall(`/challenge/update/${id}`, 'PATCH', data);
                closeModal();
                renderChallengesPage();
                showSuccess('Défi modifié avec succès');
            } catch (error) {
                alert(error.message);
            }
        });
    } catch (error) {
        alert(error.message);
    }
}

// ✅ FONCTION EDIT BADGE
async function editBadge(id) {
    try {
        const badge = await apiCall(`/badge/get/${id}`);
        
        showModal('Modifier le badge', `
            <form id="edit-badge-form">
                <div class="form-group">
                    <label>Nom</label>
                    <input type="text" name="name" value="${badge.name}" required>
                </div>
                <div class="form-group">
                    <label>Description</label>
                    <textarea name="description" required>${badge.description}</textarea>
                </div>
                <div class="form-group">
                    <label>Icône</label>
                    <input type="url" name="iconUrl" value="${badge.iconUrl}" required placeholder="https://example.com/badge.svg">
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" onclick="closeModal()">Annuler</button>
                    <button type="submit" class="btn btn-primary">Modifier</button>
                </div>
            </form>
        `);

        document.getElementById('edit-badge-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const data = Object.fromEntries(formData);

            try {
                await apiCall(`/badge/update/${id}`, 'PATCH', data);
                closeModal();
                renderBadgesPage();
                showSuccess('Badge modifié avec succès');
            } catch (error) {
                alert(error.message);
            }
        });
    } catch (error) {
        alert(error.message);
    }
}

// ✅ FONCTION EDIT BADGE RULE
async function editBadgeRule(id) {
    try {
        const rule = await apiCall(`/badgeRule/get/${id}`);
        const badges = await apiCall('/badge/getAll');
        
        showModal('Modifier la règle', `
       <form id="edit-rule-form">
    <div class="form-group">
        <label>Badge</label>
        <select name="badgeName" required>
            ${badges.map(b => `<option value="${b.name}" ${rule.badgeName === b.name ? 'selected' : ''}>${b.name}</option>`).join('')}
        </select>
    </div>
    <div class="form-group">
        <label>Type de condition</label>
        <select name="conditionType" required>
            <option value="totalPoints" ${rule.conditionType === 'totalPoints' ? 'selected' : ''}>Points totaux</option>
            <option value="completedTrainings" ${rule.conditionType === 'completedTrainings' ? 'selected' : ''}>Entraînements complétés</option>
            <option value="custom" ${rule.conditionType === 'custom' ? 'selected' : ''}>Personnalisé</option>
        </select>
    </div>
    <div class="form-group">
        <label>Champ à évaluer</label>
        <input type="text" name="conditionField" value="${rule.conditionField}" required>
    </div>
    <div class="form-group">
        <label>Opérateur</label>
        <select name="operator" required>
            <option value=">=" ${rule.operator === '>=' ? 'selected' : ''}>&gt;=</option>
            <option value=">" ${rule.operator === '>' ? 'selected' : ''}>&gt;</option>
            <option value="=" ${rule.operator === '=' ? 'selected' : ''}>=</option>
            <option value="<" ${rule.operator === '<' ? 'selected' : ''}>&lt;</option>
            <option value="<=" ${rule.operator === '<=' ? 'selected' : ''}>&lt;=</option>
        </select>
    </div>
    <div class="form-group">
        <label>Valeur seuil</label>
        <input type="number" name="value" value="${rule.value}" required min="0">
    </div>
    <div class="form-group">
        <label>Statut</label>
        <select name="isActive">
            <option value="true" ${rule.isActive ? 'selected' : ''}>Actif</option>
            <option value="false" ${!rule.isActive ? 'selected' : ''}>Inactif</option>
        </select>
    </div>
    <div class="modal-footer">
        <button type="button" class="btn btn-secondary" onclick="closeModal()">Annuler</button>
        <button type="submit" class="btn btn-primary">Modifier</button>
    </div>
</form>
        `);

        document.getElementById('edit-rule-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const data = Object.fromEntries(formData);
          data.isActive = data.isActive === 'true';
            data.value = parseInt(data.value);

            try {
                await apiCall(`/badgeRule/update/${id}`, 'PATCH', data);
                closeModal();
               renderBadgeRulesPage();
                showSuccess('Règle modifiée avec succès');
            } catch (error) {
                alert(error.message);
            }
        });
    } catch (error) {
        alert(error.message);
    }
}

