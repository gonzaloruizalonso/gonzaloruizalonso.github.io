// script.js
document.addEventListener("DOMContentLoaded", async () => {
  const res  = await fetch("lists.json");
  const json = await res.json();
  const lists = json.Item;       // tu estructura original

  // DOM
  const listScreen   = document.getElementById("list-screen");
  const detailScreen = document.getElementById("detail-screen");
  const headerTitle  = document.getElementById("header-title");
  const backBtn      = document.getElementById("back-btn");
  const detailItems  = document.getElementById("detail-items");
  const addBtn       = document.getElementById("add-btn");
  const undoBtn      = document.getElementById("undo-btn");

  let activeListIdx = null;
  let lastState     = null;  // para deshacer

  // Guarda copia profunda del estado anterior
  function snapshot() {
    lastState = JSON.stringify(lists);
    undoBtn.classList.remove("hidden");
  }

  // Restaura último snapshot
  function undo() {
    if (!lastState) return;
    const prev = JSON.parse(lastState);
    lists.splice(0, lists.length, ...prev);
    undoBtn.classList.add("hidden");
    if (activeListIdx !== null) {
      renderDetail(lists[activeListIdx]);
    } else {
      renderListScreen();
    }
  }

  // Muestra lista principal
  function showListScreen() {
    activeListIdx = null;
    headerTitle.textContent = "Ranked Lists";
    backBtn.classList.add("hidden");
    detailScreen.classList.add("hidden");
    listScreen.classList.remove("hidden");
    renderListScreen();
  }

  // Renderiza tarjetas de lista
  function renderListScreen() {
    listScreen.innerHTML = "";
    lists.forEach((list, idx) => {
      const card = document.createElement("div");
      card.className = "list-card";
      card.innerHTML = `
        <span>${list.name}</span>
        <span>${list.itemList.length}</span>
      `;
      card.addEventListener("click", () => showDetailScreen(idx));
      listScreen.appendChild(card);
    });
  }

  // Pasa a detalle
  function showDetailScreen(idx) {
    snapshot();
    activeListIdx = idx;
    const list = lists[idx];
    headerTitle.textContent = list.name;
    backBtn.classList.remove("hidden");
    listScreen.classList.add("hidden");
    detailScreen.classList.remove("hidden");
    renderDetail(list);
  }

  // Renderiza items y habilita drag&drop
  function renderDetail(list) {
    detailItems.innerHTML = "";
    // Ordenar por position
    const ordered = [...list.itemList].sort((a,b)=>a.position-b.position);

    ordered.forEach((item, i) => {
      const div = document.createElement("div");
      div.className = "item";
      div.setAttribute("data-index", i);
      div.textContent = `${i+1}. ${item.name}`;
      detailItems.appendChild(div);
    });

    new Sortable(detailItems, {
      animation: 150,
      onEnd: e => {
        snapshot();
        const oldIdx = e.oldIndex, newIdx = e.newIndex;
        const items = ordered.slice();
        const [moved] = items.splice(oldIdx,1);
        items.splice(newIdx,0,moved);
        // Recalcular posiciones
        items.forEach((it,pos)=>it.position=pos);
        list.itemList = items;
        renderDetail(list);
      }
    });
  }

  // Añadir elemento en detalle
  addBtn.addEventListener("click", () => {
    if (activeListIdx === null) return;
    snapshot();
    const name = prompt("Nombre del nuevo elemento:");
    if (name && name.trim()) {
      const list = lists[activeListIdx];
      // nueva posición al final
      list.itemList.push({ name: name.trim(), position: list.itemList.length });
      renderDetail(list);
    }
  });

  // Atrás y deshacer
  backBtn.addEventListener("click", showListScreen);
  undoBtn.addEventListener("click", undo);

  // Inicia
  showListScreen();
});
