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
            this.weights_hh = a.weights_hh.copy();
            this.weights_ho = a.weights_ho.copy();

            this.bias_h = a.bias_h.copy();
            this.bias_h2 = a.bias_h2.copy();
            this.bias_o = a.bias_o.copy();
        } else {
            this.inputNodes = inputNodes;
            this.hiddenNodes = hiddenNodes;
            this.outputNodes = outputNodes;

            this.weights_ih = new Matrix(this.hiddenNodes, this.inputNodes);
            this.weights_hh = new Matrix(this.hiddenNodes, this.hiddenNodes);
            this.weights_ho = new Matrix(this.outputNodes, this.hiddenNodes);
            this.weights_ih.randomize();
            this.weights_hh.randomize();
            this.weights_ho.randomize();

            this.bias_h = new Matrix(this.hiddenNodes, 1);
            this.bias_h2 = new Matrix(this.hiddenNodes, 1);
            this.bias_o = new Matrix(this.outputNodes, 1);
            this.bias_h.randomize();
            this.bias_h2.randomize();
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

        let hidden2 = Matrix.multiply(this.weights_hh, hidden);
        hidden2.add(this.bias_h2);
        hidden2.map(relu);
        this.lastHidden2 = hidden2.toArray();

        let output = Matrix.multiply(this.weights_ho, hidden2);
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
        this.weights_hh.map(mutateFunc);
        this.weights_ho.map(mutateFunc);
        this.bias_h.map(mutateFunc);
        this.bias_h2.map(mutateFunc);
        this.bias_o.map(mutateFunc);
    }

    crossover(partner, type = 'weight') {
        let child = new NeuralNetwork(this.inputNodes, this.hiddenNodes, this.outputNodes);

        if (type === 'neuron') {
            // Crossover weights_ih and bias_h (hidden layer 1)
            for (let i = 0; i < child.weights_ih.rows; i++) {
                let useParent1 = Math.random() < 0.5;
                for (let j = 0; j < child.weights_ih.cols; j++) {
                    child.weights_ih.data[i][j] = useParent1 ? this.weights_ih.data[i][j] : partner.weights_ih.data[i][j];
                }
                child.bias_h.data[i][0] = useParent1 ? this.bias_h.data[i][0] : partner.bias_h.data[i][0];
            }

            // Crossover weights_hh and bias_h2 (hidden layer 2)
            for (let i = 0; i < child.weights_hh.rows; i++) {
                let useParent1 = Math.random() < 0.5;
                for (let j = 0; j < child.weights_hh.cols; j++) {
                    child.weights_hh.data[i][j] = useParent1 ? this.weights_hh.data[i][j] : partner.weights_hh.data[i][j];
                }
                child.bias_h2.data[i][0] = useParent1 ? this.bias_h2.data[i][0] : partner.bias_h2.data[i][0];
            }

            // Crossover weights_ho and bias_o (output layer)
            for (let i = 0; i < child.weights_ho.rows; i++) {
                let useParent1 = Math.random() < 0.5;
                for (let j = 0; j < child.weights_ho.cols; j++) {
                    child.weights_ho.data[i][j] = useParent1 ? this.weights_ho.data[i][j] : partner.weights_ho.data[i][j];
                }
                child.bias_o.data[i][0] = useParent1 ? this.bias_o.data[i][0] : partner.bias_o.data[i][0];
            }
        } else {
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

            // Crossover weights_hh
            for (let i = 0; i < child.weights_hh.rows; i++) {
                for (let j = 0; j < child.weights_hh.cols; j++) {
                    if (Math.random() < 0.5) {
                        child.weights_hh.data[i][j] = this.weights_hh.data[i][j];
                    } else {
                        child.weights_hh.data[i][j] = partner.weights_hh.data[i][j];
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

            for (let i = 0; i < child.bias_h2.rows; i++) {
                for (let j = 0; j < child.bias_h2.cols; j++) {
                    if (Math.random() < 0.5) child.bias_h2.data[i][j] = this.bias_h2.data[i][j];
                    else child.bias_h2.data[i][j] = partner.bias_h2.data[i][j];
                }
            }

            for (let i = 0; i < child.bias_o.rows; i++) {
                for (let j = 0; j < child.bias_o.cols; j++) {
                    if (Math.random() < 0.5) child.bias_o.data[i][j] = this.bias_o.data[i][j];
                    else child.bias_o.data[i][j] = partner.bias_o.data[i][j];
                }
            }
        }

        return child;
    }
}
