import { navigateTo } from '/static/js/Router.js'

export default function Home() {
    const element = document.createElement('div');
    element.innerHTML = `
        <div class="container d-flex flex-column align-content-center justify-content-center vh-100">
            <div class="card col-2-md w-100">
                <div class="row border-rounded justify-content-center m-5 w-50 mx-auto">
                    <div class="card-body justify-content-center align-items-center">
                        <img class="mx-auto d-block" src="static/images/logo-m.png" alt="">
                        <h2 class="card-title text-center" alt="The ultimate arcade Pong">The ultimate arcade PONG</h2>
                        <form id="loginForm">
                            <div class="mb-3">
                                <label for="username">Username</label>
                                <input type="text" class="form-control" style="background-color: transparent;" id="username" name="username" required>
                            </div>
                            <div class="mb-3">
                                <label for="password">Password</label>
                                <input type="password" class="form-control" style="background-color: transparent;" id="password" name="password" required>
                            </div>
                            <div class="mb-4 d-grid">
                                <button type="submit" class="btn btn-dark btn-block"><i class="fas fa-sign-in-alt"></i> Sign In</button>
                                <button id="signUpButton" type="button" class="btn btn-outline-dark btn-block mt-3">Sign Up</button>
                                <p class="text-center fs-5">or</p>
                                <button id="loginButton" type="button" class="btn btn-dark btn-block"><i class="fa fa-duotone fa-rocket"></i> Login 42</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    `;

    element.querySelector('#loginForm').addEventListener('submit', async (event) => {
        event.preventDefault();

        const formData = new FormData(event.target);
        const username = formData.get('username');
        const password = formData.get('password');

        try {
            const response = await fetch('/api/login-form/', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error('Failed to authenticate');
            }

            const data = await response.json();
            localStorage.setItem('jwtToken', data.token);
            navigateTo('/dashboard');
        } catch (error) {
            console.error('Authentication error:', error);
        }
    });

    const handleButtonLogin = () => {
        const authUrl = `https://api.intra.42.fr/oauth/authorize?client_id=u-s4t2ud-949c9204ce2bacc41d9143cdcb52e5152e57d57686ef9cad4cfbe996f15a106e&redirect_uri=http%3A%2F%2Flocalhost%3A80%2Fcallback&response_type=code`;
        window.location.href = authUrl;
    };

    element.querySelector('#loginButton').addEventListener('click', handleButtonLogin);
    element.querySelector('#signUpButton').addEventListener('click', () => navigateTo('/register'));

    return element;
}
