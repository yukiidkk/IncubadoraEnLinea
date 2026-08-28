-- ============================================================
-- IncubadoraEnLinea - Esquema de Base de Datos (MySQL 8.x)
-- Reconstruido a partir de las consultas SQL usadas en:
--   backend/controladores/*.js
-- No existía ningún archivo .sql en el repositorio original,
-- así que este script documenta y recrea la estructura real
-- que el backend espera encontrar en la BD.
--
-- IMPORTANTE: la BD de Azure (incubadoraenlineatec.mysql.database.azure.com)
-- YA TIENE datos reales. No ejecutes este script completo contra ella
-- sin antes hacer un respaldo (mysqldump). Úsalo para:
--   1) Levantar un entorno local/staging idéntico.
--   2) Comparar contra la BD real y detectar diferencias.
-- ============================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

CREATE DATABASE IF NOT EXISTS incubadora
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE incubadora;

-- ------------------------------------------------------------
-- Catálogos base
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS rol (
  id_rol      INT AUTO_INCREMENT PRIMARY KEY,
  nombre_rol  VARCHAR(30) NOT NULL UNIQUE,
  permisos    VARCHAR(255) NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS especialidad (
  id_especialidad     INT AUTO_INCREMENT PRIMARY KEY,
  nombre_especialidad VARCHAR(100) NOT NULL UNIQUE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS tipos_eventos (
  id_tipos_eve     INT AUTO_INCREMENT PRIMARY KEY,
  nombre_tipo_eve  VARCHAR(100) NOT NULL UNIQUE
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- Personas y usuarios
-- NOTA DE DISEÑO: persona.id_rol duplica usuarios.id_rol.
-- Se conserva porque el código actual lo usa en ambos lados
-- (registrocontrolador.js inserta id_rol en persona Y en usuarios).
-- Recomendación a futuro: quitarlo de persona y dejar el rol
-- únicamente en usuarios (ver GUIA_DESPLIEGUE_Y_MEJORAS.md).
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS persona (
  id_persona        INT AUTO_INCREMENT PRIMARY KEY,
  id_especialidad   INT NULL,
  id_rol            INT NULL,
  nombre            VARCHAR(100) NOT NULL,
  apellido          VARCHAR(100) NOT NULL,
  telefono          VARCHAR(20)  NULL,
  fecha_nacimiento  DATE NULL,
  correo            VARCHAR(150) NOT NULL UNIQUE,
  ingresos          DECIMAL(10,2) NULL,
  dependientes_eco  INT NULL,
  rfc               VARCHAR(13) NULL,
  curp              VARCHAR(18) NULL,
  estado_civil      VARCHAR(30) NULL,
  genero            VARCHAR(30) NULL,
  colonia           VARCHAR(100) NULL,
  cp                VARCHAR(10) NULL,
  calle             VARCHAR(150) NULL,
  jornada           VARCHAR(30) NULL,
  no_control        VARCHAR(20) NULL,
  fecha_registro    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_persona_especialidad FOREIGN KEY (id_especialidad)
    REFERENCES especialidad(id_especialidad) ON DELETE SET NULL,
  CONSTRAINT fk_persona_rol FOREIGN KEY (id_rol)
    REFERENCES rol(id_rol) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS usuarios (
  id_usuario       INT AUTO_INCREMENT PRIMARY KEY,
  id_persona       INT NOT NULL,
  id_rol           INT NOT NULL,
  id_especialidad  INT NULL,
  -- 'contrasena' se guarda hoy en texto plano (ver recomendaciones).
  -- Se amplía a 255 para poder migrar a hash bcrypt sin romper el esquema.
  contrasena       VARCHAR(255) NOT NULL,
  CONSTRAINT fk_usuarios_persona FOREIGN KEY (id_persona)
    REFERENCES persona(id_persona) ON DELETE CASCADE,
  CONSTRAINT fk_usuarios_rol FOREIGN KEY (id_rol)
    REFERENCES rol(id_rol) ON DELETE RESTRICT,
  CONSTRAINT fk_usuarios_especialidad FOREIGN KEY (id_especialidad)
    REFERENCES especialidad(id_especialidad) ON DELETE SET NULL,
  UNIQUE KEY uq_usuarios_persona (id_persona)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- Proyectos
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS proyecto (
  id_proyecto       INT AUTO_INCREMENT PRIMARY KEY,
  id_usuario        INT NOT NULL,
  nombre_proyecto   VARCHAR(150) NOT NULL,
  descripcion       TEXT NULL,
  -- Archivo de registro (PDF/DOC/DOCX) guardado como binario.
  -- Ver recomendación de moverlo a almacenamiento de archivos (Azure Blob / S3).
  formato_registro  LONGBLOB NULL,
  fecha_inicio      DATE NOT NULL,
  estatus           VARCHAR(30) NOT NULL DEFAULT 'Pendiente',
  -- Se define como INT (0-100), NO como texto '0%'.
  -- El controlador actual inserta '0%' como string: es un bug a corregir,
  -- ver GUIA_DESPLIEGUE_Y_MEJORAS.md, sección "Bugs".
  progreso          TINYINT UNSIGNED NOT NULL DEFAULT 0,
  CONSTRAINT fk_proyecto_usuario FOREIGN KEY (id_usuario)
    REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
  CONSTRAINT chk_progreso CHECK (progreso BETWEEN 0 AND 100)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS persona_has_proyecto (
  id_proyecto  INT NOT NULL,
  id_persona   INT NOT NULL,
  PRIMARY KEY (id_proyecto, id_persona),
  CONSTRAINT fk_php_proyecto FOREIGN KEY (id_proyecto)
    REFERENCES proyecto(id_proyecto) ON DELETE CASCADE,
  CONSTRAINT fk_php_persona FOREIGN KEY (id_persona)
    REFERENCES persona(id_persona) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS avances (
  id_avances      INT AUTO_INCREMENT PRIMARY KEY,
  id_proyecto     INT NOT NULL,
  id_usuario      INT NULL,
  hitos           VARCHAR(150) NULL,
  notas           TEXT NULL,
  fecha_creacion  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_avances_proyecto FOREIGN KEY (id_proyecto)
    REFERENCES proyecto(id_proyecto) ON DELETE CASCADE,
  CONSTRAINT fk_avances_usuario FOREIGN KEY (id_usuario)
    REFERENCES usuarios(id_usuario) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS tarea (
  id_tarea            INT AUTO_INCREMENT PRIMARY KEY,
  id_proyecto         INT NOT NULL,
  nombre_tarea        VARCHAR(150) NOT NULL,
  descripcion_tarea   TEXT NULL,
  estatus             VARCHAR(30) NOT NULL DEFAULT 'Pendiente',
  fecha_creacion      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_tarea_proyecto FOREIGN KEY (id_proyecto)
    REFERENCES proyecto(id_proyecto) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- Eventos
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS eventos (
  id_evento      INT AUTO_INCREMENT PRIMARY KEY,
  id_usuario     INT NULL,
  id_tipos_eve   INT NULL,
  nombre_evento  VARCHAR(150) NOT NULL,
  fecha_evento   DATETIME NOT NULL,
  cupo           INT UNSIGNED NOT NULL DEFAULT 0,
  descripcion    TEXT NULL,
  CONSTRAINT fk_eventos_usuario FOREIGN KEY (id_usuario)
    REFERENCES usuarios(id_usuario) ON DELETE SET NULL,
  CONSTRAINT fk_eventos_tipo FOREIGN KEY (id_tipos_eve)
    REFERENCES tipos_eventos(id_tipos_eve) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS persona_has_eventos (
  id_evento   INT NOT NULL,
  id_persona  INT NOT NULL,
  PRIMARY KEY (id_evento, id_persona),
  CONSTRAINT fk_phe_evento FOREIGN KEY (id_evento)
    REFERENCES eventos(id_evento) ON DELETE CASCADE,
  CONSTRAINT fk_phe_persona FOREIGN KEY (id_persona)
    REFERENCES persona(id_persona) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- Tutorías
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS disponibilidad_tuto (
  id_disponibilidad  INT AUTO_INCREMENT PRIMARY KEY,
  id_usuario         INT NOT NULL,   -- tutor/coordinador
  dia                VARCHAR(20) NOT NULL,
  hora_inicio        TIME NOT NULL,
  hora_fin           TIME NOT NULL,
  CONSTRAINT fk_disp_usuario FOREIGN KEY (id_usuario)
    REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
  CONSTRAINT chk_disp_horas CHECK (hora_fin > hora_inicio)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS tutoria (
  id_tutoria    INT AUTO_INCREMENT PRIMARY KEY,
  id_usuario    INT NOT NULL,  -- emprendedor
  id_tutor      INT NOT NULL,  -- usuarios.id_usuario con rol Coordinador
  id_proyecto   INT NOT NULL,
  fecha         DATE NOT NULL,
  hora_inicio   TIME NOT NULL,
  hora_fin      TIME NOT NULL,
  CONSTRAINT fk_tutoria_usuario FOREIGN KEY (id_usuario)
    REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
  CONSTRAINT fk_tutoria_tutor FOREIGN KEY (id_tutor)
    REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
  CONSTRAINT fk_tutoria_proyecto FOREIGN KEY (id_proyecto)
    REFERENCES proyecto(id_proyecto) ON DELETE CASCADE,
  CONSTRAINT chk_tutoria_horas CHECK (hora_fin > hora_inicio)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- Índices adicionales recomendados (rendimiento en búsquedas
-- LIKE '%...%' y JOINs frecuentes detectados en los controladores)
-- ------------------------------------------------------------

CREATE INDEX idx_persona_nombre     ON persona(nombre);
CREATE INDEX idx_persona_apellido   ON persona(apellido);
CREATE INDEX idx_proyecto_nombre    ON proyecto(nombre_proyecto);
CREATE INDEX idx_proyecto_usuario   ON proyecto(id_usuario);
CREATE INDEX idx_eventos_nombre     ON eventos(nombre_evento);
CREATE INDEX idx_avances_proyecto   ON avances(id_proyecto);
CREATE INDEX idx_tutoria_tutor_fecha ON tutoria(id_tutor, fecha);

SET FOREIGN_KEY_CHECKS = 1;

-- ------------------------------------------------------------
-- Datos semilla mínimos (catálogos que el código da por hecho)
-- Ajusta los id_rol si tu BD real en Azure ya tiene otros valores;
-- el código infiere: id_rol=2 -> Emprendedor (registrocontrolador.js),
-- id_rol=3 -> Coordinador (eventosControlador.js obtenerCoordinadores).
-- ------------------------------------------------------------

INSERT IGNORE INTO rol (id_rol, nombre_rol, permisos) VALUES
  (1, 'Administrador', 'total'),
  (2, 'Emprendedor', 'basico'),
  (3, 'Coordinador', 'gestion');