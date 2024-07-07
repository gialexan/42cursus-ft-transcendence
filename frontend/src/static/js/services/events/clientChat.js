let socket;
let isConnected = false;

function connectWebSocketChat(uuid) {
    socket = new WebSocket(`wss://localhost/ws/chat/${uuid}/`);

    socket.onopen = function(e) {
        isConnected = true;
        console.log('Connection established with chat');
    };

    socket.onmessage = function(event) {
        const data = JSON.parse(event.data);
        const messageType = data.type;

        if (messageType === 'chat_message') {
            displayChatMessage(data.message);
        }
    };

    // socket.onclose = function(event) {
    //     isConnected = false;
    //     console.log('Connection closed');
    //     // Attempt to reconnect after a delay
    //     setTimeout(() => connectWebSocketChat(uuid), 5000);
    // };

    socket.onerror = function(error) {
        console.error(`WebSocket error: ${error.message}`);
    };
}

function sendChatMessage(message) {
    if (isConnected) {
        socket.send(JSON.stringify({
            'type': 'chat_message',
            'message': message
        }));
    } else {
        console.error('WebSocket is not connected');
    }
}

function displayChatMessage(message) {
    if (typeof window.displayChatMessage === 'function') {
        window.displayChatMessage(message);
    } else {
        console.log('Chat:', message); // Fallback para exibir no console
    }
}

function disconnectWebSocketChat() {
    if (socket) {
        socket.close();
        socket = null;
        console.log("WebSocket disconnected");
    }
}

export { connectWebSocketChat, sendChatMessage, disconnectWebSocketChat };
