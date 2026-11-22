
BEGIN;

-- 1. USUARIOS
CREATE TABLE IF NOT EXISTS usuarios (
    id_usuario BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre VARCHAR(120) NOT NULL,
    correo VARCHAR(254) NOT NULL,
    password_hash TEXT NOT NULL,
    es_administrador BOOLEAN NOT NULL DEFAULT FALSE,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_usuario_nombre
        CHECK (LENGTH(TRIM(nombre)) > 0)
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_usuarios_correo
    ON usuarios (LOWER(TRIM(correo)));

-- 2. EMPRENDIMIENTOS
CREATE TABLE IF NOT EXISTS emprendimientos (
    id_emprendimiento BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_usuario BIGINT NOT NULL,
    nombre VARCHAR(120) NOT NULL,
    descripcion TEXT,
    whatsapp VARCHAR(20) NOT NULL,
    estado_revision VARCHAR(15) NOT NULL DEFAULT 'pendiente',
    creado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_emprendimiento_usuario
        FOREIGN KEY (id_usuario)
        REFERENCES usuarios(id_usuario),

    CONSTRAINT chk_estado_emprendimiento
        CHECK (estado_revision IN ('pendiente', 'aprobado', 'rechazado'))
);

-- 3. CATEGORIAS
CREATE TABLE IF NOT EXISTS categorias (
    id_categoria BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre VARCHAR(80) NOT NULL UNIQUE,
    activa BOOLEAN NOT NULL DEFAULT TRUE
);

-- 4. PRODUCTOS
CREATE TABLE IF NOT EXISTS productos (
    id_producto BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_emprendimiento BIGINT NOT NULL,
    id_categoria BIGINT NOT NULL,
    nombre VARCHAR(120) NOT NULL,
    descripcion TEXT,
    precio NUMERIC(10,2) NOT NULL,
    imagen_url TEXT,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_producto_emprendimiento
        FOREIGN KEY (id_emprendimiento)
        REFERENCES emprendimientos(id_emprendimiento),

    CONSTRAINT fk_producto_categoria
        FOREIGN KEY (id_categoria)
        REFERENCES categorias(id_categoria),

    CONSTRAINT chk_precio_producto
        CHECK (precio > 0)
);

-- 5. PUBLICACIONES
CREATE TABLE IF NOT EXISTS publicaciones (
    id_publicacion BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_producto BIGINT NOT NULL,
    modalidad VARCHAR(12) NOT NULL,
    precio_publicado NUMERIC(10,2) NOT NULL,
    fecha_entrega DATE NOT NULL,
    hora_entrega TIME NOT NULL,
    lugar_entrega VARCHAR(160) NOT NULL,
    cierre_recepcion TIMESTAMPTZ,
    capacidad_orientativa INTEGER,
    disponible BOOLEAN NOT NULL DEFAULT TRUE,
    activa BOOLEAN NOT NULL DEFAULT TRUE,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_publicacion_producto
        FOREIGN KEY (id_producto)
        REFERENCES productos(id_producto),

    CONSTRAINT chk_modalidad
        CHECK (modalidad IN ('encargo', 'inmediata')),

    CONSTRAINT chk_precio_publicacion
        CHECK (precio_publicado > 0),

    CONSTRAINT chk_capacidad_orientativa
        CHECK (capacidad_orientativa > 0),

    CONSTRAINT chk_datos_encargo
        CHECK (
            modalidad <> 'encargo'
            OR (
                cierre_recepcion IS NOT NULL
                AND capacidad_orientativa IS NOT NULL
            )
        )
);

COMMIT;
