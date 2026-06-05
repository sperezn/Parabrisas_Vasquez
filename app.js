const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const path = require('path');
const db = require('./config/db');

const app = express();

// Middlewares básicos
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Configuración para servir archivos estáticos
app.use('/public', express.static(path.join(__dirname, 'public')));
app.use('/views', express.static(path.join(__dirname, 'views')));

// Ruta para manejar el login
app.post('/login', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'Usuario y contraseña son obligatorios.' });
    }

    const query = 'SELECT * FROM usuarios WHERE usuario = ? OR email = ?';
    db.query(query, [username, username], async (err, results) => {
        if (err) {
            console.error('Error al consultar la base de datos:', err);
            return res.status(500).json({ message: 'Error del servidor. Inténtelo más tarde.' });
        }

        if (results.length === 0) {
            return res.status(401).json({ message: 'Usuario o contraseña incorrectos.' });
        }

        const user = results[0];
        const passwordMatch = await bcrypt.compare(password, user.password);

        if (!passwordMatch) {
            return res.status(401).json({ message: 'Usuario o contraseña incorrectos.' });
        }

        const redirectUrl = user.role === 'admin' ? '/views/adminpag.html' : '/views/index.html';
        return res.status(200).json({ message: 'Inicio de sesión exitoso.', redirectUrl });
    });
});

// Ruta para registrar usuarios
app.post('/register', async (req, res) => {
    const { nombre, apellido, usuario, email, celular, password, role = 'cliente' } = req.body;

    if (!nombre || !apellido || !usuario || !email || !celular || !password) {
        return res.status(400).json({ message: 'Todos los campos son obligatorios.' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const query = 'INSERT INTO usuarios (nombre, apellido, usuario, email, celular, password, role) VALUES (?, ?, ?, ?, ?, ?, ?)';
        const values = [nombre, apellido, usuario, email, celular, hashedPassword, role];

        db.query(query, values, (err) => {
            if (err) {
                if (err.code === 'ER_DUP_ENTRY') {
                    return res.status(400).json({ message: 'El usuario o correo ya están registrados.' });
                }
                console.error('Error al registrar usuario en la base de datos:', err);
                return res.status(500).json({ message: 'Error al procesar la solicitud. Inténtelo de nuevo más tarde.' });
            }
            res.status(201).json({ message: 'Registro exitoso' });
        });
    } catch (error) {
        console.error('Error interno del servidor:', error);
        res.status(500).json({ message: 'Error en el servidor. Inténtelo de nuevo.' });
    }
});

// Ruta para registrar una cita
app.post('/schedule', (req, res) => {
    const { nombre, email, telefono, tipo_servicio, vidrio_daniado, tipo_vehiculo, marca, fecha, hora, descripcion } = req.body;

    if (!nombre || !email || !telefono || !tipo_servicio || !vidrio_daniado || !tipo_vehiculo || !marca || !fecha || !hora || !descripcion) {
        return res.status(400).json({ message: 'Todos los campos son obligatorios.' });
    }

    const query = `
        INSERT INTO citas (nombre, email, telefono, tipo_servicio, vidrio_daniado, tipo_vehiculo, marca, fecha, hora, descripcion)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const values = [nombre, email, telefono, tipo_servicio, vidrio_daniado, tipo_vehiculo, marca, fecha, hora, descripcion];

    db.query(query, values, (err) => {
        if (err) {
            console.error('Error al registrar la cita en la base de datos:', err);
            return res.status(500).json({ message: 'Error al registrar la cita. Inténtelo nuevamente.' });
        }
        res.status(201).json({ message: 'Cita registrada exitosamente.' });
    });
});

// Ruta para obtener todas las citas pendientes
app.get('/api/citas/pendientes', (req, res) => {
    const query = 'SELECT * FROM citas WHERE estado = "pendiente" ORDER BY fecha, hora';

    db.query(query, (err, results) => {
        if (err) {
            console.error('Error al obtener citas pendientes:', err);
            return res.status(500).json({ message: 'Error al obtener citas pendientes.' });
        }
        res.status(200).json(results);
    });
});

// Ruta para obtener el historial de citas
app.get('/api/historial-citas', (req, res) => {
    const query = `
        SELECT DISTINCT cliente, fecha, hora, servicio, accion 
        FROM historial_citas
        ORDER BY fecha DESC, hora DESC
    `;
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error al obtener historial de citas:', err);
            return res.status(500).json({ message: 'Error al obtener historial de citas.' });
        }
        res.status(200).json(results);
    });
});



app.post('/api/historial-citas', (req, res) => {
    const { cliente, fecha, hora, servicio, accion } = req.body;

    const query = 'INSERT INTO historial_citas (cliente, fecha, hora, servicio, accion) VALUES (?, ?, ?, ?, ?)';
    const values = [cliente, fecha, hora, servicio, accion];

    db.query(query, values, (err) => {
        if (err) {
            console.error('Error al agregar cita al historial:', err);
            return res.status(500).send('Error al agregar cita al historial');
        }
        res.status(201).json({ message: 'Cita agregada al historial exitosamente' });
    });
});





app.put('/api/citas/:id', (req, res) => {
    const { id } = req.params;
    const { estado, nuevaFecha, nuevaHora } = req.body;

    const query = `
        UPDATE citas
        SET estado = ?, fecha = COALESCE(?, fecha), hora = COALESCE(?, hora)
        WHERE id = ?
    `;
    const values = [estado, nuevaFecha, nuevaHora, id];

    db.query(query, values, (err) => {
        if (err) {
            console.error('Error al actualizar cita:', err);
            return res.status(500).json({ message: 'Error al actualizar la cita.' });
        }

        // Si el estado es aceptada, rechazada o fecha sugerida, mover al historial
        if (['aceptada', 'rechazada', 'fecha_sugerida'].includes(estado)) {
            const historialQuery = `
                INSERT INTO historial_citas (cliente, fecha, hora, servicio, accion)
                SELECT nombre, fecha, hora, tipo_servicio, ? FROM citas WHERE id = ?
            `;
            const historialValues = [estado, id];

            db.query(historialQuery, historialValues, (err) => {
                if (err) {
                    console.error('Error al registrar en el historial:', err);
                }
            });
        }

        res.status(200).json({ message: 'Cita actualizada correctamente.' });
    });
});



// Ruta para obtener días completamente ocupados
app.get('/api/dias-ocupados', (req, res) => {
    const query = `
        SELECT fecha, COUNT(*) AS total_citas
        FROM citas
        WHERE estado = "pendiente"
        GROUP BY fecha
        HAVING total_citas >= 8
    `;
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error al obtener días ocupados:', err);
            return res.status(500).json({ message: 'Error al obtener días ocupados.' });
        }

        const diasOcupados = results.map(row => row.fecha);
        res.status(200).json(diasOcupados);
    });
});

app.get('/api/inventario', (req, res) => {
    const query = 'SELECT * FROM inventario ORDER BY id DESC';

    db.query(query, (err, results) => {
        if (err) {
            console.error('Error al obtener inventario:', err);
            return res.status(500).json({ message: 'Error al obtener inventario.' });
        }
        res.status(200).json(results);
    });
});


app.post('/api/inventario', (req, res) => {
    const { producto, cantidad, estado } = req.body;

    console.log('Datos recibidos en el backend:', req.body); // Debug

    if (!producto || cantidad == null || !estado) {
        return res.status(400).json({ message: 'Todos los campos son obligatorios.' });
    }

    const query = 'INSERT INTO inventario (producto, cantidad, estado) VALUES (?, ?, ?)';
    const values = [producto, cantidad, estado];

    db.query(query, values, (err) => {
        if (err) {
            console.error('Error al agregar producto al inventario:', err);
            return res.status(500).json({ message: 'Error al agregar producto al inventario.' });
        }
        res.status(201).json({ message: 'Producto agregado al inventario exitosamente.' });
    });
});






app.delete('/api/inventario/:id', (req, res) => {
    const { id } = req.params;

    const query = 'DELETE FROM inventario WHERE id = ?';
    db.query(query, [id], (err) => {
        if (err) {
            console.error('Error al eliminar producto:', err);
            return res.status(500).json({ message: 'Error al eliminar producto.' });
        }
        res.status(200).json({ message: 'Producto eliminado exitosamente.' });
    });
});


// Actualizar producto del inventario
app.put('/api/inventario/:id', (req, res) => {
    const { id } = req.params;
    const { cantidad, estado } = req.body;

    if (cantidad == null || !estado) {
        return res.status(400).json({ message: 'Cantidad y estado son obligatorios.' });
    }

    const query = 'UPDATE inventario SET cantidad = ?, estado = ? WHERE id = ?';
    db.query(query, [cantidad, estado, id], (err) => {
        if (err) {
            console.error('Error al actualizar producto del inventario:', err);
            return res.status(500).json({ message: 'Error al actualizar producto del inventario.' });
        }
        res.status(200).json({ message: 'Producto actualizado correctamente.' });
    });
});

app.get('/api/ventas', (req, res) => {
    const query = 'SELECT * FROM ventas ORDER BY fecha DESC';

    db.query(query, (err, results) => {
        if (err) {
            console.error('Error al obtener ventas:', err);
            return res.status(500).json({ message: 'Error al obtener ventas.' });
        }
        res.status(200).json(results);
    });
});
app.post('/api/ventas', (req, res) => {
    const { servicio, monto } = req.body;

    if (!servicio || typeof monto !== 'number') {
        return res.status(400).json({ message: 'Datos inválidos o incompletos.' });
    }

    const query = 'INSERT INTO ventas (servicio, monto, fecha) VALUES (?, ?, NOW())';
    db.query(query, [servicio, monto], (err) => {
        if (err) {
            console.error('Error al registrar la venta:', err);
            return res.status(500).json({ message: 'Error al registrar la venta.' });
        }
        res.status(201).json({ message: 'Venta registrada exitosamente.' });
    });
});
app.get('/api/ventas', (req, res) => {
    const query = `
        SELECT servicio, SUM(monto) AS total
        FROM ventas
        GROUP BY servicio
        ORDER BY total DESC
    `;

    db.query(query, (err, results) => {
        if (err) {
            console.error('Error al generar gráfico de ventas:', err);
            return res.status(500).json({ message: 'Error al generar gráfico.' });
        }

        const labels = results.map(row => row.servicio);
        const values = results.map(row => row.total);

        res.status(200).json({ labels, values });
    });
});




// Rutas genéricas para servir vistas HTML
app.get('/views/:page', (req, res) => {
    const page = req.params.page;
    const filePath = path.join(__dirname, 'views', page);

    res.sendFile(filePath, (err) => {
        if (err) {
            console.error(`Error al servir la vista: ${filePath}`, err);
            res.status(404).send('Página no encontrada');
        }
    });
});

// Ruta para la página principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

// Manejador para rutas inexistentes (404)
app.use((req, res) => {
    res.status(404).send('Página no encontrada');
});

// Iniciar servidor
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
