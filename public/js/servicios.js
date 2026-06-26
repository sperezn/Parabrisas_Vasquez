document.getElementById('tipo-vehiculo').addEventListener('change', function () {
    const tipoVehiculo = this.value;

    if (tipoVehiculo) {
        fetch(`https://www.carqueryapi.com/api/0.3/?cmd=getMakes`)
            .then(response => response.json())
            .then(data => {
                let marcaSelect = document.getElementById('marca');
                marcaSelect.disabled = false;
                marcaSelect.innerHTML = '<option value="">Seleccionar Marca</option>';

                data.Makes.forEach(make => {
                    marcaSelect.innerHTML += `<option value="${make.make_id}">${make.make_display}</option>`;
                });
            })
            .catch(error => console.error('Error al cargar marcas:', error));
    }
});


document.getElementById('marca').addEventListener('change', function () {
    const marca = this.value;

    if (marca) {
        fetch(`https://www.carqueryapi.com/api/0.3/?cmd=getModels&make=${marca}`)
            .then(response => response.json())
            .then(data => {
                let modeloSelect = document.getElementById('modelo');
                modeloSelect.disabled = false;
                modeloSelect.innerHTML = '<option value="">Seleccionar Modelo</option>';

                data.Models.forEach(model => {
                    modeloSelect.innerHTML += `<option value="${model.model_name}">${model.model_name}</option>`;
                });
            })
            .catch(error => console.error('Error al cargar modelos:', error));
    }
});

document.getElementById('medio-comunicacion').addEventListener('change', function () {
    const seleccion = this.value;
    const contactInfo = document.getElementById('contact-info');
    const infoInput = document.getElementById('info-input');


    contactInfo.style.display = 'block';

   
    if (seleccion === 'whatsapp') {
        infoInput.placeholder = 'Número de WhatsApp';
        infoInput.type = 'tel'; 
        infoInput.pattern = '[0-9]{9,15}';  
        infoInput.title = 'Debe ser un número de teléfono válido con entre 9 y 15 dígitos.';
    } else if (seleccion === 'correo') {
        infoInput.placeholder = 'Correo Electrónico';
        infoInput.type = 'email';  
        infoInput.pattern = '[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$';  
        infoInput.title = 'Debe ser un correo electrónico válido.';
    } else {
        
        contactInfo.style.display = 'none';
    }
});
