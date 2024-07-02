import { sendChatMessage } from '/static/js/services/events/client.js';

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

    const jwtToken = localStorage.getItem('jwtToken');
    const url = '/api/player-info/';
    fetchData(url, jwtToken)
    .then(data => {
        userName = data["nickname"] ? data["nickname"] : data["username"]
    })
    .catch(error => {
        console.error('Error fetching data:', error);
        userName = "anonymous"
    });

    element.innerHTML = `
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
            // appendMessage(`You: ${message}`);
            chatInput.value = '';
        }
    });

    // Function to handle incoming messages
    window.displayChatMessage = (message) => {
        appendMessage(message);
    };

    return element;
}
