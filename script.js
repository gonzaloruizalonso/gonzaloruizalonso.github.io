// script.js

let lists = [];
let currentList = null;
let history = null;

document.addEventListener('DOMContentLoaded', () => {
  // Cargo los datos
  fetch('lists.json')
    .then(res => res.json())
    .then(data => {
      lists = data.Item;
      renderLists();
    });

  // Añadir nuevo elemento con opción inicio/cola
  document.getElementById('add-btn').addEventListener('click', () => {
    if (!currentList) return;
    const name = prompt('Nombre del nuevo elemento:');
    if (!name) return;

    // Pregunto dónde añadir
    const alInicio = confirm('¿Quieres añadir el elemento al principio?\nOK → Principio · Cancelar → Final');

    const timestamp = Date.now();
    const newItem = {
      name,
      uniqueId: timestamp,
      date: new Date().toString(),
      isChecked: false,
      description: ""
    };

    if (alInicio) {
      currentList.itemList.unshift(newItem);
      history = { type: 'add-front', item: newItem };
    } else {
      currentList.itemList.push(newItem);
      history = { type: 'add-back', item: newItem };
    }

    // Recalculo posiciones en función del índice
    currentList.itemList.forEach((it, i) => it.position = i);

    renderItems(currentList);
    showUndo(alInicio ? 'Elemento añadido al principio' : 'Elemento añadido al final');
  });

  // Botón atrás
  document.getElementById('back-btn').addEventListener('click', () => {
    document.getElementById('detail-screen').classList.add('hidden');
    document.getElementById('list-screen').classList.remove('hidden');
    document.getElementById('back-btn').classList.add('hidden');
    document.getElementById('header-title').textContent = 'Ranked Lists';
    currentList = null;
  });
});

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

function openList(list) {
  currentList = list;
  history = null;
  document.getElementById('list-screen').classList.add('hidden');
  document.getElementById('detail-screen').classList.remove('hidden');
  document.getElementById('back-btn').classList.remove('hidden');
  document.getElementById('header-title').textContent = list.name;
  renderItems(list);
}

function renderItems(list) {
  const detailItems = document.getElementById('detail-items');
  detailItems.innerHTML = '';
  // Orden inicial por posición
  list.itemList
    .sort((a, b) => a.position - b.position)
    .forEach((item, idx) => {
      const div = document.createElement('div');
      div.className = 'item';
      div.dataset.id = item.uniqueId;
      div.innerHTML = `
        <span class="item-number">${idx + 1}</span>
        <span class="name">${item.name}</span>
        <span class="drag-handle">≡</span>
      `;
      detailItems.appendChild(div);
    });

  // Drag & drop con SortableJS
  if (window.sortable) window.sortable.destroy();
  window.sortable = Sortable.create(detailItems, {
    animation: 150,
    handle: '.drag-handle',
    onEnd: evt => {
      const oldList = list.itemList.slice();
      const moved = list.itemList.splice(evt.oldIndex, 1)[0];
      list.itemList.splice(evt.newIndex, 0, moved);
      // Recalculo posiciones
      list.itemList.forEach((it, i) => it.position = i);
      history = { type: 'move', prevList: oldList };
      renderItems(list);
      showUndo('Orden cambiado');
    }
  });
}

function showUndo(message) {
  const bar = document.getElementById('undo-bar');
  bar.firstChild.textContent = message;
  bar.classList.remove('hidden');

  const undoBtn = document.getElementById('undo-btn');
  undoBtn.onclick = () => {
    if (!history) return;
    if (history.type === 'add-front' || history.type === 'add-back') {
      // deshago la adición
      currentList.itemList = currentList.itemList.filter(
        it => it.uniqueId !== history.item.uniqueId
      );
    } else if (history.type === 'move') {
      // deshago el reordenamiento
      currentList.itemList = history.prevList;
    }
    // Recalculo posiciones tras deshacer
    currentList.itemList.forEach((it, i) => it.position = i);
    history = null;
    renderItems(currentList);
    bar.classList.add('hidden');
  };

  // Ocultar tras 5s si no interactúan
  clearTimeout(bar._timeout);
  bar._timeout = setTimeout(() => {
    bar.classList.add('hidden');
    history = null;
  }, 5000);
}
