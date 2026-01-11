/**
 * Standard Seam Carving Implementation for the Browser
 * Uses Gradient Magnitude for Energy Calculation and Dynamic Programming for Seam Finding.
 */

// Calculates the energy of a pixel at (x, y) using the Sobel operator approximation (Dual Gradient Energy)
function getPixelEnergy(data: Uint8ClampedArray, width: number, height: number, x: number, y: number): number {
  const getIndex = (x: number, y: number) => (y * width + x) * 4;

  const left = x > 0 ? x - 1 : width - 1;
  const right = x < width - 1 ? x + 1 : 0;
  const up = y > 0 ? y - 1 : height - 1;
  const down = y < height - 1 ? y + 1 : 0;

  const idxL = getIndex(left, y);
  const idxR = getIndex(right, y);
  const idxU = getIndex(x, up);
  const idxD = getIndex(x, down);

  const dx = 
    Math.pow(data[idxR] - data[idxL], 2) +
    Math.pow(data[idxR + 1] - data[idxL + 1], 2) +
    Math.pow(data[idxR + 2] - data[idxL + 2], 2);

  const dy = 
    Math.pow(data[idxD] - data[idxU], 2) +
    Math.pow(data[idxD + 1] - data[idxU + 1], 2) +
    Math.pow(data[idxD + 2] - data[idxU + 2], 2);

  return dx + dy;
}

// Computes the energy map for the entire image
function computeEnergyMap(data: Uint8ClampedArray, width: number, height: number): Float32Array {
  const energyMap = new Float32Array(width * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      energyMap[y * width + x] = getPixelEnergy(data, width, height, x, y);
    }
  }
  return energyMap;
}

// Finds the vertical seam with the lowest energy
function findVerticalSeam(energyMap: Float32Array, width: number, height: number): number[] {
  // DP Matrix for cumulative minimum energy
  const dist = new Float32Array(width * height);
  const edgeTo = new Int32Array(width * height); // To reconstruct path

  // Initialize first row
  for (let x = 0; x < width; x++) {
    dist[x] = energyMap[x];
  }

  // Fill DP table
  for (let y = 1; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      
      // Check 3 neighbors from previous row: (x-1, y-1), (x, y-1), (x+1, y-1)
      const prevRow = (y - 1) * width;
      
      let minPrevEnergy = dist[prevRow + x];
      let bestPrevX = x;

      if (x > 0) {
        if (dist[prevRow + x - 1] < minPrevEnergy) {
          minPrevEnergy = dist[prevRow + x - 1];
          bestPrevX = x - 1;
        }
      }
      if (x < width - 1) {
        if (dist[prevRow + x + 1] < minPrevEnergy) {
          minPrevEnergy = dist[prevRow + x + 1];
          bestPrevX = x + 1;
        }
      }

      dist[idx] = energyMap[idx] + minPrevEnergy;
      edgeTo[idx] = bestPrevX;
    }
  }

  // Find min energy in last row
  let minEnergy = Infinity;
  let minIndex = -1;
  const lastRow = (height - 1) * width;
  for (let x = 0; x < width; x++) {
    if (dist[lastRow + x] < minEnergy) {
      minEnergy = dist[lastRow + x];
      minIndex = x;
    }
  }

  // Backtrack to find seam
  const seam = new Array(height);
  let currX = minIndex;
  for (let y = height - 1; y >= 0; y--) {
    seam[y] = currX;
    currX = edgeTo[y * width + currX];
  }

  return seam;
}

// Removes a vertical seam from the image data
export function removeVerticalSeam(imageData: ImageData): ImageData {
  const width = imageData.width;
  const height = imageData.height;
  const data = imageData.data;
  
  const energyMap = computeEnergyMap(data, width, height);
  const seam = findVerticalSeam(energyMap, width, height);
  
  const newWidth = width - 1;
  const newData = new Uint8ClampedArray(newWidth * height * 4);
  
  for (let y = 0; y < height; y++) {
    const seamX = seam[y];
    let newX = 0;
    for (let x = 0; x < width; x++) {
      if (x === seamX) continue;
      
      const oldIdx = (y * width + x) * 4;
      const newIdx = (y * newWidth + newX) * 4;
      
      newData[newIdx] = data[oldIdx];
      newData[newIdx + 1] = data[oldIdx + 1];
      newData[newIdx + 2] = data[oldIdx + 2];
      newData[newIdx + 3] = data[oldIdx + 3];
      newX++;
    }
  }
  
  return new ImageData(newData, newWidth, height);
}

// Rotates image data 90 degrees clockwise (for handling horizontal seams via vertical logic)
function rotateImageData(imageData: ImageData): ImageData {
  const { width, height, data } = imageData;
  const newData = new Uint8ClampedArray(width * height * 4);
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const oldIdx = (y * width + x) * 4;
      // New (x, y) becomes (height - 1 - y, x)
      const newX = height - 1 - y;
      const newY = x;
      const newIdx = (newY * height + newX) * 4;
      
      newData[newIdx] = data[oldIdx];
      newData[newIdx + 1] = data[oldIdx + 1];
      newData[newIdx + 2] = data[oldIdx + 2];
      newData[newIdx + 3] = data[oldIdx + 3];
    }
  }
  return new ImageData(newData, height, width);
}

export function removeHorizontalSeam(imageData: ImageData): ImageData {
  // Rotate -> Remove Vertical -> Rotate Back (actually needs 3 more rotations or 1 counter-clockwise, but re-using logic is safer)
  // Simple approach: Rotate 90, Remove Vertical, Rotate -90 (or 270)
  // Let's do: Rotate 90, remove V, Rotate 90, Rotate 90, Rotate 90. 
  // Optimization: Just implement Transpose? 
  // Let's implement rotate, process, un-rotate.
  
  let rotated = rotateImageData(imageData);
  rotated = removeVerticalSeam(rotated);
  
  // Rotate 270 degrees to get back (or just rotate 3 times 90)
  // A simpler way is to write a dedicated horizontal seam remover, but for code compactness here, reuse is better.
  // Actually, rotating 3 times is slow. Let's write a rotateCounterClockwise.
  
  return rotateImageDataCCW(rotated);
}

function rotateImageDataCCW(imageData: ImageData): ImageData {
  const { width, height, data } = imageData;
  const newData = new Uint8ClampedArray(width * height * 4);
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const oldIdx = (y * width + x) * 4;
      // New (x, y) becomes (y, width - 1 - x)
      const newX = y;
      const newY = width - 1 - x;
      const newIdx = (newY * height + newX) * 4;
      
      newData[newIdx] = data[oldIdx];
      newData[newIdx + 1] = data[oldIdx + 1];
      newData[newIdx + 2] = data[oldIdx + 2];
      newData[newIdx + 3] = data[oldIdx + 3];
    }
  }
  return new ImageData(newData, height, width);
}