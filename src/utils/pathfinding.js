// Izgara üzerinde A* yol bulma. Oyundan bağımsızdır: harita kurallarını çağıran taraf
// `isWalkable` ve `cost` fonksiyonlarıyla verir.
//
// - 8 yönlü hareket; çapraz adım yalnızca iki yandaki karo da yürünebilirse (köşe kesmez)
// - Karo maliyetleri farklı olabilir (ör. yol 0.4, çimen 1); en ucuz rota bulunur
// - allowBlockedGoal: hedef karo yürünemez olsa da son adımda girilir (ör. banka oturmak)
//
// Dönüş: başlangıç ve hedef dahil [{x, y}, ...] ya da yol yoksa null.

const SQRT2 = Math.SQRT2;
const DIRECTIONS = [
  [1, 0], [-1, 0], [0, 1], [0, -1],
  [1, 1], [1, -1], [-1, 1], [-1, -1],
];

/** f değerine göre en küçük öğeyi veren ikili yığın. */
class MinHeap {
  constructor() {
    this.items = [];
    this.priorities = [];
  }

  get size() {
    return this.items.length;
  }

  push(item, priority) {
    this.items.push(item);
    this.priorities.push(priority);
    let i = this.items.length - 1;
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (this.priorities[parent] <= this.priorities[i]) break;
      this.swap(i, parent);
      i = parent;
    }
  }

  pop() {
    const top = this.items[0];
    const lastItem = this.items.pop();
    const lastPriority = this.priorities.pop();
    if (this.items.length > 0) {
      this.items[0] = lastItem;
      this.priorities[0] = lastPriority;
      let i = 0;
      for (;;) {
        const left = i * 2 + 1;
        const right = left + 1;
        let smallest = i;
        if (left < this.items.length && this.priorities[left] < this.priorities[smallest]) smallest = left;
        if (right < this.items.length && this.priorities[right] < this.priorities[smallest]) smallest = right;
        if (smallest === i) break;
        this.swap(i, smallest);
        i = smallest;
      }
    }
    return top;
  }

  swap(a, b) {
    [this.items[a], this.items[b]] = [this.items[b], this.items[a]];
    [this.priorities[a], this.priorities[b]] = [this.priorities[b], this.priorities[a]];
  }
}

// Arama tamponları çağrılar arasında yeniden kullanılır: her aramada harita boyunda üç dizi ayırıp doldurmak
// yerine nesil damgası tutulur (stamp[i] !== generation ise o karonun gScore / parent değeri geçersizdir).
const buffers = { size: 0, gScore: null, parent: null, stamp: null, closed: null, generation: 0 };

function acquireBuffers(total) {
  if (buffers.size !== total) {
    buffers.size = total;
    buffers.gScore = new Float64Array(total);
    buffers.parent = new Int32Array(total);
    buffers.stamp = new Uint32Array(total);
    buffers.closed = new Uint32Array(total);
    buffers.generation = 0;
  }
  buffers.generation++;
  if (buffers.generation >= 0xffffffff) {
    buffers.stamp.fill(0);
    buffers.closed.fill(0);
    buffers.generation = 1;
  }
  return buffers;
}

/** Sekiz yönlü ızgarada iki nokta arası en kısa uzaklık (çapraz adım √2). */
function octile(dx, dy) {
  const ax = Math.abs(dx);
  const ay = Math.abs(dy);
  return Math.max(ax, ay) + (SQRT2 - 1) * Math.min(ax, ay);
}

/**
 * @param {{ width: number, height: number, isWalkable: (x:number, y:number) => boolean, cost: (x:number, y:number) => number, minCost?: number }} grid
 * @param {{x:number, y:number}} start
 * @param {{x:number, y:number}} goal
 * @param {{ allowBlockedGoal?: boolean, maxIterations?: number }} [options]
 */
export function findPath(grid, start, goal, options = {}) {
  const { width, height, isWalkable, cost } = grid;
  const minCost = grid.minCost ?? 1;
  const allowBlockedGoal = options.allowBlockedGoal ?? false;
  const maxIterations = options.maxIterations ?? width * height * 4;

  const inBounds = (x, y) => x >= 0 && y >= 0 && x < width && y < height;
  if (!inBounds(start.x, start.y) || !inBounds(goal.x, goal.y)) return null;
  if (start.x === goal.x && start.y === goal.y) return [{ x: start.x, y: start.y }];

  const goalBlocked = !isWalkable(goal.x, goal.y);
  if (goalBlocked && !allowBlockedGoal) return null;

  const total = width * height;
  const goalIndex = goal.y * width + goal.x;
  const startIndex = start.y * width + start.x;
  const { gScore, parent, stamp, closed, generation } = acquireBuffers(total);
  const open = new MinHeap();
  const g = (i) => (stamp[i] === generation ? gScore[i] : Infinity);

  const heuristic = (x, y) => octile(goal.x - x, goal.y - y) * minCost;

  gScore[startIndex] = 0;
  parent[startIndex] = -1;
  stamp[startIndex] = generation;
  open.push(startIndex, heuristic(start.x, start.y));

  let iterations = 0;
  while (open.size > 0 && iterations++ < maxIterations) {
    const current = open.pop();
    if (closed[current] === generation) continue;
    if (current === goalIndex) return reconstruct(parent, current, width);
    closed[current] = generation;

    const cx = current % width;
    const cy = (current - cx) / width;

    for (const [dx, dy] of DIRECTIONS) {
      const nx = cx + dx;
      const ny = cy + dy;
      if (!inBounds(nx, ny)) continue;
      const next = ny * width + nx;
      if (closed[next] === generation) continue;

      const diagonal = dx !== 0 && dy !== 0;
      const isGoal = next === goalIndex;
      if (isGoal && goalBlocked) {
        // Yürünemez hedefe yalnızca düz adımla girilir (banka yandan değil önden oturulur)
        if (diagonal) continue;
      } else if (!isWalkable(nx, ny)) {
        continue;
      }
      if (diagonal && (!isWalkable(cx + dx, cy) || !isWalkable(cx, cy + dy))) continue;

      const stepCost = (isGoal && goalBlocked ? 1 : cost(nx, ny)) * (diagonal ? SQRT2 : 1);
      const tentative = gScore[current] + stepCost;
      if (tentative < g(next)) {
        gScore[next] = tentative;
        parent[next] = current;
        stamp[next] = generation;
        open.push(next, tentative + heuristic(nx, ny));
      }
    }
  }
  return null;
}

function reconstruct(parent, endIndex, width) {
  const path = [];
  for (let i = endIndex; i !== -1; i = parent[i]) {
    path.push({ x: i % width, y: Math.floor(i / width) });
  }
  return path.reverse();
}

/** Bir yolun toplam maliyeti (test ve karşılaştırma için). */
export function pathCost(grid, path) {
  let total = 0;
  for (let i = 1; i < path.length; i++) {
    const diagonal = path[i].x !== path[i - 1].x && path[i].y !== path[i - 1].y;
    total += grid.cost(path[i].x, path[i].y) * (diagonal ? SQRT2 : 1);
  }
  return total;
}
