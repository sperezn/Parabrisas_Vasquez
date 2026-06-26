const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const app = express();

app.use('/public', express.static(path.join(__dirname, 'public')));


app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

app.get('/servicios', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'servicios.html'));
});

app.get('/contacto', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'contacto.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'login.html'));
});

app.get('/agendar', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'servicios.html')); 
});

app.use(express.json());


mongoose.connect('mongodb://localhost/parabrisas_vasquez', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true
}).then(() => console.log('Conectado a la base de datos'))
  .catch(err => console.log(err));


app.use('/api/auth', require('./routes/auth'));


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor en ejecución en el puerto ${PORT}`);
});