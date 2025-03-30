export class GameState {
    constructor() {
        this.reset();
    }

    reset() {
        this.currentScore = 0;
        this.day = 1;
        this.quota = this.calculateQuota(this.day);
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

    calculateQuota(day) {
        // Start with a lower quota (5) on day 1
        // Scale based on peg values and doubling mechanics
        // Day 1: 5
        // Day 2: ~12
        // Day 3: ~25
        // Day 4: ~50
        // etc. - scaling with the expected peg value progression
        
        if (day === 1) return 5; // Fixed day 1 quota
        
        // For later days, scale with expected peg score progression
        // This considers that higher-tiered pegs double approximately every 2-3 days
        // and that there are 15 pegs with an average value that scales with day number
        const baseQuota = 5;
        const growthRate = 1.8; // Slightly less than doubling each day
        
        return Math.floor(baseQuota * Math.pow(growthRate, day - 1));
    }

    completeDay() {
        // Calculate how many lives to restore based on score relative to quota
        let livesToRestore = 0;
        let scoreMultiple = this.currentScore / this.quota;
        
        while (scoreMultiple >= 1 && livesToRestore < this.maxLives) {
            livesToRestore++;
            scoreMultiple /= 2; // Divide by 2 for each level of achievement
        }
        
        // Restore lives, up to the maximum
        this.lives = Math.min(this.lives + livesToRestore, this.maxLives);
        
        this.day++;
        this.currentScore = 0;
        this.quota = this.calculateQuota(this.day);
        this.runEnded = false;
        this.temporaryEffects = [];
        this.consecutiveHits = 0;
        this.dailyChallenge = null; // Clear previous day's challenge
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
