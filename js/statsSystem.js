export class StatsSystem {
    constructor() {
        this.stats = this.loadStats() || this.getDefaultStats();
    }

    getDefaultStats() {
        return {
            gamesPlayed: 0,
            highestDay: 0,
            totalNumbersGenerated: 0,
            largestNumberGenerated: 0,
            pegsHit: 0,
            itemsCollected: 0,
            totalScore: 0
        };
    }

    loadStats() {
        try {
            const statsJson = localStorage.getItem('NumbyStats');
            if (statsJson) {
                return JSON.parse(statsJson);
            }
        } catch (e) {
            console.error('Could not load stats:', e);
        }
        return null;
    }

    saveStats() {
        try {
            localStorage.setItem('NumbyStats', JSON.stringify(this.stats));
        } catch (e) {
            console.error('Could not save stats:', e);
        }
    }

    recordGamePlayed() {
        this.stats.gamesPlayed++;
        this.saveStats();
    }

    updateHighestDay(day) {
        if (day > this.stats.highestDay) {
            this.stats.highestDay = day;
            this.saveStats();
        }
    }

    recordNumberGenerated(value) {
        this.stats.totalNumbersGenerated++;
        this.stats.totalScore += value;
        
        if (value > this.stats.largestNumberGenerated) {
            this.stats.largestNumberGenerated = value;
        }
        
        this.saveStats();
    }

    recordPegHit() {
        this.stats.pegsHit++;
        this.saveStats();
    }

    recordItemCollected() {
        this.stats.itemsCollected++;
        this.saveStats();
    }

    getStats() {
        return {...this.stats};
    }
}
