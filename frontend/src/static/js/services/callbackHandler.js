import { navigateTo } from '/static/js/Router.js';

export function handleCallback() {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    console.log(`Authorization code: ${code}`);

    // 1. Primeiro pega o CODE

    const jwtLoginValid = async (code) => {
        try {
            // 2. Valida com o OAuth
            const response = await fetch('/api/validate-oauth-login/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ code: code }),
            });

            if (!response.ok) {
                throw new Error('Failed to validate OAuth login');
            }

            // 3. Validado, gera com o backend um JWT
            const data = await response.json();
            const jwtToken = data.token;

            // 4. Salva o JWT
            localStorage.setItem('jwtToken', jwtToken);

            // Retorna o JWT
            return jwtToken;
        } catch (error) {
            console.error('Error during OAuth login validation:', error);
            return null;
        }
    };

    // Valida o login OAuth usando o código capturado
    if (code) {
        jwtLoginValid(code).then(jwtToken => {
            if (jwtToken) {
                console.log('OAuth login successful, JWT:', jwtToken);
                // Vai para o dashboard
                navigateTo('/dashboard');
            } else {
                console.log('OAuth login failed');
                // Opcional: Redirecionar para a página de login ou exibir uma mensagem de erro
                navigateTo('/');
            }
        });
    } else {
        console.log('No OAuth code found in URL');
        // Opcional: Redirecionar para a página de login ou exibir uma mensagem de erro
        navigateTo('/');
    }
}
