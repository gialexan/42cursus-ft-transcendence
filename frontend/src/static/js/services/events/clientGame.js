async function createGameRoomAndInvite(userUuid, invitedUserUuid) {
    const jwtToken = localStorage.getItem('jwtToken');

    try {
        const response = await fetch('http://localhost:8000/api/game-room/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${jwtToken}`,
            },
            body: JSON.stringify({
                user_uuid: userUuid,
                invited_user_uuid: invitedUserUuid,
            }),
        });

        if (!response.ok) {
            throw new Error('Failed to create game room');
        }

        const responseData = await response.json();
        console.log('Game room created:', responseData);

        // Conecta o usuário à sala do jogo usando WebSocket
        connectWebSocketGame(responseData.game_uuid);

    } catch (error) {
        console.error('Error creating game room:', error);
    }
}

function connectWebSocketGame(gameUuid) {
    const socket = new WebSocket(`ws://localhost/ws/game/${gameUuid}/`);

    socket.onopen = function() {
        console.log('Connected to game room:', gameUuid);
    };

    socket.onmessage = function(event) {
        const data = JSON.parse(event.data);
        console.log('Game message received:', data);
    };

    socket.onclose = function() {
        console.log('Disconnected from game room:', gameUuid);
    };

    socket.onerror = function(error) {
        console.error('WebSocket error:', error);
    };
}

// Exemplo de uso da função
const userUuid = 'e94a55e0-65d6-4813-80a8-860f95b93362'; // UUID do usuário que está convidando
const invitedUserUuid = 'some-uuid-of-invited-user'; // UUID do usuário convidado
createGameRoomAndInvite(userUuid, invitedUserUuid);
