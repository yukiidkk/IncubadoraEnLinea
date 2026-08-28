# IncubadoraEnLinea — Guía de BD, despliegue y mejoras

## 0. Antes que nada: rota la contraseña de la base de datos

El archivo `backend/.env` que subiste contiene, en texto plano:

```
DB_HOST=incubadoraenlineatec.mysql.database.azure.com
DB_USER=fercho
DB_PASSWORD=Ingenieriadesoftware25
DB_NAME=incubadora
JWT_SECRET=ingdesoftware
```

Esto es una credencial real de un servidor MySQL accesible por internet (Azure Database for MySQL). Independientemente de lo que hagamos en este chat, te recomiendo:

1. Entra al portal de Azure → tu servidor MySQL → cambia la contraseña del usuario `fercho` (o crea un usuario nuevo con menos privilegios y borra este).
2. Cambia también `JWT_SECRET` por un valor aleatorio largo (aunque ahora mismo no se está usando para firmar nada, ver bug #5).
3. Verifica el firewall de Azure MySQL: si tiene "Allow all IPs" o `0.0.0.0-255.255.255.255` abierto, restringe a las IPs que realmente necesitan conectarse (tu VM/hosting del backend).
4. Confirma que `.env` nunca se subió a un repositorio público de GitHub (el `.gitignore` sí lo excluye, lo cual es correcto, pero si en algún commit anterior se subió por error, sigue expuesto en el historial aunque lo borres ahora — habría que limpiar el historial con `git filter-repo` o similar).

No es algo que yo pueda hacer por ti, pero es la acción más urgente de todo lo que sigue.

---

## 1. La base de datos: qué encontré y qué te entrego

El repositorio **no tenía ningún archivo `.sql`**. El esquema solo existía implícito en las consultas de `backend/controladores/*.js`. Reconstruí la estructura completa leyendo cada `SELECT`, `INSERT`, `UPDATE` y `JOIN`, y te dejo `schema.sql` con:

- Las 12 tablas que el backend realmente usa: `rol`, `especialidad`, `persona`, `usuarios`, `proyecto`, `persona_has_proyecto`, `avances`, `tarea`, `eventos`, `tipos_eventos`, `persona_has_eventos`, `disponibilidad_tuto`, `tutoria`.
- Llaves foráneas e índices para las búsquedas `LIKE '%...%'` y `JOIN`s que vi repetidos en varios controladores (esas tablas no tenían ningún índice explícito, así que las búsquedas de usuarios/proyectos van a degradarse conforme crezcan los datos).
- Un `CHECK` para `progreso` (0–100) y para que `hora_fin > hora_inicio` en tutorías/disponibilidad, reforzando en la BD las validaciones que el backend ya hace en JS (defensa en profundidad).

**Cómo usarlo:**

- **Si vas a levantar un entorno nuevo (local o staging):** ejecuta `schema.sql` completo contra una BD vacía.
  ```bash
  mysql -h localhost -u root -p incubadora < schema.sql
  ```
- **Contra la BD real de Azure (que ya tiene datos):** NO lo ejecutes tal cual. Primero:
  ```bash
  mysqldump -h incubadoraenlineatec.mysql.database.azure.com -u fercho -p incubadora > backup_$(date +%F).sql
  ```
  Luego compara tabla por tabla (`DESCRIBE tabla;` en la BD real vs. el script) para confirmar que coincide, y solo aplica los `CREATE INDEX` que falten — esos sí son seguros de correr en cualquier momento.

---

## 2. Bugs encontrados (por severidad)

### Críticos (afectan seguridad o corrompen datos)

1. **Contraseñas en texto plano.** `loginController.js` compara `password !== user.contrasena` directamente, y `registrocontrolador.js` / `gestionUsuariosController.js` insertan `contrasena` sin cifrar. Cualquiera con acceso a la BD ve todas las contraseñas. Hay que usar `bcrypt` (ver sección 4).

2. **No hay autenticación ni autorización en las rutas.** Ninguna ruta (`/api/usuarios`, `/api/roles`, `/api/eliminarProyecto/:id`, etc.) valida quién hace la petición. Cualquiera que conozca la URL del backend puede, sin loguearse, borrar usuarios, cambiar roles o eliminar proyectos. El `JWT_SECRET` está definido en `.env` pero **nunca se usa** — el login no genera ningún token.

3. **Progreso del proyecto con tipo inconsistente.** `proyectoController.js` inserta `progreso` como el string `'0%'`, pero `reportesController.js::actualizarProgresoProyecto` lo trata como número (`progreso < 0 || progreso > 100`, y lo usa en un `CASE WHEN ? = 100`). Con el esquema nuevo (`progreso` como `TINYINT`), hay que corregir la línea de `crearProyecto` para insertar `0` en vez de `'0%'`, y mostrar el `%` solo en el frontend.

4. **SQL injection potencial en `LIKE`.** Los parámetros de búsqueda sí usan `?` parametrizado (bien), pero el patrón `%${valor}%` se concatena antes de pasarlo — eso está bien porque va como parámetro, no interpolado en el SQL. Sin embargo, en `gestionUsuariosController.js` y varios controladores **no hay ningún tipo de sanitización o límite de longitud** en los campos de texto libre (`descripcion`, `notas`, etc.), lo que permite payloads XML/HTML almacenados que luego se renderizan sin escapar en el frontend (XSS almacenado). Antes de insertar texto libre, sanitiza en el backend (p. ej. con `sanitize-html` o al menos escapando al renderizar en el frontend).

### Importantes (rompen funcionalidad)

5. **Endpoint duplicado y sombreado en `reportesRoutes.js`.**
   ```js
   router.get('/proyectos', reportesController.getReporteProyectos);
   // ...
   router.get("/proyectos", reportesController.getProyectosFiltrados); // nunca se ejecuta
   ```
   Express usa la primera coincidencia, así que `getProyectosFiltrados` (el filtro por nombre para el emprendedor) **jamás se ejecuta**. Hay que renombrar una de las dos rutas, por ejemplo `/proyectos/filtrar`.

6. **Desestructuración incorrecta de `query()`.** `config/database.js` ya devuelve el arreglo de filas directamente:
   ```js
   async function query(sql, params) {
     const [rows] = await pool.execute(sql, params);
     return rows; // ya es el arreglo
   }
   ```
   Pero en varios lugares se vuelve a desestructurar como si fuera `pool.query()`:
   - `reportesController.js::getProyectosCoordinador` → `const [proyectos] = await query(proyectosQuery);`
   - `reportesController.js::getProyectosFiltrados` → `const [rows] = await query(sql, [...]);`

   Esto toma solo la **primera fila** del resultado y la trata como si fuera todo el arreglo, rompiendo la respuesta cuando hay más de un proyecto. Quita el `[ ]` en ambos casos: `const proyectos = await query(...)`.

7. **Frontend apunta a un endpoint que no existe.** `backend/proyectosAPI.js` (que no está enrutado, parece código muerto o de un refactor a medias) llama a `${BASE}/admin/proyectos/${id}/avances`, pero la ruta real registrada es `GET /api/reportes/emprendedor/proyectos/:id/avances`. Si algún HTML lo importa, esa llamada fallará con 404.

8. **Rutas duplicadas de inscripción a eventos, sin montar una de las dos.** Existen `eventosControlador.js::inscribirPersonaAEvento` (montado en `/api/inscripciones` vía `eventosRoutes.js`) e `inscripcioneventoControlador.js::inscribir` (una ruta casi idéntica, pero en `inscripcioneventoRoutes.js`, que **no está importado en `server.js`**). Es lógica duplicada y una de las dos nunca se usa: bórrala para no confundir a futuro (a ti o a quien siga el proyecto).

9. **Controladores/archivos vacíos referenciados.** `gestionInscripcionesController.js` y `gestionInscripcionesRoutes.js` están vacíos — parecen un módulo a medio empezar. Si no vas a completarlo, bórralo; si sí, complétalo antes de la entrega.

10. **Error de sintaxis peligroso (comentario dentro de un template string SQL).** En `tutoriasControlador.js::actualizarTutoria`:
    ```js
    `SELECT * FROM tutoria
     WHERE id_tutor = ? AND fecha = ? AND id_tutoria != ? // <-- comentario JS dentro del SQL
       AND NOT (hora_fin <= ? OR hora_inicio >= ?)`,
    ```
    El `//` es un comentario de JavaScript, pero como está **dentro de un template string**, se envía literalmente como parte del SQL a MySQL. MySQL interpreta `//` como parte de la sintaxis solo en algunos contextos (delimitadores), así que aquí probablemente no rompe la query hoy, pero es frágil y confuso — bórralo, no pertenece ahí.

### Menores (limpieza)

11. Falta un `npm start` en `backend/package.json` (solo tiene el script `test` por defecto). Agrega:
    ```json
    "scripts": {
      "start": "node server.js",
      "dev": "node --watch server.js"
    }
    ```
12. Hay dos `node_modules` (uno en la raíz del proyecto, con `exceljs`, `archiver`, `unzipper`, etc., y otro en `backend/`). El de la raíz no corresponde a ningún `package.json` de un frontend con build — probablemente quedó de una prueba. Bórralo y deja un único `package.json` por proyecto (raíz para nada, o defínelo si el frontend algún día usa un bundler).
13. La ruta `GET /inscripciones/evento/:id_evento` está registrada **dos veces** en `eventosRoutes.js` (líneas duplicadas, inofensivo pero desordenado).

---

## 3. Cómo desplegarlo paso a paso

### 3.1 Backend (Node + Express + MySQL)

**Local:**
```bash
cd backend
npm install
# copia .env (rota la contraseña primero, ver sección 0)
npm run start   # después de agregar el script (punto 11)
# o, si no lo agregas: node server.js
curl http://localhost:3001/test-db   # debe responder { success: true, fecha_actual: ... }
```

**Producción — dos rutas razonables para un proyecto académico/real:**

- **Opción simple (recomendada para empezar): Render o Railway.**
  1. Sube el backend a un repo de GitHub (sin el `.env`, ya está en `.gitignore`).
  2. En Render/Railway, crea un "Web Service" apuntando a la carpeta `backend/`.
  3. Configura las variables de entorno (`DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_PORT`, `JWT_SECRET`) directamente en el panel del servicio, **no en un archivo**.
  4. Comando de arranque: `node server.js`.
  5. Verifica que el firewall de tu Azure MySQL permita la IP saliente de Render/Railway (o usa "Allow access to Azure services" si tu MySQL está en Azure y el backend también).

- **Opción robusta (si ya usas Azure para la BD): Azure App Service.**
  1. `az webapp up` desde la carpeta `backend/` con Node 18+ como runtime.
  2. Configura las variables de entorno en "Configuration → Application settings" del App Service (mismo criterio: nunca subir `.env`).
  3. Como el App Service y el MySQL están en la misma nube, puedes usar VNET integration o Private Link para no exponer el MySQL a internet público — hoy tu BD tiene una IP pública alcanzable desde cualquier lugar, lo cual es el mayor riesgo de seguridad del proyecto.

### 3.2 Frontend (HTML/CSS/JS estático)

El problema principal: **cada uno de los ~19 archivos HTML tiene la URL `http://localhost:3001/api...` hardcodeada**. Antes de desplegar, esto tiene que resolverse o el frontend en producción seguirá intentando llamar a tu máquina local.

**Solución recomendada — un solo archivo de configuración:**

Crea `js/config.js`:
```js
// js/config.js
const API_BASE_URL = window.location.hostname === "localhost"
  ? "http://localhost:3001/api"
  : "https://tu-backend-en-produccion.com/api";
```

Y en cada HTML, antes del script que hace los `fetch`, agrega:
```html
<script src="js/config.js"></script>
```

Luego reemplaza cada `http://localhost:3001/api...` por `${API_BASE_URL}...` en los scripts inline de cada página. Es un cambio mecánico pero tienes que tocar los ~19 archivos — puedo ayudarte a hacerlo automáticamente si quieres, dime y lo dejo listo.

**Dónde alojar el frontend estático:**
- Azure Static Web Apps, Netlify o GitHub Pages funcionan directo con HTML/CSS/JS puro, sin build. Solo asegúrate de que `CORS` en el backend (`app.use(cors())` en `server.js`) esté restringido al dominio real del frontend en producción, en vez de aceptar cualquier origen (`cors()` sin opciones permite *):
  ```js
  app.use(cors({ origin: "https://tu-frontend-en-produccion.com" }));
  ```

---

## 4. Recomendaciones para llevarlo a un entorno real (más allá de lo académico)

1. **Hashear contraseñas con bcrypt.**
   ```bash
   npm install bcrypt
   ```
   Al registrar/crear usuario: `const hash = await bcrypt.hash(password, 10);` — guarda `hash` en vez de la contraseña plana. Al hacer login: `await bcrypt.compare(password, user.contrasena)`.

2. **Emitir y validar JWT.** Ya tienes `JWT_SECRET` en `.env` sin usar. En el login, tras validar credenciales:
   ```js
   const token = jwt.sign({ id_usuario, id_rol }, process.env.JWT_SECRET, { expiresIn: "8h" });
   ```
   Y crea un middleware `verificarToken` que proteja las rutas de escritura/borrado (`crearUsuario`, `eliminarProyecto`, `crearRol`, etc.), verificando también el `id_rol` para las rutas exclusivas de coordinador/admin.

3. **Mover el archivo de registro (`formato_registro`) fuera de la BD.** Guardar binarios en MySQL funciona pero no escala: cada backup, cada réplica y cada consulta que toque esa tabla carga con archivos pesados. Súbelo a Azure Blob Storage (o S3) y guarda solo la URL en la columna.

4. **Migraciones versionadas en vez de un solo `schema.sql`.** Para un proyecto que va a evolucionar, usa algo como `knex` o `sequelize-cli` con migraciones, así los cambios de esquema quedan versionados junto con el código y no dependen de que alguien recuerde qué `ALTER TABLE` corrió manualmente.

5. **Logging y monitoreo real.** Ahora mismo el manejo de errores es `console.error(e)` seguido de un 500 genérico. Para producción, considera `winston` o `pino` para logs estructurados, y algo como Sentry para capturar excepciones con contexto.

6. **Rate limiting en rutas sensibles** (`/login`, `/registro`) con `express-rate-limit`, para mitigar fuerza bruta ahora que no hay bloqueo de intentos.

7. **Variables de entorno documentadas.** Agrega `backend/.env.example` (sin valores reales) para que cualquiera que clone el repo sepa qué variables necesita configurar, sin exponer las reales.

8. **Revisar el diseño `persona.id_rol` vs `usuarios.id_rol`.** Tener el rol duplicado en dos tablas es una fuente de bugs (¿cuál es la fuente de verdad si algún día se desincronizan?). Lo dejé en el esquema porque el código actual los usa a ambos, pero a mediano plazo conviene quitarlo de `persona` y dejarlo solo en `usuarios`.

---

## 5. Orden sugerido de trabajo

1. Rota la contraseña de MySQL y el `JWT_SECRET` (sección 0) — hoy mismo.
2. Aplica los bugs #5 y #6 (rutas y desestructuración) — son los que están rompiendo funcionalidad ahora mismo, no solo seguridad.
3. Corre `schema.sql` en un entorno de prueba y verifica que coincide con la BD real de Azure.
4. Implementa bcrypt + JWT (sección 4, puntos 1–2) — es lo mínimo indispensable antes de que esto sea usado por gente real.
5. Centraliza la URL del API en el frontend (sección 3.2) para poder desplegar sin depender de `localhost`.
6. Despliega backend y frontend en los servicios que elijas.
7. El resto de las recomendaciones (blob storage, migraciones, logging, rate limiting) son mejoras incrementales que puedes ir metiendo después de tener la primera versión en producción funcionando.