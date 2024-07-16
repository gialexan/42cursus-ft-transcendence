class ButtonBlock extends HTMLElement {
    connectedCallback() {
        this.classList.add('d-grid');
        this.innerHTML = `
            <button type="button" class="btn btn-primary btn-block">${this.getAttribute('text')}</button>
        `;
    }
}

customElements.define('button-block', ButtonBlock);
