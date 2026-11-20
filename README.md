# UniBite — Administración de Bases de Datos, 5.º A

**UniBite** es una propuesta de plataforma web para que estudiantes universitarios descubran y soliciten alimentos publicados por otros estudiantes emprendedores.

## Organización

- `frontend/`: interfaz web, vistas, componentes y llamadas al backend.
- `backend/`: API, validaciones, autenticación y reglas de negocio.
- `database/`: migraciones, scripts SQL y datos de prueba de PostgreSQL.
- `docs/`: propuesta, requisitos, diagramas, pruebas, evidencias y entregas.
- `infra/`: archivos de infraestructura y Docker complementarios.
- `tests/`: pruebas de integración o generales.
- `scripts/`: tareas auxiliares del equipo.
- `compose.yaml`: entorno PostgreSQL **de desarrollo** en Docker.

## Estado

Estructura inicial. **Aún no hay una aplicación web funcional:** falta escoger framework frontend, tecnología backend y desarrollar módulos.

## PostgreSQL local con Docker

1. Copiar `.env.example` como `.env` y cambiar la contraseña de ejemplo.
2. Desde la raíz del repositorio ejecutar `docker compose up -d`.
3. La base de datos quedará disponible en `localhost` con puerto `5433` por defecto (configurable en `.env`).
4. Para detener el contenedor: `docker compose down` (sin `-v`, para conservar los datos del volumen).

Este Compose arranca **solo PostgreSQL 18**, no el frontend ni el backend. El volumen de datos es local de Docker, no parte del repositorio.

## Flujo de trabajo sugerido

- Rama `main`: versión revisada.
- Ramas por tarea: `feature/catalogo`, `feature/solicitudes`, `feature/base-datos`.
- Subir cambios a su rama y proponer Pull Request hacia `main`.
- No subir contraseñas, tokens, archivos `.env`, datos reales de clientes ni respaldos privados.

## Documentación inicial

Ver `docs/02-requisitos/alcance.md` y `docs/02-requisitos/reglas-negocio.md`.
