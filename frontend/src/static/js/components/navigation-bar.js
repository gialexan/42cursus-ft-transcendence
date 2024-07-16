class NavigationBar extends HTMLElement {
    connectedCallback() {
        this.innerHTML = `
            <nav class="navbar navbar-expand-lg navbar-dark bg-dark">
                <div class="container-fluid">
                    <a class="navbar-brand text-white" href="#">Pong</a>
                    <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
                        <span class="navbar-toggler-icon"></span>
                    </button>
                    <div class="collapse navbar-collapse" id="navbarNav">
                        <ul class="navbar-nav ms-auto">
                            <li class="nav-item">
                                <a class="nav-link text-white" href="/">Página inicial</a>
                            </li>
                            <li class="nav-item">
                                <a class="nav-link text-white" href="/">Game</a>
                            </li>
                        </ul>
                    </div>
                </div>
            </nav>
        `;
    }
}

customElements.define('navigation-bar', NavigationBar);
