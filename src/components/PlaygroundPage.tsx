import React, { useState, useEffect, useRef } from 'react';
import { MultiClassSVM } from '../utils/svmModel';
import { IRIS_DATASET, IRIS_FEATURES, FeatureKey, IRIS_SPECIES_NAMES } from '../data/irisData';
import { SVMKernel, SVMModelReport, IrisSpecies, ExperimentRecord } from '../types';

interface PlaygroundPageProps {
  onSaveExperiment: (experiment: Omit<ExperimentRecord, 'id'>) => void;
  onNavigateToExperiments: () => void;
}

export const PlaygroundPage: React.FC<PlaygroundPageProps> = ({
  onSaveExperiment,
  onNavigateToExperiments,
}) => {
  const [kernel, setKernel] = useState<SVMKernel>('rbf');
  const [cValue, setCValue] = useState<number>(1.0);
  const [gammaMode, setGammaMode] = useState<'scale' | 'auto' | 'custom'>('scale');
  const [gammaValue, setGammaValue] = useState<number>(0.5);
  const [degree, setDegree] = useState<number>(3);
  const [feature1, setFeature1] = useState<FeatureKey>('petal_length');
  const [feature2, setFeature2] = useState<FeatureKey>('petal_width');
  const [useAllFourFeatures, setUseAllFourFeatures] = useState<boolean>(false);

  const [training, setTraining] = useState<boolean>(false);
  const [modelReport, setModelReport] = useState<SVMModelReport | null>(null);
  const [activeModel, setActiveModel] = useState<MultiClassSVM | null>(null);
  const [savedNotification, setSavedNotification] = useState<string>('');

  const [testClickResult, setTestClickResult] = useState<{
    x: number;
    y: number;
    species: IrisSpecies;
    confidence: number;
  } | null>(null);

  const boundaryCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const trainModel = () => {
    setTraining(true);
    setTestClickResult(null);

    setTimeout(() => {
      try {
        const featuresToUse: FeatureKey[] = useAllFourFeatures
          ? ['sepal_length', 'sepal_width', 'petal_length', 'petal_width']
          : [feature1, feature2];

        const resolvedGamma =
          gammaMode === 'custom' ? gammaValue : gammaMode;

        const svm = new MultiClassSVM({
          kernel,
          C: cValue,
          gamma: resolvedGamma,
          degree,
          features: featuresToUse,
        });

        const report = svm.train(IRIS_DATASET);
        setModelReport(report);
        setActiveModel(svm);
      } catch (err) {
        console.error('Lỗi huấn luyện SVM:', err);
      } finally {
        setTraining(false);
      }
    }, 60);
  };

  // Train initial model on mount
  useEffect(() => {
    trainModel();
  }, []);

  // Draw Decision Boundary on Canvas whenever report or dimensions change
  useEffect(() => {
    if (!boundaryCanvasRef.current || !modelReport?.decisionBoundaryGrid) return;

    const canvas = boundaryCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    const grid = modelReport.decisionBoundaryGrid;
    const [minX, maxX] = grid.xRange;
    const [minY, maxY] = grid.yRange;

    const toCanvasX = (val: number) => ((val - minX) / (maxX - minX)) * width;
    const toCanvasY = (val: number) => height - ((val - minY) / (maxY - minY)) * height;

    // Draw background contour regions
    // Density grid
    const cellW = width / 40;
    const cellH = height / 40;

    grid.points.forEach((pt) => {
      const cx = toCanvasX(pt.x);
      const cy = toCanvasY(pt.y);

      let fillColor = 'rgba(22, 101, 52, 0.18)'; // Setosa
      if (pt.species === 'versicolor') fillColor = 'rgba(30, 64, 175, 0.18)';
      if (pt.species === 'virginica') fillColor = 'rgba(107, 33, 168, 0.18)';

      ctx.fillStyle = fillColor;
      ctx.fillRect(cx - cellW / 2, cy - cellH / 2, cellW + 1, cellH + 1);
    });

    // Draw Axes Grid Lines
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    for (let x = Math.ceil(minX); x <= Math.floor(maxX); x++) {
      ctx.beginPath();
      ctx.moveTo(toCanvasX(x), 0);
      ctx.lineTo(toCanvasX(x), height);
      ctx.stroke();
    }
    for (let y = Math.ceil(minY); y <= Math.floor(maxY); y++) {
      ctx.beginPath();
      ctx.moveTo(0, toCanvasY(y));
      ctx.lineTo(width, toCanvasY(y));
      ctx.stroke();
    }

    // Draw Data Points
    const xF = grid.xFeature;
    const yF = grid.yFeature;

    const svIndicesSet = new Set(modelReport.supportVectors.map((sv) => sv.index));

    IRIS_DATASET.forEach((sample, idx) => {
      const px = toCanvasX(sample[xF]);
      const py = toCanvasY(sample[yF]);
      const isSV = svIndicesSet.has(idx);

      // Point Color
      let color = '#166534';
      if (sample.species === 'versicolor') color = '#1e40af';
      if (sample.species === 'virginica') color = '#6b21a8';

      // Draw Support Vector ring if applicable
      if (isSV) {
        ctx.beginPath();
        ctx.arc(px, py, 9, 0, Math.PI * 2);
        ctx.strokeStyle = '#eab308'; // Highlight Support Vectors with Gold Ring
        ctx.lineWidth = 2.5;
        ctx.stroke();
      }

      // Main Point
      ctx.beginPath();
      ctx.arc(px, py, 5, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    });

    // Draw clicked test point if exists
    if (testClickResult) {
      const tX = toCanvasX(testClickResult.x);
      const tY = toCanvasY(testClickResult.y);

      ctx.beginPath();
      ctx.arc(tX, tY, 11, 0, Math.PI * 2);
      ctx.fillStyle = '#dc2626';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Pulsing indicator ring
      ctx.beginPath();
      ctx.arc(tX, tY, 16, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(220, 38, 38, 0.6)';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }, [modelReport, testClickResult]);

  // Handle canvas click to test any point in the boundary
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!boundaryCanvasRef.current || !activeModel || !modelReport?.decisionBoundaryGrid) return;
    const canvas = boundaryCanvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const grid = modelReport.decisionBoundaryGrid;
    const [minX, maxX] = grid.xRange;
    const [minY, maxY] = grid.yRange;

    const dataX = minX + (clickX / canvas.width) * (maxX - minX);
    const dataY = minY + ((canvas.height - clickY) / canvas.height) * (maxY - minY);

    const roundedX = Number(dataX.toFixed(2));
    const roundedY = Number(dataY.toFixed(2));

    const res = activeModel.predict([roundedX, roundedY]);
    setTestClickResult({
      x: roundedX,
      y: roundedY,
      species: res.species,
      confidence: res.confidence,
    });
  };

  const handleSaveAsExperiment = () => {
    if (!modelReport) return;

    const now = new Date();
    const timeStr = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()} - ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const featuresUsed: FeatureKey[] = useAllFourFeatures
      ? ['sepal_length', 'sepal_width', 'petal_length', 'petal_width']
      : [feature1, feature2];

    const expName = `Thí nghiệm #${kernel.toUpperCase()}_C${cValue}`;

    onSaveExperiment({
      name: expName,
      kernel,
      C: cValue,
      gamma: gammaMode === 'custom' ? gammaValue : gammaMode,
      degree: kernel === 'poly' ? degree : undefined,
      features: featuresUsed,
      accuracy: modelReport.accuracy,
      supportVectorCount: modelReport.supportVectorCount,
      timestamp: timeStr,
      note: useAllFourFeatures ? 'Tất cả 4 đặc trưng' : `${feature1} vs ${feature2}`,
    });

    setSavedNotification('✓ Đã lưu cấu hình vào mục "Thí nghiệm" thành công!');
    setTimeout(() => setSavedNotification(''), 4000);
  };

  return (
    <section id="playgroundPage" className="page active">
      <div className="card">
        <div className="card-header" style={{ justifyContent: 'space-between', flexWrap: 'wrap' }}>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1e1b4b', margin: 0 }}>
              🧠 SVM Playground (Không gian thử nghiệm SVM)
            </h2>
            <p style={{ fontSize: '13px', color: '#6b7280', margin: '4px 0 0 0' }}>
              Tự do điều chỉnh tham số Hyperparameters của thuật toán SVM và quan sát Decision Boundary theo thời gian thực.
            </p>
          </div>
          {savedNotification && (
            <div style={{ backgroundColor: '#dcfce7', color: '#166534', padding: '6px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: 600 }}>
              {savedNotification}
            </div>
          )}
        </div>

        {/* Hyperparameters Controls Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '16px',
            backgroundColor: '#f8fafc',
            padding: '20px',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            marginBottom: '24px',
          }}
        >
          {/* 1. Kernel */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
              1. Hàm nhân (Kernel):
            </label>
            <select
              value={kernel}
              onChange={(e) => setKernel(e.target.value as SVMKernel)}
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '14px',
                fontWeight: 600,
                backgroundColor: 'white',
              }}
            >
              <option value="linear">Linear (Tuyến tính - Siêu phẳng phẳng)</option>
              <option value="rbf">RBF (Radial Basis Function - Phổ biến nhất)</option>
              <option value="poly">Polynomial (Đa thức phi tuyến)</option>
              <option value="sigmoid">Sigmoid (Hàm Hyperbolic Tangent)</option>
            </select>
          </div>

          {/* 2. C Parameter */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }}>2. Tham số C (Regularization):</label>
              <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#4f46e5' }}>{cValue}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="range"
                min="0.01"
                max="20"
                step="0.1"
                value={cValue}
                onChange={(e) => setCValue(parseFloat(e.target.value))}
                style={{ flex: 1, accentColor: '#4f46e5' }}
              />
              <input
                type="number"
                min="0.01"
                max="100"
                step="0.1"
                value={cValue}
                onChange={(e) => setCValue(parseFloat(e.target.value) || 0.1)}
                style={{ width: '60px', padding: '4px', border: '1px solid #cbd5e1', borderRadius: '6px', textAlign: 'center' }}
              />
            </div>
            <span style={{ fontSize: '11px', color: '#9ca3af' }}>C nhỏ: lề rộng (chấp nhận lỗi). C lớn: lề hẹp (phạt lỗi nặng).</span>
          </div>

          {/* 3. Gamma Parameter */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }}>3. Tham số Gamma (γ):</label>
              <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#4f46e5' }}>
                {gammaMode === 'custom' ? gammaValue : gammaMode}
              </span>
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              <select
                value={gammaMode}
                onChange={(e) => setGammaMode(e.target.value as any)}
                style={{
                  padding: '8px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '13px',
                  backgroundColor: 'white',
                  flex: 1,
                }}
              >
                <option value="scale">scale (1 / n_features * var)</option>
                <option value="auto">auto (1 / n_features)</option>
                <option value="custom">Tùy chỉnh số</option>
              </select>
              {gammaMode === 'custom' && (
                <input
                  type="number"
                  min="0.01"
                  max="10"
                  step="0.05"
                  value={gammaValue}
                  onChange={(e) => setGammaValue(parseFloat(e.target.value) || 0.1)}
                  style={{ width: '70px', padding: '4px', border: '1px solid #cbd5e1', borderRadius: '6px', textAlign: 'center' }}
                />
              )}
            </div>
            <span style={{ fontSize: '11px', color: '#9ca3af' }}>Quyết định bán kính ảnh hưởng của mỗi điểm dữ liệu.</span>
          </div>

          {/* 4. Degree for Poly */}
          {kernel === 'poly' && (
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
                Bậc đa thức (Degree):
              </label>
              <select
                value={degree}
                onChange={(e) => setDegree(parseInt(e.target.value))}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '14px',
                  fontWeight: 600,
                  backgroundColor: 'white',
                }}
              >
                <option value={2}>Bậc 2 (Quadratic)</option>
                <option value={3}>Bậc 3 (Cubic)</option>
                <option value={4}>Bậc 4</option>
              </select>
            </div>
          )}
        </div>

        {/* Feature selection row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
            marginBottom: '20px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '14px', fontWeight: 600, color: '#374151' }}>Chọn đặc trưng huấn luyện:</span>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={useAllFourFeatures}
                onChange={(e) => setUseAllFourFeatures(e.target.checked)}
                style={{ accentColor: '#4f46e5' }}
              />
              Dùng toàn bộ 4 đặc trưng (Độ chính xác cao hơn, không vẽ 2D boundary)
            </label>

            {!useAllFourFeatures && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <select
                  value={feature1}
                  onChange={(e) => setFeature1(e.target.value as FeatureKey)}
                  style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                >
                  {IRIS_FEATURES.map((f) => (
                    <option key={f.key} value={f.key} disabled={f.key === feature2}>
                      {f.label}
                    </option>
                  ))}
                </select>
                <span style={{ fontSize: '13px', color: '#6b7280' }}>vs</span>
                <select
                  value={feature2}
                  onChange={(e) => setFeature2(e.target.value as FeatureKey)}
                  style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                >
                  {IRIS_FEATURES.map((f) => (
                    <option key={f.key} value={f.key} disabled={f.key === feature1}>
                      {f.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={trainModel}
              disabled={training}
              className="main-btn"
              style={{ width: 'auto', padding: '10px 22px' }}
            >
              {training ? '⏳ Đang huấn luyện...' : '🚀 Huấn luyện mô hình (Train Model)'}
            </button>
            <button
              onClick={handleSaveAsExperiment}
              disabled={!modelReport}
              className="reset-btn"
              style={{ width: 'auto', padding: '10px 18px', fontWeight: 600, color: '#4f46e5', borderColor: '#c7d2fe' }}
            >
              💾 Lưu vào Thí nghiệm
            </button>
          </div>
        </div>

        {/* Model Training Results Overview */}
        {modelReport && (
          <div className="overview-grid" style={{ marginBottom: '24px' }}>
            <div className="stat-card" style={{ borderLeft: '4px solid #16a34a' }}>
              <div className="stat-title">Độ chính xác (Accuracy)</div>
              <div className="stat-number success">{modelReport.accuracy}%</div>
            </div>
            <div className="stat-card" style={{ borderLeft: '4px solid #4f46e5' }}>
              <div className="stat-title">Support Vectors</div>
              <div className="stat-number">{modelReport.supportVectorCount} <small style={{ fontSize: '13px', color: '#6b7280' }}>/ 150 mẫu</small></div>
            </div>
            <div className="stat-card" style={{ borderLeft: '4px solid #0284c7' }}>
              <div className="stat-title">Precision / Recall</div>
              <div className="stat-number" style={{ fontSize: '24px' }}>
                {modelReport.metrics.precision} / {modelReport.metrics.recall}
              </div>
            </div>
            <div className="stat-card" style={{ borderLeft: '4px solid #9333ea' }}>
              <div className="stat-title">F1-Score</div>
              <div className="stat-number" style={{ color: '#9333ea' }}>{modelReport.metrics.f1Score}</div>
            </div>
          </div>
        )}

        {/* 2D DECISION BOUNDARY VISUALIZATION */}
        {!useAllFourFeatures && modelReport?.decisionBoundaryGrid && (
          <div style={{ marginTop: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#1f2937' }}>
                🗺️ Ranh giới quyết định (Decision Boundary) & Siêu phẳng phân chia
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '12px', color: '#4b5563' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: '10px', height: '10px', backgroundColor: '#166534', borderRadius: '50%' }}></span> Setosa
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: '10px', height: '10px', backgroundColor: '#1e40af', borderRadius: '50%' }}></span> Versicolor
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: '10px', height: '10px', backgroundColor: '#6b21a8', borderRadius: '50%' }}></span> Virginica
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: '12px', height: '12px', border: '2px solid #eab308', borderRadius: '50%' }}></span> Support Vector
                </span>
              </div>
            </div>

            <p style={{ fontSize: '13px', color: '#6b7280', margin: '0 0 12px 0' }}>
              Nhấp chuột vào bất kỳ vị trí nào trên bản đồ phân vùng để phân loại toạ độ thử nghiệm ngay tức thì!
            </p>

            <div style={{ position: 'relative', width: '100%', borderRadius: '12px', overflow: 'hidden', border: '1px solid #cbd5e1' }}>
              <canvas
                ref={boundaryCanvasRef}
                width={760}
                height={380}
                style={{ width: '100%', height: '380px', display: 'block', cursor: 'crosshair', backgroundColor: '#ffffff' }}
                onClick={handleCanvasClick}
              />
            </div>

            {testClickResult && (
              <div
                style={{
                  marginTop: '12px',
                  padding: '12px 18px',
                  backgroundColor: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '10px',
                }}
              >
                <div>
                  <span style={{ fontWeight: 600, color: '#991b1b' }}>🔴 Điểm bạn vừa nhấp: </span>
                  <span style={{ fontSize: '13px', color: '#374151' }}>
                    {feature1} = <b>{testClickResult.x} cm</b>, {feature2} = <b>{testClickResult.y} cm</b>
                  </span>
                </div>
                <div>
                  <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#111827' }}>
                    → Phân loại: {IRIS_SPECIES_NAMES[testClickResult.species]} ({testClickResult.confidence}%)
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Confusion Matrix Table */}
        {modelReport && (
          <div style={{ marginTop: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#1f2937', marginBottom: '10px' }}>
              📊 Ma trận nhầm lẫn (Confusion Matrix)
            </h3>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Thực tế \ Dự đoán</th>
                    <th>Dự đoán Setosa</th>
                    <th>Dự đoán Versicolor</th>
                    <th>Dự đoán Virginica</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ fontWeight: 600, color: '#166534' }}>Iris Setosa (Thực tế)</td>
                    <td style={{ background: '#dcfce7', fontWeight: 'bold' }}>{modelReport.confusionMatrix.setosa.setosa}</td>
                    <td>{modelReport.confusionMatrix.setosa.versicolor}</td>
                    <td>{modelReport.confusionMatrix.setosa.virginica}</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 600, color: '#1e40af' }}>Iris Versicolor (Thực tế)</td>
                    <td>{modelReport.confusionMatrix.versicolor.setosa}</td>
                    <td style={{ background: '#dbeafe', fontWeight: 'bold' }}>{modelReport.confusionMatrix.versicolor.versicolor}</td>
                    <td>{modelReport.confusionMatrix.versicolor.virginica}</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 600, color: '#6b21a8' }}>Iris Virginica (Thực tế)</td>
                    <td>{modelReport.confusionMatrix.virginica.setosa}</td>
                    <td>{modelReport.confusionMatrix.virginica.versicolor}</td>
                    <td style={{ background: '#f3e8ff', fontWeight: 'bold' }}>{modelReport.confusionMatrix.virginica.virginica}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
