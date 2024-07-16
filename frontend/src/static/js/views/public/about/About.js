export default function About() {
    const element = document.createElement('div');
    element.innerHTML = `
        <style>
            .about {
                font-family: Arial, sans-serif;
            }
        </style>
        <div class="about">
            <h1>About Page</h1>
        </div>
    `;
    return element;
}
