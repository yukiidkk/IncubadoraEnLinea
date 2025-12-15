// backend/server.js
const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { pool } = require("./config/database");

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Importar rutas
const registroRoutes = require("./routes/registroRoutes");
const loginRoutes = require("./routes/loginRoutes");
const rolRoutes = require("./routes/rolRoutes");
const proyectoRoutes = require("./routes/proyectoRoutes");
const gestionUsuariosRoutes = require("./routes/gestionUsuariosRoutes");
const tipo_eventoRoutes = require("./routes/tipo_eventoRoutes");
const eventosRoutes = require("./routes/eventosRoutes");
const seguimientoRoutes = require("./routes/seguimientoRoutes");
const tutoriasRoutes = require("./routes/tutoriasRoutes");



// Usar rutas
app.use("/api", registroRoutes);
app.use("/api", loginRoutes);
app.use("/api", rolRoutes);
app.use("/api", proyectoRoutes);
app.use("/api", gestionUsuariosRoutes);
app.use("/api", tipo_eventoRoutes);
app.use("/api", eventosRoutes);
app.use("/api/seguimiento", seguimientoRoutes);
app.use("/api/tutorias", tutoriasRoutes);

// Probar conexión
app.get("/test-db", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT NOW() AS fecha_actual");
    res.json({ success: true, fecha_actual: rows[0].fecha_actual });
  } catch (err) {
    console.error("Error en la conexión a MySQL:", err);
    res
      .status(500)
      .json({ success: false, message: "Error de conexión a MySQL" });
  }
});

console.log("Rutas montadas en /api y /api/seguimiento");

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Servidor backend corriendo en http://localhost:${PORT}`);
});
