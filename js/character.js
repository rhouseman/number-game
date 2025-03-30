export class Character {
    constructor(gameState, gameBoard) {
        this.gameState = gameState;
        this.gameBoard = gameBoard;
        
        // Add error checking for element
        const numbyElement = document.getElementById('numby');
        if (!numbyElement) {
            console.error('Could not find Numby element with ID "numby"');
            throw new Error('Numby element not found');
        }
        this.element = numbyElement;

        this.x = 0;
        this.y = 0;
        this.vx = 0;
        this.vy = 0;
        this.radius = 15; // Radius of Numby
        this.isActive = false;
        this.gravity = 0.2;
        this.friction = 0.98;
        this.elasticity = 0.95; // Increased from 0.9 for more bounce
        this.maxVelocity = 15; // Add maximum velocity cap
    }

    setPosition(x, y) {
        this.x = x;
        this.y = y;
        this.updateElementPosition();
    }

    getPosition() {
        return { x: this.x, y: this.y };
    }

    getRadius() {
        return this.radius;
    }

    setActive(active) {
        this.isActive = active;
    }

    launch(vx, vy) {
        // Scale up velocity to account for larger grid spacing
        this.vx = vx * 1.2; // 20% boost to horizontal velocity
        this.vy = vy * 1.2; // 20% boost to vertical velocity
        
        // Apply velocity cap during launch
        this.capVelocity();
        
        this.isActive = true;
    }

    update() {
        if (!this.isActive) return;
        
        // Apply gravity
        this.vy += this.gravity;
        
        // Apply friction (air resistance)
        this.vx *= this.friction;
        this.vy *= this.friction;
        
        // Cap velocity to prevent excessive speed
        this.capVelocity();
        
        // Update position
        this.x += this.vx;
        this.y += this.vy;
        
        // Check wall collisions
        this.handleWallCollisions();
        
        // Update the DOM element position
        this.updateElementPosition();
    }

    updateElementPosition() {
        this.element.style.left = `${this.x}px`;
        this.element.style.top = `${this.y}px`;
    }

    handleWallCollisions() {
        const boardRect = this.gameBoard.boardRect;
        
        // Left wall
        if (this.x - this.radius < 0) {
            this.x = this.radius;
            this.vx = -this.vx * this.elasticity;
        }
        
        // Right wall
        if (this.x + this.radius > boardRect.width) {
            this.x = boardRect.width - this.radius;
            this.vx = -this.vx * this.elasticity;
        }
        
        // Top wall (optional - may want Numby to exit at top)
        if (this.y - this.radius < 0) {
            this.y = this.radius;
            this.vy = -this.vy * this.elasticity;
        }
        
        // Note: No bottom wall collision - Numby should fall out
    }

    bounceOff(pegX, pegY) {
        // Calculate normal vector from peg to character
        const dx = this.x - pegX;
        const dy = this.y - pegY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        // Normalize the vector
        const nx = dx / dist;
        const ny = dy / dist;
        
        // Calculate dot product (projection of velocity onto normal)
        const dot = this.vx * nx + this.vy * ny;
        
        // Calculate reflection with enhanced bounce for pinball feel
        const boostFactor = 1.5; // Increased from 1.3 for more energetic bounces
        
        // Apply bounce with boost
        this.vx = (this.vx - 2 * dot * nx) * this.elasticity * boostFactor;
        this.vy = (this.vy - 2 * dot * ny) * this.elasticity * boostFactor;
        
        // Apply minimum upward velocity on hits with downward momentum
        if (this.vy > 0) {
            const upwardBoost = 0.8; // Increased from 0.5 for stronger upward bounce
            this.vy = Math.min(this.vy * 0.5, 0) - (Math.sqrt(this.vx * this.vx + this.vy * this.vy) * upwardBoost);
        }
        
        // Cap velocity to prevent excessive speed after bounce
        this.capVelocity();
        
        // Ensure character doesn't get stuck inside peg
        const minDist = this.radius + this.gameBoard.pegRadius;
        if (dist < minDist) {
            this.x = pegX + nx * minDist;
            this.y = pegY + ny * minDist;
        }
    }

    // Add new method to cap velocity
    capVelocity() {
        // Cap horizontal velocity
        if (Math.abs(this.vx) > this.maxVelocity) {
            this.vx = Math.sign(this.vx) * this.maxVelocity;
        }
        
        // Cap vertical velocity
        if (Math.abs(this.vy) > this.maxVelocity) {
            this.vy = Math.sign(this.vy) * this.maxVelocity;
        }
    }

    hasExitedBoard() {
        const boardRect = this.gameBoard.boardRect;
        
        // Check if Numby has exited in any direction
        return this.x - this.radius > boardRect.width ||  // Right edge
               this.x + this.radius < 0 ||               // Left edge
               this.y - this.radius > boardRect.height || // Bottom edge
               this.y + this.radius < 0;                 // Top edge
    }
    
    hasExitedBottom() {
        // Check if Numby has exited specifically through the bottom
        return this.y - this.radius > this.gameBoard.boardRect.height;
    }
}
