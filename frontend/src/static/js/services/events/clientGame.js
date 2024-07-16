// clientGame.js
let socket = null;

export function connectWebSocketGame(gameUuid) {
    socket = new WebSocket(`wss://localhost/ws/game/${gameUuid}/`);

    socket.onopen = function() {
        console.log('Connected to game room:', gameUuid);
    };

    socket.onmessage = function(event) {
        const data = JSON.parse(event.data);
        console.log('Game message received:', data);

        if (data.type === 'game_report' && data.response.type === 'key_press') {
            const { player_uuid, key } = data.response;
            console.log(`Updating position for player ${player_uuid} with key ${key}`);
            updatePlayerPosition(player_uuid, key);
        }
    };

    socket.onclose = function() {
        console.log('Disconnected from game room:', gameUuid);
    };

    socket.onerror = function(error) {
        console.error('WebSocket error:', error);
    };

    return socket;
}

export function sendKeyPressed(player_uuid, key) {
    if (socket && socket.readyState === WebSocket.OPEN) {
        const eventObject = {
            "type": "key_press",
            "player_uuid": player_uuid,
            "key": key
        };
        const jsonstring = JSON.stringify(eventObject);
        socket.send(jsonstring);
    } else {
        console.error('WebSocket is not connected');
    }
}

function updatePlayerPosition(player_uuid, key) {
    const playerElement = document.getElementById(`player_${player_uuid}`);
    if (!playerElement) {
        console.error(`Element not found for player ${player_uuid}`);
        return;
    }

    const step = 5;
    let top = parseInt(playerElement.style.top || '0', 10);
    let left = parseInt(playerElement.style.left || '0', 10);

    switch (key) {
        case 'ArrowUp':
            top -= step;
            break;
        case 'ArrowDown':
            top += step;
            break;
        case 'ArrowLeft':
            left -= step;
            break;
        case 'ArrowRight':
            left += step;
            break;
        default:
            return;
    }

    playerElement.style.top = `${top}px`;
    playerElement.style.left = `${left}px`;

    console.log(`Updated position for player ${player_uuid}: top=${top}px, left=${left}px`);
}
