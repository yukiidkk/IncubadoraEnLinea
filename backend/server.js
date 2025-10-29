const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

const registroRoutes = require("./routes/registroRoutes");
const loginRoutes = require("./routes/loginRoutes"); 
const rolRoutes = require("./routes/rolRoutes");
const proyectoRoutes = require("./routes/proyectoRoutes");

app.use("/api", registroRoutes);
app.use("/api", loginRoutes); 
app.use("/api", rolRoutes);
app.use("/api", proyectoRoutes);


// Prueba de conexión
const { pool } = require("./config/database");

app.get("/test-db", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT NOW() AS fecha_actual");
    res.json({ success: true, fecha_actual: rows[0].fecha_actual });
  } catch (err) {
    console.error("Error en la conexión a MySQL:", err);
    res.status(500).json({ success: false, message: "Error de conexión a MySQL" });
  }
});

// Puerto
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Servidor backend corriendo en http://localhost:${PORT}`);
});
