import { connectWebSocketGame, sendKeyPressed } from '/static/js/services/events/clientGame.js';
import { navigateTo } from '/static/js/Router.js';

// Função para buscar dados da API
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
        navigateTo('/'); // Redirect to the login page
        return null;
    }
}

// Função para obter informações do jogador
async function getPlayerInfo(url) {
    const storedPlayerInfo = localStorage.getItem('playerInfo');
    if (storedPlayerInfo) {
        return JSON.parse(storedPlayerInfo);
    }

    const playerInfo = await fetchApiData(url);
    if (playerInfo) {
        localStorage.setItem('playerInfo', JSON.stringify(playerInfo));
    }
    return playerInfo;
}

// Função para exibir tecla pressionada no console
function logKeyPressed(playerInfo, event) {
    console.log(`Tecla pressionada: ${event.key}`);
    sendKeyPressed(playerInfo.user_uuid, event.key);
}

export default async function GameRoom(uuid) {
    const element = document.createElement('div');
    element.innerHTML = `
        <style>
            .about {
                font-family: Arial, sans-serif;
            }
        </style>
        <div class="about">
            <h1>Game Room: ${uuid}</h1>
        </div>
    `;

    // Conectar ao WebSocket quando a sala do jogo é carregada
    connectWebSocketGame(uuid);

    const playerInfo = await getPlayerInfo("http://localhost/api/player-info");

    if (playerInfo && playerInfo.user_uuid) {
        // Adiciona um listener ao documento para capturar eventos de tecla pressionada
        document.addEventListener('keydown', (event) => logKeyPressed(playerInfo, event));
    } else {
        console.error('User data is not available.');
    }

    return element;
}
