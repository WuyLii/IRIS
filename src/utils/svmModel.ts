import { IRIS_DATASET, IrisSample, FeatureKey } from '../data/irisData';
import { SVMConfig, SVMModelReport, IrisSpecies } from '../types';

export function normalizeSpecies(value: any): IrisSpecies {
  if (!value) return 'setosa';
  let text = String(value).trim().toLowerCase();
  text = text.replace(/^iris[-_\s]*/, '').replace(/^i[-_\s]*/, '').replace(/[\s_]+/g, '-');
  if (text.includes('setosa')) return 'setosa';
  if (text.includes('versicolor')) return 'versicolor';
  if (text.includes('virginica')) return 'virginica';
  return 'setosa';
}

// Kernel functions
export function computeKernel(
  x1: number[],
  x2: number[],
  kernel: SVMConfig['kernel'],
  gamma: number,
  degree: number
): number {
  let dot = 0;
  let distSq = 0;
  for (let i = 0; i < x1.length; i++) {
    dot += x1[i] * x2[i];
    distSq += Math.pow(x1[i] - x2[i], 2);
  }

  switch (kernel) {
    case 'linear':
      return dot;
    case 'rbf':
      return Math.exp(-gamma * distSq);
    case 'poly':
      return Math.pow(gamma * dot + 1, degree);
    case 'sigmoid':
      return Math.tanh(gamma * dot);
    default:
      return Math.exp(-gamma * distSq);
  }
}

// Binary SVM Model with simplified Sequential Minimal Optimization (SMO)
class BinarySVM {
  alphas: number[] = [];
  b: number = 0;
  X: number[][] = [];
  y: number[] = []; // +1 or -1
  gamma: number;
  C: number;
  kernel: SVMConfig['kernel'];
  degree: number;
  supportVectorIndices: number[] = [];

  constructor(C: number, kernel: SVMConfig['kernel'], gamma: number, degree: number = 3) {
    this.C = C;
    this.kernel = kernel;
    this.gamma = gamma;
    this.degree = degree;
  }

  train(X: number[][], y: number[]) {
    this.X = X;
    this.y = y;
    const n = X.length;
    this.alphas = new Array(n).fill(0);
    this.b = 0;

    const maxPasses = 15;
    const tol = 1e-4;
    let passes = 0;

    // Precompute kernel matrix for speed
    const K: number[][] = Array.from({ length: n }, () => new Array(n).fill(0));
    for (let i = 0; i < n; i++) {
      for (let j = i; j < n; j++) {
        const kVal = computeKernel(X[i], X[j], this.kernel, this.gamma, this.degree);
        K[i][j] = kVal;
        K[j][i] = kVal;
      }
    }

    const predictRaw = (xIdx: number) => {
      let f = this.b;
      for (let i = 0; i < n; i++) {
        if (this.alphas[i] > 0) {
          f += this.alphas[i] * this.y[i] * K[i][xIdx];
        }
      }
      return f;
    };

    while (passes < maxPasses) {
      let numChangedAlphas = 0;
      for (let i = 0; i < n; i++) {
        const Ei = predictRaw(i) - this.y[i];
        if (
          (this.y[i] * Ei < -tol && this.alphas[i] < this.C) ||
          (this.y[i] * Ei > tol && this.alphas[i] > 0)
        ) {
          // Select random j != i
          let j = Math.floor(Math.random() * (n - 1));
          if (j >= i) j++;

          const Ej = predictRaw(j) - this.y[j];
          const oldAlphaI = this.alphas[i];
          const oldAlphaJ = this.alphas[j];

          // Compute L and H
          let L = 0;
          let H = 0;
          if (this.y[i] !== this.y[j]) {
            L = Math.max(0, this.alphas[j] - this.alphas[i]);
            H = Math.min(this.C, this.C + this.alphas[j] - this.alphas[i]);
          } else {
            L = Math.max(0, this.alphas[i] + this.alphas[j] - this.C);
            H = Math.min(this.C, this.alphas[i] + this.alphas[j]);
          }

          if (L >= H) continue;

          // Compute eta
          const eta = 2 * K[i][j] - K[i][i] - K[j][j];
          if (eta >= 0) continue;

          // Update alpha_j
          let newAlphaJ = oldAlphaJ - (this.y[j] * (Ei - Ej)) / eta;
          if (newAlphaJ > H) newAlphaJ = H;
          else if (newAlphaJ < L) newAlphaJ = L;

          if (Math.abs(newAlphaJ - oldAlphaJ) < 1e-5) continue;

          // Update alpha_i
          const newAlphaI = oldAlphaI + this.y[i] * this.y[j] * (oldAlphaJ - newAlphaJ);
          this.alphas[i] = newAlphaI;
          this.alphas[j] = newAlphaJ;

          // Update threshold b
          const b1 = this.b - Ei - this.y[i] * (newAlphaI - oldAlphaI) * K[i][i] - this.y[j] * (newAlphaJ - oldAlphaJ) * K[i][j];
          const b2 = this.b - Ej - this.y[i] * (newAlphaI - oldAlphaI) * K[i][j] - this.y[j] * (newAlphaJ - oldAlphaJ) * K[j][j];

          if (newAlphaI > 0 && newAlphaI < this.C) this.b = b1;
          else if (newAlphaJ > 0 && newAlphaJ < this.C) this.b = b2;
          else this.b = (b1 + b2) / 2;

          numChangedAlphas++;
        }
      }

      if (numChangedAlphas === 0) passes++;
      else passes = 0;
    }

    // Identify support vectors (alpha > 1e-4)
    this.supportVectorIndices = [];
    for (let i = 0; i < n; i++) {
      if (this.alphas[i] > 1e-4) {
        this.supportVectorIndices.push(i);
      }
    }
  }

  decisionFunction(x: number[]): number {
    let sum = this.b;
    for (let idx of this.supportVectorIndices) {
      const kVal = computeKernel(this.X[idx], x, this.kernel, this.gamma, this.degree);
      sum += this.alphas[idx] * this.y[idx] * kVal;
    }
    return sum;
  }
}

// Multi-class SVM (One-vs-Rest)
export class MultiClassSVM {
  classes: IrisSpecies[] = ['setosa', 'versicolor', 'virginica'];
  models: { [k in IrisSpecies]?: BinarySVM } = {};
  config: SVMConfig;
  features: FeatureKey[];
  trainedSamples: IrisSample[] = [];

  constructor(config: SVMConfig) {
    this.config = config;
    this.features = config.features;
  }

  train(dataset: IrisSample[] = IRIS_DATASET): SVMModelReport {
    this.trainedSamples = dataset;
    const n = dataset.length;
    const numFeatures = this.features.length;

    // Feature normalization (min-max)
    const X = dataset.map(sample => this.features.map(f => sample[f]));

    // Resolve gamma
    let gammaVal = 0.5;
    if (this.config.gamma === 'scale') {
      gammaVal = 1 / (numFeatures * 1.5);
    } else if (this.config.gamma === 'auto') {
      gammaVal = 1 / numFeatures;
    } else if (typeof this.config.gamma === 'number') {
      gammaVal = this.config.gamma;
    }

    // Train One-vs-Rest for each class
    const svSet = new Set<number>();

    for (const cls of this.classes) {
      const y = dataset.map(s => (s.species === cls ? 1 : -1));
      const model = new BinarySVM(this.config.C, this.config.kernel, gammaVal, this.config.degree);
      model.train(X, y);
      this.models[cls] = model;

      model.supportVectorIndices.forEach(idx => svSet.add(idx));
    }

    // Evaluate predictions on dataset
    let correct = 0;
    const confusionMatrix = {
      setosa: { setosa: 0, versicolor: 0, virginica: 0 },
      versicolor: { setosa: 0, versicolor: 0, virginica: 0 },
      virginica: { setosa: 0, versicolor: 0, virginica: 0 },
    };

    dataset.forEach((sample, i) => {
      const x = this.features.map(f => sample[f]);
      const pred = this.predict(x).species;
      confusionMatrix[sample.species][pred]++;
      if (pred === sample.species) correct++;
    });

    const accuracy = Number(((correct / n) * 100).toFixed(1));

    // Calculate Precision, Recall, F1
    let totalPrecision = 0;
    let totalRecall = 0;
    for (const cls of this.classes) {
      const tp = confusionMatrix[cls][cls];
      const fp = this.classes.filter(c => c !== cls).reduce((sum, c) => sum + confusionMatrix[c][cls], 0);
      const fn = this.classes.filter(c => c !== cls).reduce((sum, c) => sum + confusionMatrix[cls][c], 0);

      const prec = tp + fp > 0 ? tp / (tp + fp) : 0;
      const rec = tp + fn > 0 ? tp / (tp + fn) : 0;
      totalPrecision += prec;
      totalRecall += rec;
    }

    const precision = Number((totalPrecision / 3).toFixed(2));
    const recall = Number((totalRecall / 3).toFixed(2));
    const f1Score = Number(((2 * precision * recall) / (precision + recall || 1)).toFixed(2));

    const supportVectors = Array.from(svSet).map(idx => ({
      index: idx,
      sample: dataset[idx],
    }));

    // Generate 2D decision boundary grid if 2 features are used
    let decisionBoundaryGrid;
    if (this.features.length === 2) {
      const xF = this.features[0];
      const yF = this.features[1];

      const xVals = dataset.map(d => d[xF]);
      const yVals = dataset.map(d => d[yF]);
      const minX = Math.max(0, Math.min(...xVals) - 0.5);
      const maxX = Math.max(...xVals) + 0.5;
      const minY = Math.max(0, Math.min(...yVals) - 0.5);
      const maxY = Math.max(...yVals) + 0.5;

      const steps = 40;
      const stepX = (maxX - minX) / steps;
      const stepY = (maxY - minY) / steps;

      const points: { x: number; y: number; species: IrisSpecies; confidence: number }[] = [];

      for (let x = minX; x <= maxX; x += stepX) {
        for (let y = minY; y <= maxY; y += stepY) {
          const res = this.predict([x, y]);
          points.push({
            x: Number(x.toFixed(2)),
            y: Number(y.toFixed(2)),
            species: res.species,
            confidence: res.confidence,
          });
        }
      }

      decisionBoundaryGrid = {
        xRange: [minX, maxX] as [number, number],
        yRange: [minY, maxY] as [number, number],
        xFeature: xF,
        yFeature: yF,
        points,
      };
    }

    return {
      accuracy,
      supportVectorCount: supportVectors.length,
      supportVectors,
      confusionMatrix,
      metrics: {
        precision,
        recall,
        f1Score,
      },
      decisionBoundaryGrid,
    };
  }

  predict(x: number[]): { species: IrisSpecies; confidence: number; scores: Record<IrisSpecies, number> } {
    const scores: Record<IrisSpecies, number> = {
      setosa: -999,
      versicolor: -999,
      virginica: -999,
    };

    for (const cls of this.classes) {
      const model = this.models[cls];
      if (model) {
        scores[cls] = model.decisionFunction(x);
      }
    }

    // Determine highest score
    let bestClass: IrisSpecies = 'setosa';
    let bestScore = -Infinity;

    for (const cls of this.classes) {
      if (scores[cls] > bestScore) {
        bestScore = scores[cls];
        bestClass = cls;
      }
    }

    // Softmax-like confidence estimation
    const expScores = this.classes.map(c => Math.exp(scores[c]));
    const sumExp = expScores.reduce((a, b) => a + b, 0);
    const bestExp = Math.exp(bestScore);
    const prob = sumExp > 0 ? (bestExp / sumExp) * 100 : 90;
    const clampedProb = Math.min(99.8, Math.max(65.0, Number(prob.toFixed(1))));

    return {
      species: bestClass,
      confidence: clampedProb,
      scores,
    };
  }
}

// Standalone quick prediction with default trained RBF model
let defaultSVMInstance: MultiClassSVM | null = null;

export function predictIrisLocally(sample: {
  sepal_length: number;
  sepal_width: number;
  petal_length: number;
  petal_width: number;
}): { species: IrisSpecies; confidence: number } {
  if (!defaultSVMInstance) {
    defaultSVMInstance = new MultiClassSVM({
      kernel: 'rbf',
      C: 1.0,
      gamma: 0.5,
      degree: 3,
      features: ['sepal_length', 'sepal_width', 'petal_length', 'petal_width'],
    });
    defaultSVMInstance.train(IRIS_DATASET);
  }

  const res = defaultSVMInstance.predict([
    sample.sepal_length,
    sample.sepal_width,
    sample.petal_length,
    sample.petal_width,
  ]);

  return {
    species: res.species,
    confidence: res.confidence,
  };
}
