document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('registerForm');

    form.addEventListener('submit', async function (event) {
        event.preventDefault(); 

        const formData = new FormData(this);
        const data = Object.fromEntries(formData.entries());

        try {
          
            const response = await fetch('http://localhost:3000/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

           
            if (!response.ok) {
                const errorData = await response.json();
                alert(errorData.message || 'Error al registrar. Inténtalo nuevamente.');
                return;
            }

           
            const result = await response.json();
            alert(result.message || 'Registro exitoso');
            form.reset(); 
        } catch (error) {
            console.error('Error en la solicitud:', error);

           
            if (error.message === 'Failed to fetch') {
                alert('No se pudo conectar al servidor. Asegúrate de que el backend está corriendo.');
            } else {
                alert('Error en el servidor. Inténtalo de nuevo más tarde.');
            }
        }
    });
});
