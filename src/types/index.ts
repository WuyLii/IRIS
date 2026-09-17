import { IrisSample, FeatureKey } from '../data/irisData';

export type IrisSpecies = 'setosa' | 'versicolor' | 'virginica';

export type SVMKernel = 'linear' | 'rbf' | 'poly' | 'sigmoid';

export interface SVMConfig {
  kernel: SVMKernel;
  C: number;
  gamma: number | 'scale' | 'auto';
  degree: number; // For polynomial kernel
  features: FeatureKey[];
}

export interface SVMModelReport {
  accuracy: number;
  supportVectorCount: number;
  supportVectors: { index: number; sample: IrisSample }[];
  confusionMatrix: {
    [actual in IrisSpecies]: { [predicted in IrisSpecies]: number };
  };
  metrics: {
    precision: number;
    recall: number;
    f1Score: number;
  };
  decisionBoundaryGrid?: {
    xRange: [number, number];
    yRange: [number, number];
    xFeature: FeatureKey;
    yFeature: FeatureKey;
    points: { x: number; y: number; species: IrisSpecies; confidence: number }[];
  };
}

export interface ExperimentRecord {
  id: string;
  name: string;
  kernel: SVMKernel;
  C: number;
  gamma: number | string;
  degree?: number;
  features: FeatureKey[];
  accuracy: number;
  supportVectorCount: number;
  timestamp: string;
  note?: string;
}

export interface HistoryRecord {
  id: string;
  timestamp: string;
  sepal_length: number;
  sepal_width: number;
  petal_length: number;
  petal_width: number;
  prediction: IrisSpecies;
  confidence: number; // e.g. 98.5
  method: 'Nhập số liệu' | 'Bạn đoán trước SVM' | 'Phân tích file' | 'SVM Playground';
  fileName?: string;
}

export interface FileAnalysisRow {
  originalIndex: number;
  input: {
    sepal_length: number;
    sepal_width: number;
    petal_length: number;
    petal_width: number;
  };
  trueLabel: IrisSpecies | '';
  prediction: IrisSpecies;
  correct: boolean | null;
  confidence?: number;
}
