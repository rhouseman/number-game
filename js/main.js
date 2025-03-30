import { GameBoard } from './gameBoard.js';
import { Character } from './character.js';
import { ItemSystem } from './itemSystem.js';
import { UIManager } from './uiManager.js';
import { GameState } from './gameState.js';
import { ShopSystem } from './shopSystem.js';
import { SoundSystem } from './soundSystem.js';
import { StatsSystem } from './statsSystem.js';
import { TutorialSystem } from './tutorial.js';
import { AchievementSystem } from './achievements.js';

class Game {
    constructor() {
        // Initialize components
        this.gameState = new GameState();
        this.statsSystem = new StatsSystem();
        this.gameState.setStatsSystem(this.statsSystem);
        this.soundSystem = new SoundSystem();
        
        // Connect sound system to game state
        this.gameState.soundSystem = this.soundSystem;
        
        this.uiManager = new UIManager(this.gameState);
        this.gameBoard = new GameBoard(this.gameState);
        this.character = new Character(this.gameState, this.gameBoard);
        this.itemSystem = new ItemSystem(this.gameState, this.character);
        this.shopSystem = new ShopSystem(this.gameState, this.itemSystem, this.uiManager, this.statsSystem);
        this.achievementSystem = new AchievementSystem(this);
        
        // Connect components that need references to each other
        this.itemSystem.setUIManager(this.uiManager);
        
        // Create tutorial system last, after all components are initialized
        this.tutorialSystem = new TutorialSystem(this);
        
        this.isPowerMeterActive = false;
        this.powerDirection = 1; // 1 for increasing, -1 for decreasing
        this.powerLevel = 75; // Default power level
        this.currentAngle = 90; // Default angle
        this.mousePosition = { x: 0, y: 0 };
        this.showCrosshair = false;
        
        // Make items accessible globally within the game
        this.items = this.gameState.items;

        this.boundSpeakGameOver = null; // Add property to store bound function

        this.initialize();
    }

    initialize() {
        this.gameBoard.generateBoard();
        this.setupEventListeners();
        this.startGame();
        this.gameLoop();
        
        // Start tutorial after a short delay
        setTimeout(() => {
            this.tutorialSystem.startTutorial();
        }, 1000);
    }

    setupEventListeners() {
        // Game board mouse events for aiming and launching
        const gameBoard = document.querySelector('.game-board');
        gameBoard.addEventListener('mousemove', (e) => this.updateMousePosition(e));
        gameBoard.addEventListener('mouseenter', () => this.showCrosshair = true);
        gameBoard.addEventListener('mouseleave', () => this.showCrosshair = false);
        gameBoard.addEventListener('click', (e) => this.handleBoardClick(e));
        
        // Other UI event listeners
        document.getElementById('restart-btn').addEventListener('click', () => this.restartGame());
        document.getElementById('sound-btn').addEventListener('click', () => this.toggleSound());
        document.getElementById('music-btn').addEventListener('click', () => this.toggleMusic());
        document.getElementById('help-btn').addEventListener('click', () => this.showHelp());
        document.getElementById('close-help-btn').addEventListener('click', () => this.closeHelp());
        document.getElementById('stats-btn').addEventListener('click', () => this.showStats());
        document.getElementById('close-stats-btn').addEventListener('click', () => this.closeStats());
        document.getElementById('achievements-btn').addEventListener('click', () => this.showAchievements());
    }

    updateMousePosition(event) {
        if (!this.character.isActive) {
            const rect = event.currentTarget.getBoundingClientRect();
            this.mousePosition.x = event.clientX - rect.left;
            this.mousePosition.y = event.clientY - rect.top;
            this.drawCrosshair();
        }
    }

    drawCrosshair() {
        const crosshair = document.getElementById('crosshair') || this.createCrosshairElement();
        
        if (this.showCrosshair && !this.character.isActive) {
            crosshair.style.left = `${this.mousePosition.x}px`;
            crosshair.style.top = `${this.mousePosition.y}px`;
            crosshair.classList.remove('hidden');
            
            // Calculate and display angle
            const startX = this.character.x;
            const startY = this.character.y;
            const angle = Math.atan2(this.mousePosition.y - startY, this.mousePosition.x - startX) * (180 / Math.PI);
            document.getElementById('angle-value').textContent = `${Math.round(angle)}°`;
        } else {
            crosshair.classList.add('hidden');
        }
    }

    createCrosshairElement() {
        const crosshair = document.createElement('div');
        crosshair.id = 'crosshair';
        document.getElementById('pegboard').appendChild(crosshair);
        return crosshair;
    }

    handleBoardClick(event) {
        if (!this.character.isActive && this.showCrosshair) {
            this.launchTowardsMouse();
        }
    }

    launchTowardsMouse() {
        // Only launch if we have lives
        if (this.gameState.lives <= 0) {
            this.uiManager.addMessage("No more lives left! Game over.");
            this.gameOver();
            return;
        }
        
        // NOTE: We're removing the line that decreases lives here
        // No longer deducting life on launch - will be deducted when Numby exits bottom
        
        // Switch to gameplay music when Numby is first launched
        this.soundSystem.playMusic('gameplay');
        
        // Calculate direction vector from Numby to mouse position
        const startX = this.character.x;
        const startY = this.character.y;
        const dx = this.mousePosition.x - startX;
        const dy = this.mousePosition.y - startY;
        
        // Calculate angle in radians
        const angle = Math.atan2(dy, dx);
        
        // Calculate velocity based on power level
        const power = this.powerLevel / 100 * 15; // Scale power to a reasonable velocity
        let vx = power * Math.cos(angle);
        let vy = power * Math.sin(angle);
        
        // Apply any item effects that modify launch velocity
        this.items.forEach(item => {
            if (item.effect && item.effect.type === 'onLaunch') {
                const result = item.effect.action(vx, vy);
                vx = result.vx;
                vy = result.vy;
            }
        });
        
        // Launch with calculated velocity
        this.character.launch(vx, vy);
        this.soundSystem.playSound('launch');
        this.gameState.consecutiveHits = 0;
        
        // Hide crosshair during launch
        document.getElementById('crosshair').classList.add('hidden');
        
        // Display message
        const angleDegrees = Math.round(angle * (180 / Math.PI));
        this.uiManager.addMessage(`Numby launched at ${angleDegrees}° angle!`);
    }

    startGame() {
        this.uiManager.updateQuota();
        this.uiManager.updateDayCounter();
        this.uiManager.addMessage("Welcome to Numby's Number Factory! Meet your quota or face cosmic consequences.");
        this.resetNumby();
        
        // Start playing main theme
        this.soundSystem.playMusic('main_theme');
    }

    resetNumby() {
        const boardRect = document.getElementById('pegboard').getBoundingClientRect();
        const x = boardRect.width / 2;
        
        // Position Numby higher up to give more space before the first row of pegs
        const y = this.character.radius + 30; // Increased from 5 to 30
        
        this.character.setPosition(x, y);
        this.character.setActive(false);
    }

    restartGame() {
        // Clear the game over timeout and listener
        if (this.boundSpeakGameOver) {
            clearTimeout(this.gameOverTimeout);
            this.boundSpeakGameOver = null;
        }
        
        // Reset destroyed peg positions on game restart
        if (this.gameBoard) {
            this.gameBoard.destroyedPegPositions.clear();
            // Also clear initial state
            this.gameBoard.initialDayState = { pegs: [], layout: null, destroyedPegPositions: new Set() };
        }
        
        // Remove catastrophic effects
        const overlay = document.querySelector('.catastrophic-overlay');
        if (overlay) overlay.remove();
        
        document.getElementById('game-over').classList.remove('catastrophic-modal');
        
        this.gameState.reset();
        document.getElementById('game-over').classList.add('hidden');
        this.gameBoard.generateBoard();
        this.startGame();
        
        // Make sure UI reflects reset state
        this.uiManager.updateInventory([]);
        this.uiManager.updateLives();
        
        // Record game played in stats
        this.statsSystem.recordGamePlayed();
    }

    gameLoop() {
        if (this.character.isActive) {
            this.character.update();
            this.checkCollisions();
            
            // Apply any onUpdate effects from items
            this.items.forEach(item => {
                if (item.effect && item.effect.type === 'onUpdate') {
                    item.effect.action(this.character, this.gameBoard);
                }
            });
            
            // Check if Numby has exited the board in any direction
            if (this.character.hasExitedBoard()) {
                this.endRun();
            }
        }

        // Only check for quota completion without ending the day
        // The day will only end when Numby exits through the bottom
        
        requestAnimationFrame(() => this.gameLoop());
    }

    checkCollisions() {
        const collisions = this.gameBoard.checkCollisions(this.character);
        
        collisions.forEach(collision => {
            if (collision.type === 'peg') {
                // Basic collision with regular peg
                this.character.bounceOff(collision.x, collision.y);
                this.soundSystem.playSound('peg_hit');
                this.statsSystem.recordPegHit();
                
                // Get the peg object from the ID
                const pegIndex = this.gameBoard.pegs.findIndex(p => p.id === collision.id);
                if (pegIndex !== -1) {
                    const peg = this.gameBoard.pegs[pegIndex];
                    
                    // Add peg score to player's score
                    const scoreToAdd = peg.score;
                    this.gameState.addToScore(scoreToAdd);
                    this.uiManager.updateScore(); // This now updates both score display and quota tracker
                    this.uiManager.showPegScorePopup(collision.x, collision.y, scoreToAdd);
                    
                    // Halve the peg's score
                    const newScore = Math.floor(peg.score / 2);
                    
                    // Update or remove peg
                    if (newScore <= 0) {
                        this.gameBoard.removePeg(peg.id);
                    } else {
                        this.gameBoard.updatePegScore(peg.id, newScore);
                    }
                }
            } else if (collision.type === 'numberNode') {
                // Find the actual node object with all its properties
                const nodeIndex = this.gameBoard.numberNodes.findIndex(n => n.id === collision.id);
                if (nodeIndex === -1) return;
                
                const node = this.gameBoard.numberNodes[nodeIndex];
                
                // Play special sound for special nodes
                if (node.type && node.type !== 'normal') {
                    this.soundSystem.playSound('special_node');
                }
                
                // Handle special node effects
                const specialEffectActivated = this.gameBoard.handleSpecialNodeEffect(node, this);
                
                // Show visual effect for special nodes
                if (node.effect) {
                    this.uiManager.showSpecialNodeEffect(node.x, node.y, node.effect.type);
                }
                
                // Hit a number generating node
                const baseValue = node.value;
                // Pass the node type to apply appropriate item effects
                const finalValue = this.itemSystem.applyItemEffects('onNumberHit', baseValue, node.type, node, this);
                
                // Apply any daily challenge effects
                const challengeValue = this.gameState.applyDailyChallengeToScore(finalValue, node.type, baseValue);
                
                // Apply any run-specific effects (like consecutive hits)
                let multiplier = 1;
                if (this.gameState.consecutiveHits) {
                    multiplier = this.itemSystem.applyItemEffects('onRun', 1);
                }
                
                const totalValue = Math.floor(challengeValue * multiplier);
                
                this.gameState.addToScore(totalValue);
                this.uiManager.updateScore(); // Updates both score and quota tracker
                this.uiManager.showNumberPopup(collision.x, collision.y, totalValue);
                
                // Show different messages based on whether special effects or multipliers were applied
                if (specialEffectActivated) {
                    // Message already shown by special effect
                } else if (totalValue !== baseValue) {
                    this.uiManager.addMessage(`Generated ${totalValue} from a ${baseValue} node! (${Math.floor((totalValue/baseValue-1)*100)}% bonus)`);
                } else {
                    this.uiManager.addMessage(`Generated ${totalValue} from a node!`);
                }
                
                // Show activation message for temporary effects
                if (this.gameState.temporaryEffects && this.gameState.temporaryEffects.length > 0) {
                    const effect = this.gameState.temporaryEffects[0];
                    if (effect.type === 'globalMultiplier') {
                        this.uiManager.showEffectActivation('globalMultiplier', 1000);
                    }
                }
                
                this.soundSystem.playSound('number_hit');
                
                // Track statistics
                this.statsSystem.recordNumberGenerated(totalValue);
                
                // Remove the node after hit
                this.gameBoard.removeNode(collision.id);
            }
        });
    }

    endRun() {
        this.character.setActive(false);
        
        // Only check for game over if Numby exited through the bottom
        if (this.character.hasExitedBottom()) {
            // Check if quota was met
            if (this.gameState.currentScore < this.gameState.quota) {
                // Check if we have more lives
                if (this.gameState.lives > 0) {
                    // Use a life when Numby exits through bottom without reaching quota
                    this.gameState.useLife();
                    this.uiManager.updateLives();
                    
                    // Play demotivating quip from manager
                    setTimeout(() => {
                        this.soundSystem.speakDemotivatingQuip();
                    }, 500);
                    
                    // Reset Numby for another attempt with same score
                    this.resetNumby();
                    
                    // Reset the grid to its initial state for the current day
                    this.gameBoard.resetGridToInitialState();
                    
                    this.uiManager.addMessage(`Life used! ${this.gameState.lives} lives remaining.`);
                    
                    console.log("Reset grid to initial state - maintaining score:", this.gameState.currentScore);
                } else {
                    // No lives left, game over
                    this.gameOver();
                }
            } else {
                // Complete the day when quota was met
                this.completeDay();
            }
        } else {
            // If Numby exited from sides or top, just reset Numby for another attempt (no life lost)
            this.resetNumby();
            this.uiManager.addMessage("Numby reset! Try again to reach the quota.");
        }
    }

    completeDay() {
        // First clear destroyed peg positions when moving to a new day
        this.gameBoard.destroyedPegPositions.clear();
        
        // Shuffle and combine remaining pegs
        this.gameBoard.shuffleRemainingPegs();
        
        this.gameState.completeDay();
        
        // Update lives display after restoring lives
        this.uiManager.updateLives();
        
        const extraLives = Math.min(this.gameState.lives - 1, this.gameState.maxLives - 1); // -1 because one is baseline
        let message = `Day ${this.gameState.day - 1} complete! Quota reached.`;
        
        if (extraLives > 0) {
            message += ` Gained ${extraLives} extra ${extraLives === 1 ? 'life' : 'lives'}!`;
        }
        
        this.uiManager.addMessage(message);
        this.uiManager.addMessage("The sun remains intact... for now.");
        this.soundSystem.playSound('day_complete');
        
        // Update statistics
        this.statsSystem.updateHighestDay(this.gameState.day);
        
        // Check for achievements
        this.achievementSystem.checkAchievements();
        
        // Add daily challenge if appropriate day
        if (this.gameState.day % 3 === 0) {
            this.gameState.addDailyChallenge();
            this.uiManager.showDailyChallenge(this.gameState.dailyChallenge);
        }
        
        // Open the shop instead of automatically giving an item
        this.shopSystem.openShop();
        
        // Switch to shop music
        this.soundSystem.playMusic('shop');
        
        // Reset Numby
        this.resetNumby();
        
        // Update UI
        this.uiManager.updateDayCounter();
        this.uiManager.updateQuota();
    }

    gameOver() {
        // Stop alarm if active
        if (this.soundSystem) {
            this.soundSystem.stopAlarm();
        }
        
        this.gameState.endGame();
        document.getElementById('final-score').textContent = this.gameState.currentScore;
        
        // Show catastrophic failure effect
        this.uiManager.showCatastrophicFailure();
        
        this.uiManager.addMessage("CATASTROPHIC FAILURE! The sun has exploded.");
        
        // Play game over sound and music
        this.soundSystem.playSound('game_over');
        this.soundSystem.playMusic('game_over');
        
        // Clear any existing timeout and remove old listener
        if (this.boundSpeakGameOver) {
            clearTimeout(this.gameOverTimeout);
        }
        
        // Create new bound function and store it
        this.boundSpeakGameOver = () => {
            this.soundSystem.speakGameOverMessage();
        };
        
        // Set new timeout with new listener
        this.gameOverTimeout = setTimeout(this.boundSpeakGameOver, 1500);
    }
    
    toggleSound() {
        const soundButton = document.getElementById('sound-btn');
        const isMuted = this.soundSystem.toggleMute();
        
        if (isMuted) {
            soundButton.textContent = '🔈';
            soundButton.classList.add('muted');
        } else {
            soundButton.textContent = '🔊';
            soundButton.classList.remove('muted');
        }
    }
    
    // Add new method to toggle music
    toggleMusic() {
        const musicButton = document.getElementById('music-btn');
        const isMuted = this.soundSystem.toggleMusic();
        
        if (isMuted) {
            musicButton.textContent = '🎵';
            musicButton.classList.add('muted');
        } else {
            musicButton.textContent = '🎵';
            musicButton.classList.remove('muted');
        }
    }
    
    showHelp() {
        document.getElementById('help-modal').classList.remove('hidden');
    }
    
    closeHelp() {
        document.getElementById('help-modal').classList.add('hidden');
    }
    
    showStats() {
        // Update stats display with latest values
        const stats = this.statsSystem.getStats();
        document.getElementById('stat-games-played').textContent = stats.gamesPlayed;
        document.getElementById('stat-highest-day').textContent = stats.highestDay;
        document.getElementById('stat-numbers-generated').textContent = stats.totalNumbersGenerated;
        document.getElementById('stat-largest-number').textContent = stats.largestNumberGenerated;
        document.getElementById('stat-pegs-hit').textContent = stats.pegsHit;
        document.getElementById('stat-items-collected').textContent = stats.itemsCollected;
        document.getElementById('stat-total-score').textContent = stats.totalScore.toLocaleString();
        
        // Show the modal
        document.getElementById('stats-modal').classList.remove('hidden');
    }
    
    closeStats() {
        document.getElementById('stats-modal').classList.add('hidden');
    }
    
    showAchievements() {
        this.achievementSystem.showAchievementsModal();
    }
}

// Start the game when the page loads
window.addEventListener('DOMContentLoaded', () => {
    const game = new Game();
});
