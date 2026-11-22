
using Microsoft.AspNetCore.Mvc;
using Npgsql;

namespace UniBite.Api.Controllers;

[ApiController]
[Route("api/productos")]
public class ProductosController : ControllerBase
{
    private readonly IConfiguration _config;

    public ProductosController(IConfiguration config)
    {
        _config = config;
    }

    [HttpGet]
    public async Task<IActionResult> ObtenerProductos()
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
            SELECT id_producto, nombre, precio, activo
            FROM productos
            ORDER BY id_producto
            """;

        await using var comando =
            new NpgsqlCommand(sql, conexion);

        await using var lector =
            await comando.ExecuteReaderAsync();

        var productos = new List<object>();

        while (await lector.ReadAsync())
        {
            productos.Add(new
            {
                id_producto = lector.GetInt64(0),
                nombre = lector.GetString(1),
                precio = lector.GetDecimal(2),
                activo = lector.GetBoolean(3)
            });
        }

        return Ok(productos);
    }

public record CrearProductoDto(
        long IdEmprendimiento,
        long IdCategoria,
        string Nombre,
        decimal Precio
    );

    [HttpPost]
    public async Task<IActionResult> CrearProducto(
        [FromBody] CrearProductoDto producto)
    {
        if (producto.IdEmprendimiento <= 0 ||
            producto.IdCategoria <= 0 ||
            string.IsNullOrWhiteSpace(producto.Nombre) ||
            producto.Nombre.Trim().Length > 120 ||
            producto.Precio <= 0)
        {
            return BadRequest(new
            {
                mensaje = "Verifica los datos del producto."
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
            INSERT INTO productos
                (id_emprendimiento, id_categoria, nombre, precio)
            VALUES
                (@emprendimiento, @categoria, @nombre, @precio)
            RETURNING id_producto
            """;

        await using var comando =
            new NpgsqlCommand(sql, conexion);

        comando.Parameters.AddWithValue(
            "emprendimiento", producto.IdEmprendimiento);

        comando.Parameters.AddWithValue(
            "categoria", producto.IdCategoria);

        comando.Parameters.AddWithValue(
            "nombre", producto.Nombre.Trim());

        comando.Parameters.AddWithValue(
            "precio", producto.Precio);

        try
        {
            var id = (long)(await comando.ExecuteScalarAsync())!;

            return StatusCode(201, new
            {
                mensaje = "Producto registrado correctamente",
                id_producto = id
            });
        }
        catch (PostgresException ex)
            when (ex.SqlState == "23503")
        {
            return BadRequest(new
            {
                mensaje = "El emprendimiento o la categoría no existe."
            });
        }
    }

 public record ActualizarProductoDto(
        long IdCategoria,
        string Nombre,
        decimal Precio
    );

    [HttpPut("{id:long}")]
    public async Task<IActionResult> ActualizarProducto(
        long id,
        [FromBody] ActualizarProductoDto producto)
    {
        if (id <= 0 ||
            producto.IdCategoria <= 0 ||
            string.IsNullOrWhiteSpace(producto.Nombre) ||
            producto.Nombre.Trim().Length > 120 ||
            producto.Precio <= 0)
        {
            return BadRequest(new
            {
                mensaje = "Verifica los datos del producto."
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
            UPDATE productos
            SET id_categoria = @categoria,
                nombre = @nombre,
                precio = @precio
            WHERE id_producto = @id
            RETURNING id_producto
            """;

        await using var comando =
            new NpgsqlCommand(sql, conexion);

        comando.Parameters.AddWithValue("id", id);
        comando.Parameters.AddWithValue(
            "categoria", producto.IdCategoria);
        comando.Parameters.AddWithValue(
            "nombre", producto.Nombre.Trim());
        comando.Parameters.AddWithValue(
            "precio", producto.Precio);

        try
        {
            var resultado = await comando.ExecuteScalarAsync();

            if (resultado is null)
                return NotFound(new
                {
                    mensaje = "Producto no encontrado."
                });

            return Ok(new
            {
                mensaje = "Producto actualizado correctamente"
            });
        }
        catch (PostgresException ex)
            when (ex.SqlState == "23503")
        {
            return BadRequest(new
            {
                mensaje = "La categoría indicada no existe."
            });
        }
    }
     [HttpDelete("{id:long}")]
    public async Task<IActionResult> DesactivarProducto(long id)
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
            UPDATE productos
            SET activo = FALSE
            WHERE id_producto = @id
            RETURNING id_producto
            """;

        await using var comando =
            new NpgsqlCommand(sql, conexion);

        comando.Parameters.AddWithValue("id", id);

        var resultado = await comando.ExecuteScalarAsync();

        if (resultado is null)
        {
            return NotFound(new
            {
                mensaje = "Producto no encontrado."
            });
        }

        return Ok(new
        {
            mensaje = "Producto desactivado correctamente."
        });
    }

}
