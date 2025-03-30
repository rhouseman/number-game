export class GameBoard {
    constructor(gameState) {
        this.gameState = gameState;
        this.pegs = [];
        this.numberNodes = []; // Keep this for compatibility even though we won't use it
        this.nodeCounter = 0;
        this.pegCounter = 0;
        this.boardElement = document.getElementById('pegboard');
        this.boardRect = this.boardElement.getBoundingClientRect();
        
        // Configuration options
        this.pegRadius = 30; // Equal to Numby's diameter (2 * Numby's radius)
        this.nodeRadius = 20;
        
        // Peg spacing constants
        this.pegSpacing = {
            edgeToEdge: 60, // 2 Numby diameters (60px) between peg edges
            wallToEdge: 60, // 2 Numby diameters (60px) from wall to peg edge
            topMarginPercent: 0.25  // Increased from 0.15 to 0.25 to create more space at the top
        };
        
        // Peg scoring configuration
        this.basePegScore = 1; // Day 1 pegs start at value 1
        this.savedPegs = [];
        this.initialDayState = {
            pegs: [],
            layout: null,
            destroyedPegPositions: new Set()
        };
        
        // Grid configuration
        this.gridSize = {
            rows: 5,
            cols: 5
        };
        
        this.maxPegs = 15; // Maximum number of pegs to display at once
        
        // Track destroyed pegs for visual feedback
        this.destroyedPegPositions = new Set();
        
        // Calculate the fixed board width based on game container
        this.calculateBoardDimensions();
    }
    
    calculateBoardDimensions() {
        // The board width is the game container width (660px) minus padding (20px on each side)
        // and the border (4px on each side)
        this.fixedBoardWidth = 660 - 40 - 8;
        
        // Update board rect for calculations
        this.boardRect = this.boardElement.getBoundingClientRect();
    }

    generateBoard() {
        // Clear existing elements
        this.clearBoard();
        
        // Update board dimensions (in case window was resized)
        this.calculateBoardDimensions();
        
        // Board dimensions - use fixed width
        const width = this.fixedBoardWidth;
        const height = this.boardRect.height;
        
        // Fixed grid of 5x5
        const rows = this.gridSize.rows;
        const cols = this.gridSize.cols;
        
        // Calculate spacing between peg centers
        // For a peg with radius R and spacing S between edges:
        // Center-to-center distance = 2*R + S
        const centerToCenter = this.pegRadius * 2 + this.pegSpacing.edgeToEdge;
        
        // Calculate wall margin - from wall to center of first/last column
        // We want wall-to-edge spacing of exactly 60px (2 Numby diameters)
        // So wall-to-center = wall-to-edge + peg radius = 60px + 30px = 90px
        const wallToCenter = this.pegSpacing.wallToEdge + this.pegRadius;
        
        // Position the grid with correct wall spacing
        // First peg center is wallToCenter from left edge
        // Last peg center is wallToCenter from right edge
        // Total width needed is: wallToCenter + (cols-1)*centerToCenter + wallToCenter
        // Check if board is wide enough
        const requiredWidth = wallToCenter * 2 + (cols - 1) * centerToCenter;
        
        // If board is not wide enough, adjust centerToCenter to fit
        let effectiveCenterToCenter = centerToCenter;
        if (requiredWidth > width) {
            const availableSpace = width - (wallToCenter * 2);
            effectiveCenterToCenter = availableSpace / (cols - 1);
            console.log(`Board too narrow. Reducing spacing from ${centerToCenter} to ${effectiveCenterToCenter}`);
        }
        
        // Calculate top margin - increased to lower the grid
        const topMargin = height * this.pegSpacing.topMarginPercent;
        
        // Store these values for consistent coordinate calculations
        this.gridLayout = {
            wallToCenter,
            effectiveCenterToCenter,
            topMargin,
            rows,
            cols
        };
        
        // Generate all possible grid positions
        const allGridPositions = [];
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const x = wallToCenter + col * effectiveCenterToCenter;
                const y = topMargin + row * effectiveCenterToCenter;
                
                allGridPositions.push({
                    x, y, row, col,
                    // Day 1: All pegs are worth 1
                    // Later days: powers of 2 with higher rows having higher powers
                    // Calculate score with more gradual progression
                    score: this.calculatePegScore(row, rows),
                    gridKey: `${row},${col}`
                });
            }
        }

        // Add destroyed peg outlines first (but only for the current day, not between days)
        if (this.destroyedPegPositions && this.destroyedPegPositions.size > 0) {
            this.destroyedPegPositions.forEach(gridKey => {
                const position = allGridPositions.find(pos => pos.gridKey === gridKey);
                if (position) {
                    this.addDestroyedPegOutline(position.x, position.y);
                }
            });
        }
        
        // For the first day or when there are no saved pegs
        if (this.savedPegs.length === 0 || this.gameState.day === 1) {
            // Shuffle and select random peg positions
            this.shuffleArray(allGridPositions);
            const selectedPositions = allGridPositions.slice(0, this.maxPegs);
            
            // Create the pegs
            selectedPositions.forEach(pos => {
                this.addPeg(pos.x, pos.y, pos.score, pos.row, pos.col);
            });
            
            // Save initial day state for resetting when Numby dies
            this.saveInitialDayState(true);
        } else {
            // Handle existing pegs from previous day
            if (this.gameState.day > 1) {
                // Ensure all saved pegs have valid grid positions
                this.savedPegs = this.savedPegs.filter(pegData => {
                    // Find the closest grid position for this peg
                    const gridPos = allGridPositions.find(pos => pos.gridKey === `${pegData.row},${pegData.col}`);
                    return gridPos !== undefined;
                });
                
                // Only increase some pegs' scores with focus on lower value pegs
                this.savedPegs.forEach(pegData => {
                    // Higher chance to double lower value pegs
                    const doubleChance = pegData.score < 8 ? 0.5 : // 50% chance for small pegs
                                      pegData.score < 32 ? 0.25 : // 25% for medium pegs
                                      0.1; // 10% for larger pegs
                    
                    if (Math.random() < doubleChance) {
                        pegData.score *= 2;
                    }
                });
                
                // Determine how many pegs to keep from previous day
                const pegsToKeep = Math.min(this.savedPegs.length, Math.floor(this.maxPegs * 0.6)); // Keep about 60%
                
                // Shuffle the saved pegs and select some to keep
                this.shuffleArray(this.savedPegs);
                const keptPegs = this.savedPegs.slice(0, pegsToKeep);
                
                // Add back kept pegs at their exact grid positions
                keptPegs.forEach(pegData => {
                    // Find the correct position from allGridPositions
                    const gridPos = allGridPositions.find(pos => pos.gridKey === `${pegData.row},${pegData.col}`);
                    if (gridPos) {
                        this.addPeg(gridPos.x, gridPos.y, pegData.score, pegData.row, pegData.col);
                    }
                });
                
                // Calculate remaining grid positions that are not occupied
                const occupiedPositions = new Set(this.pegs.map(peg => `${peg.row},${peg.col}`));
                const destroyedPositions = new Set([...this.destroyedPegPositions]);
                
                // Exclude both occupied and destroyed peg positions
                const availablePositions = allGridPositions.filter(pos => 
                    !occupiedPositions.has(pos.gridKey) && !destroyedPositions.has(pos.gridKey)
                );
                
                // Shuffle available positions
                this.shuffleArray(availablePositions);
                
                // Add new pegs to fill up to maxPegs
                const remainingPegs = this.maxPegs - this.pegs.length;
                for (let i = 0; i < remainingPegs && i < availablePositions.length; i++) {
                    const pos = availablePositions[i];
                    this.addPeg(pos.x, pos.y, pos.score, pos.row, pos.col);
                }
                
                // Save initial day state for resetting when Numby dies
                this.saveInitialDayState(true);
            }
        }
        
        // Clear saved pegs since they've been placed
        this.savedPegs = [];
        
        // Log the grid dimensions and spacing for debugging
        console.log(`Grid: ${cols}x${rows}, Active pegs: ${this.pegs.length}/${rows*cols}`);
    }

    // Calculate peg score with more gradual progression
    calculatePegScore(row, totalRows) {
        if (this.gameState.day === 1) {
            return 1; // Day 1: All pegs are worth 1
        }
        
        // For later days: more gradual doubling based on row position
        const rowValue = totalRows - row; // 5 at top, 1 at bottom
        
        // Day affects score more gradually, higher rows still worth more
        const dayFactor = Math.floor(Math.log2(this.gameState.day) + 1);
        const exponent = rowValue === 1 ? dayFactor : // Bottom row doubles every day
                        rowValue === 2 ? Math.floor(dayFactor * 0.8) : // Second row doubles more slowly
                        rowValue === 3 ? Math.floor(dayFactor * 0.6) : // Middle row
                        rowValue === 4 ? Math.floor(dayFactor * 0.4) : // Second from top
                        Math.floor(dayFactor * 0.3); // Top row doubles very slowly
        
        return Math.pow(2, exponent);
    }

    // Shuffle array in place (Fisher-Yates algorithm)
    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    clearBoard() {
        // Save existing pegs before clearing
        if (this.pegs.length > 0) {
            this.savedPegs = this.pegs.map(peg => ({
                x: peg.x, 
                y: peg.y, 
                score: peg.score,
                row: peg.row,
                col: peg.col
            }));
        }
        
        this.pegs = [];
        this.numberNodes = [];
        this.boardElement.innerHTML = '';
    }

    addPeg(x, y, score = 1, row, col) {
        const peg = {
            id: this.pegCounter++,
            x,
            y,
            row,
            col,
            radius: this.pegRadius,
            score: score,
            element: document.createElement('div')
        };
        
        peg.element.className = 'peg';
        peg.element.style.left = `${x}px`;
        peg.element.style.top = `${y}px`;
        
        // Store grid coordinates as data attributes
        peg.element.dataset.row = row;
        peg.element.dataset.col = col;
        
        // Always show score - even for pegs with value 1
        peg.element.dataset.score = score;
        peg.element.classList.add('scored-peg');
        
        // Visual indication of higher value pegs
        if (score >= 16) {
            peg.element.classList.add('high-value-peg');
        } else if (score >= 8) {
            peg.element.classList.add('medium-value-peg');
        }
        
        this.boardElement.appendChild(peg.element);
        this.pegs.push(peg);
    }

    // Add a visual indicator for destroyed pegs with exact grid coordinates
    addDestroyedPegOutline(x, y) {
        const outline = document.createElement('div');
        outline.className = 'peg-outline';
        outline.style.left = `${x}px`;
        outline.style.top = `${y}px`;
        
        this.boardElement.appendChild(outline);
    }

    removePeg(pegId) {
        const pegIndex = this.pegs.findIndex(peg => peg.id === pegId);
        
        if (pegIndex !== -1) {
            const peg = this.pegs[pegIndex];
            
            // Add to destroyed pegs set for visual feedback
            const gridKey = `${peg.row},${peg.col}`;
            this.destroyedPegPositions.add(gridKey);
            
            // Add visual outline at the position
            this.addDestroyedPegOutline(peg.x, peg.y);
            
            peg.element.remove();
            this.pegs.splice(pegIndex, 1);
        }
    }
    
    updatePegScore(pegId, newScore) {
        const peg = this.pegs.find(peg => peg.id === pegId);
        
        if (peg) {
            peg.score = newScore;
            
            if (newScore <= 0) {
                this.removePeg(pegId);
                return;
            }
            
            // Always update and display the score - even if it's 1
            peg.element.dataset.score = newScore;
            
            peg.element.classList.remove('high-value-peg', 'medium-value-peg');
            if (newScore >= 16) {
                peg.element.classList.add('high-value-peg');
            } else if (newScore >= 8) {
                peg.element.classList.add('medium-value-peg');
            }
        }
    }

    checkCollisions(character) {
        const collisions = [];
        const charPosition = character.getPosition();
        const charRadius = character.getRadius();
        
        // Check collisions with pegs
        this.pegs.forEach(peg => {
            const dx = peg.x - charPosition.x;
            const dy = peg.y - charPosition.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < charRadius + peg.radius) {
                collisions.push({
                    type: 'peg',
                    id: peg.id,
                    x: peg.x,
                    y: peg.y,
                    score: peg.score
                });
            }
        });
        
        return collisions;
    }

    // Save initial day state - this is the key method for our fix
    saveInitialDayState(newDay = false) {
        // If it's a new day, reset the destroyed positions
        if (newDay) {
            this.destroyedPegPositions = new Set();
        }

        // Store all initial pegs with deep copies
        this.initialDayState = {
            pegs: this.pegs.map(peg => ({
                id: peg.id,
                x: peg.x,
                y: peg.y,
                row: peg.row,
                col: peg.col,
                score: peg.score,
                gridKey: `${peg.row},${peg.col}`
            })),
            layout: { ...this.gridLayout },
            destroyedPegPositions: new Set(this.destroyedPegPositions)
        };
        
        console.log(`Initial day state saved: ${this.initialDayState.pegs.length} pegs`);
    }
    
    // Reset the grid to the initial state of the current day
    resetGridToInitialState() {
        // First, clear all current elements
        this.clearBoardWithoutSaving();
        
        // Make sure we have a valid initial state
        if (!this.initialDayState || !this.initialDayState.pegs || this.initialDayState.pegs.length === 0) {
            console.error("Cannot reset grid: No initial day state available");
            return;
        }
        
        // Restore grid layout
        this.gridLayout = this.initialDayState.layout;
        
        // Restore destroyed positions
        this.destroyedPegPositions = new Set(this.initialDayState.destroyedPegPositions);
        
        // Add destroyed peg outlines based on the initial state's destroyed positions
        if (this.destroyedPegPositions.size > 0) {
            this.destroyedPegPositions.forEach(gridKey => {
                const [row, col] = gridKey.split(',').map(Number);
                
                const x = this.gridLayout.wallToCenter + col * this.gridLayout.effectiveCenterToCenter;
                const y = this.gridLayout.topMargin + row * this.gridLayout.effectiveCenterToCenter;
                
                this.addDestroyedPegOutline(x, y);
            });
        }
        
        // Rebuild pegs based on the initial day state, but exclude destroyed pegs
        this.initialDayState.pegs.forEach(pegData => {
            // Skip if this position was destroyed
            if (this.destroyedPegPositions.has(`${pegData.row},${pegData.col}`)) {
                return;
            }
            
            // Otherwise, add the peg with its initial properties
            this.addPeg(pegData.x, pegData.y, pegData.score, pegData.row, pegData.col);
        });
        
        console.log(`Grid reset from initial state: ${this.pegs.length} active pegs, ${this.destroyedPegPositions.size} destroyed`);
    }

    // Clear the board without saving the current state
    clearBoardWithoutSaving() {
        // Reset pegs array
        this.pegs = [];
        this.numberNodes = [];
        
        // Important: Clear all DOM elements to avoid duplicates
        this.boardElement.innerHTML = '';
    }
    
    // Clear destroyed peg positions when moving to a new day
    completeDay() {
        this.destroyedPegPositions.clear();
        this.initialDayState.destroyedPegPositions.clear();
    }
}
