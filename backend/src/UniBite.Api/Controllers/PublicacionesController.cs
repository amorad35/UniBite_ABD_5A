using Microsoft.AspNetCore.Mvc;
using Npgsql;

namespace UniBite.Api.Controllers;

[ApiController]
[Route("api/publicaciones")]
public class PublicacionesController : ControllerBase
{
    private readonly IConfiguration _config;

    public PublicacionesController(IConfiguration config)
    {
        _config = config;
    }

    [HttpGet]
    public async Task<IActionResult> ObtenerPublicaciones()
    {
        var datos = new NpgsqlConnectionStringBuilder
        {
            Host = _config["Database:Host"],
            Port = int.Parse(_config["Database:Port"]!),
            Database = _config["Database:Name"],
            Username = _config["Database:Username"],
            Password = _config["Database:Password"]
        };

        await using var conexion =
            new NpgsqlConnection(datos.ConnectionString);

        await conexion.OpenAsync();

        const string sql = """
            SELECT
                p.id_publicacion,
                p.id_producto,
                pr.nombre,
                p.modalidad,
                p.precio_publicado,
                p.fecha_entrega,
                p.hora_entrega,
                p.lugar_entrega,
                p.disponible,
                p.activa
            FROM publicaciones p
            INNER JOIN productos pr
                ON p.id_producto = pr.id_producto
            ORDER BY p.id_publicacion
            """;

        await using var comando =
            new NpgsqlCommand(sql, conexion);

        await using var lector =
            await comando.ExecuteReaderAsync();

        var publicaciones = new List<object>();

        while (await lector.ReadAsync())
        {
            publicaciones.Add(new
            {
                id_publicacion = lector.GetInt64(0),
                id_producto = lector.GetInt64(1),
                producto = lector.GetString(2),
                modalidad = lector.GetString(3),
                precio = lector.GetDecimal(4),
                fecha_entrega = lector.GetFieldValue<DateOnly>(5),
                hora_entrega = lector.GetFieldValue<TimeOnly>(6),
                lugar_entrega = lector.GetString(7),
                disponible = lector.GetBoolean(8),
                activa = lector.GetBoolean(9)
            });
        }

        return Ok(publicaciones);
    }
    public record CrearPublicacionDto(
        long IdProducto,
        string Modalidad,
        decimal PrecioPublicado,
        DateOnly FechaEntrega,
        TimeOnly HoraEntrega,
        string LugarEntrega,
        DateTimeOffset? CierreRecepcion,
        int? CapacidadOrientativa
    );

    [HttpPost]
    public async Task<IActionResult> CrearPublicacion(
        [FromBody] CrearPublicacionDto publicacion)
    {
        var modalidad = (publicacion.Modalidad ?? "")
            .Trim().ToLowerInvariant();

        if (publicacion.IdProducto <= 0 ||
            (modalidad != "encargo" && modalidad != "inmediata") ||
            publicacion.PrecioPublicado <= 0 ||
            publicacion.FechaEntrega <
                DateOnly.FromDateTime(DateTime.Today) ||
            string.IsNullOrWhiteSpace(publicacion.LugarEntrega) ||
            publicacion.LugarEntrega.Trim().Length > 160)
        {
            return BadRequest(new
            {
                mensaje = "Verifica los datos de la publicación."
            });
        }

        if (modalidad == "encargo" &&
            (publicacion.CierreRecepcion is null ||
             publicacion.CapacidadOrientativa is null ||
             publicacion.CapacidadOrientativa <= 0))
        {
            return BadRequest(new
            {
                mensaje = "El encargo requiere cierre y capacidad orientativa."
            });
        }

        var datos = new NpgsqlConnectionStringBuilder
        {
            Host = _config["Database:Host"],
            Port = int.Parse(_config["Database:Port"]!),
            Database = _config["Database:Name"],
            Username = _config["Database:Username"],
            Password = _config["Database:Password"]
        };

        await using var conexion =
            new NpgsqlConnection(datos.ConnectionString);

        await conexion.OpenAsync();

        const string sql = """
            INSERT INTO publicaciones
                (id_producto, modalidad, precio_publicado,
                 fecha_entrega, hora_entrega, lugar_entrega,
                 cierre_recepcion, capacidad_orientativa)
            SELECT
                pr.id_producto, @modalidad, @precio,
                @fecha, @hora, @lugar, @cierre, @capacidad
            FROM productos pr
            INNER JOIN emprendimientos e
                ON e.id_emprendimiento = pr.id_emprendimiento
            WHERE pr.id_producto = @producto
              AND pr.activo = TRUE
              AND e.estado_revision = 'aprobado'
            RETURNING id_publicacion
            """;

        await using var comando =
            new NpgsqlCommand(sql, conexion);

        comando.Parameters.AddWithValue(
            "producto", publicacion.IdProducto);
        comando.Parameters.AddWithValue("modalidad", modalidad);
        comando.Parameters.AddWithValue(
            "precio", publicacion.PrecioPublicado);
        comando.Parameters.AddWithValue(
            "fecha", publicacion.FechaEntrega);
        comando.Parameters.AddWithValue(
            "hora", publicacion.HoraEntrega);
        comando.Parameters.AddWithValue(
            "lugar", publicacion.LugarEntrega.Trim());

        comando.Parameters.Add(
            "cierre", NpgsqlTypes.NpgsqlDbType.TimestampTz
        ).Value = modalidad == "encargo" &&
                  publicacion.CierreRecepcion.HasValue
            ? (object)publicacion.CierreRecepcion.Value.ToUniversalTime()
            : DBNull.Value;

        comando.Parameters.Add(
            "capacidad", NpgsqlTypes.NpgsqlDbType.Integer
        ).Value = modalidad == "encargo"
            ? (object?)publicacion.CapacidadOrientativa ?? DBNull.Value
            : DBNull.Value;

        var resultado = await comando.ExecuteScalarAsync();

        if (resultado is null)
        {
            return BadRequest(new
            {
                mensaje = "El producto no existe, está desactivado o su emprendimiento no está aprobado."
            });
        }

        return StatusCode(201, new
        {
            mensaje = "Publicación registrada correctamente",
            id_publicacion = resultado
        });
    }
public record ActualizarPublicacionDto(
        decimal PrecioPublicado,
        string LugarEntrega,
        bool Disponible
    );

    [HttpPut("{id:long}")]
    public async Task<IActionResult> ActualizarPublicacion(
        long id,
        [FromBody] ActualizarPublicacionDto publicacion)
    {
        if (id <= 0 ||
            publicacion.PrecioPublicado <= 0 ||
            string.IsNullOrWhiteSpace(publicacion.LugarEntrega) ||
            publicacion.LugarEntrega.Trim().Length > 160)
        {
            return BadRequest(new
            {
                mensaje = "Verifica los datos de la publicación."
            });
        }

        var datos = new NpgsqlConnectionStringBuilder
        {
            Host = _config["Database:Host"],
            Port = int.Parse(_config["Database:Port"]!),
            Database = _config["Database:Name"],
            Username = _config["Database:Username"],
            Password = _config["Database:Password"]
        };

        await using var conexion =
            new NpgsqlConnection(datos.ConnectionString);

        await conexion.OpenAsync();

        const string sql = """
            UPDATE publicaciones
            SET precio_publicado = @precio,
                lugar_entrega = @lugar,
                disponible = @disponible
            WHERE id_publicacion = @id
              AND activa = TRUE
            RETURNING id_publicacion
            """;

        await using var comando =
            new NpgsqlCommand(sql, conexion);

        comando.Parameters.AddWithValue("id", id);
        comando.Parameters.AddWithValue(
            "precio", publicacion.PrecioPublicado);
        comando.Parameters.AddWithValue(
            "lugar", publicacion.LugarEntrega.Trim());
        comando.Parameters.AddWithValue(
            "disponible", publicacion.Disponible);

        var resultado = await comando.ExecuteScalarAsync();

        if (resultado is null)
        {
            return NotFound(new
            {
                mensaje = "No se encontró una publicación activa."
            });
        }

        return Ok(new
        {
            mensaje = "Publicación actualizada correctamente."
        });
    }
 [HttpDelete("{id:long}")]
    public async Task<IActionResult> DesactivarPublicacion(long id)
    {
        if (id <= 0)
        {
            return BadRequest(new
            {
                mensaje = "El identificador no es válido."
            });
        }

        var datos = new NpgsqlConnectionStringBuilder
        {
            Host = _config["Database:Host"],
            Port = int.Parse(_config["Database:Port"]!),
            Database = _config["Database:Name"],
            Username = _config["Database:Username"],
            Password = _config["Database:Password"]
        };

        await using var conexion =
            new NpgsqlConnection(datos.ConnectionString);

        await conexion.OpenAsync();

        const string sql = """
            UPDATE publicaciones
            SET activa = FALSE,
                disponible = FALSE
            WHERE id_publicacion = @id
              AND activa = TRUE
            RETURNING id_publicacion
            """;

        await using var comando =
            new NpgsqlCommand(sql, conexion);

        comando.Parameters.AddWithValue("id", id);

        var resultado = await comando.ExecuteScalarAsync();

        if (resultado is null)
        {
            return NotFound(new
            {
                mensaje = "No se encontró una publicación activa."
            });
        }

        return Ok(new
        {
            mensaje = "Publicación desactivada correctamente."
        });
    }
}