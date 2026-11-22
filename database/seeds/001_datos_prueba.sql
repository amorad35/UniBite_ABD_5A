
BEGIN;

-- Usuario ficticio, desactivado y sin acceso al sistema.
-- No utilizar este registro para iniciar sesión.
INSERT INTO usuarios
(nombre, correo, password_hash, activo)
VALUES
('Usuario de prueba', 'demo@unibite.invalid',
 'SIN_LOGIN_SOLO_PRUEBA', FALSE)
ON CONFLICT DO NOTHING;

-- Emprendimiento ficticio aprobado para las pruebas.
INSERT INTO emprendimientos
(id_usuario, nombre, descripcion, whatsapp, estado_revision)
SELECT
    u.id_usuario,
    'Dulces UniBite',
    'Emprendimiento de prueba',
    '0000000000',
    'aprobado'
FROM usuarios u
WHERE u.correo = 'demo@unibite.invalid'
AND NOT EXISTS (
    SELECT 1
    FROM emprendimientos e
    WHERE e.id_usuario = u.id_usuario
      AND e.nombre = 'Dulces UniBite'
);

-- Categoría para clasificar brownies.
INSERT INTO categorias (nombre)
VALUES ('Postres')
ON CONFLICT (nombre) DO NOTHING;

COMMIT;
