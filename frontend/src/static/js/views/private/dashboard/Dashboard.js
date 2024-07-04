import { checkJWT } from '/static/js/services/checkJWT.js';
import { navigateTo } from '/static/js/Router.js';
import { connectWebSocketNotify } from '/static/js/services/events/clientNotification.js';

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
        window.location.href = 'http://localhost'; // Redirect to the login page
        return null;
    }
}

async function updatePlayersStatus(element) {
    const playersStatus = await fetchApiData('/api/players-status');

    // Parte do código onde você gera a lista de jogadores online/offline
    const playersHtml = playersStatus && playersStatus.players
        ? playersStatus.players.map(player => `
        <tr>
            <td>${player.nickname || player.username}</td>
            <td>${player.status_player ? 'Online' : 'Offline'}</td>
            <td>
                <button class="btn ${player.status_player ? 'btn-success' : 'btn-secondary'}" ${player.status_player ? '' : 'disabled'} onclick="handleFriendship('${player.user_uuid}')">Friendship</button>
                <button class="btn ${player.status_player ? 'btn-success' : 'btn-secondary'}" ${player.status_player ? '' : 'disabled'} onclick="handleGameparty('${player.user_uuid}')">Gameparty</button>
            </td>
        </tr>
    `).join('')
    : '<tr><td colspan="3">No players found</td></tr>';

    const playersTableBody = element.querySelector('#players-table-body');
    playersTableBody.innerHTML = playersHtml;
}

export default async function Dashboard() {
    if (!await checkJWT()) {
        return null; // Stop rendering if JWT is not valid
    }

    const element = document.createElement('div');
    const playerInfo = await fetchApiData('/api/player-info');

    // Verifique se o MFA está habilitado e se o token de validação do MFA não está no localStorage
    if (playerInfo && playerInfo.is_mfa_enabled && !localStorage.getItem('tokenMfaValid')) {
        navigateTo('/mfa');
        return null; // Não renderize o dashboard
    }

    const playerScore = await fetchApiData('/api/player-score');
    const playersStatus = await fetchApiData('/api/players-status');

    // Parte do código onde você gera a tabela de pontos
    const scoresHtml = playerScore && playerScore.scores
        ? playerScore.scores.map(score => `
            <tr>
                <th scope="row">${score.position}</th>
                <td>${score.player}</td>
                <td>${score.points}</td>
            </tr>
        `).join('')
        : '<tr><td colspan="3">No Score found</td></tr>';

    // Parte do código onde você gera a lista de jogadores online/offline
    const playersHtml = playersStatus && playersStatus.players
        ? playersStatus.players.map(player => `
            <tr>
                <td>${player.nickname || player.username}</td>
                <td>${player.status_player ? 'Online' : 'Offline'}</td>
                <td>
                    <button class="btn ${player.status_player ? 'btn-success' : 'btn-secondary'}" ${player.status_player ? '' : 'disabled'} onclick="handleFriendship('${player.user_uuid}')">Friendship</button>
                    <button class="btn ${player.status_player ? 'btn-success' : 'btn-secondary'}" ${player.status_player ? '' : 'disabled'} onclick="handleGameparty('${player.user_uuid}')">Gameparty</button>
                </td>
            </tr>
        `).join('')
        : '<tr><td colspan="3">No players found</td></tr>';

    console.log("Player Info:", playerInfo);
    console.log("Player Info Username:", playerInfo.username);
    console.log("Player Info User UUID:", playerInfo.user_uuid);

    element.innerHTML = `
        <!-- Navigation bar | Web component -->
        <div class="navbar navbar-expand-lg navbar-light bg-light">
            <div class="container-fluid">
                <span class="navbar-brand mb-0 h1">${playerInfo ? `Welcome, ${playerInfo.nickname}` : 'Welcome'}</span>
                <ul class="navbar-nav ms-auto mb-2 mb-lg-0">
                    <li class="nav-item">
                        <button type="button" class="btn btn-link nav-link" onclick="navigateToProfile()">Profile</button>
                    </li>
                </ul>
            </div>
        </div>

        <!-- Container to put elements on page -->
        <div class="container mt-3">
            <div class="row justify-content-between">
                <!-- Left column for Games -->
                <div class="col-md-6">
                    <div class="card">
                        <div class="card-header">Modos de jogar</div>
                        <div class="card-body">
                            <p>Está pronto para se divertir? No modo Han Solo, você encara a clássica batalha de Pong sozinho, onde a rapidez e a precisão são suas melhores aliadas. Ou, se prefere um desafio mais intenso, enfrente a Skynet e teste suas habilidades contra a IA. Prove que os humanos ainda são superiores e que as máquinas não podem nos dominar... ainda!</p>
                            <button type="button" class="btn btn-primary">Han Solo</button>
                            <button type="button" class="btn btn-secondary" onclick="window.location.href='/pong'">Contra a Skynet</button>
                        </div>
                    </div>
                    <div class="card mt-4">
                        <div class="card-header">Torneio online e Chat</div>
                        <div class="card-body">
                            <p>Desafie seus amigos em um torneio online e mostre quem é o melhor. Mostre suas habilidades e seja o primeiro do ranking.</p>
                            <button type="button" class="btn btn-primary">Torneio online</button>
                            <button type="button" class="btn btn-primary" id="openChat">Chat</button>
                        </div>
                    </div>
                </div>

                <!-- Right column for Players Status and Scoreboard -->
                <div class="col-md-6">
                    <div class="card">
                        <div class="card-header">Players Status</div>
                        <div class="card-body">
                            <table class="table">
                                <thead>
                                    <tr>
                                        <th scope="col">Player</th>
                                        <th scope="col">Status</th>
                                        <th scope="col">Actions</th>
                                    </tr>
                                </thead>
                                <tbody id="players-table-body">${playersHtml}</tbody>
                            </table>
                        </div>
                    </div>
                    <div class="card mt-4">
                        <div class="card-header">Score Points</div>
                        <div class="card-body">
                            <table class="table">
                                <thead>
                                    <tr>
                                        <th scope="col">Posição</th>
                                        <th scope="col">Jogador</th>
                                        <th scope="col">Pontos</th>
                                    </tr>
                                </thead>
                                <tbody>${scoresHtml}</tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Função para navegar para a página de perfil
    window.navigateToProfile = function() {
        navigateTo('/profile');
    };

    // Adicionar evento ao botão
    const openChat = element.querySelector('#openChat');
    openChat.addEventListener('click', () => {
        navigateTo('/chat');
    });

    // Atualizar a lista de jogadores a cada 30 segundos
    setInterval(() => updatePlayersStatus(element), 30000);

    // Conectar ao WebSocket de notificação
    if (playerInfo) {
        connectWebSocketNotify(playerInfo.user_uuid);
    }

    return element;
}

async function sendNotificationToEndpoint(userUuid, message) {
    const jwtToken = localStorage.getItem('jwtToken');

    try {
        const response = await fetch('http://localhost/api/notifications/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${jwtToken}`,
            },
            body: JSON.stringify({
                user_uuid: userUuid,
                message: message,
                link: "http://localhost:8000/game/join/" + userUuid
            }),
        });

        if (!response.ok) {
            throw new Error('Failed to send notification');
        }

        const responseData = await response.json();
        console.log('Notification sent successfully:', responseData);
    } catch (error) {
        console.error('Error sending notification:', error);
    }
}

// Funções de manipulação dos botões de friendship e gameparty
window.handleFriendship = function(userUuid) {
    console.log('Friendship with:', userUuid);
    sendNotificationToEndpoint(userUuid, 'Friendship request sent');
}

window.handleGameparty = function(userUuid) {
    console.log('Gameparty with:', userUuid);
    sendNotificationToEndpoint(userUuid, 'Gameparty invitation sent');
}
