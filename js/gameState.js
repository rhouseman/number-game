export class GameState {
    constructor() {
        this.reset();
    }

    reset() {
        this.currentScore = 0;
        this.day = 1;
        this.quota = this.calculateDailyQuota();
        this.runEnded = false;
        this.items = [];
        this.synergies = [];
        this.temporaryEffects = [];
        this.consecutiveHits = 0;
        this.statsSystem = null;
        this.dailyChallenge = null;
        this.lives = 3; // Start with 3 lives
        this.maxLives = 5; // Maximum number of lives
    }

    setStatsSystem(statsSystem) {
        this.statsSystem = statsSystem;
    }

    addToScore(value) {
        this.currentScore += value;
    }

    calculateDailyQuota() {
        if (this.day === 1) {
            return 50; // Very easy first day
        }

        // Base quota scaling
        let baseQuota;
        if (this.day <= 10) {
            // Days 1-10: Very gentle scaling
            baseQuota = 50 + (this.day - 1) * 25;
        } else if (this.day <= 30) {
            // Days 11-30: Moderate scaling
            baseQuota = 275 + (this.day - 10) * 40;
        } else if (this.day <= 60) {
            // Days 31-60: More challenging scaling
            const daysPast30 = this.day - 30;
            baseQuota = 1075 + daysPast30 * 75;
        } else if (this.day <= 100) {
            // Days 61-100: Final challenge scaling
            const daysPast60 = this.day - 60;
            baseQuota = 3325 + daysPast60 * 150;
        } else {
            // Post day 100: Endless mode with steeper scaling
            const daysPast100 = this.day - 100;
            baseQuota = 9325 + daysPast100 * 300;
        }

        // Apply daily challenge modifier if active
        if (this.dailyChallenge && this.dailyChallenge.quotaModifier) {
            baseQuota *= this.dailyChallenge.quotaModifier;
        }

        return Math.floor(baseQuota);
    }

    completeDay() {
        this.day++;
        
        // Bonus life every 10 days until day 100
        if (this.day % 10 === 0 && this.day <= 100) {
            this.lives = Math.min(this.lives + 2, this.maxLives);
        } else {
            // Regular completion restores 1 life
            this.lives = Math.min(this.lives + 1, this.maxLives);
        }
        
        // Reset score for next day
        this.currentScore = 0;
        
        // Calculate new quota
        this.quota = this.calculateDailyQuota();
        
        // Clear any temporary effects
        this.temporaryEffects = [];
    }

    endGame() {
        this.runEnded = true;
        this.items = []; // Reset items when the game is over
    }

    addTemporaryEffect(effect) {
        if (!this.temporaryEffects) {
            this.temporaryEffects = [];
        }
        this.temporaryEffects.push(effect);
    }

    addDailyChallenge() {
        const challenges = [
            { 
                name: "Double Quota",
                description: "Today's quota is doubled, but all numbers are worth 50% more!",
                effect: (score) => Math.floor(score * 1.5),
                applyToQuota: () => { this.quota *= 2; }
            },
            {
                name: "High Gravity",
                description: "Gravity is increased! Numby falls faster, but all prime numbers are worth triple.",
                effect: (score, nodeType) => nodeType === 'prime' ? score * 3 : score,
                applyToCharacter: (character) => { character.gravity *= 1.5; }
            },
            {
                name: "Slippery Factory Floor",
                description: "Extra slippery today! Numby has less friction but collects 25% more from even numbers.",
                effect: (score, value) => value % 2 === 0 ? Math.floor(score * 1.25) : score,
                applyToCharacter: (character) => { character.friction *= 1.2; }
            },
            {
                name: "Special Node Shower",
                description: "Many special nodes today, but regular nodes are worth less.",
                effect: (score, nodeType) => nodeType === 'special' ? score * 2 : Math.floor(score * 0.8),
                modifyBoard: true
            },
            {
                name: "Peg Bonanza",
                description: "All pegs score double points, but the quota is 50% higher!",
                effect: (score) => score,
                applyToQuota: () => { this.quota = Math.floor(this.quota * 1.5); },
                pegScoreMultiplier: 2
            }
        ];

        // Select random challenge
        this.dailyChallenge = challenges[Math.floor(Math.random() * challenges.length)];
        
        // Apply challenge effects immediately if needed
        if (this.dailyChallenge.applyToQuota) {
            this.dailyChallenge.applyToQuota();
        }
        
        return this.dailyChallenge;
    }

    // Calculate score with daily challenge effects applied
    applyDailyChallengeToScore(score, nodeType, value) {
        if (!this.dailyChallenge || !this.dailyChallenge.effect) return score;
        return this.dailyChallenge.effect(score, nodeType, value);
    }

    useLife() {
        if (this.lives > 0) {
            this.lives--;
            return true; // Successfully used a life
        }
        return false; // No lives left
    }
}
