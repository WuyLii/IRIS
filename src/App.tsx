/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { VerifyModal } from './components/VerifyModal';
import { PredictPage } from './components/PredictPage';
import { GuessPage } from './components/GuessPage';
import { FileAnalysisPage } from './components/FileAnalysisPage';
import { VisualizationPage } from './components/VisualizationPage';
import { PlaygroundPage } from './components/PlaygroundPage';
import { ExperimentsPage } from './components/ExperimentsPage';
import { BenchmarkPage } from './components/BenchmarkPage';
import { HistoryPage } from './components/HistoryPage';
import { HistoryRecord, ExperimentRecord } from './types';

type ActiveTab =
  | 'predict'
  | 'guess'
  | 'file'
  | 'visualization'
  | 'playground'
  | 'experiments'
  | 'benchmark'
  | 'history';

const TAB_METADATA: Record<ActiveTab, { title: string; sub: string }> = {
  predict: {
    title: 'Nhận diện',
    sub: 'Nhập 4 đặc trưng của hoa Iris để phân loại loài bằng mô hình SVM.',
  },
  guess: {
    title: 'Bạn đoán trước',
    sub: 'Hệ thống tạo thông số ngẫu nhiên. Hãy đoán trước khi SVM phân loại.',
  },
  file: {
    title: 'Phân tích dữ liệu',
    sub: 'Tải dữ liệu để SVM phân loại từng mẫu. Hỗ trợ CSV, XLSX, XLS và TXT.',
  },
  visualization: {
    title: 'Trực quan hóa Iris',
    sub: 'Khám phá không gian phân bố 2D của các đặc trưng dataset Iris và ranh giới 3 loài.',
  },
  playground: {
    title: 'SVM Playground',
    sub: 'Tự do điều chỉnh tham số Kernel, C, Gamma và trực quan hóa Decision Boundary.',
  },
  experiments: {
    title: 'Thí nghiệm',
    sub: 'Lưu trữ, đối chiếu và so sánh độ chính xác của các lần cấu hình SVM.',
  },
  benchmark: {
    title: 'Model Benchmark',
    sub: 'So sánh hiệu năng thuật toán SVM với KNN, Decision Tree, Random Forest.',
  },
  history: {
    title: 'Lịch sử',
    sub: 'Xem lại toàn bộ lịch sử các lần nhận diện và phân loại Iris.',
  },
};

export default function App() {
  const [isVerified, setIsVerified] = useState<boolean>(() => {
    return sessionStorage.getItem('iris_verified') === 'true';
  });

  const [activeTab, setActiveTab] = useState<ActiveTab>('predict');

  // Persistent History
  const [history, setHistory] = useState<HistoryRecord[]>(() => {
    try {
      const saved = localStorage.getItem('irisHistoryDetailed');
      if (saved) return JSON.parse(saved);
      // Fallback sample if empty
      return [
        {
          id: 'hist-1',
          timestamp: '17/09/2026 - 20:15',
          sepal_length: 5.1,
          sepal_width: 3.5,
          petal_length: 1.4,
          petal_width: 0.2,
          prediction: 'setosa',
          confidence: 99.8,
          method: 'Nhập số liệu',
        },
        {
          id: 'hist-2',
          timestamp: '17/09/2026 - 19:42',
          sepal_length: 6.0,
          sepal_width: 2.9,
          petal_length: 4.5,
          petal_width: 1.5,
          prediction: 'versicolor',
          confidence: 98.4,
          method: 'Nhập số liệu',
        },
      ];
    } catch {
      return [];
    }
  });

  // Persistent Experiments
  const [experiments, setExperiments] = useState<ExperimentRecord[]>(() => {
    try {
      const saved = localStorage.getItem('irisExperiments');
      if (saved) return JSON.parse(saved);
      // Preload with the user's exact prompt examples:
      return [
        {
          id: 'exp-1',
          name: 'Thí nghiệm #01',
          kernel: 'rbf',
          C: 1,
          gamma: 0.1,
          features: ['sepal_length', 'sepal_width', 'petal_length', 'petal_width'],
          accuracy: 96.7,
          supportVectorCount: 42,
          timestamp: '17/09/2026 - 08:30',
          note: 'Cấu hình chuẩn RBF',
        },
        {
          id: 'exp-2',
          name: 'Thí nghiệm #02',
          kernel: 'rbf',
          C: 10,
          gamma: 0.1,
          features: ['sepal_length', 'sepal_width', 'petal_length', 'petal_width'],
          accuracy: 100,
          supportVectorCount: 31,
          timestamp: '17/09/2026 - 08:35',
          note: 'Tăng C lên 10 để thu hẹp lề',
        },
      ];
    } catch {
      return [];
    }
  });

  // Sync History to LocalStorage
  useEffect(() => {
    localStorage.setItem('irisHistoryDetailed', JSON.stringify(history));
  }, [history]);

  // Sync Experiments to LocalStorage
  useEffect(() => {
    localStorage.setItem('irisExperiments', JSON.stringify(experiments));
  }, [experiments]);

  const handleVerified = () => {
    setIsVerified(true);
    sessionStorage.setItem('iris_verified', 'true');
  };

  const handleSaveHistory = (item: Omit<HistoryRecord, 'id'>) => {
    const newRecord: HistoryRecord = {
      ...item,
      id: `hist-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    };
    setHistory((prev) => [newRecord, ...prev]);
  };

  const handleDeleteHistoryItem = (id: string) => {
    setHistory((prev) => prev.filter((item) => item.id !== id));
  };

  const handleClearHistory = () => {
    if (window.confirm('Bạn có chắc muốn xóa toàn bộ lịch sử nhận diện?')) {
      setHistory([]);
    }
  };

  const handleAddExperiment = (exp: Omit<ExperimentRecord, 'id'>) => {
    const newExp: ExperimentRecord = {
      ...exp,
      id: `exp-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    };
    setExperiments((prev) => [newExp, ...prev]);
  };

  const handleDeleteExperiment = (id: string) => {
    setExperiments((prev) => prev.filter((exp) => exp.id !== id));
  };

  const handleClearExperiments = () => {
    if (window.confirm('Bạn có chắc muốn xóa tất cả các thí nghiệm đã lưu?')) {
      setExperiments([]);
    }
  };

  return (
    <>
      {/* CAPTCHA MODAL */}
      {!isVerified && <VerifyModal onVerified={handleVerified} />}

      {/* SIDEBAR NAVIGATION */}
      <aside>
        <div className="brand">
          <span className="brand-icon">🪻</span>
          <div className="brand-text">
            <h1>Iris SVM</h1>
            <p>Nhận diện loài hoa Iris</p>
          </div>
        </div>

        <nav>
          <button
            id="navPredict"
            className={activeTab === 'predict' ? 'active' : ''}
            onClick={() => setActiveTab('predict')}
          >
            <span>🎯</span> Nhận diện
          </button>
          <button
            id="navGuess"
            className={activeTab === 'guess' ? 'active' : ''}
            onClick={() => setActiveTab('guess')}
          >
            <span>🔮</span> Bạn đoán trước
          </button>
          <button
            id="navFile"
            className={activeTab === 'file' ? 'active' : ''}
            onClick={() => setActiveTab('file')}
          >
            <span>📊</span> Phân tích dữ liệu
          </button>
          <button
            id="navVisualization"
            className={activeTab === 'visualization' ? 'active' : ''}
            onClick={() => setActiveTab('visualization')}
          >
            <span>📈</span> Trực quan hóa
          </button>
          <button
            id="navPlayground"
            className={activeTab === 'playground' ? 'active' : ''}
            onClick={() => setActiveTab('playground')}
          >
            <span>🧠</span> SVM Playground
          </button>
          <button
            id="navExperiments"
            className={activeTab === 'experiments' ? 'active' : ''}
            onClick={() => setActiveTab('experiments')}
          >
            <span>🧪</span> Thí nghiệm
          </button>
          <button
            id="navBenchmark"
            className={activeTab === 'benchmark' ? 'active' : ''}
            onClick={() => setActiveTab('benchmark')}
          >
            <span>🏆</span> Model Benchmark
          </button>
          <button
            id="navHistory"
            className={activeTab === 'history' ? 'active' : ''}
            onClick={() => setActiveTab('history')}
          >
            <span>🕘</span> Lịch sử
          </button>
        </nav>

        <div className="sidebar-footer">
          Dữ liệu hôm nay
          <br />
          Kiến tạo trí thức ngày mai
        </div>
      </aside>

      {/* APP CONTAINER */}
      <div className="app-container">
        <header>
          <div className="header-title">
            <h2 id="pageHeaderTitle">{TAB_METADATA[activeTab].title}</h2>
            <p id="pageHeaderSub">{TAB_METADATA[activeTab].sub}</p>
          </div>
          <div className="api-badge">
            <span>🟢</span> API Online
          </div>
        </header>

        <main>
          {activeTab === 'predict' && <PredictPage onSaveHistory={handleSaveHistory} />}
          {activeTab === 'guess' && <GuessPage onSaveHistory={handleSaveHistory} />}
          {activeTab === 'file' && <FileAnalysisPage onSaveHistory={handleSaveHistory} />}
          {activeTab === 'visualization' && <VisualizationPage />}
          {activeTab === 'playground' && (
            <PlaygroundPage
              onSaveExperiment={handleAddExperiment}
              onNavigateToExperiments={() => setActiveTab('experiments')}
            />
          )}
          {activeTab === 'experiments' && (
            <ExperimentsPage
              experiments={experiments}
              onAddExperiment={handleAddExperiment}
              onDeleteExperiment={handleDeleteExperiment}
              onClearExperiments={handleClearExperiments}
              onNavigateToPlayground={() => setActiveTab('playground')}
            />
          )}
          {activeTab === 'benchmark' && <BenchmarkPage />}
          {activeTab === 'history' && (
            <HistoryPage
              history={history}
              onDeleteHistoryItem={handleDeleteHistoryItem}
              onClearHistory={handleClearHistory}
              onNavigateToPredict={() => setActiveTab('predict')}
            />
          )}
        </main>
      </div>
    </>
  );
}
