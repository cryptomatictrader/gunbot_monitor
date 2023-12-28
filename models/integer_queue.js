module.exports = class IntegerQueue {
    constructor(size) {
        this.queue = [];
        this.maxSize = size;
    }

    enqueue(item) {
        if (this.queue.length >= this.maxSize) {
            this.dequeue(); // Automatically dequeue the oldest item
        }
        this.queue.push(item);
    }

    dequeue() {
        if (this.queue.length === 0) {
            throw new Error("Queue is empty");
        }
        return this.queue.shift();
    }

    getAverage() {
        if (this.queue.length === 0) {
            return 0;
        }
        let sum = this.queue.reduce((acc, item) => acc + item, 0);
        return sum / this.queue.length;
    }

    size() {
        return this.queue.length;
    }

    isEmpty() {
        return this.queue.length === 0;
    }

    isFull() {
        return this.queue.length === this.maxSize;
    }
};
