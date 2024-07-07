let socket;
let isConnected = false;

function connectWebSocketNotify(userUuid) {
    // Inicializa a conexão WebSocket com o servidor
    console.log("user uuid:", userUuid);
    socket = new WebSocket(`wss://localhost/ws/notifications/${userUuid}/`);

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
    console.log('Displaying notification:', notification); // Adicionando log para depuração

    // Cria um elemento de notificação
    const notificationElement = document.createElement('div');
    notificationElement.className = 'notification';

    // Adiciona a mensagem de notificação
    const messageElement = document.createElement('p');
    messageElement.innerText = notification.message || 'No message provided';
    notificationElement.appendChild(messageElement);

    // Adiciona o botão de ação se houver um link
    if (notification.link && typeof notification.link === 'string') {
        console.log('Adding button with link:', notification.link); // Adicionando log para depuração

        const buttonElement = document.createElement('button');
        buttonElement.innerText = 'Accept Invite';
        buttonElement.className = 'btn btn-primary';
        buttonElement.onclick = () => {
            window.location.href = notification.link;
        };
        notificationElement.appendChild(buttonElement);
    } else {
        console.log('No valid link provided:', notification.link); // Adicionando log para depuração
    }

    // Adiciona a notificação ao corpo do documento
    document.body.appendChild(notificationElement);

    // Remove a notificação após um período de tempo (opcional)
    setTimeout(() => {
        if (document.body.contains(notificationElement)) {
            document.body.removeChild(notificationElement);
        }
    }, 10000);
}

export { connectWebSocketNotify, displayNotification };
