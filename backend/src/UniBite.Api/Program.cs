using Npgsql;
var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

builder.Services.AddControllers();
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();

app.UseAuthorization();

app.MapControllers();

if (app.Environment.IsDevelopment())
{
    app.MapGet("/api/prueba-bd", async (IConfiguration config) =>
    {
        var datos = new NpgsqlConnectionStringBuilder
        {
            Host = config["Database:Host"],
            Port = int.Parse(config["Database:Port"]!),
            Database = config["Database:Name"],
            Username = config["Database:Username"],
            Password = config["Database:Password"]
        };

        await using var conexion =
            new NpgsqlConnection(datos.ConnectionString);

        await conexion.OpenAsync();

        await using var comando =
            new NpgsqlCommand("SELECT 1", conexion);

        var resultado = await comando.ExecuteScalarAsync();

        return Results.Ok(new
        {
            mensaje = "Conexion exitosa con PostgreSQL",
            prueba = resultado
        });
    });
}
app.Run();
