import { navigateTo } from '/static/js/Router.js';


async function fetchApiLocal(url) {
    const jwtToken = localStorage.getItem('jwtToken');

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${jwtToken}`,
            },
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch data from ${url}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error fetching data:', error);
        localStorage.removeItem('jwtToken'); // Remove JWT if there's an API error
        window.location.href = 'http://localhost'; // Redirect to the login page
        return null;
    }
}

export default async function Profile() {
    const jwtToken = localStorage.getItem('jwtToken');

    try {
        // Função para buscar informações do usuário na API
        const userInfo = await fetchApiLocal('/api/player-info');

        // Elemento principal que será retornado
        const element = document.createElement('div');

        if (!userInfo) {
            // Mensagem de erro usando Bootstrap
            const errorAlert = `
                <div class="alert alert-danger" role="alert">
                    Error fetching user data. Please try again later.
                </div>
                <a href="/dashboard" class="btn btn-primary mt-3">Back to Dashboard</a>
            `;
            element.innerHTML = errorAlert;
        } else {
            // Função para renderizar o formulário de perfil
            const renderProfileForm = () => {
                // Formulário para editar informações do perfil
                const profileForm = `
                            <!-- Navigation bar | Web component -->
                            <div class="navbar navbar-expand-lg navbar-light bg-light">
                                <div class="container-fluid">
                                    <img class="px-3" src="/static/images/logo-mini.svg" alt="Logo">
                                    <span class="navbar-brand mb-0 h1">${userInfo ? `Olá, ${userInfo.nickname}` : 'Welcome'}</span>
                                    <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
                                        <span class="navbar-toggler-icon"></span>
                                    </button>
                                    <div class="collapse navbar-collapse" id="navbarNav">
                                        <ul class="navbar-nav ms-auto mb-2 mb-lg-0">
                                            <li class="nav-item">
                                                <button class="btn btn-link nav-link" id="backToDashboard">Painel</button>
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                <div class="container mt-3">
                    <div class="row justify-content-between">
                    <div class="card p-3">
                        <div class="card-header">Editar perfil</div>
                        <form id="profileForm">
                            <div class="mb-3">
                                <label for="nickname" class="form-label">Apelido</label>
                                <input type="text" class="form-control" id="nickname" value="${userInfo.nickname}" required>
                            </div>
                            <div class="mb-3">
                                <label for="username" class="form-label">Username</label>
                                <input type="text" class="form-control" id="username" value="${userInfo.username}" required>
                            </div>
                            <div class="mb-3">
                                <label for="email" class="form-label">Email</label>
                                <input type="text" class="form-control" id="email" value="${userInfo.email}" required>
                            </div>
                            <div class="mb-3 form-check">
                                <input type="checkbox" class="form-check-input" id="isMFAEnabled" ${userInfo.is_mfa_enabled ? 'checked' : ''}>
                                <label class="form-check-label" for="isMFAEnabled">Multi-Factor Authentication Enabled</label>
                            </div>
                            <button type="submit" class="btn btn-primary">Save</button>
                        </form>
                    </div>
                </div>

                `;

                element.innerHTML = profileForm;

                // Event listener para salvar alterações no perfil
                const profileFormElement = element.querySelector('#profileForm');
                profileFormElement.addEventListener('submit', async (event) => {
                    event.preventDefault();

                    const formData = {
                        nickname: document.getElementById('nickname').value,
                        username: document.getElementById('username').value,
                        email: document.getElementById('email').value,
                        is_mfa_enabled: document.getElementById('isMFAEnabled').checked,
                        theme: document.getElementById('theme').value,
                    };

                    try {
                        const response = await fetch('/api/update-profile/', {
                            method: 'POST',
                            headers: {
                                'Authorization': `Bearer ${jwtToken}`,
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify(formData),
                        });

                        if (!response.ok) {
                            throw new Error(`Failed to update user profile`);
                        }

                        const updatedUser = await response.json();

                        if (updatedUser) {
                            // Exibir mensagem de sucesso ou redirecionar para outra página
                            console.log('Profile updated successfully:', updatedUser);
                        } else {
                            // Tratar erro ao atualizar perfil
                            console.error('Failed to update profile');
                        }
                    } catch (error) {
                        console.error('Error updating user profile:', error);
                    }
                });
            };

            renderProfileForm(); // Chamar a função para renderizar o formulário
        }

        const backToDashboardButton = element.querySelector('#backToDashboard');
        backToDashboardButton.addEventListener('click', (event) => {
            navigateTo('/dashboard');
        });

        return element;
    } catch (error) {
        console.error('Error fetching or rendering user profile:', error);
        return null;
    }
}
