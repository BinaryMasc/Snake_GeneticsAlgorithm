function relu(x) {
    return Math.max(0, x);
}

function sigmoid(x) {
    return 1 / (1 + Math.exp(-x));
}

class NeuralNetwork {
    constructor(inputNodes, hiddenNodes, outputNodes) {
        if (inputNodes instanceof NeuralNetwork) {
            let a = inputNodes;
            this.inputNodes = a.inputNodes;
            this.hiddenNodes = a.hiddenNodes;
            this.outputNodes = a.outputNodes;

            this.weights_ih = a.weights_ih.copy();
            this.weights_ho = a.weights_ho.copy();

            this.bias_h = a.bias_h.copy();
            this.bias_o = a.bias_o.copy();
        } else {
            this.inputNodes = inputNodes;
            this.hiddenNodes = hiddenNodes;
            this.outputNodes = outputNodes;

            this.weights_ih = new Matrix(this.hiddenNodes, this.inputNodes);
            this.weights_ho = new Matrix(this.outputNodes, this.hiddenNodes);
            this.weights_ih.randomize();
            this.weights_ho.randomize();

            this.bias_h = new Matrix(this.hiddenNodes, 1);
            this.bias_o = new Matrix(this.outputNodes, 1);
            this.bias_h.randomize();
            this.bias_o.randomize();
        }
    }

    predict(inputArray) {
        let inputs = Matrix.fromArray(inputArray);
        this.lastInputs = inputs.toArray();

        let hidden = Matrix.multiply(this.weights_ih, inputs);
        hidden.add(this.bias_h);
        hidden.map(relu);
        this.lastHidden = hidden.toArray();

        let output = Matrix.multiply(this.weights_ho, hidden);
        output.add(this.bias_o);
        output.map(sigmoid);
        this.lastOutputs = output.toArray();

        return this.lastOutputs;
    }

    copy() {
        return new NeuralNetwork(this);
    }

    mutate(rate) {
        function mutateFunc(val) {
            if (Math.random() < rate) {
                // Add a random Gaussian value (approximate)
                let r = (Math.random() * 2 - 1) + (Math.random() * 2 - 1) + (Math.random() * 2 - 1);
                // Keep weights bounded somewhat
                return val + r * 0.5;
            } else {
                return val;
            }
        }
        this.weights_ih.map(mutateFunc);
        this.weights_ho.map(mutateFunc);
        this.bias_h.map(mutateFunc);
        this.bias_o.map(mutateFunc);
    }

    crossover(partner) {
        let child = new NeuralNetwork(this.inputNodes, this.hiddenNodes, this.outputNodes);

        // Crossover weights_ih
        for (let i = 0; i < child.weights_ih.rows; i++) {
            for (let j = 0; j < child.weights_ih.cols; j++) {
                if (Math.random() < 0.5) {
                    child.weights_ih.data[i][j] = this.weights_ih.data[i][j];
                } else {
                    child.weights_ih.data[i][j] = partner.weights_ih.data[i][j];
                }
            }
        }

        // Crossover weights_ho
        for (let i = 0; i < child.weights_ho.rows; i++) {
            for (let j = 0; j < child.weights_ho.cols; j++) {
                if (Math.random() < 0.5) {
                    child.weights_ho.data[i][j] = this.weights_ho.data[i][j];
                } else {
                    child.weights_ho.data[i][j] = partner.weights_ho.data[i][j];
                }
            }
        }

        // Crossover biases
        for (let i = 0; i < child.bias_h.rows; i++) {
            for (let j = 0; j < child.bias_h.cols; j++) {
                if (Math.random() < 0.5) child.bias_h.data[i][j] = this.bias_h.data[i][j];
                else child.bias_h.data[i][j] = partner.bias_h.data[i][j];
            }
        }

        for (let i = 0; i < child.bias_o.rows; i++) {
            for (let j = 0; j < child.bias_o.cols; j++) {
                if (Math.random() < 0.5) child.bias_o.data[i][j] = this.bias_o.data[i][j];
                else child.bias_o.data[i][j] = partner.bias_o.data[i][j];
            }
        }

        return child;
    }
}
