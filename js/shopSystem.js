export class ShopSystem {
    constructor(gameState, itemSystem, uiManager) {
        this.gameState = gameState;
        this.itemSystem = itemSystem;
        this.uiManager = uiManager;
        this.shopItems = [];
        this.isShopOpen = false;
        this.shopElement = null;
        this.createShopElement();
    }

    createShopElement() {
        // Create shop modal
        this.shopElement = document.createElement('div');
        this.shopElement.id = 'item-shop';
        this.shopElement.className = 'modal hidden';
        
        const content = document.createElement('div');
        content.className = 'modal-content shop-content';
        
        const title = document.createElement('h2');
        title.textContent = 'Daily Item Shop';
        
        const subtitle = document.createElement('p');
        subtitle.textContent = 'Select one item to help meet your quota:';
        
        const itemContainer = document.createElement('div');
        itemContainer.id = 'shop-items';
        itemContainer.className = 'shop-item-container';
        
        content.appendChild(title);
        content.appendChild(subtitle);
        content.appendChild(itemContainer);
        
        this.shopElement.appendChild(content);
        document.body.appendChild(this.shopElement);
    }

    openShop() {
        this.generateShopItems();
        this.renderShopItems();
        this.shopElement.classList.remove('hidden');
        this.isShopOpen = true;
    }

    closeShop() {
        this.shopElement.classList.add('hidden');
        this.isShopOpen = false;
    }

    generateShopItems() {
        this.shopItems = [];
        const numChoices = 3;
        
        // Generate multiple items to choose from
        for (let i = 0; i < numChoices; i++) {
            const item = this.itemSystem.generateRandomItem();
            
            // Ensure no duplicate items in the shop
            if (!this.shopItems.some(shopItem => shopItem.id === item.id)) {
                this.shopItems.push(item);
            } else {
                // Try again if we got a duplicate
                i--;
            }
        }
    }

    renderShopItems() {
        const container = document.getElementById('shop-items');
        container.innerHTML = '';
        
        this.shopItems.forEach(item => {
            const itemElement = document.createElement('div');
            itemElement.className = 'shop-item';
            
            const iconElement = document.createElement('div');
            iconElement.className = 'item-icon';
            iconElement.textContent = item.icon;
            
            const nameElement = document.createElement('div');
            nameElement.className = 'item-name';
            nameElement.textContent = item.name;
            
            const descElement = document.createElement('div');
            descElement.className = 'item-description';
            descElement.textContent = item.description;
            
            const selectButton = document.createElement('button');
            selectButton.textContent = 'Select';
            selectButton.className = 'select-item-btn';
            
            selectButton.addEventListener('click', () => {
                this.selectItem(item);
            });
            
            itemElement.appendChild(iconElement);
            itemElement.appendChild(nameElement);
            itemElement.appendChild(descElement);
            itemElement.appendChild(selectButton);
            
            container.appendChild(itemElement);
        });
    }

    selectItem(item) {
        this.itemSystem.addItem(item);
        this.uiManager.addMessage(`You selected: ${item.name}!`);
        this.closeShop();
    }
}
