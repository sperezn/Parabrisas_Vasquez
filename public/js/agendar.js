document.addEventListener('DOMContentLoaded', function () {
    
    document.querySelectorAll('.form-control').forEach((input) => {
        input.addEventListener('focus', function () {
            this.style.borderColor = '#FFA500';
        });
        input.addEventListener('blur', function () {
            this.style.borderColor = '#ced4da';
        });
    });

    document.addEventListener('DOMContentLoaded', async function () {
        const dateInput = document.getElementById('fecha');
    
      
        async function bloquearDiasOcupados() {
            try {
                const response = await fetch('/api/dias-ocupados');
                if (!response.ok) throw new Error('Error al obtener días ocupados.');
    
                const diasOcupados = await response.json();
                dateInput.addEventListener('input', function () {
                    const selectedDate = this.value;
                    if (diasOcupados.includes(selectedDate)) {
                        alert('Este día está completamente ocupado. Por favor, selecciona otro.');
                        this.value = ''; 
                    }
                });
            } catch (error) {
                console.error('Error al bloquear días ocupados:', error);
            }
        }
    
        bloquearDiasOcupados();
    });
    
    
    const form = document.getElementById('form-agendar-cita');
    form.addEventListener('submit', async function (event) {
        event.preventDefault();

        let isValid = true;
        document.querySelectorAll('.form-control').forEach((input) => {
            if (!input.value.trim()) {
                isValid = false;
                showTemporaryError(input, 'Este campo es obligatorio.');
            }
        });

        if (!isValid) return;

        const formData = new FormData(this);
        const data = Object.fromEntries(formData.entries()); 

        try {

            const response = await fetch('/schedule', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            if (response.ok) {
                const mensajeExito = document.getElementById('mensaje-exito');
                mensajeExito.style.display = 'block';
                setTimeout(() => {
                    mensajeExito.style.display = 'none';
                }, 3000);

                this.reset(); 
            } else {
                alert('Error al agendar la cita. Inténtelo de nuevo.');
            }
        } catch (error) {
            console.error('Error en la solicitud:', error);
            alert('Error del servidor. Inténtelo de nuevo más tarde.');
        }
    });

    
    function showTemporaryError(input, message) {
        input.style.borderColor = 'red';
        const errorMsg = document.createElement('small');
        errorMsg.classList.add('text-danger');
        errorMsg.innerText = message;
        input.parentNode.appendChild(errorMsg);

        setTimeout(() => {
            errorMsg.remove();
            input.style.borderColor = '#ced4da';
        }, 3000);
    }

   
    async function cargarCitasExistentes() {
        try {
            const response = await fetch('/api/citas');
            if (response.ok) {
                const citas = await response.json();
                console.log('Citas cargadas:', citas); 
            } else {
                console.error('Error al cargar citas existentes');
            }
        } catch (error) {
            console.error('Error de red al cargar citas:', error);
        }
    }

   
    cargarCitasExistentes();
});
