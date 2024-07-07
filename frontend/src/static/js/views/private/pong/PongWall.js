import { main as gameMain } from '/static/js/services/gameWall.js';
import { navigateTo } from '/static/js/Router.js';

export default function PongWall() {
    const element = document.createElement('div');
    element.innerHTML = `
                            <link href="https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;700&display=swap" rel="stylesheet">
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
                                                <button type="button" class="btn btn-link nav-link" onclick="navigateToProfile()">Perfil</button>
                                            </li>
                                            <li class="nav-item">
                                                <button class="btn btn-link nav-link" id="backToDashboard">Painel</button>
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                            <div class="container mt-3">
                                <div class="row justify-content-between">
                                <div class="card p-3">
                                    <div class="w-100 d-flex justify-content-center">
                                                    <canvas id="gameCanvas" class="w-100" width="800" height="800"></canvas>
                                                </div>
                                                <div class="d-flex justify-content-center mt-3 d-grid">
                                                    <button id="startButton" class="btn btn-primary btn-block">Start</button>
                                                </div>
                                </div>
                            </div>

                            <!-- Match over -->
                            <div class="modal fade" id="gameOverModal" tabindex="-1" aria-labelledby="gameOverModalLabel" aria-hidden="true">
                                <div class="modal-dialog">
                                    <div class="modal-content">
                                        <div class="modal-header">
                                            <h5 class="modal-title" id="gameOverModalLabel">The match is over!</h5>
                                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                                        </div>
                                        <div class="modal-body">
                                            Player 1 wins!
                                        </div>
                                        <div class="modal-footer">
                                            <button type="button" class="btn btn-primary" data-bs-dismiss="modal" id="endGameButton">End game</button>
                                            <button type="button" class="btn btn-info" data-bs-dismiss="modal" id="restartGameButton">Restart game</button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                        `;

    element.addEventListener('DOMNodeInserted', () => {
        document.getElementById('startButton').addEventListener('click', () => {
            gameMain();
        });
    });


    const backToDashboardButton = element.querySelector('#backToDashboard');
    backToDashboardButton.addEventListener('click', (event) => {
        navigateTo('/dashboard');
    });

    window.navigateToProfile = function() {
        navigateTo('/profile');
    };


    return element;
}
