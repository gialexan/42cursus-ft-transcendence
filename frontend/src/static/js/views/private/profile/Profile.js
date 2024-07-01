// view/profile.js
// import { fetchApiData } from '/static/js/services/fetchData.js';

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
                    <form id="profileForm">
                        <div class="mb-3">
                            <label for="nickname" class="form-label">Nickname</label>
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
                        <div class="mb-3">
                            <label for="theme" class="form-label">Theme</label>
                            <select class="form-select" id="theme" required>
                                <option value="light" ${userInfo.theme === 'light' ? 'selected' : ''}>Light</option>
                                <option value="dark" ${userInfo.theme === 'dark' ? 'selected' : ''}>Dark</option>
                            </select>
                        </div>
                        <button type="submit" class="btn btn-primary">Save</button>
                    </form>
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

        return element;
    } catch (error) {
        console.error('Error fetching or rendering user profile:', error);
        return null;
    }
}
