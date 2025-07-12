// script.js

let lists = [];
let currentList = null;
let history = null;

document.addEventListener('DOMContentLoaded', () => {
  loadLists();
  setupFloatingButtons();
  document.getElementById('back-btn')
    .addEventListener('click', backToLists);
});

function loadLists() {
  const saved = localStorage.getItem('listsData');
  if (saved) {
    lists = JSON.parse(saved);
    renderLists();
  } else {
    fetch('lists.json')
      .then(r => r.json())
      .then(data => {
        lists = data.Item;
        saveLists();
        renderLists();
      });
  }
}

function saveLists() {
  localStorage.setItem('listsData', JSON.stringify(lists));
}

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
  renderItems();
}

function backToLists() {
  document.getElementById('detail-screen').classList.add('hidden');
  document.getElementById('list-screen').classList.remove('hidden');
  document.getElementById('back-btn').classList.add('hidden');
  document.getElementById('header-title').textContent = 'Ranked Lists';
  currentList = null;
}

function renderItems() {
  const detailItems = document.getElementById('detail-items');
  detailItems.innerHTML = '';

  // Orden por posición
  currentList.itemList
    .sort((a,b) => a.position - b.position)
    .forEach((item, idx) => {
      const div = document.createElement('div');
      div.className = 'item';
      div.dataset.id = item.uniqueId;
      div.innerHTML = `
        <span class="delete-btn">×</span>
        <span class="item-number">${idx+1}</span>
        <span class="name">${item.name}</span>
        <span class="drag-handle">≡</span>
      `;
      // delete
      div.querySelector('.delete-btn')
         .addEventListener('click', ()=> tryDelete(item, idx));
      detailItems.appendChild(div);
    });

  // drag & drop
  if (window.sortable) window.sortable.destroy();
  window.sortable = Sortable.create(detailItems, {
    animation: 150,
    handle: '.drag-handle',
    onEnd: evt => {
      const old = currentList.itemList.slice();
      const moved = currentList.itemList.splice(evt.oldIndex,1)[0];
      currentList.itemList.splice(evt.newIndex,0,moved);
      currentList.itemList.forEach((it,i)=> it.position=i);
      history = { type:'move', prev: old };
      renderItems();
      saveLists();
      showUndo('Orden cambiado');
    }
  });
}

function tryDelete(item, idx) {
  if (!confirm('¿Eliminar este elemento?')) return;
  history = { type:'delete', item, index: idx };
  currentList.itemList.splice(idx,1);
  currentList.itemList.forEach((it,i)=> it.position=i);
  renderItems();
  saveLists();
  showUndo('Elemento eliminado');
}

function showUndo(msg) {
  const bar = document.getElementById('undo-bar');
  document.getElementById('undo-msg').textContent = msg;
  bar.classList.remove('hidden');

  const btn = document.getElementById('undo-btn');
  btn.onclick = () => {
    if (!history) return;
    const L = currentList.itemList;
    if (history.type==='delete') {
      L.splice(history.index,0,history.item);
    } else if (history.type==='move') {
      currentList.itemList = history.prev;
    }
    currentList.itemList.forEach((it,i)=> it.position=i);
    history = null;
    renderItems();
    saveLists();
    bar.classList.add('hidden');
  };

  clearTimeout(bar._h);
  bar._h = setTimeout(()=>{
    bar.classList.add('hidden');
    history = null;
  },5000);
}

function setupFloatingButtons() {
  // añadir
  document.getElementById('add-btn')
    .addEventListener('click', ()=> {
      if (!currentList) return;
      const name = prompt('Nombre del nuevo elemento:');
      if (!name) return;
      const front = confirm('OK → al principio\nCancelar → al final');
      const ts = Date.now();
      const newItem = { name, uniqueId:ts, date:new Date().toString(),
                        isChecked:false, description:"" };
      if (front) currentList.itemList.unshift(newItem);
      else       currentList.itemList.push(newItem);
      currentList.itemList.forEach((it,i)=> it.position=i);
      history = { type: front?'add-front':'add-back', item:newItem,
                  index: front?0:currentList.itemList.length-1 };
      renderItems();
      saveLists();
      showUndo(front?'Añadido al principio':'Añadido al final');
    });

  // scroll top
  document.getElementById('scroll-top')
    .addEventListener('click', ()=> window.scrollTo({top:0,behavior:'smooth'}));
  // scroll bottom
  document.getElementById('scroll-bottom')
    .addEventListener('click', ()=> window.scrollTo({
      top: document.body.scrollHeight,
      behavior:'smooth'
    }));
}
