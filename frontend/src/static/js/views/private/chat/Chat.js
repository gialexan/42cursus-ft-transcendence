import { connectWebSocketChat, sendChatMessage, disconnectWebSocketChat } from '/static/js/services/events/clientChat.js';
import { navigateTo } from '/static/js/Router.js';

async function fetchData(url, jwtToken) {
    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${jwtToken}`,
            },
        });

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('There has been a problem with your fetch operation:', error);
    }
}

export default function Chat() {
    const element = document.createElement('div');
    let userName = "anonymous";
    let userUuid = null;

    const jwtToken = localStorage.getItem('jwtToken');
    const url = '/api/player-info/';
    fetchData(url, jwtToken)
    .then(data => {
        userName = data["nickname"] ? data["nickname"] : data["username"];
        userUuid = data["user_uuid"];
        connectWebSocketChat(userUuid);  // Conectar o WebSocket com o UUID do usuário
    })
    .catch(error => {
        console.error('Error fetching data:', error);
        userName = "anonymous";
    });

    element.innerHTML = `
                            <!-- Navigation bar | Web component -->
                            <div class="navbar navbar-expand-lg navbar-light bg-light">
                                <div class="container-fluid">
                                    <img class="px-3" src="/static/images/logo-mini.svg" alt="Logo">
                                    <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
                                        <span class="navbar-toggler-icon"></span>
                                    </button>
                                    <div class="collapse navbar-collapse" id="navbarNav">
                                        <ul class="navbar-nav ms-auto mb-2 mb-lg-0">
                                            <li class="nav-item">
                                                <button type="button" class="btn btn-link nav-link" onclick="navigateToProfile()">Profile</button>
                                            </li>
                                            <li class="nav-item">
                                                <button class="btn btn-link nav-link" id="backToDashboard">Dashboard</button>
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                            <div class="container mt-3">
                                <div class="row">
                                    <div class="col-md-8 offset-md-2">
                                        <div class="card">
                                            <div class="card-header">Chat</div>
                                            <div class="card-body">
                                                <div id="chatMessages" class="mb-3" style="height: 300px; overflow-y: scroll;">
                                                    <!-- Chat messages will be appended here -->
                                                </div>
                                                <div class="input-group">
                                                    <input type="text" id="chatInput" class="form-control" placeholder="Type a message">
                                                    <button class="btn btn-primary" id="sendButton">Send</button>
                                                </div>

                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        `;

    const chatMessages = element.querySelector('#chatMessages');
    const chatInput = element.querySelector('#chatInput');
    const sendButton = element.querySelector('#sendButton');

    // Function to append message to chat
    function appendMessage(message) {
        const messageElement = document.createElement('div');
        messageElement.textContent = message;
        chatMessages.appendChild(messageElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // Event listener for send button
    sendButton.addEventListener('click', () => {
        const message = userName + ":" + chatInput.value.trim();
        if (message) {
            sendChatMessage(message);
            chatInput.value = '';
        }
    });

    // Event listener for back to dashboard button
    const backToDashboardButton = element.querySelector('#backToDashboard');
    backToDashboardButton.addEventListener('click', (event) => {
        disconnectWebSocketChat();
        event.preventDefault();
        navigateTo('/dashboard');
    });

    // Function to handle incoming messages
    window.displayChatMessage = (message) => {
        appendMessage(message);
    };

    return element;
}
