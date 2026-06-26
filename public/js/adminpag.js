document.addEventListener('DOMContentLoaded', () => {
   
    const citasTable = document.querySelector('.admin-section tbody');
    const historialCitasTable = document.querySelector('#historialCitasTable tbody');
    const inventarioTable = document.getElementById('inventarioTable');
    const ventasTable = document.querySelector('.admin-section:last-child table tbody');
    

   
    function cargarCitasPendientes() {
        fetch('/api/citas/pendientes')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Error al cargar citas pendientes.');
                }
                return response.json();
            })
            .then(citas => {
                const tablaCitas = document.querySelector('.admin-section tbody'); // Asegúrate de que esta sea la tabla correcta.
                tablaCitas.innerHTML = '';
    
                citas.forEach(cita => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${cita.nombre}</td>
                        <td>${new Date(cita.fecha).toLocaleDateString()}</td>
                        <td>${cita.hora}</td>
                        <td>${cita.tipo_servicio}</td>
                        <td>
                            <button class="btn btn-success btn-aceptar" data-id="${cita.id}">Aceptar</button>
                            <button class="btn btn-danger btn-rechazar" data-id="${cita.id}">Rechazar</button>
                            <button class="btn btn-warning btn-sugerir-fecha" data-id="${cita.id}">Sugerir Nueva Fecha</button>
                        </td>
                    `;
                    tablaCitas.appendChild(row);
                });
    
                
                asignarEventosCitas();
            })
            .catch(error => console.error('Error al cargar citas pendientes:', error));
    }
    function asignarEventosCitas() {
        document.querySelectorAll('.btn-aceptar').forEach(button => {
            button.addEventListener('click', () => actualizarCita(button.dataset.id, 'aceptada'));
        });
    
        document.querySelectorAll('.btn-rechazar').forEach(button => {
            button.addEventListener('click', () => actualizarCita(button.dataset.id, 'rechazada'));
        });
    
        document.querySelectorAll('.btn-sugerir-fecha').forEach(button => {
            button.addEventListener('click', () => sugerirNuevaFecha(button.dataset.id));
        });
    }
    
    function actualizarCita(id, estado, nuevaFecha = null, nuevaHora = null) {
        fetch(`/api/citas/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ estado, nuevaFecha, nuevaHora }),
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Error al actualizar cita.');
                }
                return response.json();
            })
            .then(data => {
                alert(data.message);
                cargarCitasPendientes(); 
                cargarHistorialCitas(); 
            })
            .catch(error => console.error('Error al actualizar cita:', error));
    }
    
    
    function sugerirNuevaFecha(id) {
        const nuevaFecha = prompt('Ingrese la nueva fecha (YYYY-MM-DD):');
        const nuevaHora = prompt('Ingrese la nueva hora (HH:MM):');
    
        if (!nuevaFecha || !nuevaHora) {
            alert('Debe ingresar fecha y hora válidas.');
            return;
        }
    
        actualizarCita(id, 'fecha_sugerida', nuevaFecha, nuevaHora);
    }
    
    
    
    
    

    function mostrarCitasPendientes(citas) {
        citasTable.innerHTML = '';
        citas.forEach(cita => {
            const fila = document.createElement('tr');
            fila.innerHTML = `
                <td>${cita.nombre}</td>
                <td>${new Date(cita.fecha).toLocaleDateString()}</td>
                <td>${cita.hora}</td>
                <td>${cita.tipo_servicio}</td>
                <td>
                    <button class="btn btn-success btn-sm btn-aceptar" data-id="${cita.id}">Aceptar</button>
                    <button class="btn btn-danger btn-sm btn-rechazar" data-id="${cita.id}">Rechazar</button>
                </td>
            `;
            citasTable.appendChild(fila);
        });
    }

    citasTable.addEventListener('click', async (event) => {
        const button = event.target;
        if (!button.dataset.id) return;

        const id = button.dataset.id;
        const accion = button.classList.contains('btn-aceptar') ? 'aceptada' : 'rechazada';
        try {
            const response = await fetch(`/api/citas/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ estado: accion })
            });
            if (!response.ok) throw new Error('Error al actualizar cita.');
            cargarCitasPendientes();
            cargarHistorialCitas();
        } catch (error) {
            console.error(error);
        }
    });

    function cargarHistorialCitas() {
        fetch('/api/historial-citas')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Error al cargar historial de citas.');
                }
                return response.json();
            })
            .then(historial => {
                const tablaHistorial = document.querySelector('#historialCitasTable tbody');
                if (!tablaHistorial) {
                    console.error('No se encontró la tabla del historial de citas.');
                    return;
                }
                tablaHistorial.innerHTML = ''; 
    
                historial.forEach(cita => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${cita.cliente}</td>
                        <td>${new Date(cita.fecha).toLocaleDateString()}</td>
                        <td>${cita.hora}</td>
                        <td>${cita.servicio}</td>
                        <td>${cita.accion}</td>
                    `;
                    tablaHistorial.appendChild(row);
                });
            })
            .catch(error => console.error('Error al cargar historial de citas:', error));
    }
    
    
    

    function mostrarHistorialCitas(historial) {
        historialCitasTable.innerHTML = '';
        historial.forEach(cita => {
            const fila = document.createElement('tr');
            fila.innerHTML = `
                <td>${cita.cliente}</td>
                <td>${new Date(cita.fecha).toLocaleDateString()}</td>
                <td>${cita.hora}</td>
                <td>${cita.servicio}</td>
                <td>${cita.accion}</td>
            `;
            historialCitasTable.appendChild(fila);
        });
    }

  
    async function cargarInventario() {
        try {
            const response = await fetch('/api/inventario');
            if (!response.ok) throw new Error('Error al cargar inventario.');
            const inventario = await response.json();
            mostrarInventario(inventario);
        } catch (error) {
            console.error(error);
        }
    }
    const data = {
        producto: document.getElementById('producto').value,  
        cantidad: document.getElementById('cantidad').value,
        estado: document.getElementById('estado').value,
    };
    
    fetch('/api/inventario', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    })
    

    function mostrarInventario(productos) {
        inventarioTable.innerHTML = '';
        productos.forEach(producto => {
            const fila = document.createElement('tr');
            fila.innerHTML = `
                <td>${producto.nombre}</td>
                <td>${producto.cantidad}</td>
                <td>${producto.estado}</td>
                <td>
                    <button class="btn btn-danger btn-sm btn-eliminar" data-id="${producto.id}">Eliminar</button>
                </td>
            `;
            inventarioTable.appendChild(fila);
        });
    }

    document.querySelector('.btn-agregar-producto').addEventListener('click', async () => {
        const producto = document.getElementById('producto').value.trim(); 
        const cantidad = parseInt(document.getElementById('cantidad').value); 
        const estado = document.getElementById('estado').value; 
     
        if (!producto || isNaN(cantidad)) {
            alert('Por favor, completa todos los campos.');
            return;
        }
     
        console.log('Producto a enviar:', producto); 
     
        try {
            const response = await fetch('/api/inventario', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ producto, cantidad, estado }),
            });
     
            if (!response.ok) {
                throw new Error('Error al agregar producto.');
            }
     
            alert('Producto agregado correctamente.');
            cargarInventario(); 
        } catch (error) {
            console.error('Error al agregar producto:', error);
        }
    });
    
    
    
    
    inventarioTable.addEventListener('click', async (event) => {
        if (event.target.classList.contains('btn-eliminar')) {
            const id = event.target.dataset.id;
            try {
                const response = await fetch(`/api/inventario/${id}`, { method: 'DELETE' });
                if (!response.ok) throw new Error('Error al eliminar producto.');
                cargarInventario();
            } catch (error) {
                console.error(error);
            }
        }
    });


    async function cargarVentas() {
        try {
            const response = await fetch('/api/ventas');
            if (!response.ok) throw new Error('Error al cargar ventas.');
            const ventas = await response.json();
            mostrarVentas(ventas);
        } catch (error) {
            console.error(error);
        }
    }
    async function registrarVenta(servicio, monto) {
        try {
            const response = await fetch('/api/ventas', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ servicio, monto })
            });
            if (!response.ok) throw new Error('Error al registrar la venta.');
    
            alert('Venta registrada exitosamente.');
            cargarVentas(); 
        } catch (error) {
            console.error('Error al registrar la venta:', error);
        }
    }
    

    function mostrarVentas(ventas) {
        ventasTable.innerHTML = '';
        ventas.forEach(venta => {
            const fila = document.createElement('tr');
            fila.innerHTML = `
                <td>${venta.servicio}</td>
                <td>${venta.monto}</td>
                <td>${new Date(venta.fecha).toLocaleDateString()}</td>
            `;
            ventasTable.appendChild(fila);
        });
    }

    document.querySelector('.btn-agregar').addEventListener('click', async () => {
        const servicio = document.getElementById('servicio').value.trim();
        const monto = parseFloat(document.getElementById('monto').value);

        if (!servicio || isNaN(monto)) {
            alert('Completa todos los campos.');
            return;
        }

        try {
            const response = await fetch('/api/ventas', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ servicio, monto })
            });
            if (!response.ok) throw new Error('Error al registrar venta.');
            cargarVentas();
        } catch (error) {
            console.error(error);
        }
    });

    document.querySelector('.btn-generar-informe').addEventListener('click', async () => {
        try {
            const response = await fetch('/api/ventas');
            if (!response.ok) throw new Error('Error al generar informe.');
            const ventas = await response.json();
            generarGraficoVentas(ventas);
        } catch (error) {
            console.error(error);
        }
    });

    let ventasChart = null; 

    function generarGraficoVentas(data) {
        const ctx = document.getElementById('ventasPorServicioChart').getContext('2d');
    
        if (ventasChart) {
            ventasChart.destroy();
        }
    
        ventasChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.labels,
                datasets: [{
                    label: 'Monto de Ventas',
                    data: data.values,
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1,
                }],
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                    },
                },
            },
        });
    }
    
    cargarCitasPendientes();
    cargarHistorialCitas();
    cargarInventario();
    cargarVentas();
});
