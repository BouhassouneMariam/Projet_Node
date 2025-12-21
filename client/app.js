// Configuration API
const API_URL = 'http://localhost:3000';
let authToken = localStorage.getItem('authToken');
let currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');

// ========== DÉFINITION DES PERMISSIONS PAR RÔLE ==========
const ROLE_PERMISSIONS = {
    admin: {
        pages: ['users', 'gyms', 'exercises', 'challenges', 'badges', 'badgeRules', 'trainings', 'scores'],
        canCreateUser: true,
        canDeleteUser: true,
        canApproveGym: true,
        canCreateGym: true,
        canDeleteGym: true,
        canCreateExercise: true,
        canDeleteExercise: true,
        canCreateBadge: true,
        canDeleteBadge: true,
        canManageBadgeRules: true,
        canSeeAllUsers: true,
        canSeeAllGyms: true,
        canCreateChallenge: true,
        canDeleteAnyChallenge: true,
        canSeeAllTrainings: true,
    },
    manager: {
        pages: ['gyms', 'exercises', 'challenges', 'trainings', 'scores'],
        canCreateUser: false,
        canDeleteUser: false,
        canApproveGym: false,
        canCreateGym: true,
        canDeleteGym: false,
        canCreateExercise: false,
        canDeleteExercise: false,
        canCreateBadge: false,
        canDeleteBadge: false,
        canManageBadgeRules: false,
        canSeeAllUsers: false,
        canSeeAllGyms: true,
        canCreateChallenge: true,
        canDeleteAnyChallenge: false,
        canSeeAllTrainings: false,
    },
    member: {
        pages: ['challenges', 'trainings', 'scores'],
        canCreateUser: false,
        canDeleteUser: false,
        canApproveGym: false,
        canCreateGym: false,
        canDeleteGym: false,
        canCreateExercise: false,
        canDeleteExercise: false,
        canCreateBadge: false,
        canDeleteBadge: false,
        canManageBadgeRules: false,
        canSeeAllUsers: false,
        canSeeAllGyms: false,
        canCreateChallenge: true,
        canJoinChallenge: true,
        canDeleteAnyChallenge: false,
        canSeeAllTrainings: false,
    }
};

// Fonctions de vérification des permissions
function hasPermission(permission) {
    if (!currentUser.role) return false;
    const permissions = ROLE_PERMISSIONS[currentUser.role];
    return permissions && permissions[permission];
}

function canAccessPage(page) {
    if (!currentUser.role) return false;
    const permissions = ROLE_PERMISSIONS[currentUser.role];
    return permissions && permissions.pages.includes(page);
}

function isAdmin() { return currentUser.role === 'admin'; }
function isManager() { return currentUser.role === 'manager'; }
function isMember() { return currentUser.role === 'member'; }

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

        if (!response.ok) throw new Error('Email ou mot de passe incorrect');

        const data = await response.json();
        authToken = data.token;
        
        const userResponse = await fetch(`${API_URL}/user/get/${data.id}`, {
            headers: { 'Authorization': `Bearer ${data.token}` }
        });
        
        if (userResponse.ok) {
            const userData = await userResponse.json();
            currentUser = { 
                email: userData.email, 
                id: data.id, 
                role: userData.role,
                firstname: userData.firstname,
                lastname: userData.lastname
            };
        } else {
            currentUser = { email, id: data.id, role: 'member' };
        }
        
        localStorage.setItem('authToken', authToken);
        localStorage.setItem('currentUser', JSON.stringify(currentUser));

        document.getElementById('auth-page').style.display = 'none';
        document.getElementById('dashboard').style.display = 'flex';
        document.getElementById('current-user-email').textContent = `${currentUser.firstname || ''} ${currentUser.lastname || ''} (${currentUser.role})`;

        setupSidebarByRole();
        const firstPage = ROLE_PERMISSIONS[currentUser.role]?.pages[0] || 'challenges';
        loadPage(firstPage);
    } catch (error) {
        showAuthError(error.message);
    }
});

// ========== CONFIGURATION SIDEBAR PAR RÔLE ==========
function setupSidebarByRole() {
    const navItems = document.querySelectorAll('.nav-item');
    let firstVisibleItem = null;
    
    navItems.forEach(item => {
        const page = item.dataset.page;
        if (canAccessPage(page)) {
            item.style.display = 'flex';
            if (!firstVisibleItem) firstVisibleItem = item;
        } else {
            item.style.display = 'none';
            item.classList.remove('active');
        }
    });
    
    if (firstVisibleItem) {
        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
        firstVisibleItem.classList.add('active');
    }
}

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
        setTimeout(() => {
            toggleAuthForm();
            document.getElementById('email').value = data.email;
        }, 2000);
    } catch (error) {
        showAuthError(error.message);
    }
});

// ========== TOGGLE CONNEXION/INSCRIPTION ==========
document.getElementById('toggle-link')?.addEventListener('click', (e) => {
    e.preventDefault();
    toggleAuthForm();
});

function toggleAuthForm() {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const toggleText = document.getElementById('toggle-text');
    const testAccounts = document.getElementById('test-accounts');

    if (loginForm.style.display === 'none') {
        loginForm.style.display = 'block';
        registerForm.style.display = 'none';
        toggleText.innerHTML = 'Pas encore de compte ? <a href="#" id="toggle-link">Créer un compte</a>';
        testAccounts.style.display = 'block';
    } else {
        loginForm.style.display = 'none';
        registerForm.style.display = 'block';
        toggleText.innerHTML = 'Déjà un compte ? <a href="#" id="toggle-link">Se connecter</a>';
        testAccounts.style.display = 'none';
    }
    
    document.getElementById('toggle-link').addEventListener('click', (e) => {
        e.preventDefault();
        toggleAuthForm();
    });

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

async function apiCall(endpoint, method = 'GET', body = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`
    }
  };
  if (body) options.body = JSON.stringify(body);

  const response = await fetch(`${API_URL}${endpoint}`, options);

  if (response.status === 204) return null;

  // Gestion des erreurs
  if (!response.ok) {
    const contentType = response.headers.get('content-type') || '';
    let msg = 'Une erreur est survenue';

    if (contentType.includes('application/json')) {
      const err = await response.json().catch(() => ({}));
      msg = err.error || err.message || msg;
    } else {
      msg = await response.text().catch(() => msg);
    }

    throw new Error(msg);
  }

  // ✅ Gestion du succès: JSON ou texte
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return response.json();
  } else {
    const text = await response.text();
    return { message: text };
  }
}


// ========== NAVIGATION ==========
document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();
        const page = item.dataset.page;
        if (!canAccessPage(page)) {
            showError('Vous n\'avez pas accès à cette page');
            return;
        }
        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
        item.classList.add('active');
        loadPage(page);
    });
});

function loadPage(page) {
    if (!canAccessPage(page)) {
        showError('Accès refusé');
        return;
    }
    
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

    if (pages[page]) pages[page]();
}

// ========== PAGE UTILISATEURS (Admin uniquement) ==========
async function renderUsersPage() {
    const content = document.getElementById('content-area');
    if (!hasPermission('canSeeAllUsers')) {
        content.innerHTML = '<div class="error-message">Accès refusé - Réservé aux administrateurs</div>';
        return;
    }
    content.innerHTML = '<div class="loading"><div class="spinner"></div></div>';

    try {
        const users = await apiCall('/user/getAll');
        content.innerHTML = `
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Liste des utilisateurs</h3>
                    ${hasPermission('canCreateUser') ? `
                        <button class="btn btn-primary" onclick="showCreateUserModal()">+ Nouvel utilisateur</button>
                    ` : ''}
                </div>
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Nom</th>
                                <th>Email</th>
                                <th>Rôle</th>
                                <th>Statut</th>
                                ${isAdmin() ? '<th>Actions</th>' : ''}
                            </tr>
                        </thead>
                        <tbody>
                            ${users.map(user => `
                                <tr>
                                    <td>${user.firstname} ${user.lastname}</td>
                                    <td>${user.email}</td>
                                    <td><span class="badge badge-info">${user.role}</span></td>
                                    <td><span class="badge ${user.active ? 'badge-success' : 'badge-danger'}">${user.active ? 'Actif' : 'Inactif'}</span></td>
                                    ${isAdmin() ? `
                                        <td>
                                            <div class="btn-group">
                                                <button class="btn btn-sm btn-secondary" onclick="editUser('${user._id}')">Modifier</button>
                                                <button class="btn btn-sm btn-warning" onclick="toggleUserActive('${user._id}')">${user.active ? 'Désactiver' : 'Activer'}</button>
                                                <button class="btn btn-sm btn-danger" onclick="deleteUser('${user._id}')">Supprimer</button>
                                            </div>
                                        </td>
                                    ` : ''}
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
    if (!hasPermission('canCreateUser')) return showError('Permission refusée');
    showModal('Créer un utilisateur', `
        <form id="create-user-form">
            <div class="form-group"><label>Prénom</label><input type="text" name="firstname" required></div>
            <div class="form-group"><label>Nom</label><input type="text" name="lastname" required></div>
            <div class="form-group"><label>Email</label><input type="email" name="email" required></div>
            <div class="form-group"><label>Mot de passe</label><input type="password" name="password" required minlength="8"></div>
            <div class="form-group"><label>Rôle</label>
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
        try {
            await apiCall('/user/create', 'POST', Object.fromEntries(new FormData(e.target)));
            closeModal();
            renderUsersPage();
            showSuccess('Utilisateur créé');
        } catch (error) { alert(error.message); }
    });
}

async function toggleUserActive(id) {
    if (!isAdmin()) return showError('Réservé aux administrateurs');
    try {
        await apiCall(`/user/toggle-active/${id}`, 'PATCH');
        renderUsersPage();
        showSuccess('Statut modifié');
    } catch (error) { alert(error.message); }
}

async function deleteUser(id) {
    if (!hasPermission('canDeleteUser')) return showError('Permission refusée');
    if (!confirm('Supprimer cet utilisateur ?')) return;
    try {
        await apiCall(`/user/delete/${id}`, 'DELETE');
        renderUsersPage();
        showSuccess('Utilisateur supprimé');
    } catch (error) { alert(error.message); }
}

// ========== PAGE SALLES ==========
async function renderGymsPage() {
    const content = document.getElementById('content-area');
    content.innerHTML = '<div class="loading"><div class="spinner"></div></div>';

    try {
        const endpoint = isMember() ? '/gym/approved' : '/gym/getAll';
        const gyms = await apiCall(endpoint);
        
        content.innerHTML = `
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Salles de sport</h3>
                    ${hasPermission('canCreateGym') ? `<button class="btn btn-primary" onclick="showCreateGymModal()">+ Nouvelle salle</button>` : ''}
                </div>
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Nom</th>
                                <th>Adresse</th>
                                <th>Capacité</th>
                                <th>Propriétaire</th>
                                ${!isMember() ? '<th>Statut</th><th>Actions</th>' : ''}
                            </tr>
                        </thead>
                        <tbody>
                            ${gyms.map(gym => `
                                <tr>
                                    <td><strong>${gym.name}</strong></td>
                                    <td>${gym.address}</td>
                                    <td>${gym.capacity} pers.</td>
                                    <td>${gym.owner?.firstname || ''} ${gym.owner?.lastname || ''}</td>
                                    ${!isMember() ? `
                                        <td><span class="badge ${gym.approved ? 'badge-success' : 'badge-warning'}">${gym.approved ? 'Approuvée' : 'En attente'}</span></td>
                                        <td>
                                            <div class="btn-group">
                                                ${!gym.approved && hasPermission('canApproveGym') ? `<button class="btn btn-sm btn-success" onclick="approveGym('${gym._id}')">Approuver</button>` : ''}
                                                ${(isAdmin() || gym.owner?._id === currentUser.id) ? `
                                                    <button class="btn btn-sm btn-secondary" onclick="editGym('${gym._id}')">Modifier</button>
                                                    <button class="btn btn-sm btn-danger" onclick="deleteGym('${gym._id}')">Supprimer</button>
                                                ` : ''}
                                            </div>
                                        </td>
                                    ` : ''}
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
    if (!hasPermission('canCreateGym')) return showError('Permission refusée');
    
    let usersOptions = '';
    if (isAdmin()) {
        const users = await apiCall('/user/getAll');
        usersOptions = users.map(u => `<option value="${u._id}">${u.firstname} ${u.lastname}</option>`).join('');
    }

    showModal('Créer une salle', `
        <form id="create-gym-form">
            <div class="form-group"><label>Nom</label><input type="text" name="name" required></div>
            <div class="form-group"><label>Adresse</label><input type="text" name="address" required></div>
            <div class="form-group"><label>Capacité</label><input type="number" name="capacity" required min="1"></div>
            ${isAdmin() ? `<div class="form-group"><label>Propriétaire</label><select name="owner" required>${usersOptions}</select></div>` : `<input type="hidden" name="owner" value="${currentUser.id}">`}
            <div class="form-group"><label>Description</label><textarea name="description"></textarea></div>
            <div class="form-group"><label>Téléphone</label><input type="tel" name="phone"></div>
            <div class="form-group"><label>Email</label><input type="email" name="email"></div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" onclick="closeModal()">Annuler</button>
                <button type="submit" class="btn btn-primary">Créer</button>
            </div>
        </form>
    `);

    document.getElementById('create-gym-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const data = Object.fromEntries(new FormData(e.target));
        data.capacity = parseInt(data.capacity);
        data.equipment = []; data.facilities = []; data.exerciseTypes = [];
        try {
            await apiCall('/gym/create', 'POST', data);
            closeModal();
            renderGymsPage();
            showSuccess(isAdmin() ? 'Salle créée et approuvée' : 'Salle créée, en attente d\'approbation');
        } catch (error) { alert(error.message); }
    });
}

async function approveGym(id) {
    if (!hasPermission('canApproveGym')) return showError('Permission refusée');
    try {
        await apiCall(`/gym/approve/${id}`, 'PATCH', { approved: true });
        renderGymsPage();
        showSuccess('Salle approuvée');
    } catch (error) { alert(error.message); }
}

async function deleteGym(id) {
    if (!confirm('Supprimer cette salle ?')) return;
    try {
        await apiCall(`/gym/${id}`, 'DELETE');
        renderGymsPage();
        showSuccess('Salle supprimée');
    } catch (error) { alert(error.message); }
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
                    ${hasPermission('canCreateExercise') ? `<button class="btn btn-primary" onclick="showCreateExerciseModal()">+ Nouvel exercice</button>` : ''}
                </div>
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Nom</th>
                                <th>Description</th>
                                <th>Muscles ciblés</th>
                                <th>Difficulté</th>
                                ${hasPermission('canDeleteExercise') ? '<th>Actions</th>' : ''}
                            </tr>
                        </thead>
                        <tbody>
                            ${exercises.map(ex => `
                                <tr>
                                    <td><strong>${ex.name}</strong></td>
                                    <td>${ex.description}</td>
                                    <td>${ex.targetedMuscles?.join(', ') || '-'}</td>
                                    <td><span class="badge badge-${ex.difficulty === 'beginner' ? 'success' : ex.difficulty === 'intermediate' ? 'warning' : 'danger'}">${ex.difficulty === 'beginner' ? 'Débutant' : ex.difficulty === 'intermediate' ? 'Intermédiaire' : 'Avancé'}</span></td>
                                    ${hasPermission('canDeleteExercise') ? `
                                        <td>
                                            <div class="btn-group">
                                                <button class="btn btn-sm btn-secondary" onclick="editExercise('${ex._id}')">Modifier</button>
                                                <button class="btn btn-sm btn-danger" onclick="deleteExercise('${ex._id}')">Supprimer</button>
                                            </div>
                                        </td>
                                    ` : ''}
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
    if (!hasPermission('canCreateExercise')) return showError('Permission refusée');
    showModal('Créer un exercice', `
        <form id="create-exercise-form">
            <div class="form-group"><label>Nom</label><input type="text" name="name" required></div>
            <div class="form-group"><label>Description</label><textarea name="description" required></textarea></div>
            <div class="form-group"><label>Muscles ciblés (virgules)</label><input type="text" name="targetedMuscles" placeholder="pectoraux, triceps"></div>
            <div class="form-group"><label>Difficulté</label>
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
        const data = Object.fromEntries(new FormData(e.target));
        data.targetedMuscles = data.targetedMuscles ? data.targetedMuscles.split(',').map(m => m.trim()) : [];
        try {
            await apiCall('/exerciseType/create', 'POST', data);
            closeModal();
            renderExercisesPage();
            showSuccess('Exercice créé');
        } catch (error) { alert(error.message); }
    });
}

async function deleteExercise(id) {
    if (!hasPermission('canDeleteExercise')) return showError('Permission refusée');
    if (!confirm('Supprimer cet exercice ?')) return;
    try {
        await apiCall(`/exerciseType/${id}`, 'DELETE');
        renderExercisesPage();
        showSuccess('Exercice supprimé');
    } catch (error) { alert(error.message); }
}

// ========== PAGE DÉFIS ==========
async function renderChallengesPage() {
    const content = document.getElementById('content-area');
    content.innerHTML = '<div class="loading"><div class="spinner"></div></div>';

    try {
        const challenges = await apiCall('/challenge/getAll');
        window.allChallenges = challenges;
        
        content.innerHTML = `
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Défis</h3>
                    ${hasPermission('canCreateChallenge') ? `<button class="btn btn-primary" onclick="showCreateChallengeModal()">+ Nouveau défi</button>` : ''}
                </div>
                <div class="filters" style="margin-bottom: 20px;">
                    <select id="filter-difficulty" onchange="filterChallenges()" style="padding: 8px; border-radius: 6px; border: 1px solid #e2e8f0;">
                        <option value="">Toutes difficultés</option>
                        <option value="beginner">Débutant</option>
                        <option value="intermediate">Intermédiaire</option>
                        <option value="advanced">Avancé</option>
                    </select>
                </div>
                <div class="table-container">
                    <table>
                        <thead>
                            <tr><th>Titre</th><th>Exercice</th><th>Difficulté</th><th>Durée</th><th>Participants</th><th>Actions</th></tr>
                        </thead>
                        <tbody id="challenges-body">${renderChallengesRows(challenges)}</tbody>
                    </table>
                </div>
            </div>
        `;
    } catch (error) {
        content.innerHTML = `<div class="error-message">${error.message}</div>`;
    }
}

function renderChallengesRows(challenges) {
    return challenges.map(ch => `
        <tr>
            <td><strong>${ch.title}</strong></td>
            <td>${ch.exerciseType?.name || '-'}</td>
            <td><span class="badge badge-${ch.difficulty === 'beginner' ? 'success' : ch.difficulty === 'intermediate' ? 'warning' : 'danger'}">${ch.difficulty === 'beginner' ? 'Débutant' : ch.difficulty === 'intermediate' ? 'Intermédiaire' : 'Avancé'}</span></td>
            <td>${ch.duration} jours</td>
            <td>${ch.participants?.length || 0}/${ch.maxParticipants || '∞'}</td>
            <td>
                <div class="btn-group">
                    ${isMember() ? `<button class="btn btn-sm btn-success" onclick="joinChallenge('${ch._id}')">Rejoindre</button>` : ''}
                    ${(isAdmin() || ch.creator?._id === currentUser.id) ? `
                        <button class="btn btn-sm btn-secondary" onclick="editChallenge('${ch._id}')">Modifier</button>
                        <button class="btn btn-sm btn-danger" onclick="deleteChallenge('${ch._id}')">Supprimer</button>
                    ` : ''}
                </div>
            </td>
        </tr>
    `).join('');
}

function filterChallenges() {
    const difficulty = document.getElementById('filter-difficulty').value;
    let filtered = window.allChallenges;
    if (difficulty) filtered = filtered.filter(ch => ch.difficulty === difficulty);
    document.getElementById('challenges-body').innerHTML = renderChallengesRows(filtered);
}

async function joinChallenge(id) {
    try {
        await apiCall(`/challenge/${id}/join`, 'POST', { userId: currentUser.id });
        renderChallengesPage();
        showSuccess('Vous avez rejoint le défi !');
    } catch (error) { alert(error.message); }
}

async function showCreateChallengeModal() {
    if (!hasPermission('canCreateChallenge')) return showError('Permission refusée');
    const exercises = await apiCall('/exerciseType/getAll');
    const gyms = await apiCall('/gym/approved');

    showModal('Créer un défi', `
        <form id="create-challenge-form">
            <div class="form-group"><label>Titre</label><input type="text" name="title" required></div>
            <div class="form-group"><label>Description</label><textarea name="description" required></textarea></div>
            <input type="hidden" name="creator" value="${currentUser.id}">
            <div class="form-group"><label>Type d'exercice</label><select name="exerciseType" required>${exercises.map(e => `<option value="${e._id}">${e.name}</option>`).join('')}</select></div>
            <div class="form-group"><label>Salle (optionnel)</label><select name="gym"><option value="">Aucune</option>${gyms.map(g => `<option value="${g._id}">${g.name}</option>`).join('')}</select></div>
            <div class="form-group"><label>Difficulté</label><select name="difficulty" required><option value="beginner">Débutant</option><option value="intermediate">Intermédiaire</option><option value="advanced">Avancé</option></select></div>
            <div class="form-group"><label>Durée (jours)</label><input type="number" name="duration" required min="1"></div>
            <div class="form-group"><label>Objectifs</label><textarea name="objectives" required></textarea></div>
            <div class="form-group"><label>Max participants</label><input type="number" name="maxParticipants" min="1"></div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" onclick="closeModal()">Annuler</button>
                <button type="submit" class="btn btn-primary">Créer</button>
            </div>
        </form>
    `);

    document.getElementById('create-challenge-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const data = Object.fromEntries(new FormData(e.target));
        data.duration = parseInt(data.duration);
        if (data.maxParticipants) data.maxParticipants = parseInt(data.maxParticipants);
        if (!data.gym) delete data.gym;
        try {
            await apiCall('/challenge/create', 'POST', data);
            closeModal();
            renderChallengesPage();
            showSuccess('Défi créé');
        } catch (error) { alert(error.message); }
    });
}

async function deleteChallenge(id) {
    if (!confirm('Supprimer ce défi ?')) return;
    try {
        await apiCall(`/challenge/${id}`, 'DELETE');
        renderChallengesPage();
        showSuccess('Défi supprimé');
    } catch (error) { alert(error.message); }
}

// ========== PAGE BADGES (Admin) ==========
async function renderBadgesPage() {
    const content = document.getElementById('content-area');
    if (!isAdmin()) {
        content.innerHTML = '<div class="error-message">Accès refusé - Réservé aux administrateurs</div>';
        return;
    }
    content.innerHTML = '<div class="loading"><div class="spinner"></div></div>';

    try {
        const badges = await apiCall('/badge/getAll');
        content.innerHTML = `
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Badges</h3>
                    <button class="btn btn-primary" onclick="showCreateBadgeModal()">+ Nouveau badge</button>
                </div>
                <div class="table-container">
                    <table>
                        <thead><tr><th>Nom</th><th>Description</th><th>Icon URL</th><th>Actions</th></tr></thead>
                        <tbody>
                            ${badges.map(b => `
                                <tr>
                                    <td><strong>${b.name}</strong></td>
                                    <td>${b.description}</td>
                                    <td>${b.iconUrl}</td>
                                    <td>
                                        <div class="btn-group">
                                            <button class="btn btn-sm btn-secondary" onclick="editBadge('${b._id}')">Modifier</button>
                                            <button class="btn btn-sm btn-danger" onclick="deleteBadge('${b._id}')">Supprimer</button>
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
            <div class="form-group"><label>Nom</label><input type="text" name="name" required></div>
            <div class="form-group"><label>Description</label><textarea name="description" required></textarea></div>
            <div class="form-group"><label>URL de l'icône</label><input type="url" name="iconUrl" required></div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" onclick="closeModal()">Annuler</button>
                <button type="submit" class="btn btn-primary">Créer</button>
            </div>
        </form>
    `);
    document.getElementById('create-badge-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            await apiCall('/badge/create', 'POST', Object.fromEntries(new FormData(e.target)));
            closeModal();
            renderBadgesPage();
            showSuccess('Badge créé');
        } catch (error) { alert(error.message); }
    });
}

async function deleteBadge(id) {
    if (!confirm('Supprimer ce badge ?')) return;
    try {
        await apiCall(`/badge/delete/${id}`, 'DELETE');
        renderBadgesPage();
        showSuccess('Badge supprimé');
    } catch (error) { alert(error.message); }
}

// ========== PAGE RÈGLES BADGES (Admin) ==========
async function renderBadgeRulesPage() {
    const content = document.getElementById('content-area');
    if (!hasPermission('canManageBadgeRules')) {
        content.innerHTML = '<div class="error-message">Accès refusé - Réservé aux administrateurs</div>';
        return;
    }
    content.innerHTML = '<div class="loading"><div class="spinner"></div></div>';

    try {
        const rules = await apiCall('/badgeRule/getAll');
        content.innerHTML = `
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Règles d'attribution des badges</h3>
                    <button class="btn btn-primary" onclick="showCreateBadgeRuleModal()">+ Nouvelle règle</button>
                </div>
                <div class="table-container">
                    <table>
                        <thead><tr><th>Badge</th><th>Condition</th><th>Champ</th><th>Opérateur</th><th>Valeur</th><th>Statut</th><th>Actions</th></tr></thead>
                        <tbody>
                            ${rules.map(r => `
                                <tr>
                                    <td><strong>${r.badgeName}</strong></td>
                                    <td>${r.conditionType}</td>
                                    <td>${r.conditionField}</td>
                                    <td>${r.operator}</td>
                                    <td>${r.value}</td>
                                    <td><span class="badge ${r.isActive ? 'badge-success' : 'badge-secondary'}">${r.isActive ? 'Active' : 'Inactive'}</span></td>
                                    <td>
                                        <div class="btn-group">
                                            <button class="btn btn-sm btn-info" onclick="editBadgeRule('${r._id}')">Modifier</button>
                                            <button class="btn btn-sm btn-secondary" onclick="toggleBadgeRule('${r._id}')">${r.isActive ? 'Désactiver' : 'Activer'}</button>
                                            <button class="btn btn-sm btn-danger" onclick="deleteBadgeRule('${r._id}')">Supprimer</button>
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
            <div class="form-group"><label>Badge</label><select name="badgeName" required>${badges.map(b => `<option value="${b.name}">${b.name}</option>`).join('')}</select></div>
            <div class="form-group"><label>Type de condition</label><select name="conditionType" required><option value="totalPoints">Points totaux</option><option value="completedTrainings">Entraînements complétés</option><option value="custom">Personnalisé</option></select></div>
            <div class="form-group"><label>Champ à évaluer</label><input type="text" name="conditionField" required placeholder="totalPoints ou completedTrainings"></div>
            <div class="form-group"><label>Opérateur</label><select name="operator" required><option value=">=">>=</option><option value=">">&gt;</option><option value="=">=</option><option value="<">&lt;</option><option value="<="><=</option></select></div>
            <div class="form-group"><label>Valeur seuil</label><input type="number" name="value" required min="0"></div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" onclick="closeModal()">Annuler</button>
                <button type="submit" class="btn btn-primary">Créer</button>
            </div>
        </form>
    `);
    document.getElementById('create-badge-rule-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const data = Object.fromEntries(new FormData(e.target));
        data.value = parseInt(data.value);
        try {
            await apiCall('/badgeRule/create', 'POST', data);
            closeModal();
            renderBadgeRulesPage();
            showSuccess('Règle créée');
        } catch (error) { alert(error.message); }
    });
}

async function toggleBadgeRule(id) {
    try {
        await apiCall(`/badgeRule/toggle/${id}`, 'PATCH');
        renderBadgeRulesPage();
        showSuccess('Règle mise à jour');
    } catch (error) { alert(error.message); }
}

async function deleteBadgeRule(id) {
    if (!confirm('Supprimer cette règle ?')) return;
    try {
        await apiCall(`/badgeRule/delete/${id}`, 'DELETE');
        renderBadgeRulesPage();
        showSuccess('Règle supprimée');
    } catch (error) { alert(error.message); }
}

// ========== PAGE ENTRAÎNEMENTS ==========
async function renderTrainingsPage() {
    const content = document.getElementById('content-area');
    content.innerHTML = '<div class="loading"><div class="spinner"></div></div>';

    try {
        if (isAdmin()) {
            const users = await apiCall('/user/getAll');
            content.innerHTML = `
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">Entraînements</h3>
                        <div style="display: flex; gap: 10px; align-items: center;">
                            <select id="user-selector" onchange="loadUserTrainings(this.value)" style="padding: 8px; border-radius: 6px; border: 1px solid #e2e8f0;">
                                ${users.map(u => `<option value="${u._id}" ${u._id === currentUser.id ? 'selected' : ''}>${u.firstname} ${u.lastname}</option>`).join('')}
                            </select>
                            <button class="btn btn-primary" onclick="showCreateTrainingModal()">+ Nouvel entraînement</button>
                        </div>
                    </div>
                    <div id="trainings-table-container"><div class="loading"><div class="spinner"></div></div></div>
                </div>
            `;
            loadUserTrainings(users[0]?._id || currentUser.id);
        } else {
            const trainings = await apiCall(`/trainingStat/user/${currentUser.id}`);
            renderTrainingsTable(trainings);
        }
    } catch (error) {
        content.innerHTML = `<div class="error-message">${error.message}</div>`;
    }
}

async function loadUserTrainings(userId) {
    const container = document.getElementById('trainings-table-container');
    if (!container) return;
    container.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
    window.selectedUserId = userId;
    
    try {
        const trainings = await apiCall(`/trainingStat/user/${userId}`);
        container.innerHTML = `
            <div class="table-container">
                <table>
                    <thead><tr><th>Date</th><th>Défi</th><th>Durée</th><th>Calories</th><th>Complété</th><th>Actions</th></tr></thead>
                    <tbody>
                        ${trainings.length === 0 ? '<tr><td colspan="6" style="text-align:center;padding:40px;">Aucun entraînement</td></tr>' : trainings.map(t => `
                            <tr>
                                <td>${new Date(t.sessionDate).toLocaleDateString('fr-FR')}</td>
                                <td>${t.challenge?.title || '-'}</td>
                                <td>${t.duration} min</td>
                                <td>${t.caloriesBurned}</td>
                                <td><span class="badge ${t.completed ? 'badge-success' : 'badge-warning'}">${t.completed ? 'Oui' : 'Non'}</span></td>
                                <td><button class="btn btn-sm btn-danger" onclick="deleteTraining('${t._id}')">Supprimer</button></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    } catch (error) {
        container.innerHTML = `<div class="error-message">${error.message}</div>`;
    }
}

function renderTrainingsTable(trainings) {
    const content = document.getElementById('content-area');
    window.selectedUserId = currentUser.id;
    content.innerHTML = `
        <div class="card">
            <div class="card-header">
                <h3 class="card-title">Mes Entraînements</h3>
                <button class="btn btn-primary" onclick="showCreateTrainingModal()">+ Nouvel entraînement</button>
            </div>
            <div class="table-container">
                <table>
                    <thead><tr><th>Date</th><th>Défi</th><th>Durée</th><th>Calories</th><th>Complété</th><th>Actions</th></tr></thead>
                    <tbody>
                        ${trainings.length === 0 ? '<tr><td colspan="6" style="text-align:center;padding:40px;">Aucun entraînement</td></tr>' : trainings.map(t => `
                            <tr>
                                <td>${new Date(t.sessionDate).toLocaleDateString('fr-FR')}</td>
                                <td>${t.challenge?.title || '-'}</td>
                                <td>${t.duration} min</td>
                                <td>${t.caloriesBurned}</td>
                                <td><span class="badge ${t.completed ? 'badge-success' : 'badge-warning'}">${t.completed ? 'Oui' : 'Non'}</span></td>
                                <td><button class="btn btn-sm btn-danger" onclick="deleteTraining('${t._id}')">Supprimer</button></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

async function showCreateTrainingModal() {
    const challenges = await apiCall('/challenge/getAll');
    const userId = window.selectedUserId || currentUser.id;

    showModal('Enregistrer un entraînement', `
        <form id="create-training-form">
            <input type="hidden" name="user" value="${userId}">
            <div class="form-group"><label>Défi</label><select name="challenge" required>${challenges.map(c => `<option value="${c._id}">${c.title}</option>`).join('')}</select></div>
            <div class="form-group"><label>Date de la séance</label><input type="datetime-local" name="sessionDate" required></div>
            <div class="form-group"><label>Durée (minutes)</label><input type="number" name="duration" required min="1"></div>
            <div class="form-group"><label>Calories brûlées</label><input type="number" name="caloriesBurned" required min="0"></div>
            <div class="form-group"><label>Notes</label><textarea name="notes"></textarea></div>
            <div class="form-group"><label><input type="checkbox" name="completed" checked> Entraînement complété</label></div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" onclick="closeModal()">Annuler</button>
                <button type="submit" class="btn btn-primary">Enregistrer</button>
            </div>
        </form>
    `);
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
            showSuccess('Entraînement enregistré');
        } catch (error) { alert(error.message); }
    });
}

async function deleteTraining(id) {
    if (!confirm('Supprimer cet entraînement ?')) return;
    try {
        await apiCall(`/trainingStat/${id}`, 'DELETE');
        renderTrainingsPage();
        showSuccess('Entraînement supprimé');
    } catch (error) { alert(error.message); }
}

// ========== PAGE CLASSEMENT ==========
async function renderScoresPage() {
    const content = document.getElementById('content-area');
    content.innerHTML = '<div class="loading"><div class="spinner"></div></div>';

    try {
        const leaderboard = await apiCall('/score/leaderboard');
        let myScore = null;
        try { myScore = await apiCall(`/score/user/${currentUser.id}`); } catch (e) {}
        
        content.innerHTML = `
            ${myScore ? `
                <div class="card" style="background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%); color: white; margin-bottom: 20px;">
                    <h3 style="margin-bottom: 10px;">Mon Score</h3>
                    <div style="display: flex; gap: 30px;">
                        <div><div style="font-size: 32px; font-weight: bold;">${myScore.totalPoints}</div><div style="opacity: 0.9;">Points totaux</div></div>
                        <div><div style="font-size: 32px; font-weight: bold;">${myScore.challengesCompleted}</div><div style="opacity: 0.9;">Défis complétés</div></div>
                    </div>
                </div>
            ` : ''}
            <div class="card">
                <div class="card-header"><h3 class="card-title">🏆 Top 10 Classement</h3></div>
                <div class="table-container">
                    <table>
                        <thead><tr><th>Rang</th><th>Utilisateur</th><th>Points</th><th>Défis</th></tr></thead>
                        <tbody>
                            ${leaderboard.length === 0 ? '<tr><td colspan="4" style="text-align:center;padding:40px;">Aucun score</td></tr>' : leaderboard.map((s, i) => `
                                <tr ${s.user?._id === currentUser.id ? 'style="background:#f0f9ff;"' : ''}>
                                    <td>${i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '#' + (i + 1)}</td>
                                    <td><strong>${s.user?.firstname || ''} ${s.user?.lastname || ''}</strong></td>
                                    <td><span class="badge badge-primary">${s.totalPoints} pts</span></td>
                                    <td>${s.challengesCompleted}</td>
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
    closeModal();
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3 class="modal-title">${title}</h3>
                <button class="modal-close" onclick="closeModal()">×</button>
            </div>
            <div class="modal-body">${content}</div>
        </div>
    `;
    document.body.appendChild(modal);
    currentModal = modal;
    modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
}

function closeModal() {
    if (currentModal) { currentModal.remove(); currentModal = null; }
}

// ========== NOTIFICATIONS ==========
function showSuccess(message) {
    const n = document.createElement('div');
    n.className = 'success-message';
    n.textContent = message;
    n.style.cssText = 'position:fixed;top:20px;right:20px;z-index:9999;';
    document.body.appendChild(n);
    setTimeout(() => n.remove(), 3000);
}

function showError(message) {
    const n = document.createElement('div');
    n.className = 'error-message';
    n.textContent = message;
    n.style.cssText = 'position:fixed;top:20px;right:20px;z-index:9999;';
    document.body.appendChild(n);
    setTimeout(() => n.remove(), 3000);
}

// ========== FONCTIONS D'ÉDITION ==========
async function editUser(id) {
    if (!isAdmin()) return showError('Réservé aux administrateurs');
    try {
        const user = await apiCall(`/user/get/${id}`);
        showModal('Modifier l\'utilisateur', `
            <form id="edit-user-form">
                <div class="form-group"><label>Prénom</label><input type="text" name="firstname" value="${user.firstname}" required></div>
                <div class="form-group"><label>Nom</label><input type="text" name="lastname" value="${user.lastname}" required></div>
                <div class="form-group"><label>Email</label><input type="email" name="email" value="${user.email}" required></div>
                <div class="form-group"><label>Mot de passe (laisser vide)</label><input type="password" name="password" minlength="8"></div>
                <div class="form-group"><label>Rôle</label><select name="role" required><option value="member" ${user.role === 'member' ? 'selected' : ''}>Member</option><option value="manager" ${user.role === 'manager' ? 'selected' : ''}>Manager</option><option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Admin</option></select></div>
                <div class="modal-footer"><button type="button" class="btn btn-secondary" onclick="closeModal()">Annuler</button><button type="submit" class="btn btn-primary">Modifier</button></div>
            </form>
        `);
        document.getElementById('edit-user-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const data = Object.fromEntries(new FormData(e.target));
            if (!data.password) delete data.password;
            try { await apiCall(`/user/update/${id}`, 'PATCH', data); closeModal(); renderUsersPage(); showSuccess('Utilisateur modifié'); } catch (error) { alert(error.message); }
        });
    } catch (error) { alert(error.message); }
}

async function editGym(id) {
    try {
        const gym = await apiCall(`/gym/${id}`);
        showModal('Modifier la salle', `
            <form id="edit-gym-form">
                <div class="form-group"><label>Nom</label><input type="text" name="name" value="${gym.name}" required></div>
                <div class="form-group"><label>Adresse</label><input type="text" name="address" value="${gym.address}" required></div>
                <div class="form-group"><label>Capacité</label><input type="number" name="capacity" value="${gym.capacity}" required min="1"></div>
                <div class="form-group"><label>Description</label><textarea name="description">${gym.description || ''}</textarea></div>
                <div class="form-group"><label>Téléphone</label><input type="tel" name="phone" value="${gym.phone || ''}"></div>
                <div class="form-group"><label>Email</label><input type="email" name="email" value="${gym.email || ''}"></div>
                <div class="modal-footer"><button type="button" class="btn btn-secondary" onclick="closeModal()">Annuler</button><button type="submit" class="btn btn-primary">Modifier</button></div>
            </form>
        `);
        document.getElementById('edit-gym-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const data = Object.fromEntries(new FormData(e.target));
            data.capacity = parseInt(data.capacity);
            try { await apiCall(`/gym/${id}`, 'PATCH', data); closeModal(); renderGymsPage(); showSuccess('Salle modifiée'); } catch (error) { alert(error.message); }
        });
    } catch (error) { alert(error.message); }
}

async function editExercise(id) {
    if (!hasPermission('canCreateExercise')) return showError('Réservé aux administrateurs');
    try {
        const ex = await apiCall(`/exerciseType/${id}`);
        showModal('Modifier l\'exercice', `
            <form id="edit-exercise-form">
                <div class="form-group"><label>Nom</label><input type="text" name="name" value="${ex.name}" required></div>
                <div class="form-group"><label>Description</label><textarea name="description" required>${ex.description}</textarea></div>
                <div class="form-group"><label>Muscles ciblés</label><input type="text" name="targetedMuscles" value="${ex.targetedMuscles?.join(', ') || ''}" required></div>
                <div class="form-group"><label>Difficulté</label><select name="difficulty" required><option value="beginner" ${ex.difficulty === 'beginner' ? 'selected' : ''}>Débutant</option><option value="intermediate" ${ex.difficulty === 'intermediate' ? 'selected' : ''}>Intermédiaire</option><option value="advanced" ${ex.difficulty === 'advanced' ? 'selected' : ''}>Avancé</option></select></div>
                <div class="modal-footer"><button type="button" class="btn btn-secondary" onclick="closeModal()">Annuler</button><button type="submit" class="btn btn-primary">Modifier</button></div>
            </form>
        `);
        document.getElementById('edit-exercise-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const data = Object.fromEntries(new FormData(e.target));
            data.targetedMuscles = data.targetedMuscles.split(',').map(s => s.trim());
            try { await apiCall(`/exerciseType/update/${id}`, 'PATCH', data); closeModal(); renderExercisesPage(); showSuccess('Exercice modifié'); } catch (error) { alert(error.message); }
        });
    } catch (error) { alert(error.message); }
}

async function editChallenge(id) {
    try {
        const ch = await apiCall(`/challenge/${id}`);
        const gyms = await apiCall('/gym/approved');
        const exercises = await apiCall('/exerciseType/getAll');
        showModal('Modifier le défi', `
            <form id="edit-challenge-form">
                <div class="form-group"><label>Titre</label><input type="text" name="title" value="${ch.title}" required></div>
                <div class="form-group"><label>Description</label><textarea name="description" required>${ch.description}</textarea></div>
                <div class="form-group"><label>Salle</label><select name="gym"><option value="">Aucune</option>${gyms.map(g => `<option value="${g._id}" ${ch.gym?._id === g._id ? 'selected' : ''}>${g.name}</option>`).join('')}</select></div>
                <div class="form-group"><label>Type d'exercice</label><select name="exerciseType" required>${exercises.map(e => `<option value="${e._id}" ${ch.exerciseType?._id === e._id ? 'selected' : ''}>${e.name}</option>`).join('')}</select></div>
                <div class="form-group"><label>Difficulté</label><select name="difficulty" required><option value="beginner" ${ch.difficulty === 'beginner' ? 'selected' : ''}>Débutant</option><option value="intermediate" ${ch.difficulty === 'intermediate' ? 'selected' : ''}>Intermédiaire</option><option value="advanced" ${ch.difficulty === 'advanced' ? 'selected' : ''}>Avancé</option></select></div>
                <div class="form-group"><label>Durée (jours)</label><input type="number" name="duration" value="${ch.duration}" required min="1"></div>
                <div class="form-group"><label>Objectifs</label><textarea name="objectives" required>${ch.objectives}</textarea></div>
                <div class="form-group"><label>Max participants</label><input type="number" name="maxParticipants" value="${ch.maxParticipants || ''}" min="1"></div>
                <div class="modal-footer"><button type="button" class="btn btn-secondary" onclick="closeModal()">Annuler</button><button type="submit" class="btn btn-primary">Modifier</button></div>
            </form>
        `);
        document.getElementById('edit-challenge-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const data = Object.fromEntries(new FormData(e.target));
            data.duration = parseInt(data.duration);
            if (data.maxParticipants) data.maxParticipants = parseInt(data.maxParticipants); else delete data.maxParticipants;
            if (!data.gym) delete data.gym;
            try { await apiCall(`/challenge/update/${id}`, 'PATCH', data); closeModal(); renderChallengesPage(); showSuccess('Défi modifié'); } catch (error) { alert(error.message); }
        });
    } catch (error) { alert(error.message); }
}

async function editBadge(id) {
    if (!hasPermission('canCreateBadge')) return showError('Réservé aux administrateurs');
    try {
        const badge = await apiCall(`/badge/get/${id}`);
        showModal('Modifier le badge', `
            <form id="edit-badge-form">
                <div class="form-group"><label>Nom</label><input type="text" name="name" value="${badge.name}" required></div>
                <div class="form-group"><label>Description</label><textarea name="description" required>${badge.description}</textarea></div>
                <div class="form-group"><label>Icône</label><input type="url" name="iconUrl" value="${badge.iconUrl}" required></div>
                <div class="modal-footer"><button type="button" class="btn btn-secondary" onclick="closeModal()">Annuler</button><button type="submit" class="btn btn-primary">Modifier</button></div>
            </form>
        `);
        document.getElementById('edit-badge-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            try { await apiCall(`/badge/update/${id}`, 'PATCH', Object.fromEntries(new FormData(e.target))); closeModal(); renderBadgesPage(); showSuccess('Badge modifié'); } catch (error) { alert(error.message); }
        });
    } catch (error) { alert(error.message); }
}

async function editBadgeRule(id) {
    if (!hasPermission('canManageBadgeRules')) return showError('Réservé aux administrateurs');
    try {
        const rule = await apiCall(`/badgeRule/get/${id}`);
        const badges = await apiCall('/badge/getAll');
        showModal('Modifier la règle', `
            <form id="edit-rule-form">
                <div class="form-group"><label>Badge</label><select name="badgeName" required>${badges.map(b => `<option value="${b.name}" ${rule.badgeName === b.name ? 'selected' : ''}>${b.name}</option>`).join('')}</select></div>
                <div class="form-group"><label>Type de condition</label><select name="conditionType" required><option value="totalPoints" ${rule.conditionType === 'totalPoints' ? 'selected' : ''}>Points totaux</option><option value="completedTrainings" ${rule.conditionType === 'completedTrainings' ? 'selected' : ''}>Entraînements complétés</option><option value="custom" ${rule.conditionType === 'custom' ? 'selected' : ''}>Personnalisé</option></select></div>
                <div class="form-group"><label>Champ à évaluer</label><input type="text" name="conditionField" value="${rule.conditionField}" required></div>
                <div class="form-group"><label>Opérateur</label><select name="operator" required><option value=">=" ${rule.operator === '>=' ? 'selected' : ''}>>=</option><option value=">" ${rule.operator === '>' ? 'selected' : ''}>&gt;</option><option value="=" ${rule.operator === '=' ? 'selected' : ''}>=</option><option value="<" ${rule.operator === '<' ? 'selected' : ''}>&lt;</option><option value="<=" ${rule.operator === '<=' ? 'selected' : ''}><=</option></select></div>
                <div class="form-group"><label>Valeur seuil</label><input type="number" name="value" value="${rule.value}" required min="0"></div>
                <div class="form-group"><label>Statut</label><select name="isActive"><option value="true" ${rule.isActive ? 'selected' : ''}>Actif</option><option value="false" ${!rule.isActive ? 'selected' : ''}>Inactif</option></select></div>
                <div class="modal-footer"><button type="button" class="btn btn-secondary" onclick="closeModal()">Annuler</button><button type="submit" class="btn btn-primary">Modifier</button></div>
            </form>
        `);
        document.getElementById('edit-rule-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const data = Object.fromEntries(new FormData(e.target));
            data.isActive = data.isActive === 'true';
            data.value = parseInt(data.value);
            try { await apiCall(`/badgeRule/update/${id}`, 'PATCH', data); closeModal(); renderBadgeRulesPage(); showSuccess('Règle modifiée'); } catch (error) { alert(error.message); }
        });
    } catch (error) { alert(error.message); }
}

// ========== EXPOSER LES FONCTIONS GLOBALEMENT ==========
// Fonctions d'authentification
window.fillCredentials = fillCredentials;
window.logout = logout;
window.toggleAuthForm = toggleAuthForm;

// Fonctions utilisateurs
window.showCreateUserModal = showCreateUserModal;
window.editUser = editUser;
window.deleteUser = deleteUser;
window.toggleUserActive = toggleUserActive;

// Fonctions salles
window.showCreateGymModal = showCreateGymModal;
window.editGym = editGym;
window.deleteGym = deleteGym;
window.approveGym = approveGym;

// Fonctions exercices
window.showCreateExerciseModal = showCreateExerciseModal;
window.editExercise = editExercise;
window.deleteExercise = deleteExercise;

// Fonctions défis
window.showCreateChallengeModal = showCreateChallengeModal;
window.editChallenge = editChallenge;
window.deleteChallenge = deleteChallenge;
window.joinChallenge = joinChallenge;
window.filterChallenges = filterChallenges;

// Fonctions badges
window.showCreateBadgeModal = showCreateBadgeModal;
window.editBadge = editBadge;
window.deleteBadge = deleteBadge;

// Fonctions règles badges
window.showCreateBadgeRuleModal = showCreateBadgeRuleModal;
window.editBadgeRule = editBadgeRule;
window.deleteBadgeRule = deleteBadgeRule;
window.toggleBadgeRule = toggleBadgeRule;

// Fonctions entraînements
window.showCreateTrainingModal = showCreateTrainingModal;
window.deleteTraining = deleteTraining;
window.loadUserTrainings = loadUserTrainings;

// Fonctions modales
window.showModal = showModal;
window.closeModal = closeModal;

// Fonctions de navigation
window.loadPage = loadPage;

// ========== INIT ==========
if (authToken && currentUser.id) {
    fetch(`${API_URL}/user/get/${currentUser.id}`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
    })
    .then(response => {
        if (response.ok) return response.json();
        throw new Error('Token invalide');
    })
    .then(userData => {
        currentUser = { ...currentUser, role: userData.role, firstname: userData.firstname, lastname: userData.lastname };
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        
        document.getElementById('auth-page').style.display = 'none';
        document.getElementById('dashboard').style.display = 'flex';
        document.getElementById('current-user-email').textContent = `${currentUser.firstname || ''} ${currentUser.lastname || ''} (${currentUser.role})`;
        
        setupSidebarByRole();
        const firstPage = ROLE_PERMISSIONS[currentUser.role]?.pages[0] || 'challenges';
        loadPage(firstPage);
    })
    .catch(error => {
        console.error('Session expirée:', error);
        localStorage.removeItem('authToken');
        localStorage.removeItem('currentUser');
        authToken = null;
        currentUser = {};
    });
}