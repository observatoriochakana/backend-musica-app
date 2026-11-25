const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3001;

// 1. Habilitar CORS
app.use(cors());

// 2. Crear automáticamente la carpeta "instrumentos" si no existe
const carpetaInstrumentos = path.join(__dirname, 'instrumentos');
if (!fs.existsSync(carpetaInstrumentos)) {
    fs.mkdirSync(carpetaInstrumentos);
}

// 3. Configurar Multer para guardar los archivos .sf2
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, carpetaInstrumentos);
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    }
});

const upload = multer({ 
    storage: storage,
    fileFilter: (req, file, cb) => {
        if (path.extname(file.originalname).toLowerCase() === '.sf2') {
            cb(null, true);
        } else {
            cb(new Error('Solo se permiten archivos .sf2'));
        }
    }
});

// 4. RUTA PARA SUBIR UN INSTRUMENTO
app.post('/subir-instrumento', upload.single('archivo'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No se subió ningún archivo' });
    }
    res.json({ 
        mensaje: 'Instrumento subido correctamente',
        archivo: req.file.filename
    });
});

// 5. RUTA PARA LISTAR LOS INSTRUMENTOS
app.get('/instrumentos', (req, res) => {
    fs.readdir(carpetaInstrumentos, (err, files) => {
        if (err) {
            return res.status(500).json({ error: 'Error al leer la carpeta' });
        }
        const sf2Files = files.filter(f => f.endsWith('.sf2'));
        res.json(sf2Files);
    });
});

// 6. RUTA PARA DESCARGAR UN INSTRUMENTO
app.get('/instrumentos/:nombre', (req, res) => {
    const filePath = path.join(carpetaInstrumentos, req.params.nombre);
    
    if (fs.existsSync(filePath)) {
        res.download(filePath, req.params.nombre, (err) => {
            if (err && !res.headersSent) {
                res.status(500).send('Error al descargar el archivo');
            }
        });
    } else {
        res.status(404).json({ error: 'Instrumento no encontrado' });
    }
});

// Iniciar el servidor
app.listen(PORT, () => {
    console.log(`Backend de instrumentos escuchando en http://localhost:${PORT}`);
});