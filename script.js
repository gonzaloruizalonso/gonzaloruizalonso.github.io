// script.js

let lists = [];
let currentList = null;
let history = null;

document.addEventListener('DOMContentLoaded', () => {
  loadLists();
  setupFloatingButtons();
  document.getElementById('back-btn').addEventListener('click', backToLists);
});

// Carga inicial de listas desde la Function de Netlify (GET)
async function loadLists() {
  try {
    const res = await fetch('/.netlify/functions/updateLists');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    lists = data.lists || [];
  } catch (e) {
    console.error('Error cargando listas:', e);
    lists = [];
  }
  renderLists();
}

// Guarda el estado actual de `lists` en GitHub vía la Function (POST)
async function saveListsOnServer() {
  try {
    const resp = await fetch('/.netlify/functions/updateLists', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lists })
    });
    if (!resp.ok) {
      const err = await resp.text();
      throw new Error(err || `HTTP ${resp.status}`);
    }
  } catch (e) {
    console.error('Error al guardar en GitHub:', e);
    alert('Error al guardar cambios: ' + e.message);
  }
}

// Muestra todas las listas disponibles
function renderLists() {
  const container = document.getElementById('list-screen');
  container.innerHTML = '';
  lists.forEach(list => {
    const card = document.createElement('div');
    card.className = 'list-card';
    card.textContent = list.name;
    card.addEventListener('click', () => openList(list));
    container.appendChild(card);
  });
}

// Abre la vista de detalle de una lista concreta
function openList(list) {
  currentList = list;
  history = null;
  document.getElementById('list-screen').classList.add('hidden');
  document.getElementById('detail-screen').classList.remove('hidden');
  document.getElementById('back-btn').classList.remove('hidden');
  document.getElementById('header-title').textContent = list.name;
  renderItems();
}

// Vuelve a la vista de selección de listas
function backToLists() {
  document.getElementById('detail-screen').classList.add('hidden');
  document.getElementById('list-screen').classList.remove('hidden');
  document.getElementById('back-btn').classList.add('hidden');
  document.getElementById('header-title').textContent = 'Ranked Lists';
  currentList = null;
}

// Renderiza los ítems dentro de la lista abierta
function renderItems() {
  const detailItems = document.getElementById('detail-items');
  detailItems.innerHTML = '';

  currentList.itemList
    .sort((a, b) => a.position - b.position)
    .forEach((item, idx) => {
      const div = document.createElement('div');
      div.className = 'item';
      div.dataset.id = item.uniqueId;
      div.innerHTML = `
        <span class="delete-btn">×</span>
        <span class="item-number">${idx + 1}</span>
        <span class="name">${item.name}</span>
        <span class="drag-handle">≡</span>
      `;
      div.querySelector('.delete-btn')
         .addEventListener('click', () => tryDelete(item, idx));
      detailItems.appendChild(div);
    });

  if (window.sortable) window.sortable.destroy();
  window.sortable = Sortable.create(detailItems, {
    animation: 150,
    handle: '.drag-handle',
    onEnd: async evt => {
      const old = currentList.itemList.slice();
      const moved = currentList.itemList.splice(evt.oldIndex, 1)[0];
      currentList.itemList.splice(evt.newIndex, 0, moved);
      currentList.itemList.forEach((it, i) => it.position = i);
      history = { type: 'move', prev: old };
      renderItems();
      await saveListsOnServer();
      showUndo('Orden cambiado');
    }
  });
}

// Elimina un ítem con confirmación y guarda cambios
async function tryDelete(item, idx) {
  if (!confirm('¿Eliminar este elemento?')) return;
  history = { type: 'delete', item, index: idx };
  currentList.itemList.splice(idx, 1);
  currentList.itemList.forEach((it, i) => it.position = i);
  renderItems();
  await saveListsOnServer();
  showUndo('Elemento eliminado');
}

// Muestra snackbar de Deshacer
function showUndo(msg) {
  const bar = document.getElementById('undo-bar');
  document.getElementById('undo-msg').textContent = msg;
  bar.classList.remove('hidden');
  const btn = document.getElementById('undo-btn');
  btn.onclick = async () => {
    if (!history) return;
    const L = currentList.itemList;
    if (history.type === 'delete') L.splice(history.index, 0, history.item);
    else if (history.type === 'move') currentList.itemList = history.prev;
    currentList.itemList.forEach((it, i) => it.position = i);
    history = null;
    renderItems();
    await saveListsOnServer();
    bar.classList.add('hidden');
  };
  clearTimeout(bar._timeout);
  bar._timeout = setTimeout(() => { bar.classList.add('hidden'); history = null; }, 5000);
}

// Configura botones flotantes: añadir, subir y bajar (scroll en ventana)
function setupFloatingButtons() {
  document.getElementById('add-btn')
    .addEventListener('click', async () => {
      if (!currentList) return;
      const name = prompt('Nombre del nuevo elemento:');
      if (!name) return;
      const front = confirm('OK → al principio\nCancelar → al final');
      const ts = Date.now();
      const newItem = { name, uniqueId: ts, date: new Date().toString(), isChecked: false, description: '' };
      if (front) currentList.itemList.unshift(newItem);
      else       currentList.itemList.push(newItem);
      currentList.itemList.forEach((it, i) => it.position = i);
      history = { type: front ? 'add-front' : 'add-back', item: newItem, index: front ? 0 : currentList.itemList.length - 1 };
      renderItems();
      await saveListsOnServer();
      showUndo(front ? 'Añadido al principio' : 'Añadido al final');
    });

  // Scroll ventana al top
  document.getElementById('scroll-top')
    .addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  // Scroll ventana al bottom
  document.getElementById('scroll-bottom')
    .addEventListener('click', () => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }));
}
