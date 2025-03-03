let blocks = {};
let recipes = {};
let gridState = Array(9).fill(null);

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
            div.draggable = true;
            div.ondragstart = (event) => drag(event, item.id);

            const img = document.createElement('img');
            img.src = `assets/${item.name}.png`;
            img.alt = item.displayName;
            img.className = 'item-img mr-2';
            div.appendChild(img);
            itemList.appendChild(div);
        }
    });
}

function renderGrid() {
    const grid = document.getElementById('crafting-grid');
    grid.innerHTML = '';
    gridState.forEach((itemId, index) => {
        const cell = document.createElement('div');
        cell.className = 'grid-cell';
        cell.ondrop = (event) => drop(event, index);
        cell.ondragover = (event) => allowDrop(event);
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
}

document.getElementById('search').addEventListener('input', (e) => {
    renderItemList(e.target.value.trim());
});

loadJSON();
