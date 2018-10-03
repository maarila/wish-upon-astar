"use strict";

function GridNode(x, y, size) {
  this.x = x;
  this.y = y;
  this.size = size;
}

function initialize() {
  let startButton = document.getElementById('start');
  let resetButton = document.getElementById('reset');

  let canvas = document.getElementById('canvas');
  let context = canvas.getContext('2d');

  let nodeSize = 30;
  let gridSize = 20;
  let grid = new Array(gridSize);

  context.lineWidth = 2;

  // disable text selection when double-clicking canvas
  canvas.onselectstart = function () {
    return false;
  }

  for (let i = 0; i < gridSize; i++) {
    grid[i] = new Array(gridSize)
    for (let j = 0; j < gridSize; j++) {
      grid[i][j] = new GridNode(i, j, nodeSize);
    }
  }

  let startNode = grid[0][0];
  startNode.start = true;
  let endNode = grid[grid.length - 1][grid.length - 1];
  endNode.end = true;

  drawGrid(grid, context);

  canvas.addEventListener('click', function(event) {
    let rect = canvas.getBoundingClientRect();
    let y = (event.clientX - rect.left) / nodeSize;
    let x = (event.clientY - rect.top) / nodeSize;
    let clickedNode = grid[Math.floor(x)][Math.floor(y)]

    if (clickedNode.start === true) {
      if (endNode === null) {
        startNode = null;
        clickedNode.start = false;
        clickedNode.end = true;
        create(clickedNode, 'lightblue', context);
        endNode = clickedNode;
      } else {
        startNode = null;
        clickedNode.start = false;
        endNode.end = false;
        clear(endNode, context);
        create(clickedNode, 'lightblue', context);
        endNode = clickedNode;
      }
    } else if (clickedNode.end === true) {
      clickedNode.end = false;
      clickedNode.start = true;
      endNode = null;
      if (startNode === null) {
        startNode = clickedNode;
        create(startNode, 'orange', context);
      } else {
        startNode.start = false;
        clear(startNode, context);
        startNode = clickedNode;
        create(startNode, 'orange', context);
      }
    } else {
      if (startNode === null) {
        startNode = clickedNode;
        startNode.start = true;
        create(startNode, 'orange', context);
      } else {
        clear(startNode, context);
        startNode = null;
        startNode = clickedNode;
        startNode.start = true;
        create(startNode, 'orange', context);
      }
    }
  }, false);

  canvas.addEventListener('contextmenu', function(event) {
    event.preventDefault();
    var rect = canvas.getBoundingClientRect();
    let y = (event.clientX - rect.left) / nodeSize;
    let x = (event.clientY - rect.top) / nodeSize;
    let clickedNode = grid[Math.floor(x)][Math.floor(y)]
    if (clickedNode.blocked) {
      clickedNode.blocked = false;
      clear(clickedNode, context);
    } else {
      clickedNode.blocked = true;
      create(clickedNode, 'gray', context);
    }
  }, false);

  startButton.addEventListener('click', function(event) {
    drawPath(grid, startNode, endNode, context);
  }, false);

  resetButton.addEventListener('click', function(event) {
    reset();
  }, false);
}

function drawPath(grid, startNode, endNode, context) {
  let astarPath = new Astar(grid, startNode, endNode);
  (function loop(i) {
    setTimeout(function() {
      if (astarPath[astarPath.length - i][0] === endNode.x && astarPath[astarPath.length - i][1] === endNode.y) {
        create(endNode, 'lightblue', context);
      } else {
        drawChecked(astarPath[astarPath.length - i][0], astarPath[astarPath.length - i][1], startNode.size);
      }
      if (--i) {
        loop(i);
      }
    }, 50);
  })(astarPath.length - 1);
}

function drawGrid(grid, context) {
  for (let i = 0; i < grid.length; i++) {
    for (let j = 0; j < grid.length; j++) {
      let node = grid[i][j];
      let chanceOfBlock = Math.floor(Math.random() * 10) + 1;
      if (node.start) {
        create(node, 'orange', context);
      } else if (node.end) {
        create(node, 'lightblue', context);
      } else if (chanceOfBlock < 3) {
        node.blocked = true;
        create(node, 'gray', context);
      } else {
        clear(node, context);
        createEmpty(node, context);
      }
    }
  }
}

function create(node, color, context) {
  context.fillStyle = color;
  context.fillRect(node.y * node.size, node.x * node.size, node.size, node.size);
  createEmpty(node, context);
}

function createEmpty(node, context) {
  context.strokeRect(node.y * node.size, node.x * node.size, node.size, node.size);
}

function clear(node, context) {
  context.clearRect(node.y * node.size, node.x * node.size, node.size, node.size);
  createEmpty(node, context);
}

function drawChecked(nodex, nodey, size) {
  let canvas = document.getElementById('canvas');
  let context = canvas.getContext('2d');
  context.fillStyle = 'lightgreen';
  context.fillRect(nodey * size, nodex * size, size, size);
  context.strokeRect(nodey * size, nodex * size, size, size);
}

function reset() {
  console.log('Hello World!')
}

function Astar(grid, start, goal) {
  let heap = new BinaryHeap();

  start.fromStart = 0;
  start.toGoal = 0;
  start.open = true;

  heap.insert(start);

  while (!heap.isEmpty()) {
    let current = heap.extractMin();

    if (!current) {
      console.log(heap);
    }
    current.closed = true;

    if (current === goal) {
      return pathFromStartTo(goal);
    }

    let neighbours = getNeighbours(grid, current);

    for (let i = 0; i < neighbours.length; i++) {
      let neighbour = neighbours[i];

      if (neighbour.closed) {
        continue;
      }

      let nextDistFromStart = current.fromStart + 1;

      if (!neighbour.open || nextDistFromStart < neighbour.fromStart) {
        let taxicabMetric = Math.abs(neighbour.x - goal.x) + Math.abs(neighbour.y - goal.y);

        neighbour.fromStart = nextDistFromStart;
        neighbour.toNeighbour = neighbour.toNeighbour || taxicabMetric;
        neighbour.toGoal = neighbour.fromStart + neighbour.toNeighbour;
        neighbour.parent = current;

        if (!neighbour.open) {
          heap.insert(neighbour);
          neighbour.open = true;
        } else {
          heap.update(neighbour);
        }
      }
    }
  }

  return [];
}

function getNeighbours(grid, node) {
  let x = node.y;
  let y = node.x;
  let neighbours = [];

  // above
  if (isTraversable(x, y - 1, grid)) {
    neighbours.push(grid[y - 1][x]);
  }

  // below
  if (isTraversable(x, y + 1, grid)) {
    neighbours.push(grid[y + 1][x]);
  }

  // to the left
  if (isTraversable(x - 1, y, grid)) {
    neighbours.push(grid[y][x - 1]);
  }

  // to the right
  if (isTraversable(x + 1, y, grid)) {
    neighbours.push(grid[y][x + 1]);
  }

  return neighbours;
}

function isTraversable(x, y, grid) {
  return (x >= 0 && x < grid.length) && (y >= 0 && y < grid.length) && !grid[y][x].blocked;
}

function pathFromStartTo(node) {
  let path = [[node.x, node.y]];
  while (node.parent) {
    node = node.parent;
    path.push([node.x, node.y]);
  }

  return path.reverse();
}

/*
 * An implementation of the binary heap data structure as presented in Cormen, T. H.,
 * Leiserson, C. E., Rivest, R. L. & Stein C. (2009). Introduction to Algorithms.
 * Third Edition. The MIT Press.
 */
function BinaryHeap() {
  this.heap = [];
  this.heapSize = 0;
}

BinaryHeap.prototype.isEmpty = function() {
  return this.heap.length === 0;
};

BinaryHeap.prototype.parent = function(index) {
  return Math.floor(index / 2);
};

BinaryHeap.prototype.leftChild = function(index) {
  return 2 * index;
};

BinaryHeap.prototype.rightChild = function(index) {
  return 2 * index + 1;
};

BinaryHeap.prototype.findMin = function() {
  return this.heap[0];
};

BinaryHeap.prototype.extractMin = function() {
  let minNode = this.heap[0];
  this.heap[0] = this.heap[this.heapSize - 1];
  this.heapSize--;
  this.heapify(0);

  return minNode;
};

BinaryHeap.prototype.insert = function(newNode) {
  this.heapSize++;

  let index = this.heapSize - 1;

  while (index > 0 && this.heap[this.parent(index)].toGoal >= newNode.toGoal) {
    this.heap[index] = this.heap[this.parent(index)];
    index = this.parent(index);
  }

  this.heap[index] = newNode;
};

BinaryHeap.prototype.heapify = function(index) {
  let smallest = 0;

  while (index <= this.heapSize) {
    let leftChildIndex = this.leftChild(index);
    let rightChildIndex = this.rightChild(index);

    if (leftChildIndex <= this.heapSize && this.heap[leftChildIndex].toGoal <= this.heap[index].toGoal) {
      smallest = leftChildIndex;
    } else {
      smallest = index;
    }

    if (rightChildIndex <= this.heapSize && this.heap[rightChildIndex].toGoal <= this.heap[smallest].toGoal) {
      smallest = rightChildIndex;
    }

    if (smallest === index) {
      return;
    }

    let helperVariable = this.heap[index];
    this.heap[index] = this.heap[smallest];
    this.heap[smallest] = helperVariable;
    index = smallest;
  }
};

BinaryHeap.prototype.update = function(node) {
  let index = this.heap.indexOf(node);

  while (index > 0 && this.heap[this.parent(index)].toGoal >= node.toGoal) {
    this.heap[index] = this.heap[this.parent(index)];
    index = this.parent(index);
  }

  this.heap[index] = node;
};

