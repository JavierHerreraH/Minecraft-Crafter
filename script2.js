let blocks = {};
let recipes = {};

async function loadJSON() {
    blocks = await fetch('./json/block.json').then(res => res.json());
    recipes = await fetch('./json/recipe.json').then(res => res.json());
    renderItemList();
}

function renderItemList(filter = '') {
    const itemList = document.querySelector('.item-list');
    itemList.innerHTML = '';
    blocks.forEach(item => {
        // Filtramos los ítems que coincidan con la palabra clave
        if (item.name.toLowerCase().includes(filter.toLowerCase())) {
            const div = document.createElement('div');
            div.className = 'p-2 cursor-pointer hover:bg-gray-200 flex items-center';
            div.onclick = () => displayRecipe(item.id);
            
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
            itemList.appendChild(div);
        }
    });
}

function displayRecipe(itemId) {
    const gridCells = document.querySelectorAll('.grid-cell');
    gridCells.forEach(cell => cell.innerHTML = '');
    document.getElementById('craftable-items').innerHTML = '';
    document.getElementById('dependency-items').innerHTML = '';

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

    // Mostrar el ítem seleccionado en la sección selected-items
    const selectedItemsContainer = document.getElementById('selected-items');
    selectedItemsContainer.innerHTML = ''; // Limpiar el contenedor antes de añadir el nuevo ítem

    const selectedBlock = blocks.find(b => b.id === itemId);
    if (selectedBlock) {
        const selectedItemDiv = document.createElement('div');
        selectedItemDiv.className = 'selected-item';

        const img = document.createElement('img');
        img.src = `assets/${selectedBlock.name}.png`;
        img.alt = selectedBlock.displayName;
        img.className = 'item-img';
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
                        
                        const img = document.createElement('img');
                        img.src = `assets/${block.name}.png`;
                        img.alt = block.displayName;
                        img.className = 'item-img';
                        img.onerror = () => {
                            img.style.display = 'none';
                            const text = document.createElement('span');
                            text.textContent = block.displayName;
                            dependencyItemDiv.appendChild(text);
                        };

                        dependencyItemDiv.onclick = () => displayRecipe(block.id);

                        dependencyItemDiv.appendChild(img);
                        dependencyItemsContainer.appendChild(dependencyItemDiv);

                        seenItems.add(block.id);
                    }
                });
            });
        });
    });
}

// Evento de búsqueda
document.getElementById('search').addEventListener('input', (e) => {
    const searchText = e.target.value.trim();
    renderItemList(searchText);
});

loadJSON();
