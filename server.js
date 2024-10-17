require('dotenv').config();  // Cargar las variables del archivo .env
const mongoose = require('mongoose');
const express = require('express');
const shortid = require('shortid');
const path = require('path');

const app = express();

// Usar el puerto desde el archivo .env o el puerto 5000 por defecto
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Conexión con MongoDB utilizando la URI desde .env
const dbURI = process.env.MONGODB_URI;
mongoose.connect(dbURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('Connected to MongoDB');
}).catch((error) => {
  console.error('Failed to connect to MongoDB', error);
});

// Definición del esquema de URL
const urlSchema = new mongoose.Schema({
  originalUrl: String,
  shortUrl: String,
  shortCode: String
});

// Creación del modelo de URL
const Url = mongoose.model('Url', urlSchema);

// Endpoint para acortar URL
app.post('/shorten', async (req, res) => {
  const { originalUrl } = req.body;
  const shortCode = shortid.generate();
  // Generar la URL corta utilizando el protocolo y el host actual
  const shortUrl = `${req.protocol}://${req.get('host')}/${shortCode}`;

  const url = new Url({
    originalUrl,
    shortUrl,
    shortCode
  });

  try {
    await url.save();
    res.json({ shortUrl });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save the URL' });
  }
});

// Endpoint para redirigir la URL corta
app.get('/:shortCode', async (req, res) => {
  const { shortCode } = req.params;
  try {
    const url = await Url.findOne({ shortCode });
    if (url) {
      res.redirect(url.originalUrl);
    } else {
      res.status(404).json('URL not found');
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to find the URL' });
  }
});

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Server is running on http://${process.env.HOST}:${PORT}`);
});
