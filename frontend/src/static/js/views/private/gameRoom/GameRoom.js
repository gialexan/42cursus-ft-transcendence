// GameRoom.js
import { connectWebSocketGame, sendKeyPressed } from '/static/js/services/events/clientGame.js';
import { navigateTo } from '/static/js/Router.js';

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
        localStorage.removeItem('jwtToken');
        navigateTo('/');
        return null;
    }
}

async function getGameRoomInfo(url) {
    const gameRoomInfo = await fetchApiData(url);
    return gameRoomInfo;
}

function logKeyPressed(playerInfo, event) {
    console.log(`Tecla pressionada: ${event.key}`);
    sendKeyPressed(playerInfo.user_uuid, event.key);
}

export default async function GameRoom(uuid) {
    const element = document.createElement('div');
    element.innerHTML = `
        <style>
            .about {
                font-family: Arial, sans-serif;
            }
            .player {
                position: absolute;
                width: 50px;
                height: 50px;
                background-color: red;
            }
        </style>
        <div class="about">
            <h1>Game Room: ${uuid}</h1>
            <div id="player_1" class="player" style="top: 0px; left: 0px;"></div>
            <div id="player_2" class="player" style="top: 0px; left: 60px;"></div>
            <div id="player_3" class="player" style="top: 0px; left: 120px;"></div>
            <div id="player_4" class="player" style="top: 0px; left: 180px;"></div>
        </div>
    `;

    document.body.appendChild(element);

    connectWebSocketGame(uuid);

    const gameRoomInfo = await getGameRoomInfo(`http://localhost/api/game-room-info/?game_uuid=${uuid}`);

    if (gameRoomInfo && gameRoomInfo.status === 'success') {
        const players = {
            player_1: gameRoomInfo.game_room.uuid_player_1,
            player_2: gameRoomInfo.game_room.uuid_player_2,
            player_3: gameRoomInfo.game_room.uuid_player_3,
            player_4: gameRoomInfo.game_room.uuid_player_4,
        };

        Object.keys(players).forEach((playerKey) => {
            const playerUUID = players[playerKey];
            if (playerUUID) {
                const playerElement = document.getElementById(playerKey);
                if (playerElement) {
                    playerElement.id = `player_${playerUUID}`;
                    console.log(`Updated element id for ${playerKey} to player_${playerUUID}`);
                }
            }
        });

        const playerInfo = await fetchApiData("http://localhost/api/player-info");

        if (playerInfo && playerInfo.user_uuid) {
            document.addEventListener('keydown', (event) => logKeyPressed(playerInfo, event));
        } else {
            console.error('User data is not available.');
        }
    } else {
        console.error('Game room data is not available.');
    }

    return element;
}
