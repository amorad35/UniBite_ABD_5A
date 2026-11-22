/* RF-06: consulta y persiste las publicaciones exclusivamente mediante la API C#. */
(() => {
  'use strict';
  const API = '/api/publicaciones';
  const PRODUCTOS = '/api/productos';
  const $ = selector => document.querySelector(selector);
  const form = $('#form-publicacion');
  const id = $('#id-publicacion');
  const producto = $('#producto');
  const modalidad = $('#modalidad');
  const fecha = $('#fecha-entrega');
  const hora = $('#hora-entrega');
  const cierre = $('#cierre-recepcion');
  const capacidad = $('#capacidad');
  const precio = $('#precio');
  const lugar = $('#lugar');
  const disponible = $('#disponible');
  const tabla = $('#publicaciones-tabla');
  const mensaje = $('#mensaje');
  const guardar = $('#guardar');
  const moneda = new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD' });
  let publicaciones = [];

  function avisar(texto, error = false) {
    mensaje.textContent = texto;
    mensaje.dataset.kind = error ? 'error' : 'ok';
  }
  async function api(url, options = {}) {
    let r;
    try {
      r = await fetch(url, { ...options, headers: { 'Content-Type': 'application/json', ...(options.headers || {}) } });
    } catch {
      throw new Error('No hay conexión con la API. Comprueba que dotnet run siga ejecutándose.');
    }
    const contenido = await r.text();
    let datos = null;
    try { datos = contenido ? JSON.parse(contenido) : null; } catch { /* respuesta no JSON */ }
    if (!r.ok) throw new Error(datos?.mensaje || `Error HTTP ${r.status}`);
    return datos;
  }
  function celda(texto) {
    const td = document.createElement('td');
    td.textContent = String(texto);
    return td;
  }
  function boton(texto, accion, itemId, disabled = false) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'btn outline tiny-btn';
    b.textContent = texto;
    b.dataset.accion = accion;
    b.dataset.id = itemId;
    b.disabled = disabled;
    return b;
  }
  function mostrarEncargo() {
    const esEncargo = modalidad.value === 'encargo';
    const bloque = $('#datos-encargo');
    bloque.style.display = esEncargo ? 'grid' : 'none';
    cierre.required = esEncargo;
    capacidad.required = esEncargo;
  }
  function restablecer() {
    form.reset();
    id.value = '';
    $('#solo-crear').disabled = false;
    $('#form-heading').textContent = 'Crear publicación';
    $('#form-subtitle').textContent = 'Completa los datos de una nueva oferta.';
    $('#opcion-disponible').style.display = 'none';
    guardar.textContent = 'Guardar publicación';
    modalidad.value = 'inmediata';
    mostrarEncargo();
    avisar('');
  }
  async function cargarProductos() {
    const lista = await api(PRODUCTOS);
    if (!Array.isArray(lista)) throw new Error('La API de productos no devolvió una lista.');
    producto.replaceChildren();
    producto.append(new Option('Selecciona un producto activo', ''));
    const activos = lista.filter(p => p.activo === true);
    for (const p of activos) producto.append(new Option(`${p.nombre} (ID ${p.id_producto})`, String(p.id_producto)));
    if (!activos.length) avisar('No hay productos activos. Crea uno desde RF-05 antes de publicar.', true);
  }
  function renderizar() {
    tabla.replaceChildren();
    if (!publicaciones.length) {
      const tr = document.createElement('tr'); const td = celda('Todavía no hay publicaciones.'); td.colSpan = 7; tr.append(td); tabla.append(tr); return;
    }
    for (const p of publicaciones) {
      const tr = document.createElement('tr');
      tr.append(celda(p.id_publicacion), celda(p.producto), celda(p.modalidad), celda(moneda.format(p.precio)));
      tr.append(celda(`${p.fecha_entrega} ${p.hora_entrega}\n${p.lugar_entrega}`));
      const estado = celda('');
      const chip = document.createElement('span');
      chip.className = `productos-real-badge ${p.activa && p.disponible ? 'is-active' : 'is-inactive'}`;
      chip.textContent = !p.activa ? 'Desactivada' : (p.disponible ? 'Disponible' : 'No disponible');
      estado.append(chip); tr.append(estado);
      const acciones = celda('');
      acciones.append(boton('Editar', 'editar', p.id_publicacion, !p.activa));
      acciones.append(boton('Desactivar', 'desactivar', p.id_publicacion, !p.activa));
      tr.append(acciones); tabla.append(tr);
    }
  }
  async function listar() {
    try {
      const lista = await api(API);
      if (!Array.isArray(lista)) throw new Error('La API no devolvió una lista de publicaciones.');
      publicaciones = lista;
      renderizar();
    } catch (err) {
      tabla.replaceChildren(); const tr = document.createElement('tr'); const td = celda(err.message); td.colSpan = 7; tr.append(td); tabla.append(tr);
      avisar(err.message, true);
    }
  }
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const itemId = id.value;
    let datos;
    if (itemId) {
      datos = { PrecioPublicado: Number(precio.value), LugarEntrega: lugar.value.trim(), Disponible: disponible.checked };
    } else {
      const esEncargo = modalidad.value === 'encargo';
      datos = {
        IdProducto: Number(producto.value),
        Modalidad: modalidad.value,
        PrecioPublicado: Number(precio.value),
        FechaEntrega: fecha.value,
        HoraEntrega: hora.value.length === 5 ? `${hora.value}:00` : hora.value,
        LugarEntrega: lugar.value.trim(),
        CierreRecepcion: esEncargo ? new Date(cierre.value).toISOString() : null,
        CapacidadOrientativa: esEncargo ? Number(capacidad.value) : null
      };
      if (!datos.IdProducto) { avisar('Selecciona un producto activo.', true); return; }
      if (esEncargo && (!Number.isInteger(datos.CapacidadOrientativa) || datos.CapacidadOrientativa <= 0)) {
        avisar('Indica una capacidad orientativa válida.', true); return;
      }
    }
    if (!datos.LugarEntrega || datos.PrecioPublicado <= 0) { avisar('Revisa el lugar y el precio.', true); return; }
    guardar.disabled = true;
    try {
      await api(itemId ? `${API}/${itemId}` : API, { method: itemId ? 'PUT' : 'POST', body: JSON.stringify(datos) });
      restablecer();
      await listar();
      await cargarProductos();
      avisar(itemId ? 'Publicación actualizada en PostgreSQL.' : 'Publicación registrada en PostgreSQL.');
    } catch (err) { avisar(err.message, true); }
    finally { guardar.disabled = false; }
  });
  tabla.addEventListener('click', async event => {
    const b = event.target.closest('button[data-accion]');
    if (!b) return;
    const item = publicaciones.find(p => p.id_publicacion === Number(b.dataset.id));
    if (!item) return;
    if (b.dataset.accion === 'editar') {
      id.value = String(item.id_publicacion);
      precio.value = item.precio;
      lugar.value = item.lugar_entrega;
      disponible.checked = item.disponible;
      $('#solo-crear').disabled = true;
      $('#opcion-disponible').style.display = 'grid';
      $('#form-heading').textContent = `Editar publicación #${item.id_publicacion}`;
      $('#form-subtitle').textContent = 'Puedes actualizar el precio, lugar y disponibilidad.';
      guardar.textContent = 'Guardar cambios';
      avisar(`Editando la publicación de «${item.producto}».`);
      precio.focus();
      window.scrollTo({top: 0, behavior: 'smooth'});
    } else if (b.dataset.accion === 'desactivar') {
      if (!confirm(`¿Desactivar la publicación #${item.id_publicacion} de «${item.producto}»?`)) return;
      b.disabled = true;
      try {
        await api(`${API}/${item.id_publicacion}`, {method: 'DELETE'});
        if (id.value === String(item.id_publicacion)) restablecer();
        await listar();
        avisar('Publicación desactivada correctamente.');
      } catch (err) { avisar(err.message, true); b.disabled = false; }
    }
  });
  modalidad.addEventListener('change', mostrarEncargo);
  $('#cancelar').addEventListener('click', restablecer);
  $('#recargar').addEventListener('click', async () => { await listar(); await cargarProductos(); });
  mostrarEncargo();
  Promise.all([cargarProductos(), listar()]).catch(err => avisar(err.message, true));
})();
