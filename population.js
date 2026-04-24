class Population {
    constructor(size, mutationRate) {
        this.snakes = [];
        this.generation = 1;
        this.mutationRate = mutationRate;
        this.bestFitness = 0;
        this.globalBestFitness = 0;
        this.bestSnake = null;

        for (let i = 0; i < size; i++) {
            this.snakes.push(new Snake());
        }
    }

    update() {
        for (let snake of this.snakes) {
            if (!snake.isDead) {
                snake.think();
                snake.update();
            }
        }
    }

    show(ctx, onlyBest) {
        let bestIndex = 0;
        let maxFit = 0;
        for (let i = 0; i < this.snakes.length; i++) {
            if (!this.snakes[i].isDead && this.snakes[i].score > maxFit) {
                maxFit = this.snakes[i].score;
                bestIndex = i;
            }
        }

        // Draw normal snakes first
        if (!onlyBest) {
            for (let i = 0; i < this.snakes.length; i++) {
                if (i !== bestIndex) {
                    this.snakes[i].show(ctx, false);
                }
            }
        }
        
        // Draw best snake on top
        if (!this.snakes[bestIndex].isDead) {
            this.snakes[bestIndex].show(ctx, true);
        }
    }

    allDead() {
        for (let snake of this.snakes) {
            if (!snake.isDead) return false;
        }
        return true;
    }
    
    getAliveCount() {
        let count = 0;
        for (let snake of this.snakes) {
            if (!snake.isDead) count++;
        }
        return count;
    }

    getBestAliveSnake() {
        let best = null;
        let maxFit = -1;
        for (let snake of this.snakes) {
            if (!snake.isDead && snake.score > maxFit) {
                maxFit = snake.score;
                best = snake;
            }
        }
        if (!best && this.snakes.length > 0) {
            // fallback if all dead but we still want to draw the last one
            best = this.bestSnake || this.snakes[0];
        }
        return best;
    }

    calculateFitness() {
        let sum = 0;
        this.bestFitness = 0;
        for (let snake of this.snakes) {
            let fit = snake.calculateFitness();
            if (fit > this.bestFitness) {
                this.bestFitness = fit;
                this.bestSnake = snake;
            }
            if (fit > this.globalBestFitness) {
                this.globalBestFitness = fit;
            }
        }
        
        // Normalize fitness
        for (let snake of this.snakes) {
            sum += snake.fitness;
        }
        
        for (let snake of this.snakes) {
            if (sum === 0) snake.fitness = 1 / this.snakes.length; // fallback
            else snake.fitness = snake.fitness / sum;
        }
    }

    selectParent() {
        let r = Math.random();
        let i = 0;
        while (r > 0 && i < this.snakes.length) {
            r -= this.snakes[i].fitness;
            i++;
        }
        i--;
        if (i < 0) i = 0;
        return this.snakes[i];
    }

    naturalSelection() {
        this.calculateFitness();
        
        let newSnakes = [];
        
        // Elitism: keep the best snake without mutation
        if (this.bestSnake) {
            let elite = new Snake(this.bestSnake.brain);
            newSnakes.push(elite);
        }
        
        while (newSnakes.length < this.snakes.length) {
            let parent1 = this.selectParent();
            let parent2 = this.selectParent();
            
            let child = parent1.crossover(parent2);
            child.mutate(this.mutationRate);
            
            newSnakes.push(child);
        }
        
        this.snakes = newSnakes;
        this.generation++;
    }
}
