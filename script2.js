let blocks = {};
let recipes = {};

// Crear un tooltip global y agregarlo al body
const tooltip = document.createElement('div');
tooltip.className = 'tooltip fixed bg-black text-white text-sm px-2 py-1 rounded opacity-0 transition-opacity duration-200 pointer-events-none';
tooltip.setAttribute('role', 'tooltip');
document.body.appendChild(tooltip);

// Función para mostrar tooltip en cualquier imagen de ítem
function enableTooltipForImages() {
    document.querySelectorAll('.item-img').forEach(img => {
        img.setAttribute('tabindex', '-1'); // Deshabilitar tab dentro de las listas
        img.setAttribute('role', 'button');

        img.onmousemove = (event) => {
            tooltip.style.opacity = '1';
            tooltip.style.left = `${event.pageX + 10}px`;
            tooltip.style.top = `${event.pageY - 10}px`;
            tooltip.textContent = img.alt;
        };

        img.onmouseleave = () => {
            tooltip.style.opacity = '0';
        };

        img.onfocus = () => {
            tooltip.style.opacity = '1';
            tooltip.style.left = `${img.getBoundingClientRect().right + 10}px`;
            tooltip.style.top = `${img.getBoundingClientRect().top}px`;
            tooltip.textContent = img.alt;
            img.classList.add('focused'); // Resaltar el elemento enfocado
        };

        img.onblur = () => {
            tooltip.style.opacity = '0';
            img.classList.remove('focused'); // Quitar el resaltado
        };

        img.onkeydown = (event) => {
            if (event.key === 'Enter') {
                const itemId = img.closest('.item').dataset.itemId;
                if (itemId) displayRecipe(itemId);
            }
        };
    });
}

// Cargar los datos JSON
async function loadJSON() {
    blocks = await fetch('./json/block.json').then(res => res.json());
    recipes = await fetch('./json/recipe.json').then(res => res.json());
    renderItemList();
}

// Renderizar lista de ítems
function renderItemList(filter = '') {
    const itemList = document.querySelector('.item-list');
    itemList.innerHTML = '';

    blocks.forEach(item => {
        if (item.name.toLowerCase().includes(filter.toLowerCase())) {
            const div = document.createElement('div');
            div.className = 'item p-2 cursor-pointer hover:bg-gray-200 flex items-center relative'; // Agregar 'relative' para posicionar la imagen de "no receta"
            div.dataset.itemId = item.id;
            div.setAttribute('tabindex', '0'); // Habilitar tab solo en el contenedor de la lista
            div.setAttribute('role', 'button');

            div.onclick = () => displayRecipe(item.id);

            div.onkeydown = (event) => {
                if (event.key === 'Enter') {
                    displayRecipe(item.id);
                } else if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
                    // Navegar con flechas izquierda/derecha en la lista
                    const items = Array.from(document.querySelectorAll('.item'));
                    const currentIndex = items.indexOf(div);
                    let nextIndex;

                    if (event.key === 'ArrowRight') {
                        nextIndex = currentIndex + 1;
                        if (nextIndex >= items.length) nextIndex = 0; // Circular
                    } else if (event.key === 'ArrowLeft') {
                        nextIndex = currentIndex - 1;
                        if (nextIndex < 0) nextIndex = items.length - 1; // Circular
                    }

                    items[nextIndex].focus();
                }
            };

            const img = document.createElement('img');
            img.src = `assets/${item.name}.png`;
            img.alt = item.displayName;
            img.className = 'item-img mr-2';

            img.onerror = () => {
                img.style.display = 'none';
                const text = document.createElement('span');
                text.textContent = item.displayName;
                div.appendChild(text);
            };

            div.appendChild(img);

            // Verificar si el ítem tiene receta
            if (!recipes[item.id]) {
                const noRecipeImg = document.createElement('img');
                noRecipeImg.src = 'assets/img/x.webp'; // Ruta de la imagen de "no receta"
                noRecipeImg.alt = 'No recipe';
                noRecipeImg.className = 'no-recipe-img absolute top-0 right-0 w-4 h-4'; // Estilos para posicionar la imagen
                div.appendChild(noRecipeImg);
            }

            itemList.appendChild(div);
        }
    });

    enableTooltipForImages();
}

// Mostrar receta de un ítem
function displayRecipe(itemId) {
    const gridCells = document.querySelectorAll('.grid-cell');
    gridCells.forEach(cell => cell.innerHTML = '');
    document.getElementById('craftable-items').innerHTML = '';
    document.getElementById('dependency-items').innerHTML = '';
    document.getElementById('selected-items').innerHTML = '';

    if (!recipes[itemId]) return;
    const recipe = recipes[itemId][0];

    if (recipe.inShape) {
        recipe.inShape.forEach((row, rowIndex) => {
            row.forEach((cell, colIndex) => {
                const index = rowIndex * 3 + colIndex;
                const block = blocks.find(b => b.id === cell);
                if (block) {
                    const img = document.createElement('img');
                    img.src = `assets/${block.name}.png`;
                    img.alt = block.displayName;
                    img.className = 'item-img';
                    img.setAttribute('tabindex', '-1');
                    img.setAttribute('role', 'button');

                    img.onerror = () => {
                        img.style.display = 'none';
                        const text = document.createElement('span');
                        text.textContent = block.displayName;
                        gridCells[index].appendChild(text);
                    };

                    gridCells[index].appendChild(img);
                }
            });
        });
    }

    const selectedItemsContainer = document.getElementById('selected-items');

    const selectedBlock = blocks.find(b => b.id === itemId);
    if (selectedBlock) {
        const selectedItemDiv = document.createElement('div');
        selectedItemDiv.className = 'selected-item';

        const img = document.createElement('img');
        img.src = `assets/${selectedBlock.name}.png`;
        img.alt = selectedBlock.displayName;
        img.className = 'item-img';
        img.setAttribute('tabindex', '-1');
        img.setAttribute('role', 'button');

        img.onerror = () => {
            img.style.display = 'none';
            const text = document.createElement('span');
            text.textContent = selectedBlock.displayName;
            selectedItemDiv.appendChild(text);
        };

        selectedItemDiv.appendChild(img);
        selectedItemsContainer.appendChild(selectedItemDiv);
    }

    showCraftableItems(itemId);
    showDependencies(itemId);
    enableTooltipForImages();
}

function showCraftableItems(itemId) {
    const craftableItemsContainer = document.getElementById('craftable-items');
    blocks.forEach(block => {
        recipes[block.id]?.forEach(recipe => {
            if (recipe.result === itemId) {
                const recipeItemDiv = document.createElement('div');
                recipeItemDiv.className = 'recipe-item';

                const img = document.createElement('img');
                img.src = `assets/${block.name}.png`;
                img.alt = block.displayName;
                img.className = 'item-img';
                img.setAttribute('tabindex', '-1');
                img.setAttribute('role', 'button');

                img.onerror = () => {
                    img.style.display = 'none';
                    const text = document.createElement('span');
                    text.textContent = block.displayName;
                    recipeItemDiv.appendChild(text);
                };

                recipeItemDiv.appendChild(img);
                craftableItemsContainer.appendChild(recipeItemDiv);
            }
        });
    });

    enableTooltipForImages();
}

function showDependencies(itemId) {
    const dependencyItemsContainer = document.getElementById('dependency-items');
    const seenItems = new Set();

    blocks.forEach(block => {
        recipes[block.id]?.forEach(recipe => {
            recipe.inShape?.forEach(row => {
                row.forEach(cell => {
                    if (cell === itemId && !seenItems.has(block.id)) {
                        const dependencyItemDiv = document.createElement('div');
                        dependencyItemDiv.className = 'recipe-item cursor-pointer hover:bg-gray-200 flex items-center';
                        dependencyItemDiv.setAttribute('tabindex', '0');
                        dependencyItemDiv.setAttribute('role', 'button');

                        const img = document.createElement('img');
                        img.src = `assets/${block.name}.png`;
                        img.alt = block.displayName;
                        img.className = 'item-img';
                        img.setAttribute('tabindex', '-1');
                        img.setAttribute('role', 'button');

                        img.onerror = () => {
                            img.style.display = 'none';
                            const text = document.createElement('span');
                            text.textContent = block.displayName;
                            dependencyItemDiv.appendChild(text);
                        };

                        dependencyItemDiv.onclick = () => displayRecipe(block.id);

                        dependencyItemDiv.onkeydown = (event) => {
                            if (event.key === 'Enter') {
                                displayRecipe(block.id);
                            } else if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
                                const items = Array.from(document.querySelectorAll('.recipe-item'));
                                const currentIndex = items.indexOf(dependencyItemDiv);
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

                        dependencyItemDiv.appendChild(img);
                        dependencyItemsContainer.appendChild(dependencyItemDiv);

                        seenItems.add(block.id);
                    }
                });
            });
        });
    });

    enableTooltipForImages();
}

document.getElementById('search').addEventListener('input', (e) => {
    const searchText = e.target.value.trim();
    renderItemList(searchText);
});

loadJSON();