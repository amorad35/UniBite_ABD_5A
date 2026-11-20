# Base de datos — UniBite

- `migrations/`: cambios versionados de estructura, organizados en orden de aplicación.
- `seeds/`: registros ficticios de prueba.
- `scripts/`: consultas, funciones y otros SQL de apoyo.

Los archivos `.sql` se versionan en Git. **Los datos vivos de PostgreSQL no**: se guardan en el volumen persistente de Docker definido en `compose.yaml`.

No introducir datos personales reales en los scripts de prueba. La creación de un contenedor no ejecuta automáticamente los scripts que estén en `migrations/`.
