// --- Basic helpers and UI wiring ---
const arrayContainer = document.getElementById('arrayContainer');
const newArrayBtn = document.getElementById('newArrayBtn');
const startBtn = document.getElementById('startBtn');
const sizeSlider = document.getElementById('sizeSlider');
const speedSlider = document.getElementById('speedSlider');
const algoSelect = document.getElementById('algoSelect');

let array = [];
let isSorting = false;

function generateArray(size = 40) {
  array = [];
  for (let i = 0; i < size; i++) {
    // values between 5 and 400 for visible bars
    array.push(Math.floor(Math.random() * 395) + 5);
  }
  drawArray();
}

function drawArray(highlights = {}) {
  // highlights: {i:'comparing' or 'swapping' or 'sorted', j:...}
  arrayContainer.innerHTML = '';
  const size = array.length;
  const barWidth = Math.max(2, Math.floor(arrayContainer.clientWidth / size) - 2);

  for (let i = 0; i < array.length; i++) {
    const bar = document.createElement('div');
    bar.classList.add('bar');
    bar.style.height = array[i] + 'px';
    bar.style.width = barWidth + 'px';

    if (highlights[i]) bar.classList.add(highlights[i]);

    arrayContainer.appendChild(bar);
  }
}

// small utility to wait (async pauses)
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// reading sliders
function getDelay() {
  // speed slider small value => fast; invert to a reasonable delay
  const val = Number(speedSlider.value); // 1..500
  return Math.max(1, 501 - val); // higher slider => smaller delay
}

// disable controls while sorting
function setControls(enabled) {
  newArrayBtn.disabled = !enabled;
  sizeSlider.disabled = !enabled;
  speedSlider.disabled = !enabled;
  algoSelect.disabled = !enabled;
  startBtn.disabled = !enabled;
  isSorting = !enabled;
}

// --- Sorting algorithms with visualization steps ---
// Each algorithm updates the array and calls drawArray to show steps.
// We'll implement 3 simple algorithms + merge + quick.

async function bubbleSortVisual() {
  const n = array.length;
  for (let i = 0; i < n - 1; i++) {
    for (let j = 0; j < n - i - 1; j++) {
      drawArray({ [j]: 'comparing', [j+1]: 'comparing' });
      await sleep(getDelay());
      if (array[j] > array[j+1]) {
        // swap
        [array[j], array[j+1]] = [array[j+1], array[j]];
        drawArray({ [j]: 'swapping', [j+1]: 'swapping' });
        await sleep(getDelay());
      }
    }
    // mark the last element as sorted
    drawArray({ [n - i - 1]: 'sorted' });
  }
  drawArray(Object.fromEntries(array.map((_, idx) => [idx, 'sorted'])));
}

async function selectionSortVisual() {
  const n = array.length;
  for (let i = 0; i < n - 1; i++) {
    let minIdx = i;
    for (let j = i+1; j < n; j++) {
      drawArray({ [minIdx]: 'comparing', [j]: 'comparing' });
      await sleep(getDelay());
      if (array[j] < array[minIdx]) minIdx = j;
    }
    if (minIdx !== i) {
      [array[i], array[minIdx]] = [array[minIdx], array[i]];
      drawArray({ [i]: 'swapping', [minIdx]: 'swapping' });
      await sleep(getDelay());
    }
    drawArray({ [i]: 'sorted' });
  }
  drawArray(Object.fromEntries(array.map((_, idx) => [idx, 'sorted'])));
}

async function insertionSortVisual() {
  const n = array.length;
  for (let i = 1; i < n; i++) {
    let key = array[i];
    let j = i - 1;
    while (j >= 0 && array[j] > key) {
      drawArray({ [j]: 'comparing', [j+1]: 'comparing' });
      await sleep(getDelay());
      array[j+1] = array[j];
      drawArray({ [j+1]: 'swapping' });
      await sleep(getDelay());
      j = j - 1;
    }
    array[j+1] = key;
  }
  drawArray(Object.fromEntries(array.map((_, idx) => [idx, 'sorted'])));
}

// Merge Sort (visual)
async function mergeSortVisual() {
  await mergeSortHelper(0, array.length - 1);
  drawArray(Object.fromEntries(array.map((_, idx) => [idx, 'sorted'])));
}

async function mergeSortHelper(l, r) {
  if (l >= r) return;
  const m = Math.floor((l + r) / 2);
  await mergeSortHelper(l, m);
  await mergeSortHelper(m + 1, r);
  await merge(l, m, r);
}

async function merge(l, m, r) {
  const left = array.slice(l, m + 1);
  const right = array.slice(m + 1, r + 1);
  let i = 0, j = 0, k = l;
  while (i < left.length && j < right.length) {
    drawArray({ [k]: 'comparing' });
    await sleep(getDelay());
    if (left[i] <= right[j]) {
      array[k++] = left[i++];
    } else {
      array[k++] = right[j++];
    }
    drawArray({ [k-1]: 'swapping' });
    await sleep(getDelay());
  }
  while (i < left.length) {
    array[k++] = left[i++];
    drawArray({ [k-1]: 'swapping' });
    await sleep(getDelay());
  }
  while (j < right.length) {
    array[k++] = right[j++];
    drawArray({ [k-1]: 'swapping' });
    await sleep(getDelay());
  }
}

// Quick Sort (visual)
async function quickSortVisual() {
  await quickSortHelper(0, array.length - 1);
  drawArray(Object.fromEntries(array.map((_, idx) => [idx, 'sorted'])));
}

async function quickSortHelper(low, high) {
  if (low < high) {
    let p = await partition(low, high);
    await quickSortHelper(low, p - 1);
    await quickSortHelper(p + 1, high);
  }
}

async function partition(low, high) {
  const pivot = array[high];
  let i = low;
  for (let j = low; j < high; j++) {
    drawArray({ [j]: 'comparing', [high]: 'comparing' });
    await sleep(getDelay());
    if (array[j] < pivot) {
      [array[i], array[j]] = [array[j], array[i]];
      drawArray({ [i]: 'swapping', [j]: 'swapping' });
      await sleep(getDelay());
      i++;
    }
  }
  [array[i], array[high]] = [array[high], array[i]];
  drawArray({ [i]: 'swapping', [high]: 'swapping' });
  await sleep(getDelay());
  return i;
}

// --- Event listeners ---
newArrayBtn.addEventListener('click', () => {
  generateArray(Number(sizeSlider.value));
});

sizeSlider.addEventListener('input', () => {
  generateArray(Number(sizeSlider.value));
});

startBtn.addEventListener('click', async () => {
  if (isSorting) return;
  setControls(false);
  const algo = algoSelect.value;
  try {
    if (algo === 'bubble') await bubbleSortVisual();
    else if (algo === 'selection') await selectionSortVisual();
    else if (algo === 'insertion') await insertionSortVisual();
    else if (algo === 'merge') await mergeSortVisual();
    else if (algo === 'quick') await quickSortVisual();
  } catch (err) {
    console.error(err);
  }
  setControls(true);
});

// initial generation
generateArray(Number(sizeSlider.value));
