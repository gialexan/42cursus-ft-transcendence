import AbstractView from "./AbstractView.js";

export class Profile extends AbstractView {
    constructor() {
        super();
        this.setTitle("Profile");
    }

    async getHtml() {
        return `<h1>Profile</h1>`
    }
}
