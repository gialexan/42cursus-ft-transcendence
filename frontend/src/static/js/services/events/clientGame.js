let socket = null;

export function connectWebSocketGame(gameUuid) {
    socket = new WebSocket(`ws://localhost/ws/game/${gameUuid}/`);

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

    return socket;
}

export function sendKeyPressed(player_uuid, key) {
    if (socket && socket.readyState === WebSocket.OPEN) {
        const eventObject = {
            "type":"key_press",
            "player_uuid": player_uuid,
            "key": key
        };     
        const jsonstring = JSON.stringify(eventObject);      
        socket.send(jsonstring);
    } else {
        console.error('WebSocket is not connected');
    }
}
