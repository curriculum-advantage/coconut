class Queue extends Array {
  enqueue = (value): void => {
    this.push(value);
  };

  dequeue = (): any => this.shift();

  peek = (): any => this[0];

  isEmpty = (): boolean => this.length === 0;
}

export default Queue;
