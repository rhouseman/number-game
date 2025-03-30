export class TutorialSystem {
    constructor(game) {
        this.game = game;
        this.steps = this.createTutorialSteps();
        this.currentStep = 0;
        this.tutorialComplete = this.loadTutorialStatus();
        this.tutorialElement = null;
    }

    loadTutorialStatus() {
        try {
            return localStorage.getItem('NumbyTutorialComplete') === 'true';
        } catch (e) {
            return false;
        }
    }

    saveTutorialStatus() {
        try {
            localStorage.setItem('NumbyTutorialComplete', 'true');
        } catch (e) {
            console.error('Could not save tutorial status:', e);
        }
    }

    createTutorialSteps() {
        return [
            {
                target: '#pegboard',
                title: 'Aim and Launch',
                content: 'Move your mouse to aim, then click to launch Numby towards your mouse pointer.'
            },
            {
                target: '.peg',
                selector: '.peg',
                title: 'Hit Pegs for Points',
                content: 'Bounce off pegs to collect points. Each hit halves a peg\'s value. Higher pegs are worth more!'
            },
            {
                target: '#quota-value',
                title: 'Daily Quota',
                content: 'You must meet or exceed this number to survive the day. The quota increases each day!'
            },
            {
                target: '#item-container',
                title: 'Collect Items',
                content: 'Items enhance your abilities. Some items work together for special synergy effects!'
            }
        ];
    }

    startTutorial() {
        if (this.tutorialComplete) return;
        
        this.currentStep = 0;
        this.showCurrentStep();
    }

    showCurrentStep() {
        const step = this.steps[this.currentStep];
        if (!step) return;

        // Create tooltip element
        this.tutorialElement = document.createElement('div');
        this.tutorialElement.className = 'tutorial-tooltip';
        
        const title = document.createElement('h3');
        title.textContent = step.title;
        
        const content = document.createElement('p');
        content.textContent = step.content;
        
        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'tutorial-buttons';
        
        const nextButton = document.createElement('button');
        nextButton.textContent = this.currentStep < this.steps.length - 1 ? 'Next' : 'Finish';
        nextButton.addEventListener('click', () => this.nextStep());
        
        const skipButton = document.createElement('button');
        skipButton.textContent = 'Skip All';
        skipButton.addEventListener('click', () => this.skipTutorial());
        
        buttonContainer.appendChild(skipButton);
        buttonContainer.appendChild(nextButton);
        
        this.tutorialElement.appendChild(title);
        this.tutorialElement.appendChild(content);
        this.tutorialElement.appendChild(buttonContainer);
        
        document.body.appendChild(this.tutorialElement);
        
        // Position tooltip near target
        this.positionTooltip(step);
    }

    positionTooltip(step) {
        let targetElement;
        
        if (step.selector) {
            targetElement = document.querySelector(step.selector);
        } else {
            targetElement = document.querySelector(step.target);
        }
        
        if (!targetElement) {
            // If target doesn't exist yet, retry after a delay
            setTimeout(() => this.positionTooltip(step), 500);
            return;
        }
        
        const targetRect = targetElement.getBoundingClientRect();
        const tooltipRect = this.tutorialElement.getBoundingClientRect();
        
        // Position above, below, left, or right of the target depending on space available
        let top = targetRect.top - tooltipRect.height - 10;
        let left = targetRect.left + (targetRect.width / 2) - (tooltipRect.width / 2);
        
        // If no room above, position below
        if (top < 0) {
            top = targetRect.bottom + 10;
        }
        
        // Ensure tooltip stays within window bounds
        left = Math.max(10, Math.min(left, window.innerWidth - tooltipRect.width - 10));
        
        this.tutorialElement.style.top = `${top}px`;
        this.tutorialElement.style.left = `${left}px`;
        
        // Highlight target element
        targetElement.classList.add('tutorial-highlight');
    }

    nextStep() {
        // Remove highlight from current target
        const currentStep = this.steps[this.currentStep];
        if (currentStep) {
            const targetSelector = currentStep.selector || currentStep.target;
            const targetElement = document.querySelector(targetSelector);
            if (targetElement) {
                targetElement.classList.remove('tutorial-highlight');
            }
        }
        
        // Remove current tooltip
        if (this.tutorialElement) {
            this.tutorialElement.remove();
        }
        
        this.currentStep++;
        
        // If we've completed all steps
        if (this.currentStep >= this.steps.length) {
            this.completeTutorial();
            return;
        }
        
        // Show next step
        this.showCurrentStep();
    }

    skipTutorial() {
        // Remove any highlighted elements and tooltips
        document.querySelectorAll('.tutorial-highlight').forEach(el => {
            el.classList.remove('tutorial-highlight');
        });
        
        if (this.tutorialElement) {
            this.tutorialElement.remove();
        }
        
        this.completeTutorial();
    }

    completeTutorial() {
        this.tutorialComplete = true;
        this.saveTutorialStatus();
        this.game.uiManager.addMessage('Tutorial complete! Good luck meeting your quota!');
    }
}
