/* RF-05 real. Este archivo usa la API; NO guarda productos en localStorage. */
(() => {
  'use strict';
  const API = '/api/productos';
  const form = document.querySelector('#form-producto');
  const idField = document.querySelector('#id-producto');
  const nombre = document.querySelector('#nombre');
  const precio = document.querySelector('#precio');
  const categoria = document.querySelector('#categoria');
  const cuerpo = document.querySelector('#productos-tabla');
  const mensaje = document.querySelector('#mensaje');
  const guardar = document.querySelector('#guardar');
  const heading = document.querySelector('#form-heading');
  const subtitle = document.querySelector('#form-subtitle');
  const USD = new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD' });
  let productos = [];

  function avisar(texto, tipo = 'ok') {
    mensaje.textContent = texto;
    mensaje.dataset.kind = tipo;
  }
  async function api(ruta, opciones = {}) {
    let r;
    try { r = await fetch(ruta, { ...opciones, headers: { 'Content-Type': 'application/json', ...(opciones.headers || {}) } }); }
    catch { throw new Error('No se puede conectar con la API. ¿Está ejecutándose en http://localhost:5062?'); }
    const texto = await r.text();
    let datos = null;
    try { datos = texto ? JSON.parse(texto) : null; } catch { datos = null; }
    if (!r.ok) throw new Error(datos?.mensaje || `La API respondió con error HTTP ${r.status}`);
    return datos;
  }
  function restablecer() {
    form.reset(); idField.value = '';
    heading.textContent = 'Registrar producto';
    subtitle.textContent = 'Completa los datos para guardar un producto nuevo.';
    guardar.textContent = 'Guardar producto';
    avisar('');
  }
  function celda(texto) { const td = document.createElement('td'); td.textContent = String(texto); return td; }
  function boton(etiqueta, accion, id, deshabilitado = false) {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'btn outline tiny-btn';
    b.textContent = etiqueta; b.dataset.accion = accion; b.dataset.id = id;
    b.disabled = deshabilitado;
    return b;
  }
  function renderizar() {
    cuerpo.replaceChildren();
    if (!productos.length) {
      const tr = document.createElement('tr'); const td = celda('No hay productos registrados todavía.'); td.colSpan = 5; tr.append(td); cuerpo.append(tr); return;
    }
    for (const p of productos) {
      const tr = document.createElement('tr');
      tr.append(celda(p.id_producto), celda(p.nombre), celda(USD.format(p.precio)));
      const estado = celda(''); const insignia = document.createElement('span');
      insignia.className = `productos-real-badge ${p.activo ? 'is-active' : 'is-inactive'}`;
      insignia.textContent = p.activo ? 'Activo' : 'Desactivado';
      estado.append(insignia); tr.append(estado);
      const acciones = celda('');
      acciones.append(boton('Editar', 'editar', p.id_producto), boton('Desactivar', 'desactivar', p.id_producto, !p.activo));
      tr.append(acciones); cuerpo.append(tr);
    }
  }
  async function listar() {
    cuerpo.replaceChildren();
    const tr = document.createElement('tr'); const td = celda('Consultando PostgreSQL…'); td.colSpan = 5; tr.append(td); cuerpo.append(tr);
    try {
      const lista = await api(API);
      if (!Array.isArray(lista)) throw new Error('La API no devolvió una lista de productos.');
      productos = lista;
      renderizar();
    } catch (e) {
      cuerpo.replaceChildren();
      const fila = document.createElement('tr'); const col = celda(e.message); col.colSpan = 5; fila.append(col); cuerpo.append(fila);
      avisar(e.message, 'error');
    }
  }
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!form.reportValidity()) return;
    const datos = { IdCategoria: Number(categoria.value), Nombre: nombre.value.trim(), Precio: Number(precio.value) };
    if (!datos.Nombre || datos.Precio <= 0) { avisar('Revisa nombre y precio.', 'error'); return; }
    const id = idField.value;
    if (!id) datos.IdEmprendimiento = 1; // Emprendimiento de prueba, backend sin autenticación todavía.
    guardar.disabled = true;
    try {
      await api(id ? `${API}/${id}` : API, { method: id ? 'PUT' : 'POST', body: JSON.stringify(datos) });
      restablecer();
      await listar();
      avisar(id ? 'Producto actualizado correctamente.' : 'Producto registrado correctamente.');
    } catch (err) { avisar(err.message, 'error'); }
    finally { guardar.disabled = false; }
  });
  cuerpo.addEventListener('click', async (e) => {
    const b = e.target.closest('button[data-accion]');
    if (!b) return;
    const id = Number(b.dataset.id), producto = productos.find(p => p.id_producto === id);
    if (!producto) return;
    if (b.dataset.accion === 'editar') {
      idField.value = String(id); nombre.value = producto.nombre; precio.value = producto.precio;
      categoria.value = '1'; // GET actual no devuelve id_categoria; datos de prueba usan ID 1.
      heading.textContent = `Editar producto #${id}`; subtitle.textContent = 'Modifica el nombre, categoría o precio.';
      guardar.textContent = 'Guardar cambios';
      avisar(`Editando: ${producto.nombre}`);
      nombre.focus(); window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (b.dataset.accion === 'desactivar') {
      if (!confirm(`¿Desactivar «${producto.nombre}»? El producto conservará su registro.`)) return;
      b.disabled = true;
      try { await api(`${API}/${id}`, { method: 'DELETE' }); await listar(); avisar(`Producto «${producto.nombre}» desactivado correctamente.`); }
      catch (err) { avisar(err.message, 'error'); b.disabled = false; }
    }
  });
  document.querySelector('#recargar').addEventListener('click', listar);
  document.querySelector('#cancelar').addEventListener('click', restablecer);
  listar();
})();
