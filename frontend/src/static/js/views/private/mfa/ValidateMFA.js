import { navigateTo } from '/static/js/router.js';

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

// Função para solicitar a criação do MFA
function createMFA() {
    const myHeaders = new Headers();
    myHeaders.append("Cookie", document.cookie);

    const requestOptions = {
        method: "GET",
        headers: myHeaders,
        redirect: "follow",
        credentials: 'include'  // Inclui os cookies na requisição
    };

    fetch("http://localhost:80/authentication/create/", requestOptions)
        .then((response) => response.text())
        .then((result) => {
            document.querySelector('#createMessage').innerText = 'MFA criado. Por favor, insira o código.';
            document.querySelector('#mfaCode').style.display = 'block';
            document.querySelector('#validateButton').style.display = 'block';
        })
        .catch((error) => {
            console.error('Error:', error);
            document.querySelector('#createMessage').innerText = 'Erro ao criar o MFA';
        });
}

// Função para validar MFA
function validateMFA(mfaCode) {
    const myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");

    const raw = JSON.stringify({
        "mfa_code": mfaCode
    });

    const requestOptions = {
        method: "POST",
        headers: myHeaders,
        body: raw,
        redirect: "follow",
        credentials: 'include'  // Inclui os cookies na requisição
    };

    fetch("http://localhost:80/authentication/validate/", requestOptions)
        .then((response) => response.json())
        .then((result) => {
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
        })
        .catch((error) => {
            console.error('Error:', error);
            document.querySelector('#responseMessage').innerText = 'Erro ao validar o MFA';
        });
}
