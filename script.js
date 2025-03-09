let blocks = {};
let recipes = {};
let gridState = Array(9).fill(null);
let selectedItem = null;
let isTouchDevice = 'ontouchstart' in window;

const tooltip = document.createElement('div');
tooltip.className = 'tooltip fixed bg-black text-white text-sm px-2 py-1 rounded opacity-0 transition-opacity duration-200 pointer-events-none';
document.body.appendChild(tooltip);

function enableTooltipForImages() {
    document.querySelectorAll('.item-img').forEach(img => {
        img.onmousemove = (event) => {
            tooltip.style.opacity = '1';
            tooltip.style.left = `${event.pageX + 10}px`;
            tooltip.style.top = `${event.pageY - 10}px`;
            tooltip.textContent = img.alt;
        };
        img.onmouseleave = () => {
            tooltip.style.opacity = '0';
        };
    });
}

async function loadJSON() {
    blocks = await fetch('./json/block.json').then(res => res.json());
    recipes = await fetch('./json/recipe.json').then(res => res.json());
    renderItemList();
    renderGrid();
}

function renderItemList(filter = '') {
    const itemList = document.querySelector('.item-list');
    itemList.innerHTML = '';
    blocks.forEach(item => {
        if (item.name.toLowerCase().includes(filter.toLowerCase())) {
            const div = document.createElement('div');
            div.className = 'p-2 cursor-pointer hover:bg-gray-200 flex items-center';
            div.setAttribute('tabindex', '0');
            div.setAttribute('role', 'button');

            if (isTouchDevice) {
                div.onclick = () => {
                    selectedItem = item.id;
                    document.querySelectorAll('.item-list > div').forEach(el => el.classList.remove('bg-blue-200'));
                    div.classList.add('bg-blue-200');
                };
            } else {
                div.draggable = true;
                div.ondragstart = (event) => drag(event, item.id);
            }

            div.onkeydown = (event) => {
                if (event.key === 'Enter') {
                    const itemId = item.id;
                    if (itemId) displayRecipe(itemId);
                } else if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
                    const items = Array.from(document.querySelectorAll('.item-list > div'));
                    const currentIndex = items.indexOf(div);
                    let nextIndex;

                    if (event.key === 'ArrowRight') {
                        nextIndex = currentIndex + 1;
                        if (nextIndex >= items.length) nextIndex = 0;
                    } else if (event.key === 'ArrowLeft') {
                        nextIndex = currentIndex - 1;
                        if (nextIndex < 0) nextIndex = items.length - 1;
                    }

                    items[nextIndex].focus();
                }
            };

            const img = document.createElement('img');
            img.src = `assets/${item.name}.png`;
            img.alt = item.displayName;
            img.className = 'item-img mr-2';
            div.appendChild(img);
            itemList.appendChild(div);
        }
    });

    enableTooltipForImages(); // Activar tooltip en los ítems de la lista
}

function renderGrid() {
    const grid = document.getElementById('crafting-grid');
    grid.innerHTML = '';
    gridState.forEach((itemId, index) => {
        const cell = document.createElement('div');
        cell.className = 'grid-cell';
        cell.setAttribute('tabindex', '0'); // Habilitar tab en las celdas de la cuadrícula
        cell.setAttribute('role', 'button');

        if (isTouchDevice) {
            // Comportamiento para dispositivos táctiles
            cell.onclick = () => {
                if (selectedItem !== null) {
                    gridState[index] = selectedItem; // Colocar el ítem seleccionado en la celda
                    selectedItem = null; // Deseleccionar el ítem
                    document.querySelectorAll('.item-list > div').forEach(el => el.classList.remove('bg-blue-200'));
                    renderGrid();
                }
            };
        } else {
            // Comportamiento para PC (arrastrar y soltar)
            cell.ondrop = (event) => drop(event, index);
            cell.ondragover = (event) => allowDrop(event);
        }

        cell.onkeydown = (event) => {
            if (event.key === 'Enter') {
                const itemId = gridState[index];
                if (itemId) displayRecipe(itemId);
            } else if (event.key === 'ArrowRight' || event.key === 'ArrowLeft' || event.key === 'ArrowUp' || event.key === 'ArrowDown') {
                // Navegar con flechas en la cuadrícula
                const cells = Array.from(document.querySelectorAll('.grid-cell'));
                const currentIndex = cells.indexOf(cell);
                let nextIndex;

                if (event.key === 'ArrowRight') {
                    nextIndex = currentIndex + 1;
                    if (nextIndex >= cells.length) nextIndex = 0; // Circular
                } else if (event.key === 'ArrowLeft') {
                    nextIndex = currentIndex - 1;
                    if (nextIndex < 0) nextIndex = cells.length - 1; // Circular
                } else if (event.key === 'ArrowDown') {
                    nextIndex = currentIndex + 3;
                    if (nextIndex >= cells.length) nextIndex = currentIndex % 3; // Circular
                } else if (event.key === 'ArrowUp') {
                    nextIndex = currentIndex - 3;
                    if (nextIndex < 0) nextIndex = cells.length - 3 + (currentIndex % 3); // Circular
                }

                cells[nextIndex].focus();
            }
        };

        if (itemId) {
            const block = blocks.find(b => b.id === itemId);
            if (block) {
                const img = document.createElement('img');
                img.src = `assets/${block.name}.png`;
                img.alt = block.displayName;
                img.className = 'item-img';
                cell.appendChild(img);
            }
        }
        grid.appendChild(cell);
    });

    enableTooltipForImages();
    checkCraftingResult();
}

function allowDrop(event) {
    event.preventDefault();
}

function drag(event, itemId) {
    event.dataTransfer.setData("text", itemId);
}

function drop(event, index) {
    event.preventDefault();
    const itemId = parseInt(event.dataTransfer.getData("text"));
    gridState[index] = itemId;
    renderGrid();
}

function resetGrid() {
    gridState.fill(null);
    renderGrid();
}

function countItems(grid) {
    let countMap = {};
    grid.forEach(item => {
        if (item !== null) {
            countMap[item] = (countMap[item] || 0) + 1;
        }
    });
    return countMap;
}

function checkCraftingResult() {
    const gridItems = gridState;
    let craftedItem = null;

    const sortedRecipes = Object.keys(recipes).sort((a, b) => {
        const sizeA = recipes[a][0].inShape ? recipes[a][0].inShape.length * recipes[a][0].inShape[0].length : 0;
        const sizeB = recipes[b][0].inShape ? recipes[b][0].inShape.length * recipes[b][0].inShape[0].length : 0;
        return sizeB - sizeA;
    });

    for (const recipeId of sortedRecipes) {
        recipes[recipeId].forEach(recipe => {
            if (recipe.inShape) {
                const shape = [].concat(...recipe.inShape);

                let recipeItemCount = {};
                shape.forEach(item => {
                    if (item !== null) {
                        recipeItemCount[item] = (recipeItemCount[item] || 0) + 1;
                    }
                });

                let gridItemCount = countItems(gridItems);

                for (let key in gridItemCount) {
                    if (gridItemCount[key] > (recipeItemCount[key] || 0)) {
                        return;
                    }
                }

                const recipeRows = recipe.inShape.length;
                const recipeCols = recipe.inShape[0].length;
                let match = false;

                for (let i = 0; i <= 3 - recipeRows; i++) {
                    for (let j = 0; j <= 3 - recipeCols; j++) {
                        let subGrid = [];
                        for (let k = 0; k < recipeRows; k++) {
                            for (let l = 0; l < recipeCols; l++) {
                                subGrid.push(gridItems[(i + k) * 3 + (j + l)]);
                            }
                        }

                        if (JSON.stringify(subGrid) === JSON.stringify(shape)) {
                            match = true;
                            break;
                        }
                    }
                    if (match) break;
                }

                if (match) {
                    craftedItem = blocks.find(b => b.id === recipe.result.id);
                }
            }
        });

        if (craftedItem) break;
    }

    const resultContainer = document.getElementById('craftable-items');
    resultContainer.innerHTML = '';
    if (craftedItem) {
        const img = document.createElement('img');
        img.src = `assets/${craftedItem.name}.png`;
        img.alt = craftedItem.displayName;
        img.className = 'item-img';
        resultContainer.appendChild(img);
    }

    enableTooltipForImages();
}

document.getElementById('search').addEventListener('input', (e) => {
    renderItemList(e.target.value.trim());
});

loadJSON();