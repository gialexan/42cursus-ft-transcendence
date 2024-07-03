// static/js/services/events/clientNotification.js
let socket;
let isConnected = false;

function connectWebSocketNotify(username, userUuid) {
    socket = new WebSocket('ws://localhost:8000/ws/notifications/');

    socket.onopen = function(e) {
        isConnected = true;
        console.log('Connection established');

        // Enviar uma mensagem inicial com o username e UUID
        socket.send(JSON.stringify({
            'type': 'initialize',
            'username': username,
            'user_uuid': userUuid
        }));
    };

    socket.onmessage = function(event) {
        const data = JSON.parse(event.data);
        const messageType = data.type;

        if (messageType === 'notification') {
            displayNotification(data.notification);
        }
    };

    socket.onclose = function(event) {
        isConnected = false;
        console.log('Connection closed');
        // Attempt to reconnect after a delay
        setTimeout(() => connectWebSocketNotify(username, userUuid), 5000);
    };

    socket.onerror = function(error) {
        console.error(`WebSocket error: ${error.message}`);
    };
}

function displayNotification(notification) {
    alert(notification); // Você pode usar outra forma de exibição, como um modal ou um toast
}

export { connectWebSocketNotify, displayNotification };
