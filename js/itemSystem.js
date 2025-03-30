export class ItemSystem {
    constructor(gameState, character) {
        this.gameState = gameState;
        this.character = character;
        this.uiManager = null;
        this.items = [];
        
        // Initialize all item definitions by rarity tier
        this.commonItemDefinitions = this.initializeCommonItemDefinitions();
        this.rareItemDefinitions = this.initializeRareItemDefinitions();
        this.legendaryItemDefinitions = this.initializeLegendaryItemDefinitions();
        
        // Combined list for easy access
        this.allItemDefinitions = [
            ...this.commonItemDefinitions,
            ...this.rareItemDefinitions,
            ...this.legendaryItemDefinitions
        ];
    }
    
    setUIManager(uiManager) {
        this.uiManager = uiManager;
    }
    
    initializeCommonItemDefinitions() {
        // COMMON ITEMS (80%) - 40 items
        return [
            {
                id: 'multiplier',
                name: 'Number Multiplier',
                icon: '×2',
                description: 'Doubles the value of all number nodes.',
                effect: {
                    type: 'onNumberHit',
                    action: (value) => value * 2
                }
            },
            {
                id: 'adder',
                name: 'Number Adder',
                icon: '+5',
                description: 'Adds 5 to all number values.',
                effect: {
                    type: 'onNumberHit',
                    action: (value) => value + 5
                }
            },
            {
                id: 'bouncy_Numby',
                name: 'Bouncy Numby',
                icon: '↑↓',
                description: 'Increases Numby\'s bounciness by 20%.',
                effect: {
                    type: 'onCharacterInit',
                    action: (character) => {
                        character.elasticity *= 1.2;
                        return character;
                    }
                }
            },
            {
                id: 'percentage_boost',
                name: 'Percentage Booster',
                icon: '%↑',
                description: 'Adds 15% to each number value.',
                effect: {
                    type: 'onNumberHit',
                    action: (value) => Math.floor(value * 1.15)
                }
            },
            {
                id: 'gravity_reducer',
                name: 'Gravity Reducer',
                icon: '⬇️-',
                description: 'Reduces gravity by 25%, making Numby float longer.',
                effect: {
                    type: 'onCharacterInit',
                    action: (character) => {
                        character.gravity *= 0.75;
                        return character;
                    }
                }
            },
            {
                id: 'quad_multiplier',
                name: 'Quadratic Multiplier',
                icon: 'x²',
                description: 'Squares numbers less than 10.',
                effect: {
                    type: 'onNumberHit',
                    action: (value) => value < 10 ? value * value : value
                }
            },
            {
                id: 'lucky_seven',
                name: 'Lucky Seven',
                icon: '7✨',
                description: 'Any number containing 7 is multiplied by 7.',
                effect: {
                    type: 'onNumberHit',
                    action: (value) => {
                        return String(value).includes('7') ? value * 7 : value;
                    }
                }
            },
            {
                id: 'friction_reducer',
                name: 'Friction Reducer',
                icon: '→→',
                description: 'Reduces friction by 20%, making Numby slide further.',
                effect: {
                    type: 'onCharacterInit',
                    action: (character) => {
                        character.friction = Math.min(character.friction * 1.2, 0.999);
                        return character;
                    }
                }
            },
            {
                id: 'node_magnet',
                name: 'Node Magnet',
                icon: '🧲',
                description: 'Increases the collision radius with number nodes by 20%.',
                effect: {
                    type: 'onCharacterInit',
                    action: (character) => {
                        const originalRadius = character.getRadius;
                        character.getRadius = function() {
                            return originalRadius.call(this) * 1.2;
                        };
                        return character;
                    }
                }
            },
            {
                id: 'even_doubler',
                name: 'Even Number Doubler',
                icon: '2×',
                description: 'Doubles the value of even numbers.',
                effect: {
                    type: 'onNumberHit',
                    action: (value) => value % 2 === 0 ? value * 2 : value
                }
            },
            {
                id: 'odd_tripler',
                name: 'Odd Number Tripler',
                icon: '3×',
                description: 'Triples the value of odd numbers.',
                effect: {
                    type: 'onNumberHit',
                    action: (value) => value % 2 !== 0 ? value * 3 : value
                }
            },
            {
                id: 'digit_adder',
                name: 'Digit Adder',
                icon: '+#',
                description: 'Adds the sum of digits to the number value.',
                effect: {
                    type: 'onNumberHit',
                    action: (value) => {
                        const sum = String(value).split('').reduce(
                            (total, digit) => total + parseInt(digit), 0
                        );
                        return value + sum;
                    }
                }
            },
            {
                id: 'prime_specialist',
                name: 'Prime Specialist',
                icon: 'P×',
                description: 'Triples the value of prime number nodes.',
                effect: {
                    type: 'onNumberHit',
                    action: (value, nodeType) => {
                        return nodeType === 'prime' ? value * 3 : value;
                    }
                },
                synergies: ['prime_doubler', 'odd_tripler']
            },
            {
                id: 'prime_doubler',
                name: 'Prime Doubler',
                icon: 'P+',
                description: 'Adds a prime number to all values.',
                effect: {
                    type: 'onNumberHit',
                    action: (value) => {
                        const prime = 7; // Fixed prime addition
                        return value + prime;
                    }
                },
                synergies: ['prime_specialist']
            },
            {
                id: 'fibonacci_fan',
                name: 'Fibonacci Fan',
                icon: 'F+',
                description: 'Doubles fibonacci numbers and adds 5.',
                effect: {
                    type: 'onNumberHit',
                    action: (value, nodeType) => {
                        return nodeType === 'fibonacci' ? value * 2 + 5 : value;
                    }
                },
                synergies: ['digit_adder']
            },
            {
                id: 'speed_booster',
                name: 'Speed Booster',
                icon: '🚀',
                description: 'Increases Numby\'s initial speed by 25%.',
                effect: {
                    type: 'onLaunch',
                    action: (vx, vy) => {
                        return { vx: vx * 1.25, vy: vy * 1.25 };
                    }
                },
                synergies: ['friction_reducer']
            },
            {
                id: 'value_squarer',
                name: 'Value Squarer',
                icon: '²',
                description: 'Numbers over 50 have a 10% chance to be squared.',
                effect: {
                    type: 'onNumberHit',
                    action: (value) => {
                        if (value > 50 && Math.random() < 0.1) {
                            return value * value;
                        }
                        return value;
                    }
                },
                synergies: ['quad_multiplier']
            },
            {
                id: 'special_enhancer',
                name: 'Special Enhancer',
                icon: '✨+',
                description: 'Special nodes have 50% more value.',
                effect: {
                    type: 'onNumberHit',
                    action: (value, nodeType) => {
                        return nodeType === 'special' ? Math.floor(value * 1.5) : value;
                    }
                }
            },
            {
                id: 'consecutive_booster',
                name: 'Consecutive Booster',
                icon: '⏩',
                description: 'Each consecutive node hit without exiting gives +10% value.',
                effect: {
                    type: 'onRun',
                    action: () => {
                        if (!this.gameState.consecutiveHits) {
                            this.gameState.consecutiveHits = 0;
                        }
                        this.gameState.consecutiveHits++;
                        return 1 + (this.gameState.consecutiveHits * 0.1);
                    }
                }
            },
            {
                id: 'double_chance',
                name: 'Double Chance',
                icon: '🎲',
                description: '20% chance to double any number.',
                effect: {
                    type: 'onNumberHit',
                    action: (value) => {
                        return Math.random() < 0.2 ? value * 2 : value;
                    }
                }
            },
            {
                id: 'value_rounded',
                name: 'Value Rounder',
                icon: '⚪',
                description: 'Rounds numbers to nearest 10, then adds 10%.',
                effect: {
                    type: 'onNumberHit',
                    action: (value) => {
                        const rounded = Math.round(value / 10) * 10;
                        return Math.floor(rounded * 1.1);
                    }
                }
            },
            {
                id: 'day_multiplier',
                name: 'Day Multiplier',
                icon: '📆',
                description: 'Multiplies numbers by your current day.',
                effect: {
                    type: 'onNumberHit',
                    action: (value) => {
                        return value * this.gameState.day;
                    }
                },
                synergies: ['percentage_boost']
            }
        ];
    }
    
    initializeRareItemDefinitions() {
        // RARE ITEMS (15%) - 7 items
        return [
            {
                id: 'platinum_calculator',
                name: 'Platinum Calculator',
                icon: '📱',
                description: 'Increases number values by 30%',
                rarity: 'rare',
                level: 1,
                upgradeDescription: 'Increases number values by {VALUE}%',
                upgradeValue: [30, 40, 50, 60, 75],
                effect: {
                    type: 'onNumberHit',
                    action: (value) => Math.floor(value * 1.3)
                }
            },
            {
                id: 'super_bouncer',
                name: 'Super Bouncer',
                icon: '🔄',
                description: 'Increases elasticity by 20% and adds velocity on bounce',
                rarity: 'rare',
                level: 1,
                upgradeDescription: 'Increases elasticity by {VALUE}% and adds velocity on bounce',
                upgradeValue: [20, 25, 30, 35, 40],
                effect: {
                    type: 'onCharacterInit',
                    action: (character) => {
                        // Store the original bounceOff method
                        const originalBounceOff = character.bounceOff;
                        
                        // Override with enhanced version
                        character.bounceOff = function(pegX, pegY) {
                            // Call original bounce logic
                            originalBounceOff.call(this, pegX, pegY);
                            
                            // Add extra velocity after bounce
                            const boost = 1.2;
                            this.vx *= boost;
                            this.vy *= boost;
                        };
                        
                        // Also increase elasticity
                        character.elasticity = Math.min(character.elasticity * 1.2, 0.99);
                        
                        return character;
                    }
                }
            },
            {
                id: 'multiplier_magic',
                name: 'Multiplier Magic',
                icon: '✖️',
                description: 'Multiplies all number values by 1.5',
                rarity: 'rare',
                level: 1,
                upgradeDescription: 'Multiplies all number values by {VALUE}',
                upgradeValue: [1.5, 1.65, 1.8, 1.95, 2.1],
                effect: {
                    type: 'onNumberHit',
                    action: (value) => Math.floor(value * 1.5)
                }
            },
            {
                id: 'peg_destroyer',
                name: 'Peg Destroyer',
                icon: '💥',
                description: 'Pegs have 20% chance to be destroyed with full value',
                rarity: 'rare',
                level: 1,
                upgradeDescription: 'Pegs have {VALUE}% chance to be destroyed with full value',
                upgradeValue: [20, 30, 40, 50, 60],
                effect: {
                    type: 'onPegHit',
                    action: (value, pegData, peg, game) => {
                        if (Math.random() < 0.2) {
                            // This peg will be destroyed by the game board logic
                            // Return full value before reduction
                            return pegData ? pegData.originalScore || value : value;
                        }
                        return value;
                    }
                }
            },
            {
                id: 'special_attractor',
                name: 'Special Attractor',
                icon: '🌠',
                description: 'Special nodes attracted to Numby',
                rarity: 'rare',
                level: 1,
                upgradeDescription: 'Special nodes attracted to Numby with {VALUE}× strength',
                upgradeValue: [1, 1.5, 2, 2.5, 3],
                effect: {
                    type: 'onUpdate',
                    action: (character, gameBoard) => {
                        const position = character.getPosition();
                        const attractionRadius = 150;
                        
                        gameBoard.numberNodes.forEach(node => {
                            if (node.type === 'special') {
                                const dx = position.x - node.x;
                                const dy = position.y - node.y;
                                const distance = Math.sqrt(dx * dx + dy * dy);
                                
                                if (distance < attractionRadius) {
                                    // Move node towards Numby
                                    const moveSpeed = 1;
                                    const angle = Math.atan2(dy, dx);
                                    
                                    node.x += Math.cos(angle) * moveSpeed;
                                    node.y += Math.sin(angle) * moveSpeed;
                                    
                                    if (node.element) {
                                        node.element.style.left = `${node.x}px`;
                                        node.element.style.top = `${node.y}px`;
                                    }
                                }
                            }
                        });
                    }
                }
            },
            {
                id: 'node_duplicator',
                name: 'Node Duplicator',
                icon: '🧬',
                description: '10% chance to create duplicate node on hit',
                rarity: 'rare',
                level: 1,
                upgradeDescription: '{VALUE}% chance to create duplicate node on hit',
                upgradeValue: [10, 15, 20, 25, 30],
                effect: {
                    type: 'onNumberHit',
                    action: (value, nodeType, node, game) => {
                        if (Math.random() < 0.1 && game && game.gameBoard) {
                            setTimeout(() => {
                                const board = game.gameBoard;
                                const x = Math.random() * (board.boardRect.width - 40) + 20;
                                const y = Math.random() * (board.boardRect.height - 200) + 50;
                                board.addNumberNode(x, y, Math.floor(value * 0.5), nodeType);
                                game.uiManager.addMessage("🧬 Node duplicated!");
                            }, 100);
                        }
                        return value;
                    }
                }
            },
            {
                id: 'combo_master',
                name: 'Combo Master',
                icon: '🔥',
                description: 'Each consecutive hit gives +5% points, stacking up to 100%',
                rarity: 'rare',
                level: 1,
                upgradeDescription: 'Each consecutive hit gives +{VALUE}% points, stacking up to 100%',
                upgradeValue: [5, 7, 10, 12, 15],
                effect: {
                    type: 'onRun',
                    action: () => {
                        if (!this.gameState.consecutiveHits) {
                            this.gameState.consecutiveHits = 0;
                        }
                        
                        // Cap bonus at 100%
                        const bonus = Math.min(this.gameState.consecutiveHits * 0.05, 1.0);
                        return 1 + bonus;
                    }
                }
            }
        ];
    }

    initializeLegendaryItemDefinitions() {
        // LEGENDARY ITEMS (5%) - 3 items
        return [
            {
                id: 'divine_multiplier',
                name: 'Divine Multiplier',
                icon: '🌟',
                description: 'All peg and node values are doubled, and pegs lose value 25% more slowly',
                rarity: 'legendary',
                level: 1,
                upgradeDescription: 'All values {VALUE}×, pegs lose value {VALUE2}% more slowly',
                upgradeValue: [2, 2.5, 3, 3.5, 4],
                upgradeValue2: [25, 30, 35, 40, 45],
                effect: {
                    type: 'onNumberHit',
                    action: (value) => Math.floor(value * 2)
                },
                secondaryEffect: {
                    type: 'onPegHit',
                    action: (value, pegData, peg, game) => {
                        // Return 75% of value instead of 50%
                        return Math.floor(value * 0.75);
                    }
                }
            },
            {
                id: 'peg_master',
                name: 'Peg Master',
                icon: '👑',
                description: 'Pegs retain full value on first hit, then follow normal halving',
                rarity: 'legendary',
                level: 1,
                upgradeDescription: 'Pegs retain full value for {VALUE} hits',
                upgradeValue: [1, 2, 2, 3, 3],
                effect: {
                    type: 'onPegHit',
                    action: (value, pegData) => {
                        if (!pegData.hitCount || pegData.hitCount === 0) {
                            pegData.hitCount = 1;
                            return value; // First hit returns full value
                        }
                        return Math.floor(value / 2); // Subsequent hits follow normal halving
                    }
                }
            },
            {
                id: 'score_chain',
                name: 'Score Chain',
                icon: '⚡',
                description: 'Each consecutive peg hit doubles its bonus value',
                rarity: 'legendary',
                level: 1,
                upgradeDescription: 'Each consecutive hit multiplies bonus by {VALUE}',
                upgradeValue: [2, 2.5, 3, 3.5, 4],
                effect: {
                    type: 'onPegHit',
                    action: (value) => {
                        if (!this.gameState.chainCount) {
                            this.gameState.chainCount = 0;
                        }
                        this.gameState.chainCount++;
                        const multiplier = Math.pow(2, Math.min(this.gameState.chainCount - 1, 5));
                        return Math.floor(value * multiplier);
                    }
                }
            }
        ];
    }
    
    // Method to generate a random item with proper rarity distribution
    generateRandomItem() {
        // Define rarity chances
        const LEGENDARY_CHANCE = 0.05; // 5%
        const RARE_CHANCE = 0.15;      // 15%
        // Common is 80% (remainder)
        
        // Roll for rarity
        const rarityRoll = Math.random();
        
        let itemPool;
        
        if (rarityRoll < LEGENDARY_CHANCE) {
            // Legendary item (5% chance)
            itemPool = this.legendaryItemDefinitions;
        } else if (rarityRoll < LEGENDARY_CHANCE + RARE_CHANCE) {
            // Rare item (15% chance)
            itemPool = this.rareItemDefinitions;
        } else {
            // Common item (80% chance)
            itemPool = this.commonItemDefinitions;
        }
        
        // Check if we already have any of these items (for potential upgrades)
        const upgradeableItems = [];
        
        itemPool.forEach(itemDef => {
            const existingItem = this.items.find(i => i.id === itemDef.id);
            if (existingItem && existingItem.level < 5) {
                upgradeableItems.push(existingItem);
            }
        });
        
        // 40% chance to upgrade if we have upgradeable items
        if (upgradeableItems.length > 0 && Math.random() < 0.4) {
            const itemToUpgrade = upgradeableItems[Math.floor(Math.random() * upgradeableItems.length)];
            return this.createUpgradedItem(itemToUpgrade);
        }
        
        // Otherwise, filter out maxed items
        const availableItems = itemPool.filter(itemDef => {
            const existingItem = this.items.find(i => i.id === itemDef.id);
            return !existingItem || existingItem.level < 5;
        });
        
        // If no available items in the chosen rarity, go down a tier
        if (availableItems.length === 0) {
            if (itemPool === this.legendaryItemDefinitions) {
                return this.generateRandomItemFromPool(this.rareItemDefinitions);
            } else if (itemPool === this.rareItemDefinitions) {
                return this.generateRandomItemFromPool(this.commonItemDefinitions);
            } else {
                // All common items maxed out (very unlikely)
                // Return a random item that can potentially be upgraded
                const availableForUpgrade = this.allItemDefinitions.filter(itemDef => {
                    const existingItem = this.items.find(i => i.id === itemDef.id);
                    return existingItem && existingItem.level < 5;
                });
                
                if (availableForUpgrade.length > 0) {
                    const baseItem = this.items.find(i => 
                        i.id === availableForUpgrade[Math.floor(Math.random() * availableForUpgrade.length)].id
                    );
                    return this.createUpgradedItem(baseItem);
                }
                
                // If absolutely everything is maxed out, just return a random item
                return this.allItemDefinitions[Math.floor(Math.random() * this.allItemDefinitions.length)];
            }
        }
        
        // Return a random item from available items
        return availableItems[Math.floor(Math.random() * availableItems.length)];
    }
    
    generateRandomItemFromPool(itemPool) {
        // Filter out maxed items
        const availableItems = itemPool.filter(itemDef => {
            const existingItem = this.items.find(i => i.id === itemDef.id);
            return !existingItem || existingItem.level < 5;
        });
        
        if (availableItems.length === 0) {
            return null; // No available items
        }
        
        return availableItems[Math.floor(Math.random() * availableItems.length)];
    }
    
    // Create an upgraded version of an existing item
    createUpgradedItem(baseItem) {
        // Find the item definition
        const itemDef = this.allItemDefinitions.find(def => def.id === baseItem.id);
        if (!itemDef || baseItem.level >= 5) return null;
        
        // Create a new item based on the definition, but with upgraded values
        const nextLevel = baseItem.level + 1;
        const upgradedItem = {
            ...itemDef,
            level: nextLevel,
            isUpgrade: true,
            baseItemId: baseItem.id
        };
        
        // Update description based on upgrade values
        if (itemDef.upgradeDescription && itemDef.upgradeValue) {
            const upgradeValue = itemDef.upgradeValue[nextLevel - 1];
            upgradedItem.description = itemDef.upgradeDescription.replace('{VALUE}', upgradeValue);
            
            // Handle secondary upgrade value if present
            if (itemDef.upgradeValue2) {
                const upgradeValue2 = itemDef.upgradeValue2[nextLevel - 1];
                upgradedItem.description = upgradedItem.description.replace('{VALUE2}', upgradeValue2);
            }
        }
        
        // Update the effect based on the upgrade level
        if (itemDef.effect && itemDef.effect.type === 'onNumberHit') {
            const upgradeModifier = itemDef.upgradeValue[nextLevel - 1] / itemDef.upgradeValue[0];
            
            upgradedItem.effect = {
                type: itemDef.effect.type,
                action: this.createUpgradedEffect(itemDef.effect.action, upgradeModifier, itemDef.effect.type)
            };
        }
        
        return upgradedItem;
    }
    
    createUpgradedEffect(originalAction, upgradeModifier, effectType) {
        // Create a new effect function with upgraded values
        if (effectType === 'onNumberHit') {
            return (value, ...args) => {
                const baseResult = originalAction(value, ...args);
                const increase = (baseResult - value) * upgradeModifier;
                return Math.floor(value + increase);
            };
        }
        
        // For other effect types, return the original action
        return originalAction;
    }
    
    // Add an item to the player's inventory
    addItem(item) {
        // Check if this is an upgrade
        if (item.isUpgrade && item.baseItemId) {
            // Find the existing item
            const existingItemIndex = this.items.findIndex(i => i.id === item.baseItemId);
            if (existingItemIndex !== -1) {
                // Replace the existing item with the upgrade
                this.items[existingItemIndex] = item;
                
                // Apply the effects of the upgraded item
                if (item.effect.type === 'onCharacterInit') {
                    item.effect.action(this.character);
                }
                
                // Update UI
                if (this.uiManager) {
                    this.uiManager.updateInventory(this.items);
                    this.uiManager.addMessage(`🔼 Upgraded ${item.name} to level ${item.level}!`);
                    this.uiManager.showUpgradeEffect(item);
                }
                
                return;
            }
        }
        
        // Regular item addition
        this.items.push(item);
        this.gameState.items = this.items;
        
        // Apply immediate effects
        if (item.effect.type === 'onCharacterInit') {
            item.effect.action(this.character);
        }
        
        // Apply any day start effects
        if (item.effect.type === 'onDayStart') {
            item.effect.action();
        }
        
        // Record stat
        if (this.gameState.statsSystem) {
            this.gameState.statsSystem.recordItemCollected();
        }
        
        // Update UI
        if (this.uiManager) {
            this.uiManager.updateInventory(this.items);
        }
        
        this.checkForSynergies(item);
    }
    
    // Apply item effects on various game events
    applyItemEffects(effectType, value, nodeType = null, node = null, game = null) {
        let result = value;
        
        // Apply primary effects
        this.items.forEach(item => {
            if (item.effect && item.effect.type === effectType) {
                if (effectType === 'onNumberHit') {
                    result = item.effect.action(result, nodeType, node, game);
                } else if (effectType === 'onPegHit') {
                    result = item.effect.action(result, node, null, game);
                } else {
                    result = item.effect.action(result);
                }
            }
        });
        
        // Apply secondary effects
        this.items.forEach(item => {
            if (item.secondaryEffect && item.secondaryEffect.type === effectType) {
                if (effectType === 'onNumberHit') {
                    result = item.secondaryEffect.action(result, nodeType, node, game);
                } else if (effectType === 'onPegHit') {
                    result = item.secondaryEffect.action(result, node, null, game);
                } else {
                    result = item.secondaryEffect.action(result);
                }
            }
        });
        
        // Apply synergy effects
        if ((effectType === 'onNumberHit' || effectType === 'onPegHit') && this.gameState.synergies) {
            this.gameState.synergies.forEach(synergy => {
                result = Math.floor(result * synergy.multiplier);
            });
        }
        
        // Apply temporary effects
        if (effectType === 'onNumberHit' && this.gameState.temporaryEffects) {
            this.gameState.temporaryEffects = this.gameState.temporaryEffects.filter(effect => {
                if (effect.type === 'globalMultiplier' && effect.duration > 0) {
                    result = Math.floor(result * effect.value);
                    effect.duration--;
                    return effect.duration > 0;
                }
                return true;
            });
        }
        
        return result;
    }
    
    checkForSynergies(newItem) {
        if (!newItem.synergies) return;
        
        let synergiesFound = false;
        
        this.items.forEach(existingItem => {
            if (existingItem.id !== newItem.id && 
                newItem.synergies.includes(existingItem.id)) {
                
                synergiesFound = true;
                this.activateSynergy(newItem, existingItem);
            }
        });
        
        if (synergiesFound && this.uiManager) {
            this.uiManager.showSynergyAnimation();
        }
    }
    
    activateSynergy(item1, item2) {
        const synergy = {
            items: [item1.id, item2.id],
            name: `${item1.name} + ${item2.name}`,
            description: `Special synergy between ${item1.name} and ${item2.name}!`,
            multiplier: 1.5
        };
        
        if (!this.gameState.synergies) {
            this.gameState.synergies = [];
        }
        
        this.gameState.synergies.push(synergy);
        
        if (this.uiManager) {
            this.uiManager.addMessage(`🔄 SYNERGY DISCOVERED: ${item1.name} + ${item2.name}!`);
        }
    }
    
    resetItems() {
        this.items = [];
        this.gameState.items = this.items;
        this.gameState.synergies = [];
    }
    
    // Generate an array of shop items for selection
    generateShopItems(count = 3) {
        const shopItems = [];
        
        // Guarantee at least one upgradeable item if available
        const upgradeableItems = this.items.filter(item => item.level < 5);
        if (upgradeableItems.length > 0 && Math.random() < 0.7) {
            const baseItem = upgradeableItems[Math.floor(Math.random() * upgradeableItems.length)];
            const upgrade = this.createUpgradedItem(baseItem);
            if (upgrade) {
                shopItems.push(upgrade);
            }
        }
        
        // Fill the rest with random items
        while (shopItems.length < count) {
            const item = this.generateRandomItem();
            
            // Ensure we don't have duplicates
            if (!shopItems.some(shopItem => shopItem.id === item.id)) {
                shopItems.push(item);
            }
        }
        
        return shopItems;
    }
}
