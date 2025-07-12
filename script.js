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

  // Añadir nuevo elemento
  document.getElementById('add-btn').addEventListener('click', () => {
    if (!currentList) return;
    const name = prompt('Nombre del nuevo elemento:');
    if (name) {
      const timestamp = Date.now();
      const newItem = {
        name,
        position: timestamp,
        uniqueId: timestamp,
        date: new Date().toString(),
        isChecked: false,
        description: ""
      };
      currentList.itemList.push(newItem);
      renderItems(currentList);
      history = { type: 'add', item: newItem };
      showUndo();
    }
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
    .forEach(item => {
      const div = document.createElement('div');
      div.className = 'item';
      div.dataset.id = item.uniqueId;
      div.innerHTML = `<span>${item.name}</span><span>≡</span>`;
      detailItems.appendChild(div);
    });

  // Inicializo Sortable (y destruyo la anterior si existe)
  if (window.sortable) window.sortable.destroy();
  window.sortable = Sortable.create(detailItems, {
    animation: 150,
    onEnd: evt => {
      // guardo copia del estado anterior
      const oldList = list.itemList.slice();
      // actualizo array según el drag & drop
      const moved = list.itemList.splice(evt.oldIndex, 1)[0];
      list.itemList.splice(evt.newIndex, 0, moved);
      // recalculo posiciones
      list.itemList.forEach((it, i) => it.position = i);
      history = { type: 'move', prevList: oldList };
      showUndo();
    }
  });
}

function showUndo() {
  const bar = document.getElementById('undo-bar');
  const undoBtn = document.getElementById('undo-btn');
  bar.classList.remove('hidden');

  undoBtn.onclick = () => {
    if (!history) return;
    if (history.type === 'add') {
      // deshago la adición
      currentList.itemList = currentList.itemList.filter(
        it => it.uniqueId !== history.item.uniqueId
      );
      renderItems(currentList);
    } else if (history.type === 'move') {
      // deshago el reordenamiento
      currentList.itemList = history.prevList;
      renderItems(currentList);
    }
    history = null;
    bar.classList.add('hidden');
  };

  // oculta automáticamente la barra tras 5s
  setTimeout(() => {
    bar.classList.add('hidden');
    history = null;
  }, 5000);
}
