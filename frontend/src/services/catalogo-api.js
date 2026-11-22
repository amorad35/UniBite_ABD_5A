/* RF-07: catálogo público de desarrollo, leído desde la API real /api/catalogo.
   No se generan publicaciones ficticias ni se escriben datos en localStorage. */
(() => {
  'use strict';
  const API = '/api/catalogo';
  const form = document.querySelector('#form-busqueda');
  const buscador = document.querySelector('#buscar-catalogo');
  const modalidad = document.querySelector('#filtro-modalidad');
  const tarjetas = document.querySelector('#tarjetas-catalogo');
  const resultado = document.querySelector('#resultado-catalogo');
  const vacio = document.querySelector('#vacio-catalogo');
  const botonActualizar = document.querySelector('#actualizar-catalogo');
  const botonLimpiar = document.querySelector('#limpiar-busqueda');
  const moneda = new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD' });
  const fechaFormatter = new Intl.DateTimeFormat('es-EC', { dateStyle: 'long' });
  const respaldo = 'src/assets/food-cake.svg';
  let publicaciones = [];
  let operacionActual = 0;

  function texto(tag, contenido, clase) {
    const nodo = document.createElement(tag);
    nodo.textContent = String(contenido ?? '');
    if (clase) nodo.className = clase;
    return nodo;
  }

  function fechaLegible(valor) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(valor))) return String(valor ?? '');
    const [anio, mes, dia] = valor.split('-').map(Number);
    const fecha = new Date(anio, mes - 1, dia, 12);
    return Number.isNaN(fecha.getTime()) ? String(valor) : fechaFormatter.format(fecha);
  }

  function imagenPermitida(url) {
    if (typeof url !== 'string' || !url.trim()) return respaldo;
    try {
      const parsed = new URL(url, window.location.origin);
      if (parsed.protocol === 'http:' || parsed.protocol === 'https:') return parsed.href;
    } catch { /* Ignorar enlaces incorrectos */ }
    return respaldo;
  }

  function tarjeta(p) {
    const articulo = document.createElement('article');
    articulo.className = 'catalogo-real-tarjeta';
    const visual = document.createElement('div');
    visual.className = 'catalogo-real-visual';
    const img = document.createElement('img');
    img.src = imagenPermitida(p.imagen_url);
    img.alt = p.imagen_url ? `Imagen de ${p.producto}` : 'Imagen ilustrativa de alimento';
    img.loading = 'lazy';
    img.onerror = () => { img.onerror = null; img.src = respaldo; };
    visual.append(img);
    visual.append(texto('span', p.modalidad === 'encargo' ? 'Por encargo' : 'Venta inmediata', 'catalogo-real-etiqueta'));
    const cuerpo = document.createElement('div');
    cuerpo.className = 'catalogo-real-cuerpo';
    cuerpo.append(texto('span', p.categoria || 'Alimentos', 'catalogo-real-categoria'));
    cuerpo.append(texto('h2', p.producto || 'Producto sin nombre'));
    cuerpo.append(texto('p', p.emprendimiento || '', 'catalogo-real-emprendimiento'));
    if (p.descripcion) cuerpo.append(texto('p', p.descripcion, 'catalogo-real-descripcion'));
    const filaPrecio = document.createElement('div');
    filaPrecio.className = 'catalogo-real-precio';
    filaPrecio.append(texto('strong', moneda.format(Number(p.precio))));
    filaPrecio.append(texto('small', 'Precio publicado'));
    cuerpo.append(filaPrecio);
    const entrega = document.createElement('div');
    entrega.className = 'catalogo-real-entrega';
    entrega.append(texto('span', `Entrega: ${fechaLegible(p.fecha_entrega)}`));
    entrega.append(texto('span', `Hora: ${String(p.hora_entrega || '').slice(0, 5)}`));
    entrega.append(texto('span', `Lugar: ${p.lugar_entrega || 'No especificado'}`));
    cuerpo.append(entrega);
    cuerpo.append(texto('p', `Publicación #${p.id_publicacion}`, 'catalogo-real-id'));
    articulo.append(visual, cuerpo);
    return articulo;
  }

  function mostrar() {
    tarjetas.replaceChildren();
    const filtro = modalidad.value;
    const filtradas = filtro === 'todas'
      ? publicaciones
      : publicaciones.filter(p => p.modalidad === filtro);
    for (const publicacion of filtradas) tarjetas.append(tarjeta(publicacion));
    vacio.hidden = filtradas.length !== 0;
    resultado.textContent = `${filtradas.length} publicación${filtradas.length === 1 ? '' : 'es'} disponible${filtradas.length === 1 ? '' : 's'}`;
  }

  async function cargar() {
    const operacion = ++operacionActual;
    resultado.textContent = 'Consultando PostgreSQL…';
    vacio.hidden = true;
    tarjetas.replaceChildren();
    botonActualizar.disabled = true;
    const busqueda = buscador.value.trim();
    const url = busqueda ? `${API}?buscar=${encodeURIComponent(busqueda)}` : API;
    try {
      const respuesta = await fetch(url, { headers: { Accept: 'application/json' }, cache: 'no-store' });
      if (!respuesta.ok) {
        let mensaje = `Error HTTP ${respuesta.status}`;
        try { const error = await respuesta.json(); mensaje = error.mensaje || mensaje; } catch { /* Respuesta sin JSON */ }
        throw new Error(mensaje);
      }
      const datos = await respuesta.json();
      if (!Array.isArray(datos)) throw new Error('La API no devolvió una lista de publicaciones.');
      if (operacion !== operacionActual) return;
      publicaciones = datos;
      mostrar();
    } catch (error) {
      if (operacion !== operacionActual) return;
      publicaciones = [];
      resultado.textContent = `No se pudo consultar el catálogo: ${error.message}`;
      vacio.hidden = false;
      tarjetas.replaceChildren();
    } finally {
      if (operacion === operacionActual) botonActualizar.disabled = false;
    }
  }

  form.addEventListener('submit', evento => { evento.preventDefault(); cargar(); });
  botonLimpiar.addEventListener('click', () => { buscador.value = ''; modalidad.value = 'todas'; cargar(); });
  botonActualizar.addEventListener('click', cargar);
  modalidad.addEventListener('change', mostrar);
  cargar();
})();
