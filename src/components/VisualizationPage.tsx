import React, { useState, useEffect, useRef } from 'react';
import { IRIS_DATASET, IRIS_FEATURES, FeatureKey, IRIS_SPECIES_NAMES, getFeatureStats } from '../data/irisData';
import { IrisSpecies } from '../types';

export const VisualizationPage: React.FC = () => {
  const [xAxisFeature, setXAxisFeature] = useState<FeatureKey>('petal_length');
  const [yAxisFeature, setYAxisFeature] = useState<FeatureKey>('petal_width');
  const [selectedSpeciesFilter, setSelectedSpeciesFilter] = useState<'all' | IrisSpecies>('all');
  const [hoveredPoint, setHoveredPoint] = useState<any | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstanceRef = useRef<any>(null);

  const xMeta = IRIS_FEATURES.find((f) => f.key === xAxisFeature)!;
  const yMeta = IRIS_FEATURES.find((f) => f.key === yAxisFeature)!;

  // Filter dataset based on selected species
  const filteredData = selectedSpeciesFilter === 'all'
    ? IRIS_DATASET
    : IRIS_DATASET.filter((d) => d.species === selectedSpeciesFilter);

  useEffect(() => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    const Chart = (window as any).Chart;
    if (!Chart) return;

    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }

    const setosaPoints = IRIS_DATASET.filter((d) => d.species === 'setosa').map((d) => ({
      x: d[xAxisFeature],
      y: d[yAxisFeature],
      sample: d,
    }));

    const versicolorPoints = IRIS_DATASET.filter((d) => d.species === 'versicolor').map((d) => ({
      x: d[xAxisFeature],
      y: d[yAxisFeature],
      sample: d,
    }));

    const virginicaPoints = IRIS_DATASET.filter((d) => d.species === 'virginica').map((d) => ({
      x: d[xAxisFeature],
      y: d[yAxisFeature],
      sample: d,
    }));

    const datasets = [];

    if (selectedSpeciesFilter === 'all' || selectedSpeciesFilter === 'setosa') {
      datasets.push({
        label: 'Iris Setosa (50 mẫu)',
        data: setosaPoints,
        backgroundColor: 'rgba(22, 101, 52, 0.85)',
        borderColor: '#166534',
        borderWidth: 1.5,
        pointRadius: 6,
        pointHoverRadius: 9,
      });
    }

    if (selectedSpeciesFilter === 'all' || selectedSpeciesFilter === 'versicolor') {
      datasets.push({
        label: 'Iris Versicolor (50 mẫu)',
        data: versicolorPoints,
        backgroundColor: 'rgba(30, 64, 175, 0.85)',
        borderColor: '#1e40af',
        borderWidth: 1.5,
        pointRadius: 6,
        pointHoverRadius: 9,
      });
    }

    if (selectedSpeciesFilter === 'all' || selectedSpeciesFilter === 'virginica') {
      datasets.push({
        label: 'Iris Virginica (50 mẫu)',
        data: virginicaPoints,
        backgroundColor: 'rgba(107, 33, 168, 0.85)',
        borderColor: '#6b21a8',
        borderWidth: 1.5,
        pointRadius: 6,
        pointHoverRadius: 9,
      });
    }

    chartInstanceRef.current = new Chart(ctx, {
      type: 'scatter',
      data: { datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: {
              boxWidth: 14,
              font: { size: 13, weight: '600' },
              padding: 18,
            },
          },
          tooltip: {
            backgroundColor: 'rgba(17, 24, 39, 0.95)',
            titleFont: { size: 14, weight: 'bold' },
            bodyFont: { size: 13 },
            padding: 12,
            cornerRadius: 8,
            callbacks: {
              title: (items: any[]) => {
                const item = items[0];
                const raw = item.raw.sample;
                return raw ? `${IRIS_SPECIES_NAMES[raw.species as IrisSpecies]} (#${raw.id})` : '';
              },
              label: (item: any) => {
                const raw = item.raw.sample;
                if (!raw) return '';
                return [
                  `• ${xMeta.label} (${xMeta.viLabel}): ${raw[xAxisFeature]} cm`,
                  `• ${yMeta.label} (${yMeta.viLabel}): ${raw[yAxisFeature]} cm`,
                  `• Chi tiết khác: Sepal (${raw.sepal_length} x ${raw.sepal_width}) | Petal (${raw.petal_length} x ${raw.petal_width})`,
                ];
              },
            },
          },
        },
        scales: {
          x: {
            title: {
              display: true,
              text: `${xMeta.label} - ${xMeta.viLabel} (${xMeta.unit})`,
              font: { size: 14, weight: '600' },
              color: '#374151',
            },
            grid: { color: 'rgba(0, 0, 0, 0.05)' },
          },
          y: {
            title: {
              display: true,
              text: `${yMeta.label} - ${yMeta.viLabel} (${yMeta.unit})`,
              font: { size: 14, weight: '600' },
              color: '#374151',
            },
            grid: { color: 'rgba(0, 0, 0, 0.05)' },
          },
        },
      },
    });

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
      }
    };
  }, [xAxisFeature, yAxisFeature, selectedSpeciesFilter]);

  const xStats = getFeatureStats(xAxisFeature);
  const yStats = getFeatureStats(yAxisFeature);

  return (
    <section id="visualizationPage" className="page active">
      <div className="card">
        <div className="card-header" style={{ justifyContent: 'space-between', flexWrap: 'wrap' }}>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1e1b4b', margin: 0 }}>
              📈 Trực quan hóa Dataset Iris 2D
            </h2>
            <p style={{ fontSize: '13px', color: '#6b7280', margin: '4px 0 0 0' }}>
              Khám phá không gian phân bố của 150 mẫu hoa Iris theo từng cặp đặc trưng 2D.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#4b5563' }}>Lọc loài:</span>
            <select
              value={selectedSpeciesFilter}
              onChange={(e) => setSelectedSpeciesFilter(e.target.value as any)}
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                border: '1px solid #d1d5db',
                fontSize: '13px',
                fontWeight: 500,
                backgroundColor: 'white',
              }}
            >
              <option value="all">Tất cả 3 loài (150 mẫu)</option>
              <option value="setosa">Chỉ Iris Setosa (50 mẫu)</option>
              <option value="versicolor">Chỉ Iris Versicolor (50 mẫu)</option>
              <option value="virginica">Chỉ Iris Virginica (50 mẫu)</option>
            </select>
          </div>
        </div>

        {/* Feature Selectors */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '16px',
            backgroundColor: '#f8fafc',
            padding: '16px 20px',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            marginBottom: '20px',
          }}
        >
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
              Trục hoành X (Đặc trưng 1):
            </label>
            <select
              value={xAxisFeature}
              onChange={(e) => setXAxisFeature(e.target.value as FeatureKey)}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '14px',
                fontWeight: 600,
                backgroundColor: 'white',
                color: '#1e293b',
              }}
            >
              {IRIS_FEATURES.map((feat) => (
                <option key={feat.key} value={feat.key}>
                  {feat.label} ({feat.viLabel})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
              Trục tung Y (Đặc trưng 2):
            </label>
            <select
              value={yAxisFeature}
              onChange={(e) => setYAxisFeature(e.target.value as FeatureKey)}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '14px',
                fontWeight: 600,
                backgroundColor: 'white',
                color: '#1e293b',
              }}
            >
              {IRIS_FEATURES.map((feat) => (
                <option key={feat.key} value={feat.key}>
                  {feat.label} ({feat.viLabel})
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
            <button
              onClick={() => {
                const temp = xAxisFeature;
                setXAxisFeature(yAxisFeature);
                setYAxisFeature(temp);
              }}
              className="reset-btn"
              style={{ height: '42px', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
            >
              🔄 Đổi trục X ⇄ Y
            </button>
          </div>
        </div>

        {/* Chart Canvas */}
        <div style={{ height: '420px', position: 'relative', width: '100%' }}>
          <canvas ref={canvasRef} id="irisVisualCanvas"></canvas>
        </div>

        {/* Tip */}
        <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '12px', textAlign: 'center' }}>
          💡 Di chuột vào bất kỳ điểm dữ liệu nào trên biểu đồ để xem chi tiết thông số kích thước và loài hoa.
        </div>
      </div>

      {/* Feature Statistics Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        <div className="card" style={{ marginBottom: 0 }}>
          <div className="card-header" style={{ marginBottom: '14px' }}>
            <span>📊</span>
            <h3>Thống kê {xMeta.label} (Trục X)</h3>
          </div>
          <div className="summary-list">
            <div className="summary-row">
              <span>Đặc trưng</span>
              <span className="val">{xMeta.viLabel}</span>
            </div>
            <div className="summary-row">
              <span>Giá trị Min</span>
              <span className="val">{xStats.min} cm</span>
            </div>
            <div className="summary-row">
              <span>Giá trị Max</span>
              <span className="val">{xStats.max} cm</span>
            </div>
            <div className="summary-row">
              <span>Trung bình (Mean)</span>
              <span className="val" style={{ color: '#4f46e5' }}>{xStats.mean} cm</span>
            </div>
            <div className="summary-row">
              <span>Độ lệch chuẩn (Std)</span>
              <span className="val">± {xStats.std} cm</span>
            </div>
          </div>
        </div>

        <div className="card" style={{ marginBottom: 0 }}>
          <div className="card-header" style={{ marginBottom: '14px' }}>
            <span>📊</span>
            <h3>Thống kê {yMeta.label} (Trục Y)</h3>
          </div>
          <div className="summary-list">
            <div className="summary-row">
              <span>Đặc trưng</span>
              <span className="val">{yMeta.viLabel}</span>
            </div>
            <div className="summary-row">
              <span>Giá trị Min</span>
              <span className="val">{yStats.min} cm</span>
            </div>
            <div className="summary-row">
              <span>Giá trị Max</span>
              <span className="val">{yStats.max} cm</span>
            </div>
            <div className="summary-row">
              <span>Trung bình (Mean)</span>
              <span className="val" style={{ color: '#4f46e5' }}>{yStats.mean} cm</span>
            </div>
            <div className="summary-row">
              <span>Độ lệch chuẩn (Std)</span>
              <span className="val">± {yStats.std} cm</span>
            </div>
          </div>
        </div>

        <div className="card" style={{ marginBottom: 0 }}>
          <div className="card-header" style={{ marginBottom: '14px' }}>
            <span>🌱</span>
            <h3>Phân tích khả năng phân tách SVM</h3>
          </div>
          <p style={{ fontSize: '13px', color: '#4b5563', lineHeight: '1.6', margin: 0 }}>
            {xAxisFeature.includes('petal') && yAxisFeature.includes('petal') ? (
              <span>
                🌟 <b>Cặp đặc trưng vàng:</b> <code>Petal Length</code> và <code>Petal Width</code> mang tính phân tách cao nhất!
                Iris Setosa hoàn toàn tách biệt tuyến tính (Linear Separable), trong khi Versicolor và Virginica phân tách rõ rệt với RBF kernel.
              </span>
            ) : (
              <span>
                ℹ️ Cặp đặc trưng <code>{xMeta.label}</code> và <code>{yMeta.label}</code> có sự chồng lấn nhẹ giữa Versicolor và Virginica.
                SVM với <b>RBF Kernel</b> hoặc <b>Polynomial Kernel</b> sẽ phát huy sức mạnh tối đa để tìm ra siêu phẳng cong phi tuyến tính.
              </span>
            )}
          </p>
        </div>
      </div>
    </section>
  );
};
