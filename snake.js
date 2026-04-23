const GRID_SIZE = 20;
const ROWS = 30; // 600 / 20
const COLS = 30;

class Snake {
    constructor(brain) {
        this.body = [
            { x: Math.floor(COLS / 2), y: Math.floor(ROWS / 2) },
            { x: Math.floor(COLS / 2), y: Math.floor(ROWS / 2) + 1 },
            { x: Math.floor(COLS / 2), y: Math.floor(ROWS / 2) + 2 }
        ];
        this.dir = { x: 0, y: -1 }; // Start moving up
        this.score = 0;
        this.lifetime = 0;
        this.timeLeft = 150; // Frames until starvation
        this.isDead = false;
        this.fitness = 0;
        
        if (brain) {
            this.brain = brain.copy();
        } else {
            // 24 inputs, window.hiddenLayerNodes hidden, 4 outputs
            this.brain = new NeuralNetwork(24, window.hiddenLayerNodes || 16, 4);
        }
        
        // Random color, but with good saturation and lightness to be visible
        let hue = Math.floor(Math.random() * 360);
        this.color = `hsl(${hue}, 80%, 50%)`;
        this.colorTransparent = `hsla(${hue}, 80%, 50%, 0.3)`;
        
        this.spawnApple();
    }
    
    spawnApple() {
        let valid = false;
        while (!valid) {
            this.apple = {
                x: Math.floor(Math.random() * COLS),
                y: Math.floor(Math.random() * ROWS)
            };
            valid = true;
            for (let part of this.body) {
                if (part.x === this.apple.x && part.y === this.apple.y) {
                    valid = false;
                    break;
                }
            }
        }
    }
    
    lookDirection(dx, dy) {
        let look = [0, 0, 0]; // [Wall, Apple, Body]
        
        let currX = this.body[0].x;
        let currY = this.body[0].y;
        let distance = 0;
        
        let foundApple = false;
        let foundBody = false;
        
        currX += dx;
        currY += dy;
        distance++;
        
        while (currX >= 0 && currX < COLS && currY >= 0 && currY < ROWS) {
            if (!foundApple && currX === this.apple.x && currY === this.apple.y) {
                look[1] = 1; // 1 means apple is in this direction
                foundApple = true;
            }
            
            if (!foundBody) {
                for (let i = 1; i < this.body.length; i++) {
                    if (currX === this.body[i].x && currY === this.body[i].y) {
                        look[2] = 1 / distance;
                        foundBody = true;
                        break;
                    }
                }
            }
            
            currX += dx;
            currY += dy;
            distance++;
        }
        
        look[0] = 1 / distance; // Distance to wall
        
        return look;
    }
    
    getInputs() {
        let inputs = [];
        // 8 directions
        let dirs = [
            {x: 0, y: -1}, {x: 1, y: -1}, {x: 1, y: 0}, {x: 1, y: 1},
            {x: 0, y: 1}, {x: -1, y: 1}, {x: -1, y: 0}, {x: -1, y: -1}
        ];
        
        for (let d of dirs) {
            let look = this.lookDirection(d.x, d.y);
            inputs.push(look[0]);
            inputs.push(look[1]);
            inputs.push(look[2]);
        }
        
        return inputs;
    }
    
    think() {
        let inputs = this.getInputs();
        let outputs = this.brain.predict(inputs);
        
        // Find max output
        let maxIndex = 0;
        let maxVal = outputs[0];
        for (let i = 1; i < outputs.length; i++) {
            if (outputs[i] > maxVal) {
                maxVal = outputs[i];
                maxIndex = i;
            }
        }
        
        // 0: Up, 1: Right, 2: Down, 3: Left
        if (maxIndex === 0 && this.dir.y !== 1) this.dir = {x: 0, y: -1};
        else if (maxIndex === 1 && this.dir.x !== -1) this.dir = {x: 1, y: 0};
        else if (maxIndex === 2 && this.dir.y !== -1) this.dir = {x: 0, y: 1};
        else if (maxIndex === 3 && this.dir.x !== 1) this.dir = {x: -1, y: 0};
    }
    
    update() {
        if (this.isDead) return;
        
        this.lifetime++;
        this.timeLeft--;
        
        if (this.timeLeft <= 0) {
            this.isDead = true;
            return;
        }
        
        let head = { x: this.body[0].x + this.dir.x, y: this.body[0].y + this.dir.y };
        
        // Check Wall Collision
        if (head.x < 0 || head.x >= COLS || head.y < 0 || head.y >= ROWS) {
            this.isDead = true;
            return;
        }
        
        // Check Body Collision
        for (let i = 0; i < this.body.length - 1; i++) {
            if (head.x === this.body[i].x && head.y === this.body[i].y) {
                this.isDead = true;
                return;
            }
        }
        
        this.body.unshift(head);
        
        // Check Apple
        if (head.x === this.apple.x && head.y === this.apple.y) {
            this.score++;
            this.timeLeft += 100; // Bonus time for eating
            if (this.timeLeft > 500) this.timeLeft = 500; // Cap
            this.spawnApple();
        } else {
            this.body.pop();
        }
    }
    
    calculateFitness() {
        if (this.score === 0) {
            let d = Math.abs(this.body[0].x - this.apple.x) + Math.abs(this.body[0].y - this.apple.y);
            this.fitness = this.lifetime + (100 / (d + 1));
        } else {
            this.fitness = (this.score * this.score * 5000) + this.lifetime;
        }
        return this.fitness;
    }
    
    crossover(partner) {
        let childBrain = this.brain.crossover(partner.brain);
        return new Snake(childBrain);
    }
    
    mutate(rate) {
        this.brain.mutate(rate);
    }
    
    show(ctx, isBest) {
        // Draw Apple
        ctx.fillStyle = this.color;
        // Make apple slightly smaller to differentiate from body
        ctx.fillRect(this.apple.x * GRID_SIZE + 4, this.apple.y * GRID_SIZE + 4, GRID_SIZE - 8, GRID_SIZE - 8);
        
        // Draw Snake
        if (isBest) {
            ctx.fillStyle = this.color; // Opaque for best
            ctx.shadowBlur = 10;
            ctx.shadowColor = this.color;
        } else {
            ctx.fillStyle = this.colorTransparent;
            ctx.shadowBlur = 0;
        }
        
        for (let i = 0; i < this.body.length; i++) {
            ctx.fillRect(this.body[i].x * GRID_SIZE + 1, this.body[i].y * GRID_SIZE + 1, GRID_SIZE - 2, GRID_SIZE - 2);
        }
        
        ctx.shadowBlur = 0; // reset
    }
}
