using Microsoft.AspNetCore.Mvc;
using Npgsql;

namespace UniBite.Api.Controllers;

[ApiController]
[Route("api/catalogo")]
public class CatalogoController : ControllerBase
{
    private readonly IConfiguration _config;

    public CatalogoController(IConfiguration config)
    {
        _config = config;
    }

    [HttpGet]
    public async Task<IActionResult> ConsultarCatalogo(
        [FromQuery] string? buscar)
    {
        string busqueda = (buscar ?? "").Trim();

        if (busqueda.Length > 120)
        {
            return BadRequest(new
            {
                mensaje = "La búsqueda es demasiado larga."
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
            SELECT
                pu.id_publicacion,
                pr.nombre,
                pr.descripcion,
                pu.precio_publicado,
                pu.modalidad,
                pu.fecha_entrega,
                pu.hora_entrega,
                pu.lugar_entrega,
                ca.nombre AS categoria,
                em.nombre AS emprendimiento,
                pr.imagen_url
            FROM publicaciones pu
            INNER JOIN productos pr
                ON pu.id_producto = pr.id_producto
            INNER JOIN categorias ca
                ON pr.id_categoria = ca.id_categoria
            INNER JOIN emprendimientos em
                ON pr.id_emprendimiento = em.id_emprendimiento
            WHERE pu.activa = TRUE
              AND pu.disponible = TRUE
              AND pr.activo = TRUE
              AND ca.activa = TRUE
              AND em.estado_revision = 'aprobado'
              AND (pu.fecha_entrega + pu.hora_entrega)
                  >= (CURRENT_TIMESTAMP AT TIME ZONE
                      'America/Guayaquil')
              AND (
                  @busqueda = ''
                  OR pr.nombre ILIKE '%' || @busqueda || '%'
                  OR em.nombre ILIKE '%' || @busqueda || '%'
                  OR ca.nombre ILIKE '%' || @busqueda || '%'
              )
            ORDER BY pu.fecha_entrega,
                     pu.hora_entrega,
                     pu.id_publicacion
            """;

        await using var comando =
            new NpgsqlCommand(sql, conexion);

        comando.Parameters.AddWithValue(
            "busqueda", busqueda);

        await using var lector =
            await comando.ExecuteReaderAsync();

        var catalogo = new List<object>();

        while (await lector.ReadAsync())
        {
            catalogo.Add(new
            {
                id_publicacion = lector.GetInt64(0),
                producto = lector.GetString(1),
                descripcion = lector.IsDBNull(2)
                    ? null : lector.GetString(2),
                precio = lector.GetDecimal(3),
                modalidad = lector.GetString(4),
                fecha_entrega =
                    lector.GetFieldValue<DateOnly>(5),
                hora_entrega =
                    lector.GetFieldValue<TimeOnly>(6),
                lugar_entrega = lector.GetString(7),
                categoria = lector.GetString(8),
                emprendimiento = lector.GetString(9),
                imagen_url = lector.IsDBNull(10)
                    ? null : lector.GetString(10)
            });
        }

        return Ok(catalogo);
    }
}