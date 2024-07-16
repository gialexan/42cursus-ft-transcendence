const jwtToken = localStorage.getItem('jwtToken');

export async function fetchApiData(url, options = {}) {
    try {
        const response = await fetch(url, {
            ...options,
            headers: {
                ...options.headers,
                'Authorization': `Bearer ${jwtToken}`,
                'Content-Type': 'application/json', // Definir Content-Type como JSON para POST
            },
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch data from ${url}`);
        }

        return response.json(); // Retornar os dados como JSON parseado
    } catch (error) {
        console.error('Error fetching data:', error);
        return null; // Retornar null ou lançar um erro apropriado conforme sua lógica de tratamento de erros
    }
}
