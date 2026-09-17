import { predictIrisLocally, normalizeSpecies } from './svmModel';
import { IrisSpecies } from '../types';

export const API_URL = 'https://iris-fastapi-r415.onrender.com/predict';

export interface PredictInput {
  sepal_length: number;
  sepal_width: number;
  petal_length: number;
  petal_width: number;
}

export interface PredictResult {
  species: IrisSpecies;
  confidence: number;
  source: 'remote' | 'local';
}

export async function callSVM(data: PredictInput): Promise<PredictResult> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 4500);

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const result = await response.json();
      const norm = normalizeSpecies(result.prediction);
      // If API returns probability or confidence, use it; otherwise compute based on local distance
      const localEval = predictIrisLocally(data);
      const conf = typeof result.confidence === 'number' 
        ? Number((result.confidence * 100).toFixed(1)) 
        : localEval.confidence;

      return {
        species: norm,
        confidence: conf,
        source: 'remote',
      };
    }
  } catch (err) {
    // Render API is cold starting or unreachable -> fallback gracefully to local SVM
    console.warn('API call failed or timed out, using local high-performance SVM model.', err);
  } finally {
    clearTimeout(timeoutId);
  }

  // Local SVM fallback ensures the user's demo ALWAYS works
  const localRes = predictIrisLocally(data);
  return {
    species: localRes.species,
    confidence: localRes.confidence,
    source: 'local',
  };
}
