export class UIManager {
    constructor(gameState) {
        this.gameState = gameState;
        this.messageLog = document.getElementById('message-log');
        this.quotaElement = document.getElementById('quota-value');
        this.scoreElement = document.getElementById('score-value');
        this.dayElement = document.getElementById('day-value');
        this.itemContainer = document.getElementById('item-container');
        
        // Create lives display and quota progress tracker
        this.createLivesDisplay();
        this.createQuotaTracker();

        this.flashInterval = null;
        this.catastrophicEffectTimeout = null;
    }
    
    createLivesDisplay() {
        // Create the lives container in the stats bar
        const statsBar = document.querySelector('.stats-bar');
        
        // Create lives display element
        const livesDisplay = document.createElement('div');
        livesDisplay.className = 'lives';
        livesDisplay.innerHTML = 'Lives: <span id="lives-value">3</span>';
        
        // Insert before the controls div
        const controls = statsBar.querySelector('.controls');
        statsBar.insertBefore(livesDisplay, controls);
        
        // Initial update
        this.updateLives();
    }
    
    updateLives() {
        const livesElement = document.getElementById('lives-value');
        if (livesElement) {
            livesElement.textContent = this.gameState.lives;
            
            // Visual feedback on low lives
            if (this.gameState.lives <= 1) {
                livesElement.classList.add('low-lives');
                
                // Start alarm and flashing effect for last life
                if (this.gameState.lives === 1 && this.gameState.soundSystem) {
                    this.gameState.soundSystem.startAlarm();
                    this.startEmergencyFlash();
                }
            } else {
                livesElement.classList.remove('low-lives');
                // Stop alarm and flashing if lives recovered
                if (this.gameState.soundSystem) {
                    this.gameState.soundSystem.stopAlarm();
                    this.stopEmergencyFlash();
                }
            }
        }
    }

    startEmergencyFlash() {
        // Stop any existing flash
        this.stopEmergencyFlash();
        
        // Create emergency overlay if it doesn't exist
        let overlay = document.getElementById('emergency-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'emergency-overlay';
            overlay.className = 'emergency-overlay';
            document.body.appendChild(overlay);
        }
        
        // Start flashing effect
        let isVisible = false;
        this.flashInterval = setInterval(() => {
            isVisible = !isVisible;
            overlay.style.opacity = isVisible ? 0.3 : 0;
        }, 500); // Flash every 500ms
    }
    
    stopEmergencyFlash() {
        if (this.flashInterval) {
            clearInterval(this.flashInterval);
            this.flashInterval = null;
            
            const overlay = document.getElementById('emergency-overlay');
            if (overlay) {
                overlay.style.opacity = 0;
            }
        }
    }

    createQuotaTracker() {
        // Create progress tracker in stats bar
        const statsBar = document.querySelector('.stats-bar');
        
        // Create tracker element
        const quotaTracker = document.createElement('div');
        quotaTracker.className = 'quota-tracker';
        
        // Create outer progress bar container
        const progressContainer = document.createElement('div');
        progressContainer.className = 'quota-progress-container';
        
        // Create progress bar
        const progressBar = document.createElement('div');
        progressBar.id = 'quota-progress-bar';
        progressBar.className = 'quota-progress-bar';
        
        // Create percentage label
        const percentLabel = document.createElement('div');
        percentLabel.id = 'quota-percentage';
        percentLabel.className = 'quota-percentage';
        percentLabel.textContent = '0%';
        
        // Assemble elements
        progressContainer.appendChild(progressBar);
        quotaTracker.appendChild(progressContainer);
        quotaTracker.appendChild(percentLabel);
        
        // Insert before the controls div
        const controls = statsBar.querySelector('.controls');
        statsBar.insertBefore(quotaTracker, controls);
        
        // Initial update
        this.updateQuotaTracker();
    }
    
    updateQuotaTracker() {
        const progressBar = document.getElementById('quota-progress-bar');
        const percentLabel = document.getElementById('quota-percentage');
        
        if (progressBar && percentLabel) {
            const percentage = Math.min(100, Math.floor((this.gameState.currentScore / this.gameState.quota) * 100));
            
            progressBar.style.width = `${percentage}%`;
            percentLabel.textContent = `${percentage}%`;
            
            // Update color based on progress
            if (percentage >= 100) {
                progressBar.classList.add('complete');
                progressBar.classList.remove('halfway', 'low');
            } else if (percentage >= 50) {
                progressBar.classList.add('halfway');
                progressBar.classList.remove('complete', 'low');
            } else {
                progressBar.classList.add('low');
                progressBar.classList.remove('complete', 'halfway');
            }
        }
    }

    updateScore() {
        this.scoreElement.textContent = this.gameState.currentScore;
        this.updateQuotaTracker(); // Update progress bar whenever score changes
    }

    updateQuota() {
        this.quotaElement.textContent = this.gameState.quota;
    }

    updateDayCounter() {
        this.dayElement.textContent = this.gameState.day;
    }

    addMessage(text) {
        const message = document.createElement('div');
        message.className = 'message';
        message.textContent = text;
        
        this.messageLog.appendChild(message);
        this.messageLog.scrollTop = this.messageLog.scrollHeight;
        
        // Limit the number of messages to keep performance good
        while (this.messageLog.children.length > 50) {
            this.messageLog.removeChild(this.messageLog.firstChild);
        }
    }

    showNumberPopup(x, y, value) {
        const popup = document.createElement('div');
        popup.className = 'number-popup';
        popup.textContent = `+${value}`;
        popup.style.left = `${x}px`;
        popup.style.top = `${y}px`;
        
        document.getElementById('pegboard').appendChild(popup);
        
        // Remove the popup after animation completes
        setTimeout(() => {
            popup.remove();
        }, 1000);
    }

    showPegScorePopup(x, y, value) {
        const popup = document.createElement('div');
        popup.className = 'peg-score-popup';
        popup.textContent = `+${value}`;
        popup.style.left = `${x}px`;
        popup.style.top = `${y}px`;
        
        document.getElementById('pegboard').appendChild(popup);
        
        // Remove the popup after animation completes
        setTimeout(() => {
            popup.remove();
        }, 800);
    }

    updateInventory(items) {
        // Clear existing items
        this.itemContainer.innerHTML = '';
        
        // Group items by rarity for display
        const regularItems = items.filter(item => !item.rarity || item.rarity === 'common');
        const rareItems = items.filter(item => item.rarity === 'rare');
        
        // Add header for rare items if any exist
        if (rareItems.length > 0) {
            const rareHeader = document.createElement('div');
            rareHeader.className = 'item-category-header rare';
            rareHeader.textContent = 'Rare Items';
            this.itemContainer.appendChild(rareHeader);
            
            // Add each rare item
            this.addItemsToContainer(rareItems);
            
            // Add separator
            if (regularItems.length > 0) {
                const separator = document.createElement('hr');
                separator.className = 'item-separator';
                this.itemContainer.appendChild(separator);
            }
        }
        
        // Add regular items
        if (regularItems.length > 0) {
            const regularHeader = document.createElement('div');
            regularHeader.className = 'item-category-header';
            regularHeader.textContent = 'Items';
            this.itemContainer.appendChild(regularHeader);
            
            this.addItemsToContainer(regularItems);
        }
    }
    
    addItemsToContainer(items) {
        items.forEach((item, index) => {
            const itemElement = document.createElement('div');
            itemElement.className = 'item';
            if (item.rarity === 'rare') {
                itemElement.className += ' rare-item';
            }
            itemElement.dataset.id = index;
            
            const iconElement = document.createElement('div');
            iconElement.className = 'item-icon';
            iconElement.textContent = item.icon;
            
            const nameElement = document.createElement('div');
            nameElement.className = 'item-name';
            nameElement.textContent = item.name;
            
            itemElement.appendChild(iconElement);
            itemElement.appendChild(nameElement);
            
            // Add tooltip with description
            itemElement.title = `${item.name}: ${item.description}`;
            
            this.itemContainer.appendChild(itemElement);
            
            // Add click event for item details
            itemElement.addEventListener('click', () => {
                this.addMessage(`${item.name}: ${item.description}`);
                
                // Highlight synergies if they exist
                if (item.synergies && this.gameState.items) {
                    const synergizedItems = this.gameState.items.filter(i => 
                        item.synergies.includes(i.id) && i.id !== item.id
                    );
                    
                    if (synergizedItems.length > 0) {
                        this.addMessage("🔄 Synergizes with: " + 
                            synergizedItems.map(i => i.name).join(", "));
                    }
                }
            });
        });
    }

    showSynergyAnimation() {
        // Create synergy animation overlay
        const synergyOverlay = document.createElement('div');
        synergyOverlay.className = 'synergy-overlay';
        
        const synergyText = document.createElement('div');
        synergyText.className = 'synergy-text';
        synergyText.textContent = 'SYNERGY!';
        
        synergyOverlay.appendChild(synergyText);
        document.body.appendChild(synergyOverlay);
        
        // Play animation sound
        if (this.gameState.soundSystem) {
            this.gameState.soundSystem.playSound('synergy');
        }
        
        // Remove overlay after animation completes
        setTimeout(() => {
            synergyOverlay.remove();
        }, 2000);
    }
    
    // Show a special visual effect when a temporary effect is activated
    showEffectActivation(effectType, duration) {
        const effectOverlay = document.createElement('div');
        effectOverlay.className = 'effect-activation';
        
        let message = '';
        switch (effectType) {
            case 'globalMultiplier':
                message = 'Multiplier Active!';
                break;
            case 'speedBoost':
                message = 'Speed Boost!';
                break;
            default:
                message = 'Effect Active!';
        }
        
        effectOverlay.textContent = message;
        document.querySelector('.game-board').appendChild(effectOverlay);
        
        // Fade out and remove
        setTimeout(() => {
            effectOverlay.classList.add('fade-out');
            setTimeout(() => effectOverlay.remove(), 1000);
        }, duration || 2000);
    }
    
    // Creates a floating indicator when hitting special nodes
    showSpecialNodeEffect(x, y, effectType) {
        const indicator = document.createElement('div');
        indicator.className = 'special-effect-indicator';
        indicator.style.left = `${x}px`;
        indicator.style.top = `${y}px`;
        
        let icon = '';
        switch (effectType) {
            case 'explosive':
                icon = '💥';
                break;
            case 'multiplier':
                icon = '✨';
                break;
            case 'splitter':
                icon = '🔀';
                break;
            case 'golden':
                icon = '🌟';
                break;
            default:
                icon = '✨';
        }
        
        indicator.textContent = icon;
        document.getElementById('pegboard').appendChild(indicator);
        
        // Remove after animation completes
        setTimeout(() => {
            indicator.remove();
        }, 1500);
    }

    showDailyChallenge(challenge) {
        if (!challenge) return;
        
        // Create challenge badge
        const badge = document.createElement('div');
        badge.className = 'daily-challenge';
        badge.innerHTML = `<strong>Daily Challenge:</strong> ${challenge.name}`;
        badge.title = challenge.description;
        
        // Add tooltip functionality
        badge.addEventListener('mouseover', () => {
            this.showTooltip(badge, challenge.description);
        });
        
        badge.addEventListener('mouseout', () => {
            this.hideTooltip();
        });
        
        document.querySelector('.game-board').appendChild(badge);
        
        // Add message about challenge
        this.addMessage(`🏆 DAILY CHALLENGE: ${challenge.name} - ${challenge.description}`);
    }

    showTooltip(element, text) {
        // Remove any existing tooltips
        this.hideTooltip();
        
        // Create tooltip
        const tooltip = document.createElement('div');
        tooltip.className = 'custom-tooltip';
        tooltip.textContent = text;
        
        // Position tooltip
        const rect = element.getBoundingClientRect();
        tooltip.style.top = `${rect.bottom + 5}px`;
        tooltip.style.left = `${rect.left + (rect.width / 2)}px`;
        
        document.body.appendChild(tooltip);
    }

    hideTooltip() {
        const existingTooltip = document.querySelector('.custom-tooltip');
        if (existingTooltip) {
            existingTooltip.remove();
        }
    }

    showCatastrophicFailure() {
        // Stop any emergency flashing and alarm
        this.stopEmergencyFlash();
        if (this.gameState.soundSystem) {
            this.gameState.soundSystem.stopAlarm();
        }
        
        // Create catastrophic failure overlay
        const overlay = document.createElement('div');
        overlay.className = 'catastrophic-overlay';
        document.body.appendChild(overlay);
        
        // Create explosion effect
        const explosion = document.createElement('div');
        explosion.className = 'explosion-effect';
        document.body.appendChild(explosion);
        
        // Animate the explosion
        setTimeout(() => {
            explosion.classList.add('explode');
            
            // After explosion, fade to black and show game over modal
            setTimeout(() => {
                explosion.remove();
                overlay.classList.add('full-black');
                
                // Show game over modal with message display
                const gameOver = document.getElementById('game-over');
                gameOver.classList.remove('hidden');
                gameOver.classList.add('catastrophic-modal');
                
                // Add text display for the speech
                const speechText = document.createElement('p');
                speechText.className = 'speech-text';
                speechText.textContent = "Nice going, you ruined the world.";
                gameOver.querySelector('.modal-content').appendChild(speechText);
            }, 1000);
        }, 100);
    }
}
