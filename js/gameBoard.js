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

    // Calculate peg score based on day
    calculatePegScore(row, totalRows) {
        if (this.gameState.day === 1) {
            return 1; // Day 1: All pegs are worth 1
        }
        
        // Base value scales with day
        const baseValue = Math.max(1, Math.floor(Math.log2(this.gameState.day)));
        
        // Higher rows worth more (5 at top, 1 at bottom)
        const rowValue = totalRows - row;
        
        // Calculate score based on row position and day
        const score = baseValue * Math.pow(2, rowValue - 1);
        
        return Math.max(1, score);
    }
    
    // New method to shuffle remaining pegs after day completion
    shuffleRemainingPegs() {
        // Save active peg positions
        const activePegPositions = this.pegs.map(peg => ({
            row: peg.row,
            col: peg.col,
            score: peg.score
        }));
        
        // Remove existing pegs but keep their data
        const pegContainer = this.boardElement;
        while (pegContainer.firstChild) {
            pegContainer.removeChild(pegContainer.firstChild);
        }
        
        // Clear peg array but keep the data for later
        const previousPegs = [...this.pegs];
        this.pegs = [];
        
        // Calculate available grid positions
        const availablePositions = [];
        const occupiedKeys = new Set();
        const rows = this.gridLayout.rows;
        const cols = this.gridLayout.cols;
        
        // Add all available grid positions (that aren't destroyed)
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const gridKey = `${row},${col}`;
                if (!this.destroyedPegPositions.has(gridKey)) {
                    const x = this.gridLayout.wallToCenter + col * this.gridLayout.effectiveCenterToCenter;
                    const y = this.gridLayout.topMargin + row * this.gridLayout.effectiveCenterToCenter;
                    
                    availablePositions.push({
                        x, y, row, col, gridKey,
                        score: this.calculatePegScore(row, rows)
                    });
                }
            }
        }
        
        // Calculate how many pegs to keep
        const pegsToPlace = Math.min(previousPegs.length, this.maxPegs);
        
        // Shuffle available positions
        this.shuffleArray(availablePositions);
        
        // First pass: place pegs from previous day in new positions
        const shuffledPegs = this.shuffleArray([...previousPegs]);
        for (let i = 0; i < pegsToPlace; i++) {
            if (i < shuffledPegs.length && i < availablePositions.length) {
                const position = availablePositions[i];
                const previousPeg = shuffledPegs[i];
                
                // Track as occupied
                occupiedKeys.add(position.gridKey);
                
                // Add peg at new position with previous score
                this.addPeg(position.x, position.y, previousPeg.score, position.row, position.col);
            }
        }
        
        // Fill remaining spots with new pegs
        const remainingPositions = availablePositions.filter(pos => !occupiedKeys.has(pos.gridKey));
        const spotsToFill = Math.min(remainingPositions.length, this.maxPegs - this.pegs.length);
        
        for (let i = 0; i < spotsToFill; i++) {
            const position = remainingPositions[i];
            this.addPeg(position.x, position.y, position.score, position.row, position.col);
        }
        
        // Combine similar pegs
        this.combineNeighborPegs();
        
        // Save the new initial day state
        this.saveInitialDayState(true);
    }
    
    // New method to combine neighboring pegs with similar values
    combineNeighborPegs() {
        // Sort pegs by score (highest to lowest)
        const sortedPegs = [...this.pegs].sort((a, b) => b.score - a.score);
        
        // Early exit if not enough pegs
        if (sortedPegs.length < 2) return;
        
        // Keep track of which pegs have been combined
        const combinedPegIds = new Set();
        
        // Combine the top-scoring pegs (highest numbers combine)
        // Only combine up to 30% of the pegs
        const combinationsToMake = Math.floor(sortedPegs.length * 0.3);
        
        for (let i = 0; i < combinationsToMake * 2; i += 2) {
            // Make sure we have at least 2 pegs left to combine
            if (i + 1 >= sortedPegs.length) break;
            
            const pegA = sortedPegs[i];
            const pegB = sortedPegs[i + 1];
            
            // Skip if either peg was already combined
            if (combinedPegIds.has(pegA.id) || combinedPegIds.has(pegB.id)) continue;
            
            // Combine the pegs (add B's value to A)
            const newScore = pegA.score + pegB.score;
            
            // Update the higher-value peg
            this.updatePegScore(pegA.id, newScore);
            
            // Mark both pegs as combined
            combinedPegIds.add(pegA.id);
            combinedPegIds.add(pegB.id);
            
            // Add a visual effect to show the combination
            this.addCombineEffect(pegA.x, pegA.y, pegB.x, pegB.y, pegA.id);
        }
    }
    
    // Add visual effect for peg combining
    addCombineEffect(x1, y1, x2, y2, targetId) {
        // Create a line between the two pegs
        const effectLine = document.createElement('div');
        effectLine.className = 'combine-effect-line';
        effectLine.style.position = 'absolute';
        
        // Calculate line length and angle
        const dx = x2 - x1;
        const dy = y2 - y1;
        const length = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx) * (180 / Math.PI);
        
        // Position and rotate the line
        effectLine.style.width = `${length}px`;
        effectLine.style.left = `${x1}px`;
        effectLine.style.top = `${y1}px`;
        effectLine.style.transformOrigin = '0 0';
        effectLine.style.transform = `rotate(${angle}deg)`;
        
        // Add to board
        this.boardElement.appendChild(effectLine);
        
        // Add a pulse effect to the target peg
        const targetPeg = this.pegs.find(peg => peg.id === targetId);
        if (targetPeg && targetPeg.element) {
            targetPeg.element.classList.add('peg-combined');
            setTimeout(() => {
                targetPeg.element.classList.remove('peg-combined');
            }, 1000);
        }
        
        // Remove the effect after animation
        setTimeout(() => {
            effectLine.remove();
        }, 1000);
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
