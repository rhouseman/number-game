export class AchievementSystem {
    constructor(game) {
        this.game = game;
        this.achievements = this.initializeAchievements();
        this.unlockedAchievements = this.loadUnlockedAchievements();
    }

    initializeAchievements() {
        return [
            {
                id: 'first_day',
                name: 'First Day Survivor',
                description: 'Complete your first day at the Number Factory',
                icon: '🌞',
                checkCondition: () => this.game.gameState.day > 1
            },
            {
                id: 'week_survivor',
                name: 'Week Survivor',
                description: 'Survive for 7 days at the Number Factory',
                icon: '📅',
                checkCondition: () => this.game.gameState.day > 7
            },
            {
                id: 'big_numbers',
                name: 'Big Numbers',
                description: 'Generate a number higher than 1000',
                icon: '🔢',
                checkCondition: () => this.game.statsSystem.getStats().largestNumberGenerated > 1000
            },
            {
                id: 'collector',
                name: 'Collector',
                description: 'Collect 10 different items',
                icon: '🧰',
                checkCondition: () => this.game.gameState.items.length >= 10
            },
            {
                id: 'synergy_master',
                name: 'Synergy Master',
                description: 'Discover 3 item synergies',
                icon: '⚡',
                checkCondition: () => this.game.gameState.synergies && this.game.gameState.synergies.length >= 3
            },
            {
                id: 'peg_bouncer',
                name: 'Peg Bouncer',
                description: 'Bounce off 100 pegs',
                icon: '🏓',
                checkCondition: () => this.game.statsSystem.getStats().pegsHit >= 100
            }
        ];
    }

    loadUnlockedAchievements() {
        try {
            const savedAchievements = localStorage.getItem('NumbyAchievements');
            return savedAchievements ? JSON.parse(savedAchievements) : [];
        } catch (e) {
            console.error('Error loading achievements:', e);
            return [];
        }
    }

    saveUnlockedAchievements() {
        try {
            localStorage.setItem('NumbyAchievements', JSON.stringify(this.unlockedAchievements));
        } catch (e) {
            console.error('Error saving achievements:', e);
        }
    }

    checkAchievements() {
        this.achievements.forEach(achievement => {
            // Skip if already unlocked
            if (this.unlockedAchievements.includes(achievement.id)) return;
            
            // Check if achievement condition is met
            if (achievement.checkCondition()) {
                this.unlockAchievement(achievement);
            }
        });
    }

    unlockAchievement(achievement) {
        // Add to unlocked achievements
        this.unlockedAchievements.push(achievement.id);
        this.saveUnlockedAchievements();
        
        // Show notification
        this.showAchievementNotification(achievement);
        
        // Add to game messages
        this.game.uiManager.addMessage(`🏆 Achievement Unlocked: ${achievement.name}!`);
    }

    showAchievementNotification(achievement) {
        const notification = document.createElement('div');
        notification.className = 'achievement-notification';
        
        const icon = document.createElement('div');
        icon.className = 'achievement-icon';
        icon.textContent = achievement.icon;
        
        const textContainer = document.createElement('div');
        textContainer.className = 'achievement-text';
        
        const title = document.createElement('span');
        title.textContent = 'Achievement Unlocked!';
        
        const name = document.createElement('span');
        name.textContent = achievement.name;
        
        textContainer.appendChild(title);
        textContainer.appendChild(name);
        
        notification.appendChild(icon);
        notification.appendChild(textContainer);
        
        document.body.appendChild(notification);
        
        // Play achievement sound
        this.game.soundSystem.playSound('achievement');
        
        // Remove notification after animation
        setTimeout(() => {
            notification.remove();
        }, 5000);
    }

    showAchievementsModal() {
        // Create modal if it doesn't exist
        if (!document.getElementById('achievements-modal')) {
            this.createAchievementsModal();
        }
        
        this.updateAchievementsModal();
        document.getElementById('achievements-modal').classList.remove('hidden');
    }
    
    createAchievementsModal() {
        const modal = document.createElement('div');
        modal.id = 'achievements-modal';
        modal.className = 'modal hidden';
        
        const content = document.createElement('div');
        content.className = 'modal-content achievements-content';
        
        const title = document.createElement('h2');
        title.textContent = 'Achievements';
        
        const achievementsContainer = document.createElement('div');
        achievementsContainer.id = 'achievements-container';
        achievementsContainer.className = 'achievements-container';
        
        const closeButton = document.createElement('button');
        closeButton.id = 'close-achievements-btn';
        closeButton.textContent = 'Close';
        closeButton.addEventListener('click', () => {
            document.getElementById('achievements-modal').classList.add('hidden');
        });
        
        content.appendChild(title);
        content.appendChild(achievementsContainer);
        content.appendChild(closeButton);
        modal.appendChild(content);
        
        document.body.appendChild(modal);
    }
    
    updateAchievementsModal() {
        const container = document.getElementById('achievements-container');
        container.innerHTML = '';
        
        // Add all achievements to the container
        this.achievements.forEach(achievement => {
            const isUnlocked = this.unlockedAchievements.includes(achievement.id);
            
            const achievementElement = document.createElement('div');
            achievementElement.className = `achievement-item ${isUnlocked ? 'unlocked' : 'locked'}`;
            
            const iconElement = document.createElement('div');
            iconElement.className = 'achievement-icon';
            iconElement.textContent = isUnlocked ? achievement.icon : '?';
            
            const detailsElement = document.createElement('div');
            detailsElement.className = 'achievement-details';
            
            const nameElement = document.createElement('div');
            nameElement.className = 'achievement-name';
            nameElement.textContent = isUnlocked ? achievement.name : '???';
            
            const descElement = document.createElement('div');
            descElement.className = 'achievement-description';
            descElement.textContent = isUnlocked ? achievement.description : 'Keep playing to unlock!';
            
            detailsElement.appendChild(nameElement);
            detailsElement.appendChild(descElement);
            
            achievementElement.appendChild(iconElement);
            achievementElement.appendChild(detailsElement);
            
            container.appendChild(achievementElement);
        });
    }
}
