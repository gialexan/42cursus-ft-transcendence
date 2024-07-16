import { navigateTo } from '/static/js/Router.js';

export default function ValidateMFA() {
    const element = document.createElement('div');
    element.innerHTML = `
        <style>
            .mfa {
                font-family: Arial, sans-serif;
            }
            .mfa input[type="text"] {
                padding: 10px;
                font-size: 16px;
                width: 200px;
                margin-right: 10px;
            }
            .mfa button {
                padding: 10px;
                font-size: 16px;
            }
            .mfa .response {
                margin-top: 20px;
                font-size: 16px;
            }
        </style>
        <div class="mfa">
            <h1>Validate MFA</h1>
            <div id="createMessage" class="response">Criando MFA...</div>
            <input type="text" id="mfaCode" placeholder="Enter MFA Code" style="display:none;"/>
            <button id="validateButton" style="display:none;">Validate</button>
            <div class="response" id="responseMessage"></div>
        </div>
    `;

    // Solicitar a criação do MFA ao carregar a página
    createMFA();

    // Adicionar o evento de clique ao botão
    element.querySelector('#validateButton').addEventListener('click', function() {
        const mfaCode = element.querySelector('#mfaCode').value;
        validateMFA(mfaCode);
    });

    return element;
}

async function fetchApiData(url) {
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
        window.location.href = 'https://localhost'; // Redirect to the login page
        return null;
    }
}

// Função para solicitar a criação do MFA
async function createMFA() {
    const myHeaders = new Headers();
    myHeaders.append("Cookie", document.cookie);
    myHeaders.append("Content-Type", "application/json");

    try {
        const playerInfo = await fetchApiData('https://localhost/api/player-info');

        if (!playerInfo) {
            throw new Error('Player info not available');
        }

        const raw = JSON.stringify({
            "username": playerInfo.username
        });

        const requestOptions = {
            method: "POST",
            headers: myHeaders,
            body: raw,
            credentials: 'include'  // Inclui os cookies na requisição
        };

        const response = await fetch("https://localhost/authentication/create/", requestOptions);
        if (!response.ok) {
            throw new Error(`Failed to create MFA: ${response.statusText}`);
        }
        const result = await response.text();

        document.querySelector('#createMessage').innerText = 'MFA criado. Por favor, insira o código.';
        document.querySelector('#mfaCode').style.display = 'block';
        document.querySelector('#validateButton').style.display = 'block';
    } catch (error) {
        console.error('Error:', error);
        document.querySelector('#createMessage').innerText = 'Erro ao criar o MFA';
    }
}

// Função para validar MFA
async function validateMFA(mfaCode) {
    const myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");

    try {
        const playerInfo = await fetchApiData('https://localhost/api/player-info');

        if (!playerInfo) {
            throw new Error('Player info not available');
        }

        const raw = JSON.stringify({
            "mfa_code": mfaCode,
            "username": playerInfo.username
        });

        const requestOptions = {
            method: "POST",
            headers: myHeaders,
            body: raw,
            credentials: 'include'  // Inclui os cookies na requisição
        };

        const response = await fetch("https://localhost/authentication/validate/", requestOptions);
        const result = await response.json();

        if (result.status === 'success') {
            // Exibir pop-up de sucesso
            alert('MFA validado com sucesso!');

            // Salvar token no localStorage
            localStorage.setItem('tokenMfaValid', 'true');

            // Redirecionar para /dashboard
            navigateTo('/dashboard');
        } else {
            document.querySelector('#responseMessage').innerText = JSON.stringify(result);
        }
    } catch (error) {
        console.error('Error:', error);
        document.querySelector('#responseMessage').innerText = 'Erro ao validar o MFA';
    }
}
