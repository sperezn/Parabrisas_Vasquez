document.addEventListener('DOMContentLoaded', function () {
    const loginForm = document.getElementById('loginForm');

    if (loginForm) {
        loginForm.addEventListener('submit', async function (event) {
            event.preventDefault();

            const formData = new FormData(this);
            const data = Object.fromEntries(formData);

            try {
                const response = await fetch('/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });

                
                if (!response.ok) {
                    let errorText = 'Error en el servidor';
                    try {
                        const errorData = await response.json();
                        errorText = errorData.message || errorText;
                    } catch (err) {
                        console.error('No se pudo parsear el JSON de error:', err);
                    }
                    throw new Error(errorText);
                }

                const result = await response.json();

                
                if (result.redirectUrl) {
                    window.location.href = result.redirectUrl;
                } else {
                    throw new Error('URL de redirección no disponible');
                }

            } catch (error) {
                console.error('Error en el inicio de sesión:', error);

            
                let errorMessage = document.getElementById('errorMessage');
                if (!errorMessage) {
                    errorMessage = document.createElement('p');
                    errorMessage.id = 'errorMessage';
                    errorMessage.style.color = 'red';
                    loginForm.appendChild(errorMessage);
                }
                errorMessage.textContent = error.message;
                errorMessage.style.display = 'block';
            }
        });
    }
});
