import { navigateTo } from '/static/js/Router.js'

export default function Register() {
    const element = document.createElement('div');
    element.innerHTML = `
        <div class="container d-flex flex-column align-content-center justify-content-center vh-100">
            <div class="card col-2-md w-100">
                <div class="row border-rounded justify-content-center m-5 w-50 mx-auto">
                    <div class="card-body justify-content-center align-items-center">
                        <img class="mx-auto d-block" src="static/images/logo-m.png" alt="">
                        <h2 class="card-title text-center">Register</h2>
                        <form id="registerForm">
                            <div class="mb-3">
                                <label for="username">Username</label>
                                <input type="text" class="form-control" style="background-color: transparent;" id="username" name="username" required>
                            </div>
                            <div class="mb-3">
                                <label for="email">Email</label>
                                <input type="email" class="form-control" style="background-color: transparent;" id="email" name="email" required>
                            </div>
                            <div class="mb-3">
                                <label for="password">Password</label>
                                <input type="password" class="form-control" style="background-color: transparent;" id="password" name="password" required>
                            </div>
                            <div class="mb-4 d-grid">
                                <button type="submit" class="btn btn-dark btn-block">Sign Up</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    `;

    element.querySelector('#registerForm').addEventListener('submit', async (event) => {
        event.preventDefault();

        const formData = new FormData(event.target);
        const username = formData.get('username');
        const email = formData.get('email');
        const password = formData.get('password');

        try {
            const response = await fetch('/api/register/', {
                method: 'POST',
                body: JSON.stringify({
                    username: username,
                    email: email,
                    password: password,
                }),
                headers: {
                    'Content-Type': 'application/json'
                },
            });

            if (!response.ok) {
                throw new Error('Failed to register');
            }

            const data = await response.json();
            console.log('Registration successful:', data);

            navigateTo('/dashboard');
        } catch (error) {
            console.error('Registration error:', error);
        }
    });

    return element;
}
