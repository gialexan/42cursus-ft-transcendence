import Home from './views/public/home/Home.js';
import About from './views/public/about/About.js';
import Register from './views/public/register/Register.js';
import Dashboard from './views/private/dashboard/Dashboard.js';
import Profile from './views/private/profile/Profile.js';
import Chat from './views/private/chat/Chat.js';
import Pong from './views/private/pong/Pong.js';
import ValidateMFA from './views/private/mfa/ValidateMFA.js';
import GameRoom from './views/private/gameRoom/GameRoom.js';

function getQueryParams() {
    const params = new URLSearchParams(window.location.search);
    return Object.fromEntries(params.entries());
}

export async function Router() {
    const root = document.getElementById('root');
    root.innerHTML = '';  // Clear the root element

    const path = window.location.pathname;
    const queryParams = getQueryParams();
    let component;

    switch (path) {
        case '/':
            component = Home();
            break;
        case '/register':
            component = Register();
            break;
        case '/about':
            component = About();
            break;
        case '/dashboard':
            component = await Dashboard();
            break;
        case '/mfa':
            component = await ValidateMFA();
            break;            
        case '/profile':
            component = await Profile();
            break;  
        case '/chat':
            component = await Chat();
            break;                       
        case '/pong':
            component = Pong();
            break;
        case '/game-room':
            const uuid = queryParams.uuid;
            component = await GameRoom(uuid); // Aguarde a resolução da função assíncrona
            break;            
        default:
            component = document.createElement('div');
            component.textContent = 'Page not found';
    }

    root.appendChild(component);
}

export function navigateTo(url) {
    history.pushState(null, null, url);
    Router();
}
