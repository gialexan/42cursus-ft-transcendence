export async function checkJWT() {
    const jwtToken = localStorage.getItem('jwtToken');

    console.log("jwt:", jwtToken);

    if (!jwtToken) {
        console.log("No JWT token found, redirecting to login...");
        window.location.href = 'https://localhost'; // Ajuste a URL conforme necessário
        return false;
    }

    try {
        const response = await fetch('/api/validate-jwt/', {
            headers: {
                Authorization: `Bearer ${jwtToken}`,
            },
        });

        if (response.status === 200) {
            return true; // JWT válido, permite o acesso ao Dashboard
        } else {
            console.log("Invalid JWT token, clearing token and redirecting to login...");
            localStorage.removeItem('jwtToken');
            window.location.href = 'https://localhost'; // Ajuste a URL conforme necessário
            return false;
        }
    } catch (error) {
        console.error('Erro ao verificar JWT:', error);
        // Lógica para lidar com erros, como redirecionar para a tela de login
        localStorage.removeItem('jwtToken');
        window.location.href = 'https://localhost'; // Ajuste a URL conforme necessário
        return false;
    }
}
