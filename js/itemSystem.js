export class ItemSystem {
    constructor(gameState, character) {
        this.gameState = gameState;
        this.character = character;
        this.uiManager = null;
        this.items = [];
        this.itemDefinitions = this.initializeItemDefinitions();
        this.rareItemDefinitions = this.initializeRareItemDefinitions();
    }

    setUIManager(uiManager) {
        this.uiManager = uiManager;
    }

    initializeItemDefinitions() {
        const baseItems = [
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
            }
        ];

        const additionalItems = [
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

        return [...baseItems, ...additionalItems];
    }

    initializeRareItemDefinitions() {
        return [
            {
                id: 'golden_Numby',
                name: 'Golden Numby',
                icon: '🌟',
                description: 'All numbers are increased by 50% and have a chance to spawn additional nodes.',
                effect: {
                    type: 'onNumberHit',
                    action: (value, nodeType, node, game) => {
                        // Chance to spawn an additional node
                        if (Math.random() < 0.25) {
                            const board = game.gameBoard;
                            const x = Math.random() * (board.boardRect.width - 2 * board.nodeRadius) + board.nodeRadius;
                            const y = Math.random() * (board.boardRect.height - 200 - 2 * board.nodeRadius) + board.nodeRadius + 50;
                            board.addNumberNode(x, y, Math.floor(value / 2));
                            game.uiManager.addMessage("✨ Golden Numby created an additional node!");
                        }
                        
                        return Math.floor(value * 1.5);
                    }
                },
                rarity: 'rare'
            },
            {
                id: 'Numby_aura',
                name: 'Numby\'s Aura',
                icon: '⭐',
                description: 'Numby automatically attracts nearby number nodes to itself.',
                effect: {
                    type: 'onUpdate',
                    action: (character, gameBoard) => {
                        const position = character.getPosition();
                        const attractionRadius = 100;
                        
                        gameBoard.numberNodes.forEach(node => {
                            const dx = position.x - node.x;
                            const dy = position.y - node.y;
                            const distance = Math.sqrt(dx * dx + dy * dy);
                            
                            if (distance < attractionRadius) {
                                // Move node slightly towards Numby
                                const moveSpeed = 0.5;
                                const angle = Math.atan2(dy, dx);
                                
                                node.x += Math.cos(angle) * moveSpeed;
                                node.y += Math.sin(angle) * moveSpeed;
                                
                                // Update DOM element position
                                node.element.style.left = `${node.x}px`;
                                node.element.style.top = `${node.y}px`;
                            }
                        });
                    }
                },
                rarity: 'rare'
            },
            {
                id: 'factory_overflow',
                name: 'Factory Overflow',
                icon: '🏭',
                description: 'Numbers over 100 explode into multiple smaller nodes.',
                effect: {
                    type: 'onNumberHit',
                    action: (value, nodeType, node, game) => {
                        if (value > 100) {
                            setTimeout(() => {
                                const numNodes = 2 + Math.floor(Math.random() * 3);
                                game.gameBoard.createMultipleNodes(node.x, node.y, numNodes, 
                                    Math.floor(value / numNodes));
                                game.uiManager.addMessage("🏭 Factory Overflow created additional nodes!");
                            }, 100);
                        }
                        return value;
                    }
                },
                rarity: 'rare'
            },
            {
                id: 'time_warp',
                name: 'Time Warp',
                icon: '⏱️',
                description: 'Gravity and friction are dramatically reduced, allowing for longer bounces.',
                effect: {
                    type: 'onCharacterInit',
                    action: (character) => {
                        character.gravity *= 0.4;
                        character.friction = Math.min(character.friction * 1.4, 0.999);
                        character.elasticity = Math.min(character.elasticity * 1.3, 0.99);
                        return character;
                    }
                },
                rarity: 'rare'
            }
        ];
    }

    generateRandomItem() {
        const availableItems = this.itemDefinitions.filter(item => 
            !this.items.some(playerItem => playerItem.id === item.id)
        );
        
        const itemPool = availableItems.length > 0 ? availableItems : this.itemDefinitions;
        
        const randomIndex = Math.floor(Math.random() * itemPool.length);
        return itemPool[randomIndex];
    }

    generateRareItem() {
        const randomIndex = Math.floor(Math.random() * this.rareItemDefinitions.length);
        return this.rareItemDefinitions[randomIndex];
    }

    addItem(item) {
        this.items.push(item);
        this.gameState.items = this.items;
        
        if (item.effect.type === 'onCharacterInit') {
            item.effect.action(this.character);
        }
        
        if (this.gameState.statsSystem) {
            this.gameState.statsSystem.recordItemCollected();
        }
        
        if (this.uiManager) {
            this.uiManager.updateInventory(this.items);
        }
        
        this.checkForSynergies(item);
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

    applyItemEffects(effectType, value, nodeType = null, node = null, game = null) {
        let result = value;
        
        this.items.forEach(item => {
            if (item.effect.type === effectType) {
                if (effectType === 'onNumberHit') {
                    result = item.effect.action(result, nodeType, node, game);
                } else {
                    result = item.effect.action(result);
                }
            }
        });
        
        if (effectType === 'onNumberHit' && this.gameState.synergies) {
            this.gameState.synergies.forEach(synergy => {
                result = Math.floor(result * synergy.multiplier);
            });
        }
        
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

    resetItems() {
        this.items = [];
        this.gameState.items = this.items;
        this.gameState.synergies = [];
    }
}
