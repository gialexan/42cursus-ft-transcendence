let socket;
let isConnected = false;

function connectWebSocketNotify(userUuid) {
    // Inicializa a conexão WebSocket com o servidor
    console.log("user uuid:", userUuid);
    socket = new WebSocket(`ws://localhost/ws/notifications/${userUuid}/`);


    socket.onopen = function(e) {
        isConnected = true;
        console.log('Connection established');
    };

    socket.onmessage = function(event) {
        const data = JSON.parse(event.data);
        const messageType = data.type;

        // Verifica o tipo de mensagem recebida
        if (messageType === 'notification') {
            displayNotification(data.notification);
        }
    };

    socket.onclose = function(event) {
        isConnected = false;
        console.log('Connection closed');
        // Tenta reconectar após um atraso de 5 segundos
        setTimeout(() => connectWebSocketNotify(userUuid), 5000);
    };

    socket.onerror = function(error) {
        console.error(`WebSocket error: ${error.message}`);
    };
}

function displayNotification(notification) {
    // Exibe a notificação recebida (pode ser personalizado)
    alert(notification);
}

export { connectWebSocketNotify, displayNotification };
