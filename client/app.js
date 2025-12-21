// Configuration API
const API_URL = 'http://localhost:3000';
let authToken = localStorage.getItem('authToken');
let currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');

// Cache pour les données
let cachedExerciseTypes = [];
let cachedGyms = [];
let cachedUsers = [];

// ========== DÉFINITION DES PERMISSIONS PAR RÔLE ==========
const ROLE_PERMISSIONS = {
    admin: {
        pages: ['users', 'gyms', 'exercises', 'challenges', 'social', 'badges', 'rewards', 'badgeRules', 'trainings', 'scores'],
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
        canManageRewards: true,
        canSeeAllUsers: true,
        canSeeAllGyms: true,
        canCreateChallenge: true,
        canDeleteAnyChallenge: true,
        canSeeAllTrainings: true,
    },
    manager: {
        pages: ['gyms', 'exercises', 'challenges', 'social', 'trainings', 'scores', 'rewards'],
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
        canManageRewards: false,
        canSeeAllUsers: false,
        canSeeAllGyms: true,
        canCreateChallenge: true,
        canDeleteAnyChallenge: false,
        canSeeAllTrainings: false,
    },
    member: {
        pages: ['challenges', 'social', 'trainings', 'scores', 'rewards'],
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
        canManageRewards: false,
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

async function apiCall(endpoint, method = 'GET', body = null, returnEmptyOnError = false) {
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
        }
    };
    if (body) options.body = JSON.stringify(body);

    try {
        const response = await fetch(`${API_URL}${endpoint}`, options);

        if (response.status === 204) return null;
        
        // Si 404 et qu'on demande un retour vide, retourner un tableau vide
        if (response.status === 404 && returnEmptyOnError) {
            return [];
        }

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

        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
            return response.json();
        } else {
            const text = await response.text();
            return { message: text };
        }
    } catch (error) {
        if (returnEmptyOnError) {
            console.warn(`API call to ${endpoint} failed:`, error.message);
            return [];
        }
        throw error;
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
        'social': 'Défis Sociaux',
        'badges': 'Badges',
        'rewards': 'Récompenses',
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
        'social': renderSocialPage,
        'badges': renderBadgesPage,
        'rewards': renderRewardsPage,
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
        cachedUsers = users;
        
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
                                                ${user.role !== 'admin' ? `
                                                    <button class="btn btn-sm btn-secondary" onclick="editUser('${user._id}')">Modifier</button>
                                                    <button class="btn btn-sm btn-warning" onclick="toggleUserActive('${user._id}')">${user.active ? 'Désactiver' : 'Activer'}</button>
                                                    <button class="btn btn-sm btn-danger" onclick="deleteUser('${user._id}')">Supprimer</button>
                                                ` : '<span class="badge badge-secondary">Admin protégé</span>'}
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
    
    // Vérifier que ce n'est pas un admin
    const user = cachedUsers.find(u => u._id === id);
    if (user && user.role === 'admin') {
        return showError('Impossible de supprimer un administrateur');
    }
    
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
        cachedGyms = gyms;
        
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
        // Filtrer pour n'afficher que les admins et managers
        const eligibleUsers = users.filter(u => u.role === 'admin' || u.role === 'manager');
        usersOptions = eligibleUsers.map(u => `<option value="${u._id}">${u.firstname} ${u.lastname} (${u.role})</option>`).join('');
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
        cachedExerciseTypes = exercises;
        
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

// ========== PAGE DÉFIS AVEC FILTRES AVANCÉS ==========
async function renderChallengesPage() {
    const content = document.getElementById('content-area');
    content.innerHTML = '<div class="loading"><div class="spinner"></div></div>';

    try {
        const [challenges, exercises, gyms] = await Promise.all([
            apiCall('/challenge/getAll'),
            apiCall('/exerciseType/getAll'),
            apiCall('/gym/approved')
        ]);
        
        window.allChallenges = challenges;
        cachedExerciseTypes = exercises;
        cachedGyms = gyms;
        
        // Récupérer les salles possédées par l'utilisateur courant (pour le manager)
        const myGyms = isAdmin() ? gyms : gyms.filter(g => g.owner?._id === currentUser.id);
        window.myGyms = myGyms;
        
        content.innerHTML = `
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-label">Total des défis</div>
                    <div class="stat-value">${challenges.length}</div>
                </div>
                <div class="stat-card success">
                    <div class="stat-label">Défis débutant</div>
                    <div class="stat-value">${challenges.filter(c => c.difficulty === 'beginner').length}</div>
                </div>
                <div class="stat-card warning">
                    <div class="stat-label">Défis intermédiaire</div>
                    <div class="stat-value">${challenges.filter(c => c.difficulty === 'intermediate').length}</div>
                </div>
                <div class="stat-card info">
                    <div class="stat-label">Défis avancé</div>
                    <div class="stat-value">${challenges.filter(c => c.difficulty === 'advanced').length}</div>
                </div>
            </div>

            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Explorer les défis</h3>
                    ${hasPermission('canCreateChallenge') ? `<button class="btn btn-primary" onclick="showCreateChallengeModal()">+ Créer un défi</button>` : ''}
                </div>
                
                <!-- Filtres avancés -->
                <div class="filters">
                    <div class="filter-group">
                        <label>Difficulté</label>
                        <select id="filter-difficulty" onchange="filterChallenges()">
                            <option value="">Toutes</option>
                            <option value="beginner">Débutant</option>
                            <option value="intermediate">Intermédiaire</option>
                            <option value="advanced">Avancé</option>
                        </select>
                    </div>
                    <div class="filter-group">
                        <label>Type d'exercice</label>
                        <select id="filter-exercise" onchange="filterChallenges()">
                            <option value="">Tous</option>
                            ${exercises.map(e => `<option value="${e._id}">${e.name}</option>`).join('')}
                        </select>
                    </div>
                    <div class="filter-group">
                        <label>Durée max (jours)</label>
                        <input type="number" id="filter-duration" min="1" placeholder="Ex: 30" onchange="filterChallenges()">
                    </div>
                    <div class="filter-group">
                        <label>Salle</label>
                        <select id="filter-gym" onchange="filterChallenges()">
                            <option value="">Toutes</option>
                            ${gyms.map(g => `<option value="${g._id}">${g.name}</option>`).join('')}
                        </select>
                    </div>
                    <div class="filter-actions">
                        <button class="btn btn-secondary btn-sm" onclick="resetFilters()">Réinitialiser</button>
                    </div>
                </div>
                
                <div id="challenges-container" class="challenge-grid">
                    ${renderChallengeCards(challenges)}
                </div>
            </div>
        `;
    } catch (error) {
        content.innerHTML = `<div class="error-message">${error.message}</div>`;
    }
}

function renderChallengeCards(challenges) {
    if (challenges.length === 0) {
        return '<div class="empty-state"><h3>Aucun défi trouvé</h3><p>Modifiez vos filtres ou créez un nouveau défi</p></div>';
    }
    
    return challenges.map(ch => {
        const isParticipant = ch.participants?.some(p => (p._id || p) === currentUser.id);
        const isCreator = ch.creator?._id === currentUser.id;
        const canEdit = isAdmin() || isCreator;
        
        return `
            <div class="challenge-card">
                <div class="challenge-card-header">
                    <h4 class="challenge-card-title">${ch.title}</h4>
                    <span class="badge badge-${ch.difficulty === 'beginner' ? 'success' : ch.difficulty === 'intermediate' ? 'warning' : 'danger'}">
                        ${ch.difficulty === 'beginner' ? 'Débutant' : ch.difficulty === 'intermediate' ? 'Intermédiaire' : 'Avancé'}
                    </span>
                </div>
                <div class="challenge-card-body">
                    <p>${ch.description?.substring(0, 100)}${ch.description?.length > 100 ? '...' : ''}</p>
                    <div class="challenge-meta">
                        <span class="challenge-meta-item">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="12" cy="12" r="10"></circle>
                                <polyline points="12 6 12 12 16 14"></polyline>
                            </svg>
                            ${ch.duration} jours
                        </span>
                        <span class="challenge-meta-item">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                                <circle cx="9" cy="7" r="4"></circle>
                            </svg>
                            ${ch.participants?.length || 0} participant(s)
                        </span>
                        ${ch.exerciseType ? `
                            <span class="challenge-meta-item">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <circle cx="12" cy="12" r="10"></circle>
                                </svg>
                                ${ch.exerciseType.name || 'N/A'}
                            </span>
                        ` : ''}
                    </div>
                    ${ch.gym ? `<p style="font-size: 12px; color: var(--text-secondary);">📍 ${ch.gym.name || 'Salle'}</p>` : ''}
                </div>
                <div class="challenge-card-footer">
                    ${!isParticipant && !isCreator ? `
                        <button class="btn btn-success btn-sm" onclick="joinChallenge('${ch._id}')">Rejoindre</button>
                    ` : isParticipant ? `
                        <button class="btn btn-primary btn-sm" onclick="completeChallenge('${ch._id}')">Compléter</button>
                    ` : ''}
                    <button class="btn btn-info btn-sm" onclick="shareChallenge('${ch._id}')">Partager</button>
                    ${canEdit ? `
                        <button class="btn btn-secondary btn-sm" onclick="editChallenge('${ch._id}')">Modifier</button>
                        <button class="btn btn-danger btn-sm" onclick="deleteChallenge('${ch._id}')">Supprimer</button>
                    ` : ''}
                </div>
            </div>
        `;
    }).join('');
}

function filterChallenges() {
    const difficulty = document.getElementById('filter-difficulty').value;
    const exerciseType = document.getElementById('filter-exercise').value;
    const duration = document.getElementById('filter-duration').value;
    const gymId = document.getElementById('filter-gym').value;
    
    let filtered = window.allChallenges;
    
    if (difficulty) {
        filtered = filtered.filter(ch => ch.difficulty === difficulty);
    }
    if (exerciseType) {
        filtered = filtered.filter(ch => ch.exerciseType?._id === exerciseType);
    }
    if (duration) {
        filtered = filtered.filter(ch => ch.duration <= parseInt(duration));
    }
    if (gymId) {
        filtered = filtered.filter(ch => ch.gym?._id === gymId);
    }
    
    document.getElementById('challenges-container').innerHTML = renderChallengeCards(filtered);
}

function resetFilters() {
    document.getElementById('filter-difficulty').value = '';
    document.getElementById('filter-exercise').value = '';
    document.getElementById('filter-duration').value = '';
    document.getElementById('filter-gym').value = '';
    document.getElementById('challenges-container').innerHTML = renderChallengeCards(window.allChallenges);
}

async function joinChallenge(id) {
    try {
        await apiCall(`/challenge/${id}/join`, 'POST', { userId: currentUser.id });
        renderChallengesPage();
        showSuccess('Vous avez rejoint le défi !');
    } catch (error) { alert(error.message); }
}

async function completeChallenge(id) {
    if (!confirm('Confirmer que vous avez complété ce défi ?')) return;
    try {
        const result = await apiCall(`/challenge/${id}/complete`, 'POST', { userId: currentUser.id });
        showSuccess(`Félicitations ! Vous avez gagné ${result.pointsEarned} points !`);
        renderChallengesPage();
    } catch (error) { alert(error.message); }
}

async function shareChallenge(id) {
    try {
        // Charger les utilisateurs pour le partage
        let users = [];
        if (isAdmin()) {
            users = await apiCall('/user/getAll');
        } else {
            // Pour les non-admins, on ne peut pas voir tous les utilisateurs
            // On affiche un champ texte pour entrer l'ID ou email
        }
        
        const usersOptions = users
            .filter(u => u._id !== currentUser.id)
            .map(u => `<option value="${u._id}">${u.firstname} ${u.lastname} (${u.email})</option>`)
            .join('');
        
        showModal('Partager le défi', `
            <form id="share-challenge-form">
                ${users.length > 0 ? `
                    <div class="form-group">
                        <label>Partager avec</label>
                        <select name="sharedWith" required>
                            <option value="">Sélectionner un utilisateur</option>
                            ${usersOptions}
                        </select>
                    </div>
                ` : `
                    <div class="form-group">
                        <label>ID de l'utilisateur</label>
                        <input type="text" name="sharedWith" required placeholder="ID de l'utilisateur">
                    </div>
                `}
                <div class="form-group">
                    <label>Message (optionnel)</label>
                    <textarea name="message" placeholder="Essaie ce défi !"></textarea>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" onclick="closeModal()">Annuler</button>
                    <button type="submit" class="btn btn-primary">Partager</button>
                </div>
            </form>
        `);
        
        document.getElementById('share-challenge-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const data = Object.fromEntries(new FormData(e.target));
            try {
                await apiCall(`/challenge/${id}/share`, 'POST', data);
                closeModal();
                showSuccess('Défi partagé avec succès !');
            } catch (error) { alert(error.message); }
        });
    } catch (error) { alert(error.message); }
}

async function showCreateChallengeModal() {
    if (!hasPermission('canCreateChallenge')) return showError('Permission refusée');
    
    // Charger les données nécessaires
    const exercises = cachedExerciseTypes.length > 0 ? cachedExerciseTypes : await apiCall('/exerciseType/getAll');
    
    // Pour les gyms, utiliser uniquement les salles possédées par l'utilisateur (sauf admin)
    let gymsForSelect = [];
    if (isAdmin()) {
        gymsForSelect = await apiCall('/gym/approved');
    } else if (isManager()) {
        const allGyms = await apiCall('/gym/getAll');
        gymsForSelect = allGyms.filter(g => g.owner?._id === currentUser.id && g.approved);
    }
    // Les membres ne peuvent pas associer de salle

    showModal('Créer un défi', `
        <form id="create-challenge-form">
            <div class="form-group"><label>Titre</label><input type="text" name="title" required></div>
            <div class="form-group"><label>Description</label><textarea name="description" required></textarea></div>
            <input type="hidden" name="creator" value="${currentUser.id}">
            <div class="form-group">
                <label>Type d'exercice</label>
                <select name="exerciseType" required>
                    <option value="">Sélectionner un exercice</option>
                    ${exercises.map(e => `<option value="${e._id}">${e.name} (${e.difficulty})</option>`).join('')}
                </select>
            </div>
            ${(isAdmin() || isManager()) && gymsForSelect.length > 0 ? `
                <div class="form-group">
                    <label>Salle (optionnel - ${isManager() ? 'vos salles uniquement' : 'toutes les salles'})</label>
                    <select name="gym">
                        <option value="">Aucune salle</option>
                        ${gymsForSelect.map(g => `<option value="${g._id}">${g.name}</option>`).join('')}
                    </select>
                </div>
            ` : '<input type="hidden" name="gym" value="">'}
            <div class="form-group">
                <label>Difficulté</label>
                <select name="difficulty" required>
                    <option value="beginner">Débutant</option>
                    <option value="intermediate">Intermédiaire</option>
                    <option value="advanced">Avancé</option>
                </select>
            </div>
            <div class="form-group"><label>Durée (jours)</label><input type="number" name="duration" required min="1" value="7"></div>
            <div class="form-group"><label>Objectifs</label><textarea name="objectives" required placeholder="Décrivez les objectifs à atteindre"></textarea></div>
            <div class="form-group"><label>Max participants (optionnel)</label><input type="number" name="maxParticipants" min="1" placeholder="50"></div>
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
            showSuccess('Défi créé avec succès !');
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

// ========== PAGE DÉFIS SOCIAUX ==========
async function renderSocialPage() {
    const content = document.getElementById('content-area');
    content.innerHTML = '<div class="loading"><div class="spinner"></div></div>';

    try {
        const [received, sent, invitations] = await Promise.all([
            apiCall('/challenge/shared/received').catch(() => []),
            apiCall('/challenge/shared/sent').catch(() => []),
            apiCall(`/social/invitations/${currentUser.id}`).catch(() => [])
        ]);
        
        const unseenCount = received.filter(s => !s.seen).length;
        
        content.innerHTML = `
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-label">Défis reçus</div>
                    <div class="stat-value">${received.length}</div>
                </div>
                <div class="stat-card warning">
                    <div class="stat-label">Non vus</div>
                    <div class="stat-value">${unseenCount}</div>
                </div>
                <div class="stat-card success">
                    <div class="stat-label">Défis envoyés</div>
                    <div class="stat-value">${sent.length}</div>
                </div>
                <div class="stat-card info">
                    <div class="stat-label">Invitations 1v1</div>
                    <div class="stat-value">${invitations.length}</div>
                </div>
            </div>

            <div class="tabs">
                <button class="tab active" onclick="switchSocialTab('received')">Défis reçus ${unseenCount > 0 ? `<span class="notification-badge">${unseenCount}</span>` : ''}</button>
                <button class="tab" onclick="switchSocialTab('sent')">Défis envoyés</button>
                <button class="tab" onclick="switchSocialTab('invitations')">Invitations 1v1</button>
            </div>

            <div id="social-content">
                ${renderReceivedChallenges(received)}
            </div>
        `;
        
        window.socialData = { received, sent, invitations };
    } catch (error) {
        content.innerHTML = `<div class="error-message">${error.message}</div>`;
    }
}

function switchSocialTab(tab) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    event.target.classList.add('active');
    
    const container = document.getElementById('social-content');
    
    switch(tab) {
        case 'received':
            container.innerHTML = renderReceivedChallenges(window.socialData.received);
            break;
        case 'sent':
            container.innerHTML = renderSentChallenges(window.socialData.sent);
            break;
        case 'invitations':
            container.innerHTML = renderInvitations(window.socialData.invitations);
            break;
    }
}

function renderReceivedChallenges(shares) {
    if (shares.length === 0) {
        return '<div class="card"><div class="empty-state"><h3>Aucun défi partagé reçu</h3><p>Les défis que vos amis partagent avec vous apparaîtront ici</p></div></div>';
    }
    
    return `<div class="card">
        ${shares.map(share => `
            <div class="invitation-card ${!share.seen ? 'unseen' : ''}">
                <div class="invitation-header">
                    <span class="invitation-from">De: ${share.sharedBy?.firstname || ''} ${share.sharedBy?.lastname || ''}</span>
                    <span class="invitation-date">${new Date(share.created_at).toLocaleDateString('fr-FR')}</span>
                </div>
                <h4>${share.challenge?.title || 'Défi'}</h4>
                <p>${share.challenge?.description || ''}</p>
                ${share.message ? `<p class="share-message"><em>"${share.message}"</em></p>` : ''}
                <div class="invitation-actions">
                    <button class="btn btn-primary btn-sm" onclick="joinChallenge('${share.challenge?._id}')">Rejoindre</button>
                    <button class="btn btn-secondary btn-sm" onclick="markShareSeen('${share._id}')">Marquer comme vu</button>
                </div>
            </div>
        `).join('')}
    </div>`;
}

function renderSentChallenges(shares) {
    if (shares.length === 0) {
        return '<div class="card"><div class="empty-state"><h3>Aucun défi envoyé</h3><p>Partagez des défis avec vos amis depuis la page Défis</p></div></div>';
    }
    
    return `<div class="card">
        ${shares.map(share => `
            <div class="invitation-card">
                <div class="invitation-header">
                    <span class="invitation-from">À: ${share.sharedWith?.firstname || ''} ${share.sharedWith?.lastname || ''}</span>
                    <span class="invitation-date">${new Date(share.created_at).toLocaleDateString('fr-FR')}</span>
                </div>
                <h4>${share.challenge?.title || 'Défi'}</h4>
                <p>${share.challenge?.description || ''}</p>
                ${share.message ? `<p class="share-message"><em>"${share.message}"</em></p>` : ''}
                <span class="badge ${share.seen ? 'badge-success' : 'badge-warning'}">${share.seen ? 'Vu' : 'Non vu'}</span>
            </div>
        `).join('')}
    </div>`;
}

function renderInvitations(invitations) {
    if (invitations.length === 0) {
        return '<div class="card"><div class="empty-state"><h3>Aucune invitation 1v1</h3><p>Lancez un défi à un ami depuis la page Défis</p></div></div>';
    }
    
    return `<div class="card">
        ${invitations.map(inv => `
            <div class="invitation-card">
                <div class="invitation-header">
                    <span class="invitation-from">De: ${inv.challenger?.firstname || ''} ${inv.challenger?.lastname || ''}</span>
                    <span class="invitation-date">${new Date(inv.created_at).toLocaleDateString('fr-FR')}</span>
                </div>
                <h4>${inv.challenge?.title || 'Défi 1v1'}</h4>
                <p>${inv.challenge?.description || ''}</p>
                <div class="invitation-actions">
                    <button class="btn btn-primary btn-sm" onclick="acceptInvitation('${inv._id}')">Accepter</button>
                    <button class="btn btn-danger btn-sm" onclick="declineInvitation('${inv._id}')">Refuser</button>
                </div>
            </div>
        `).join('')}
    </div>`;
}

async function markShareSeen(shareId) {
    try {
        await apiCall(`/challenge/shared/${shareId}/seen`, 'PUT');
        renderSocialPage();
    } catch (error) { alert(error.message); }
}

async function acceptInvitation(invId) {
    try {
        await apiCall(`/social/invitation/${invId}/accept`, 'PUT');
        showSuccess('Invitation acceptée !');
        renderSocialPage();
    } catch (error) { alert(error.message); }
}

async function declineInvitation(invId) {
    if (!confirm('Refuser cette invitation ?')) return;
    try {
        await apiCall(`/social/invitation/${invId}/decline`, 'PUT');
        renderSocialPage();
    } catch (error) { alert(error.message); }
}

async function shareChallenge(challengeId) {
    let usersHtml = '';
    if (isAdmin()) {
        const users = await apiCall('/user').catch(() => []);
        usersHtml = `<select name="userId" required>
            <option value="">Sélectionner un utilisateur</option>
            ${users.filter(u => u._id !== currentUser.id).map(u => `<option value="${u._id}">${u.firstname} ${u.lastname} (${u.email})</option>`).join('')}
        </select>`;
    } else {
        usersHtml = `<input type="text" name="userId" required placeholder="ID de l'utilisateur">`;
    }

    showModal('Partager ce défi', `
        <form id="share-form">
            <div class="form-group">
                <label>Destinataire</label>
                ${usersHtml}
            </div>
            <div class="form-group">
                <label>Message (optionnel)</label>
                <textarea name="message" placeholder="Ajoute un message personnel..."></textarea>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" onclick="closeModal()">Annuler</button>
                <button type="submit" class="btn btn-primary">Partager</button>
            </div>
        </form>
    `);

    document.getElementById('share-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const data = Object.fromEntries(new FormData(e.target));
        try {
            await apiCall(`/challenge/${challengeId}/share`, 'POST', data);
            closeModal();
            showSuccess('Défi partagé !');
        } catch (error) { alert(error.message); }
    });
}

async function joinChallenge(id) {
    try {
        await apiCall(`/challenge/${id}/join`, 'POST');
        showSuccess('Vous avez rejoint le défi !');
        renderChallengesPage();
    } catch (error) { alert(error.message); }
}

async function completeChallenge(id) {
    try {
        const result = await apiCall(`/challenge/${id}/complete`, 'POST');
        showSuccess(`Défi complété ! +${result.pointsEarned || 0} points`);
        renderChallengesPage();
    } catch (error) { alert(error.message); }
}

// ========== PAGE ENTRAÎNEMENTS ==========
async function renderTrainingsPage() {
    const content = document.getElementById('content-area');
    content.innerHTML = '<div class="loading"><div class="spinner"></div></div>';

    try {
        const trainings = await apiCall(`/training/user/${currentUser.id}`, 'GET', null, true) || [];
        
        content.innerHTML = `
            <div class="page-header">
                <h2>Mes entraînements</h2>
                <button class="btn btn-primary" onclick="showCreateTrainingModal()">+ Nouvel entraînement</button>
            </div>
            
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-label">Total</div>
                    <div class="stat-value">${trainings.length}</div>
                </div>
                <div class="stat-card success">
                    <div class="stat-label">Ce mois</div>
                    <div class="stat-value">${trainings.filter(t => new Date(t.date) > new Date(Date.now() - 30*24*60*60*1000)).length}</div>
                </div>
            </div>

            <div class="card">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Exercice</th>
                            <th>Durée</th>
                            <th>Répétitions</th>
                            <th>Poids</th>
                            <th>Calories</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${trainings.length === 0 ? '<tr><td colspan="7" class="text-center">Aucun entraînement enregistré</td></tr>' :
                        trainings.map(t => `
                            <tr>
                                <td>${new Date(t.date).toLocaleDateString('fr-FR')}</td>
                                <td>${t.exerciseType?.name || 'N/A'}</td>
                                <td>${t.duration || '-'} min</td>
                                <td>${t.repetitions || '-'}</td>
                                <td>${t.weight ? t.weight + ' kg' : '-'}</td>
                                <td>${t.caloriesBurned || '-'}</td>
                                <td>
                                    <button class="btn btn-sm btn-secondary" onclick="editTraining('${t._id}')">✏️</button>
                                    <button class="btn btn-sm btn-danger" onclick="deleteTraining('${t._id}')">🗑️</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    } catch (error) {
        content.innerHTML = `<div class="error-message">Impossible de charger les entraînements: ${error.message}</div>`;
    }
}

async function showCreateTrainingModal() {
    const exercises = cachedExerciseTypes.length ? cachedExerciseTypes : await apiCall('/exerciseType', 'GET', null, true) || [];
    cachedExerciseTypes = exercises;
    
    if (exercises.length === 0) {
        showError('Aucun type d\'exercice disponible. Un administrateur doit d\'abord en créer.');
        return;
    }

    showModal('Nouvel entraînement', `
        <form id="create-training-form">
            <div class="form-group">
                <label>Date</label>
                <input type="date" name="date" required value="${new Date().toISOString().split('T')[0]}">
            </div>
            <div class="form-group">
                <label>Type d'exercice</label>
                <select name="exerciseType" required>
                    <option value="">Sélectionner</option>
                    ${exercises.map(e => `<option value="${e._id}">${e.name}</option>`).join('')}
                </select>
            </div>
            <div class="form-group">
                <label>Durée (minutes)</label>
                <input type="number" name="duration" min="1" placeholder="30">
            </div>
            <div class="form-group">
                <label>Répétitions</label>
                <input type="number" name="repetitions" min="1" placeholder="10">
            </div>
            <div class="form-group">
                <label>Poids (kg)</label>
                <input type="number" name="weight" step="0.5" min="0" placeholder="0">
            </div>
            <div class="form-group">
                <label>Calories brûlées</label>
                <input type="number" name="caloriesBurned" min="0" placeholder="100">
            </div>
            <div class="form-group">
                <label>Notes</label>
                <textarea name="notes" placeholder="Notes personnelles..."></textarea>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" onclick="closeModal()">Annuler</button>
                <button type="submit" class="btn btn-primary">Enregistrer</button>
            </div>
        </form>
    `);

    document.getElementById('create-training-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = {};
        
        // Construction propre des données - éviter les champs vides
        data.date = formData.get('date');
        data.exerciseType = formData.get('exerciseType');
        
        const duration = formData.get('duration');
        if (duration && duration.trim() !== '') data.duration = parseInt(duration);
        
        const reps = formData.get('repetitions');
        if (reps && reps.trim() !== '') data.repetitions = parseInt(reps);
        
        const weight = formData.get('weight');
        if (weight && weight.trim() !== '') data.weight = parseFloat(weight);
        
        const calories = formData.get('caloriesBurned');
        if (calories && calories.trim() !== '') data.caloriesBurned = parseInt(calories);
        
        const notes = formData.get('notes');
        if (notes && notes.trim() !== '') data.notes = notes.trim();

        try {
            await apiCall('/training/create', 'POST', data);
            closeModal();
            renderTrainingsPage();
            showSuccess('Entraînement enregistré !');
        } catch (error) { alert(error.message); }
    });
}

async function deleteTraining(id) {
    if (!confirm('Supprimer cet entraînement ?')) return;
    try {
        await apiCall(`/training/${id}`, 'DELETE');
        renderTrainingsPage();
        showSuccess('Entraînement supprimé');
    } catch (error) { alert(error.message); }
}

async function editTraining(id) {
    try {
        const training = await apiCall(`/training/${id}`);
        const exercises = cachedExerciseTypes.length ? cachedExerciseTypes : await apiCall('/exerciseType').catch(() => []);
        
        showModal('Modifier l\'entraînement', `
            <form id="edit-training-form">
                <div class="form-group">
                    <label>Date</label>
                    <input type="date" name="date" required value="${training.date?.split('T')[0] || ''}">
                </div>
                <div class="form-group">
                    <label>Type d'exercice</label>
                    <select name="exerciseType" required>
                        ${exercises.map(e => `<option value="${e._id}" ${e._id === training.exerciseType?._id ? 'selected' : ''}>${e.name}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label>Durée (minutes)</label>
                    <input type="number" name="duration" min="1" value="${training.duration || ''}">
                </div>
                <div class="form-group">
                    <label>Répétitions</label>
                    <input type="number" name="repetitions" min="1" value="${training.repetitions || ''}">
                </div>
                <div class="form-group">
                    <label>Poids (kg)</label>
                    <input type="number" name="weight" step="0.5" min="0" value="${training.weight || ''}">
                </div>
                <div class="form-group">
                    <label>Calories brûlées</label>
                    <input type="number" name="caloriesBurned" min="0" value="${training.caloriesBurned || ''}">
                </div>
                <div class="form-group">
                    <label>Notes</label>
                    <textarea name="notes">${training.notes || ''}</textarea>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" onclick="closeModal()">Annuler</button>
                    <button type="submit" class="btn btn-primary">Mettre à jour</button>
                </div>
            </form>
        `);

        document.getElementById('edit-training-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const data = {};
            
            data.date = formData.get('date');
            data.exerciseType = formData.get('exerciseType');
            
            const duration = formData.get('duration');
            if (duration && duration.trim() !== '') data.duration = parseInt(duration);
            
            const reps = formData.get('repetitions');
            if (reps && reps.trim() !== '') data.repetitions = parseInt(reps);
            
            const weight = formData.get('weight');
            if (weight && weight.trim() !== '') data.weight = parseFloat(weight);
            
            const calories = formData.get('caloriesBurned');
            if (calories && calories.trim() !== '') data.caloriesBurned = parseInt(calories);
            
            const notes = formData.get('notes');
            if (notes && notes.trim() !== '') data.notes = notes.trim();

            try {
                await apiCall(`/training/${id}`, 'PUT', data);
                closeModal();
                renderTrainingsPage();
                showSuccess('Entraînement mis à jour !');
            } catch (error) { alert(error.message); }
        });
    } catch (error) { alert(error.message); }
}

// ========== PAGE BADGES ==========
async function renderBadgesPage() {
    const content = document.getElementById('content-area');
    content.innerHTML = '<div class="loading"><div class="spinner"></div></div>';

    try {
        const [allBadges, userBadges] = await Promise.all([
            apiCall('/badge', 'GET', null, true),
            apiCall(`/badge/user/${currentUser.id}`, 'GET', null, true)
        ]);

        const earnedIds = new Set((userBadges || []).map(ub => ub.badge?._id || ub.badge));

        content.innerHTML = `
            <div class="page-header">
                <h2>Badges</h2>
                ${isAdmin() ? '<button class="btn btn-primary" onclick="showCreateBadgeModal()">+ Créer un badge</button>' : ''}
            </div>

            <div class="stats-grid">
                <div class="stat-card success">
                    <div class="stat-label">Badges obtenus</div>
                    <div class="stat-value">${(userBadges || []).length}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">Total disponible</div>
                    <div class="stat-value">${(allBadges || []).length}</div>
                </div>
            </div>

            <h3>Vos badges</h3>
            <div class="badges-grid">
                ${(userBadges || []).length === 0 ? '<p>Vous n\'avez pas encore de badges</p>' :
                (userBadges || []).map(ub => {
                    const badge = ub.badge || ub;
                    return `
                    <div class="badge-card earned rarity-${badge.rarity || 'common'}">
                        <div class="badge-icon">${badge.icon || '🏅'}</div>
                        <div class="badge-name">${badge.name}</div>
                        <div class="badge-desc">${badge.description || ''}</div>
                        <div class="badge-rarity">${badge.rarity || 'common'}</div>
                        <div class="badge-date">Obtenu le ${new Date(ub.earnedAt || ub.created_at).toLocaleDateString('fr-FR')}</div>
                    </div>
                `}).join('')}
            </div>

            <h3>Tous les badges</h3>
            <div class="badges-grid">
                ${(allBadges || []).length === 0 ? '<p>Aucun badge créé pour le moment</p>' :
                (allBadges || []).map(badge => `
                    <div class="badge-card ${earnedIds.has(badge._id) ? 'earned' : 'locked'} rarity-${badge.rarity || 'common'}">
                        <div class="badge-icon">${badge.icon || '🏅'}</div>
                        <div class="badge-name">${badge.name}</div>
                        <div class="badge-desc">${badge.description || ''}</div>
                        <div class="badge-rarity">${badge.rarity || 'common'}</div>
                        ${!earnedIds.has(badge._id) ? '<div class="badge-locked">🔒 Non obtenu</div>' : ''}
                        ${isAdmin() ? `
                            <div class="badge-actions">
                                <button class="btn btn-sm btn-secondary" onclick="editBadge('${badge._id}')">✏️</button>
                                <button class="btn btn-sm btn-danger" onclick="deleteBadge('${badge._id}')">🗑️</button>
                            </div>
                        ` : ''}
                    </div>
                `).join('')}
            </div>
        `;
    } catch (error) {
        content.innerHTML = `<div class="error-message">Impossible de charger les badges: ${error.message}</div>`;
    }
}

async function showCreateBadgeModal() {
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
                <label>Icône (emoji)</label>
                <input type="text" name="icon" value="🏅" maxlength="4">
            </div>
            <div class="form-group">
                <label>Rareté</label>
                <select name="rarity" required>
                    <option value="common">Commun</option>
                    <option value="rare">Rare</option>
                    <option value="epic">Épique</option>
                    <option value="legendary">Légendaire</option>
                </select>
            </div>
            <div class="form-group">
                <label>Points bonus</label>
                <input type="number" name="pointsBonus" value="10" min="0">
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" onclick="closeModal()">Annuler</button>
                <button type="submit" class="btn btn-primary">Créer</button>
            </div>
        </form>
    `);

    document.getElementById('create-badge-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const data = Object.fromEntries(new FormData(e.target));
        data.pointsBonus = parseInt(data.pointsBonus) || 0;
        try {
            await apiCall('/badge/create', 'POST', data);
            closeModal();
            renderBadgesPage();
            showSuccess('Badge créé !');
        } catch (error) { alert(error.message); }
    });
}

async function deleteBadge(id) {
    if (!confirm('Supprimer ce badge ?')) return;
    try {
        await apiCall(`/badge/${id}`, 'DELETE');
        renderBadgesPage();
        showSuccess('Badge supprimé');
    } catch (error) { alert(error.message); }
}

// ========== PAGE RÈGLES DE BADGES ==========
async function renderBadgeRulesPage() {
    if (!hasPermission('canManageBadgeRules')) {
        document.getElementById('content-area').innerHTML = '<div class="error-message">Accès non autorisé</div>';
        return;
    }

    const content = document.getElementById('content-area');
    content.innerHTML = '<div class="loading"><div class="spinner"></div></div>';

    try {
        const [rules, badges] = await Promise.all([
            apiCall('/badgeRule', 'GET', null, true),
            apiCall('/badge', 'GET', null, true)
        ]);

        const rulesList = rules || [];
        const badgesList = badges || [];

        content.innerHTML = `
            <div class="page-header">
                <h2>Règles d'attribution des badges</h2>
                <button class="btn btn-primary" onclick="showCreateBadgeRuleModal()">+ Nouvelle règle</button>
            </div>

            <div class="card">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Badge</th>
                            <th>Type de condition</th>
                            <th>Valeur requise</th>
                            <th>Actif</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rulesList.length === 0 ? '<tr><td colspan="5" class="text-center">Aucune règle créée</td></tr>' :
                        rulesList.map(rule => `
                            <tr>
                                <td>${rule.badge?.name || 'N/A'} ${rule.badge?.icon || ''}</td>
                                <td>${rule.conditionType}</td>
                                <td>${rule.conditionValue}</td>
                                <td><span class="badge ${rule.isActive ? 'badge-success' : 'badge-danger'}">${rule.isActive ? 'Oui' : 'Non'}</span></td>
                                <td>
                                    <button class="btn btn-sm btn-secondary" onclick="editBadgeRule('${rule._id}')">✏️</button>
                                    <button class="btn btn-sm btn-danger" onclick="deleteBadgeRule('${rule._id}')">🗑️</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;

        window.cachedBadges = badgesList;
    } catch (error) {
        content.innerHTML = `<div class="error-message">Impossible de charger les règles: ${error.message}</div>`;
    }
}

async function showCreateBadgeRuleModal() {
    const badges = window.cachedBadges || await apiCall('/badge', 'GET', null, true) || [];
    
    if (badges.length === 0) {
        showError('Vous devez d\'abord créer des badges avant de pouvoir créer des règles');
        return;
    }

    showModal('Nouvelle règle de badge', `
        <form id="create-rule-form">
            <div class="form-group">
                <label>Badge à attribuer</label>
                <select name="badge" required>
                    <option value="">Sélectionner</option>
                    ${badges.map(b => `<option value="${b._id}">${b.icon || ''} ${b.name}</option>`).join('')}
                </select>
            </div>
            <div class="form-group">
                <label>Type de condition</label>
                <select name="conditionType" required>
                    <option value="trainings_count">Nombre d'entraînements</option>
                    <option value="challenges_completed">Défis complétés</option>
                    <option value="total_duration">Durée totale (minutes)</option>
                    <option value="calories_burned">Calories brûlées</option>
                    <option value="streak_days">Jours consécutifs</option>
                </select>
            </div>
            <div class="form-group">
                <label>Valeur requise</label>
                <input type="number" name="conditionValue" required min="1">
            </div>
            <div class="form-group">
                <label><input type="checkbox" name="isActive" checked> Règle active</label>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" onclick="closeModal()">Annuler</button>
                <button type="submit" class="btn btn-primary">Créer</button>
            </div>
        </form>
    `);

    document.getElementById('create-rule-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = {
            badge: formData.get('badge'),
            conditionType: formData.get('conditionType'),
            conditionValue: parseInt(formData.get('conditionValue')),
            isActive: formData.has('isActive')
        };
        try {
            await apiCall('/badgeRule/create', 'POST', data);
            closeModal();
            renderBadgeRulesPage();
            showSuccess('Règle créée !');
        } catch (error) { alert(error.message); }
    });
}

async function deleteBadgeRule(id) {
    if (!confirm('Supprimer cette règle ?')) return;
    try {
        await apiCall(`/badgeRule/${id}`, 'DELETE');
        renderBadgeRulesPage();
        showSuccess('Règle supprimée');
    } catch (error) { alert(error.message); }
}

// ========== PAGE RÉCOMPENSES ==========
async function renderRewardsPage() {
    const content = document.getElementById('content-area');
    content.innerHTML = '<div class="loading"><div class="spinner"></div></div>';

    try {
        const [rewards, userRewards] = await Promise.all([
            apiCall('/reward', 'GET', null, true),
            apiCall(`/reward/user/${currentUser.id}`, 'GET', null, true)
        ]);

        const rewardsList = rewards || [];
        const userRewardsList = userRewards || [];
        const claimedIds = new Set(userRewardsList.map(ur => ur.reward?._id || ur.reward));

        content.innerHTML = `
            <div class="page-header">
                <h2>Récompenses</h2>
                ${isAdmin() ? '<button class="btn btn-primary" onclick="showCreateRewardModal()">+ Créer une récompense</button>' : ''}
            </div>

            <div class="stats-grid">
                <div class="stat-card success">
                    <div class="stat-label">Réclamées</div>
                    <div class="stat-value">${userRewardsList.length}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">Disponibles</div>
                    <div class="stat-value">${rewardsList.length}</div>
                </div>
            </div>

            <div class="rewards-grid">
                ${rewardsList.length === 0 ? '<p>Aucune récompense disponible pour le moment</p>' :
                rewardsList.map(reward => `
                    <div class="reward-card ${claimedIds.has(reward._id) ? 'claimed' : ''}">
                        <div class="reward-icon">${reward.icon || '🎁'}</div>
                        <div class="reward-name">${reward.name}</div>
                        <div class="reward-desc">${reward.description || ''}</div>
                        <div class="reward-cost">${reward.pointsCost || 0} points</div>
                        ${claimedIds.has(reward._id) ? 
                            '<span class="badge badge-success">Réclamée</span>' :
                            `<button class="btn btn-primary btn-sm" onclick="claimReward('${reward._id}')">Réclamer</button>`
                        }
                        ${isAdmin() ? `
                            <div class="reward-actions">
                                <button class="btn btn-sm btn-danger" onclick="deleteReward('${reward._id}')">🗑️</button>
                            </div>
                        ` : ''}
                    </div>
                `).join('')}
            </div>
        `;
    } catch (error) {
        content.innerHTML = `<div class="error-message">Impossible de charger les récompenses: ${error.message}</div>`;
    }
}

async function claimReward(id) {
    try {
        await apiCall(`/reward/${id}/claim`, 'POST');
        showSuccess('Récompense réclamée !');
        renderRewardsPage();
    } catch (error) { alert(error.message); }
}

async function showCreateRewardModal() {
    showModal('Créer une récompense', `
        <form id="create-reward-form">
            <div class="form-group">
                <label>Nom</label>
                <input type="text" name="name" required>
            </div>
            <div class="form-group">
                <label>Description</label>
                <textarea name="description" required></textarea>
            </div>
            <div class="form-group">
                <label>Icône (emoji)</label>
                <input type="text" name="icon" value="🎁" maxlength="4">
            </div>
            <div class="form-group">
                <label>Coût en points</label>
                <input type="number" name="pointsCost" required min="0" value="100">
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" onclick="closeModal()">Annuler</button>
                <button type="submit" class="btn btn-primary">Créer</button>
            </div>
        </form>
    `);

    document.getElementById('create-reward-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const data = Object.fromEntries(new FormData(e.target));
        data.pointsCost = parseInt(data.pointsCost);
        try {
            await apiCall('/reward/create', 'POST', data);
            closeModal();
            renderRewardsPage();
            showSuccess('Récompense créée !');
        } catch (error) { alert(error.message); }
    });
}

async function deleteReward(id) {
    if (!confirm('Supprimer cette récompense ?')) return;
    try {
        await apiCall(`/reward/${id}`, 'DELETE');
        renderRewardsPage();
        showSuccess('Récompense supprimée');
    } catch (error) { alert(error.message); }
}

// ========== PAGE CLASSEMENT ==========
async function renderScoresPage() {
    const content = document.getElementById('content-area');
    content.innerHTML = '<div class="loading"><div class="spinner"></div></div>';

    try {
        const leaderboard = await apiCall('/score/leaderboard', 'GET', null, true) || [];
        const userScore = await apiCall(`/score/user/${currentUser.id}`, 'GET', null, true);

        content.innerHTML = `
            <div class="page-header">
                <h2>Classement</h2>
            </div>

            ${userScore ? `
                <div class="card user-score-card">
                    <h3>Votre score</h3>
                    <div class="stats-grid">
                        <div class="stat-card">
                            <div class="stat-label">Points totaux</div>
                            <div class="stat-value">${userScore.totalPoints || 0}</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-label">Défis complétés</div>
                            <div class="stat-value">${userScore.challengesCompleted || 0}</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-label">Entraînements</div>
                            <div class="stat-value">${userScore.trainingsCount || 0}</div>
                        </div>
                    </div>
                </div>
            ` : '<div class="card"><p>Aucun score enregistré pour le moment. Complétez des défis pour gagner des points !</p></div>'}

            <div class="card">
                <h3>Top joueurs</h3>
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Rang</th>
                            <th>Joueur</th>
                            <th>Points</th>
                            <th>Défis</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${leaderboard.length === 0 ? '<tr><td colspan="4" class="text-center">Aucun classement disponible</td></tr>' :
                        leaderboard.map((entry, index) => `
                            <tr class="${entry.user?._id === currentUser.id ? 'highlight' : ''}">
                                <td>
                                    ${index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                                </td>
                                <td>${entry.user?.firstname || ''} ${entry.user?.lastname || ''}</td>
                                <td><strong>${entry.totalPoints || 0}</strong></td>
                                <td>${entry.challengesCompleted || 0}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    } catch (error) {
        content.innerHTML = `<div class="error-message">Impossible de charger le classement: ${error.message}</div>`;
    }
}

// ========== UTILITAIRES MODAUX ==========
function showModal(title, content) {
    const existingModal = document.querySelector('.modal-overlay');
    if (existingModal) existingModal.remove();

    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal">
            <div class="modal-header">
                <h3>${title}</h3>
                <button class="modal-close" onclick="closeModal()">&times;</button>
            </div>
            <div class="modal-content">
                ${content}
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });
}

function closeModal() {
    const modal = document.querySelector('.modal-overlay');
    if (modal) modal.remove();
}

function showSuccess(message) {
    showToast(message, 'success');
}

function showError(message) {
    showToast(message, 'error');
}

function showToast(message, type = 'info') {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ========== INITIALISATION ==========
document.addEventListener('DOMContentLoaded', () => {
    if (token && currentUser) {
        setupSidebarByRole();
        renderDashboard();
    } else {
        showLoginForm();
    }
});