import React, { useState, useEffect, useRef } from 'react';
import { ExperimentRecord, SVMKernel } from '../types';
import { IRIS_FEATURES, FeatureKey, IRIS_DATASET } from '../data/irisData';
import { MultiClassSVM } from '../utils/svmModel';

interface ExperimentsPageProps {
  experiments: ExperimentRecord[];
  onAddExperiment: (exp: Omit<ExperimentRecord, 'id'>) => void;
  onDeleteExperiment: (id: string) => void;
  onClearExperiments: () => void;
  onNavigateToPlayground: () => void;
}

export const ExperimentsPage: React.FC<ExperimentsPageProps> = ({
  experiments,
  onAddExperiment,
  onDeleteExperiment,
  onClearExperiments,
  onNavigateToPlayground,
}) => {
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [selectedForCompare, setSelectedForCompare] = useState<string[]>([]);

  // New Experiment Form State
  const [name, setName] = useState<string>('');
  const [kernel, setKernel] = useState<SVMKernel>('rbf');
  const [cValue, setCValue] = useState<number>(1.0);
  const [gamma, setGamma] = useState<string>('0.1');
  const [featureMode, setFeatureMode] = useState<'all' | 'custom'>('all');
  const [feature1, setFeature1] = useState<FeatureKey>('petal_length');
  const [feature2, setFeature2] = useState<FeatureKey>('petal_width');

  const chartCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstanceRef = useRef<any>(null);

  // Toggle experiment selection for comparison
  const toggleSelectCompare = (id: string) => {
    setSelectedForCompare((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleCreateExperiment = () => {
    const featuresToUse: FeatureKey[] =
      featureMode === 'all'
        ? ['sepal_length', 'sepal_width', 'petal_length', 'petal_width']
        : [feature1, feature2];

    const gammaNum = parseFloat(gamma) || 0.1;

    // Train and calculate real accuracy
    const svm = new MultiClassSVM({
      kernel,
      C: cValue,
      gamma: gammaNum,
      degree: 3,
      features: featuresToUse,
    });
    const report = svm.train(IRIS_DATASET);

    const now = new Date();
    const timeStr = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()} - ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const expIndex = String(experiments.length + 1).padStart(2, '0');
    const finalName = name.trim() || `Thí nghiệm #${expIndex}`;

    onAddExperiment({
      name: finalName,
      kernel,
      C: cValue,
      gamma: gammaNum,
      features: featuresToUse,
      accuracy: report.accuracy,
      supportVectorCount: report.supportVectorCount,
      timestamp: timeStr,
      note: featureMode === 'all' ? 'Toàn bộ 4 đặc trưng' : `${feature1} & ${feature2}`,
    });

    setShowCreateModal(false);
    setName('');
  };

  // Render comparison bar chart
  useEffect(() => {
    if (!chartCanvasRef.current || experiments.length === 0) return;
    const ctx = chartCanvasRef.current.getContext('2d');
    if (!ctx) return;

    const Chart = (window as any).Chart;
    if (!Chart) return;

    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }

    const itemsToRender =
      selectedForCompare.length > 0
        ? experiments.filter((e) => selectedForCompare.includes(e.id))
        : experiments.slice(0, 10);

    const labels = itemsToRender.map((e) => e.name);
    const accuracies = itemsToRender.map((e) => e.accuracy);
    const bgColors = itemsToRender.map((e) =>
      e.accuracy >= 97 ? '#16a34a' : e.accuracy >= 95 ? '#4f46e5' : '#eab308'
    );

    chartInstanceRef.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Độ chính xác (Accuracy %)',
            data: accuracies,
            backgroundColor: bgColors,
            borderRadius: 6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            min: 80,
            max: 100,
            title: { display: true, text: 'Accuracy (%)', font: { weight: '600' } },
          },
          x: {
            ticks: {
              maxRotation: 45,
              minRotation: 0,
              font: { size: 12 },
            },
          },
        },
      },
    });

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
      }
    };
  }, [experiments, selectedForCompare]);

  return (
    <section id="experimentsPage" className="page active">
      <div className="card">
        <div className="card-header" style={{ justifyContent: 'space-between', flexWrap: 'wrap' }}>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1e1b4b', margin: 0 }}>
              🧪 Thí nghiệm & So sánh mô hình SVM
            </h2>
            <p style={{ fontSize: '13px', color: '#6b7280', margin: '4px 0 0 0' }}>
              Lưu trữ các lần chạy cấu hình SVM khác nhau và so sánh trực quan hiệu quả phân loại.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              className="main-btn"
              style={{ width: 'auto', padding: '8px 16px', fontSize: '14px' }}
              onClick={() => setShowCreateModal(true)}
            >
              ➕ Tạo thí nghiệm mới
            </button>
            <button
              className="reset-btn"
              style={{ width: 'auto', padding: '8px 14px', fontSize: '13px', color: '#4f46e5' }}
              onClick={onNavigateToPlayground}
            >
              🧠 Mở Playground
            </button>
            {experiments.length > 0 && (
              <button className="clear-btn" onClick={onClearExperiments}>
                Xóa tất cả
              </button>
            )}
          </div>
        </div>

        {/* Comparison Bar Chart */}
        {experiments.length > 0 && (
          <div style={{ marginBottom: '24px', padding: '16px', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#374151' }}>
                📊 Biểu đồ so sánh Accuracy {selectedForCompare.length > 0 ? `(Đang chọn ${selectedForCompare.length} thí nghiệm)` : '(Tất cả thí nghiệm)'}
              </h4>
              {selectedForCompare.length > 0 && (
                <button
                  className="reset-btn"
                  style={{ width: 'auto', padding: '4px 10px', fontSize: '12px' }}
                  onClick={() => setSelectedForCompare([])}
                >
                  Bỏ chọn so sánh
                </button>
              )}
            </div>
            <div style={{ height: '240px', position: 'relative' }}>
              <canvas ref={chartCanvasRef}></canvas>
            </div>
          </div>
        )}

        {/* List of Experiments */}
        {experiments.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: '#6b7280' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>🧪</div>
            <h4 style={{ fontSize: '16px', fontWeight: 600, color: '#374151', margin: '0 0 6px 0' }}>
              Chưa có thí nghiệm nào được lưu
            </h4>
            <p style={{ fontSize: '13px', margin: '0 0 16px 0' }}>
              Bạn có thể huấn luyện và bấm "Lưu vào Thí nghiệm" từ SVM Playground, hoặc nhấn nút bên dưới để tạo cấu hình thử nghiệm.
            </p>
            <button
              className="main-btn"
              style={{ width: 'auto', display: 'inline-flex', padding: '10px 20px' }}
              onClick={() => setShowCreateModal(true)}
            >
              ➕ Tạo thí nghiệm đầu tiên
            </button>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th style={{ width: '40px' }}>So sánh</th>
                  <th>Tên thí nghiệm</th>
                  <th>Kernel</th>
                  <th>C</th>
                  <th>Gamma</th>
                  <th>Đặc trưng</th>
                  <th>Accuracy</th>
                  <th>Support Vectors</th>
                  <th>Thời gian</th>
                  <th style={{ width: '60px' }}>Xóa</th>
                </tr>
              </thead>
              <tbody>
                {experiments.map((exp) => {
                  const isChecked = selectedForCompare.includes(exp.id);
                  return (
                    <tr key={exp.id} style={{ backgroundColor: isChecked ? '#eff6ff' : undefined }}>
                      <td>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleSelectCompare(exp.id)}
                          style={{ accentColor: '#4f46e5', cursor: 'pointer' }}
                        />
                      </td>
                      <td style={{ fontWeight: 'bold', color: '#1e1b4b', textAlign: 'left', paddingLeft: '16px' }}>
                        {exp.name}
                        {exp.note && <div style={{ fontSize: '11px', color: '#6b7280', fontWeight: 'normal' }}>{exp.note}</div>}
                      </td>
                      <td>
                        <span
                          style={{
                            padding: '3px 8px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: 600,
                            backgroundColor: '#e0e7ff',
                            color: '#3730a3',
                          }}
                        >
                          {exp.kernel.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600 }}>{exp.C}</td>
                      <td>{exp.gamma}</td>
                      <td style={{ fontSize: '12px', color: '#4b5563' }}>
                        {exp.features.length === 4 ? 'Tất cả 4' : `${exp.features.length} đặc trưng`}
                      </td>
                      <td>
                        <span
                          style={{
                            fontWeight: 'bold',
                            fontSize: '15px',
                            color: exp.accuracy >= 97 ? '#16a34a' : exp.accuracy >= 94 ? '#2563eb' : '#d97706',
                          }}
                        >
                          {exp.accuracy}%
                        </span>
                      </td>
                      <td>{exp.supportVectorCount}</td>
                      <td style={{ fontSize: '12px', color: '#6b7280' }}>{exp.timestamp}</td>
                      <td>
                        <button
                          onClick={() => onDeleteExperiment(exp.id)}
                          style={{
                            border: 'none',
                            background: 'transparent',
                            color: '#dc2626',
                            cursor: 'pointer',
                            fontSize: '15px',
                            padding: '4px',
                          }}
                          title="Xóa thí nghiệm này"
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Tạo Thí Nghiệm Mới */}
      {showCreateModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '16px',
              padding: '24px',
              width: '460px',
              maxWidth: '92%',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            }}
          >
            <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: 'bold', color: '#1e1b4b' }}>
              ➕ Tạo thí nghiệm SVM mới
            </h3>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '4px' }}>
                Tên thí nghiệm:
              </label>
              <input
                type="text"
                placeholder={`Thí nghiệm #${String(experiments.length + 1).padStart(2, '0')}`}
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '14px' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '4px' }}>
                  Kernel:
                </label>
                <select
                  value={kernel}
                  onChange={(e) => setKernel(e.target.value as SVMKernel)}
                  style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '13px' }}
                >
                  <option value="rbf">RBF</option>
                  <option value="linear">Linear</option>
                  <option value="poly">Polynomial</option>
                  <option value="sigmoid">Sigmoid</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '4px' }}>
                  Tham số C:
                </label>
                <input
                  type="number"
                  min="0.01"
                  max="100"
                  step="0.5"
                  value={cValue}
                  onChange={(e) => setCValue(parseFloat(e.target.value) || 1)}
                  style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '13px' }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '4px' }}>
                Gamma:
              </label>
              <input
                type="number"
                min="0.001"
                max="10"
                step="0.05"
                value={gamma}
                onChange={(e) => setGamma(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '13px' }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '4px' }}>
                Đặc trưng sử dụng:
              </label>
              <div style={{ display: 'flex', gap: '12px' }}>
                <label style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="featMode"
                    checked={featureMode === 'all'}
                    onChange={() => setFeatureMode('all')}
                  />
                  Tất cả 4 đặc trưng
                </label>
                <label style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="featMode"
                    checked={featureMode === 'custom'}
                    onChange={() => setFeatureMode('custom')}
                  />
                  Chỉ chọn 2 đặc trưng
                </label>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                className="reset-btn"
                style={{ width: 'auto', padding: '8px 16px' }}
                onClick={() => setShowCreateModal(false)}
              >
                Hủy bỏ
              </button>
              <button
                className="main-btn"
                style={{ width: 'auto', padding: '8px 20px' }}
                onClick={handleCreateExperiment}
              >
                ✓ Huấn luyện & Lưu
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
