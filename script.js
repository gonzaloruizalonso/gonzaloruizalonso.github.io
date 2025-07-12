// script.js

let lists = [];
let currentList = null;
let history = null;

document.addEventListener('DOMContentLoaded', () => {
  loadLists();
  setupFloatingButtons();
  document.getElementById('back-btn').addEventListener('click', backToLists);
});

//
// Carga inicial de listas desde el JSON estático o localStorage
//
async function loadLists() {
  try {
    const res  = await fetch("lists.json");
    const data = await res.json();
    lists = data.Item;
  } catch (e) {
    console.error("Error cargando lists.json:", e);
    lists = [];
  }
  renderLists();
}

//
// Envía el estado actual de `lists` a la Function de Netlify,
// que a su vez comitea el cambio en GitHub
//
async function saveListsOnServer() {
  try {
    const resp = await fetch("/.netlify/functions/updateLists", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ lists })
    });
    if (!resp.ok) {
      const err = await resp.text();
      throw new Error(err || `HTTP ${resp.status}`);
    }
  } catch (e) {
    console.error("Error al guardar en GitHub:", e);
    alert("Error al guardar cambios: " + e.message);
  }
}

//
// Pinta la pantalla de selección de listas
//
function renderLists() {
  const container = document.getElementById("list-screen");
  container.innerHTML = "";
  lists.forEach(list => {
    const card = document.createElement("div");
    card.className = "list-card";
    card.textContent = list.name;
    card.addEventListener("click", () => openList(list));
    container.appendChild(card);
  });
}

//
// Abre la vista de detalle de una lista concreta
//
function openList(list) {
  currentList = list;
  history     = null;
  document.getElementById("list-screen").classList.add("hidden");
  document.getElementById("detail-screen").classList.remove("hidden");
  document.getElementById("back-btn").classList.remove("hidden");
  document.getElementById("header-title").textContent = list.name;
  renderItems();
}

function backToLists() {
  document.getElementById("detail-screen").classList.add("hidden");
  document.getElementById("list-screen").classList.remove("hidden");
  document.getElementById("back-btn").classList.add("hidden");
  document.getElementById("header-title").textContent = "Ranked Lists";
  currentList = null;
}

//
// Renderiza los ítems de la lista, añade drag & drop y handlers
//
function renderItems() {
  const detailItems = document.getElementById("detail-items");
  detailItems.innerHTML = "";

  currentList.itemList
    .sort((a, b) => a.position - b.position)
    .forEach((item, idx) => {
      const div = document.createElement("div");
      div.className = "item";
      div.dataset.id = item.uniqueId;
      div.innerHTML = `
        <span class="delete-btn">×</span>
        <span class="item-number">${idx + 1}</span>
        <span class="name">${item.name}</span>
        <span class="drag-handle">≡</span>
      `;
      // Borrar
      div.querySelector(".delete-btn")
         .addEventListener("click", () => tryDelete(item, idx));
      detailItems.appendChild(div);
    });

  // Drag & drop con SortableJS
  if (window.sortable) window.sortable.destroy();
  window.sortable = Sortable.create(detailItems, {
    animation: 150,
    handle: ".drag-handle",
    onEnd: async evt => {
      const old = currentList.itemList.slice();
      const moved = currentList.itemList.splice(evt.oldIndex, 1)[0];
      currentList.itemList.splice(evt.newIndex, 0, moved);
      currentList.itemList.forEach((it, i) => it.position = i);
      history = { type: "move", prev: old };
      renderItems();
      await saveListsOnServer();
      showUndo("Orden cambiado");
    }
  });
}

//
// Intento de borrado con confirmación y persistencia
//
async function tryDelete(item, idx) {
  if (!confirm("¿Eliminar este elemento?")) return;
  history = { type: "delete", item, index: idx };
  currentList.itemList.splice(idx, 1);
  currentList.itemList.forEach((it, i) => it.position = i);
  renderItems();
  await saveListsOnServer();
  showUndo("Elemento eliminado");
}

//
// Snackbar de deshacer
//
function showUndo(msg) {
  const bar = document.getElementById("undo-bar");
  document.getElementById("undo-msg").textContent = msg;
  bar.classList.remove("hidden");

  const btn = document.getElementById("undo-btn");
  btn.onclick = async () => {
    if (!history) return;
    const L = currentList.itemList;
    if (history.type === "delete") {
      L.splice(history.index, 0, history.item);
    } else if (history.type === "move") {
      currentList.itemList = history.prev;
    }
    currentList.itemList.forEach((it, i) => it.position = i);
    history = null;
    renderItems();
    await saveListsOnServer();
    bar.classList.add("hidden");
  };

  clearTimeout(bar._timeout);
  bar._timeout = setTimeout(() => {
    bar.classList.add("hidden");
    history = null;
  }, 5000);
}

//
// Botones flotantes: añadir, subir y bajar
//
function setupFloatingButtons() {
  const detailItems = document.getElementById("detail-items");

  // Añadir elemento (principio/cola)
  document.getElementById("add-btn")
    .addEventListener("click", async () => {
      if (!currentList) return;
      const name = prompt("Nombre del nuevo elemento:");
      if (!name) return;
      const front = confirm("OK → al principio\nCancelar → al final");
      const ts = Date.now();
      const newItem = {
        name,
        uniqueId: ts,
        date: new Date().toString(),
        isChecked: false,
        description: ""
      };
      if (front) currentList.itemList.unshift(newItem);
      else       currentList.itemList.push(newItem);
      currentList.itemList.forEach((it, i) => it.position = i);
      history = {
        type:  front ? "add-front" : "add-back",
        item:  newItem,
        index: front ? 0 : currentList.itemList.length - 1
      };
      renderItems();
      await saveListsOnServer();
      showUndo(front ? "Añadido al principio" : "Añadido al final");
    });

  // Subir al inicio de la lista (scroll interno)
  document.getElementById("scroll-top")
    .addEventListener("click", () => {
      detailItems.scrollTo({ top: 0, behavior: "smooth" });
    });

  // Bajar al final de la lista (scroll interno)
  document.getElementById("scroll-bottom")
    .addEventListener("click", () => {
      detailItems.scrollTo({ top: detailItems.scrollHeight, behavior: "smooth" });
    });
}
