import React, { useState, useEffect, useRef } from 'react';
import { callSVM } from '../utils/api';
import { IRIS_SPECIES_NAMES } from '../data/irisData';
import { IrisSpecies, HistoryRecord } from '../types';

interface PredictPageProps {
  onSaveHistory: (record: Omit<HistoryRecord, 'id'>) => void;
}

const flowerInfo = {
  setosa: { name: 'Iris Setosa', image: 'images/setosa.jpg' },
  versicolor: { name: 'Iris Versicolor', image: 'images/versicolor.jpg' },
  virginica: { name: 'Iris Virginica', image: 'images/virginica.jpg' },
};

export const PredictPage: React.FC<PredictPageProps> = ({ onSaveHistory }) => {
  const [sepalLength, setSepalLength] = useState<number>(5.1);
  const [sepalWidth, setSepalWidth] = useState<number>(3.5);
  const [petalLength, setPetalLength] = useState<number>(1.4);
  const [petalWidth, setPetalWidth] = useState<number>(0.2);

  const [prediction, setPrediction] = useState<IrisSpecies>('setosa');
  const [confidence, setConfidence] = useState<number>(99.8);
  const [loading, setLoading] = useState<boolean>(false);
  const [apiSource, setApiSource] = useState<string>('SVM Sẵn sàng');

  const chartRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstanceRef = useRef<any>(null);

  // Initialize and update Chart.js
  useEffect(() => {
    if (!chartRef.current) return;
    const ctx = chartRef.current.getContext('2d');
    if (!ctx) return;

    const Chart = (window as any).Chart;
    if (!Chart) return;

    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }

    chartInstanceRef.current = new Chart(ctx, {
      type: 'scatter',
      data: {
        datasets: [
          {
            label: 'Setosa (Mẫu chuẩn)',
            data: [
              { x: 1.4, y: 0.2 }, { x: 1.5, y: 0.2 }, { x: 1.3, y: 0.3 },
              { x: 1.6, y: 0.2 }, { x: 1.4, y: 0.3 }, { x: 1.7, y: 0.4 },
              { x: 1.5, y: 0.1 }, { x: 1.9, y: 0.4 }, { x: 1.1, y: 0.1 },
            ],
            backgroundColor: '#166534',
            pointRadius: 5,
          },
          {
            label: 'Versicolor (Mẫu chuẩn)',
            data: [
              { x: 4.5, y: 1.5 }, { x: 4.0, y: 1.3 }, { x: 4.7, y: 1.4 },
              { x: 4.6, y: 1.5 }, { x: 4.1, y: 1.0 }, { x: 3.9, y: 1.2 },
              { x: 4.9, y: 1.5 }, { x: 4.4, y: 1.4 }, { x: 5.1, y: 1.6 },
            ],
            backgroundColor: '#1e40af',
            pointRadius: 5,
          },
          {
            label: 'Virginica (Mẫu chuẩn)',
            data: [
              { x: 5.5, y: 1.8 }, { x: 5.8, y: 2.2 }, { x: 6.0, y: 2.5 },
              { x: 5.1, y: 1.9 }, { x: 5.9, y: 2.1 }, { x: 6.6, y: 2.1 },
              { x: 6.3, y: 1.8 }, { x: 5.6, y: 2.4 }, { x: 6.9, y: 2.3 },
            ],
            backgroundColor: '#6b21a8',
            pointRadius: 5,
          },
          {
            label: '🔴 Mẫu đang chọn',
            data: [{ x: petalLength, y: petalWidth }],
            backgroundColor: '#dc2626',
            pointRadius: 8,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            title: { display: true, text: 'Petal Length (Chiều dài cánh hoa - cm)' },
            min: 0,
            max: 7.5,
          },
          y: {
            title: { display: true, text: 'Petal Width (Chiều rộng cánh hoa - cm)' },
            min: 0,
            max: 3.0,
          },
        },
      },
    });

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
      }
    };
  }, []);

  // Update selected red point on input changes
  useEffect(() => {
    if (chartInstanceRef.current) {
      chartInstanceRef.current.data.datasets[3].data = [{ x: petalLength, y: petalWidth }];
      chartInstanceRef.current.update();
    }
  }, [petalLength, petalWidth]);

  const handlePredict = async () => {
    setLoading(true);
    try {
      const result = await callSVM({
        sepal_length: sepalLength,
        sepal_width: sepalWidth,
        petal_length: petalLength,
        petal_width: petalWidth,
      });

      setPrediction(result.species);
      setConfidence(result.confidence);
      setApiSource(result.source === 'remote' ? 'Render API' : 'High-Precision SVM');

      // Tự động lưu vào lịch sử theo yêu cầu
      const now = new Date();
      const timeStr = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()} - ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      
      onSaveHistory({
        timestamp: timeStr,
        sepal_length: sepalLength,
        sepal_width: sepalWidth,
        petal_length: petalLength,
        petal_width: petalWidth,
        prediction: result.species,
        confidence: result.confidence,
        method: 'Nhập số liệu',
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSepalLength(5.1);
    setSepalWidth(3.5);
    setPetalLength(1.4);
    setPetalWidth(0.2);
    setPrediction('setosa');
    setConfidence(99.8);
  };

  const currentFlower = flowerInfo[prediction];

  return (
    <section id="predictPage" className="page active">
      <div className="predict-grid">
        {/* Cột Trái - Input */}
        <div>
          <div className="card">
            <div className="card-header">
              <span>🔮</span>
              <h3>Thông số đầu vào</h3>
            </div>

            <div className="input-item">
              <div className="input-label-row">
                <label>Sepal length <span className="sub">(Chiều dài đài hoa)</span></label>
              </div>
              <div className="input-control-row">
                <input
                  id="range_sepal_length"
                  type="range"
                  min="4"
                  max="8"
                  step="0.1"
                  value={sepalLength}
                  onChange={(e) => setSepalLength(parseFloat(e.target.value))}
                />
                <div className="number-box">
                  <input
                    id="sepal_length"
                    type="number"
                    min="4"
                    max="8"
                    step="0.1"
                    value={sepalLength}
                    onChange={(e) => setSepalLength(parseFloat(e.target.value) || 4)}
                  />
                  <span>cm</span>
                </div>
              </div>
            </div>

            <div className="input-item">
              <div className="input-label-row">
                <label>Sepal width <span className="sub">(Chiều rộng đài hoa)</span></label>
              </div>
              <div className="input-control-row">
                <input
                  id="range_sepal_width"
                  type="range"
                  min="2"
                  max="4.5"
                  step="0.1"
                  value={sepalWidth}
                  onChange={(e) => setSepalWidth(parseFloat(e.target.value))}
                />
                <div className="number-box">
                  <input
                    id="sepal_width"
                    type="number"
                    min="2"
                    max="4.5"
                    step="0.1"
                    value={sepalWidth}
                    onChange={(e) => setSepalWidth(parseFloat(e.target.value) || 2)}
                  />
                  <span>cm</span>
                </div>
              </div>
            </div>

            <div className="input-item">
              <div className="input-label-row">
                <label>Petal length <span className="sub">(Chiều dài cánh hoa)</span></label>
              </div>
              <div className="input-control-row">
                <input
                  id="range_petal_length"
                  type="range"
                  min="1"
                  max="7"
                  step="0.1"
                  value={petalLength}
                  onChange={(e) => setPetalLength(parseFloat(e.target.value))}
                />
                <div className="number-box">
                  <input
                    id="petal_length"
                    type="number"
                    min="1"
                    max="7"
                    step="0.1"
                    value={petalLength}
                    onChange={(e) => setPetalLength(parseFloat(e.target.value) || 1)}
                  />
                  <span>cm</span>
                </div>
              </div>
            </div>

            <div className="input-item">
              <div className="input-label-row">
                <label>Petal width <span className="sub">(Chiều rộng cánh hoa)</span></label>
              </div>
              <div className="input-control-row">
                <input
                  id="range_petal_width"
                  type="range"
                  min="0.1"
                  max="2.5"
                  step="0.1"
                  value={petalWidth}
                  onChange={(e) => setPetalWidth(parseFloat(e.target.value))}
                />
                <div className="number-box">
                  <input
                    id="petal_width"
                    type="number"
                    min="0.1"
                    max="2.5"
                    step="0.1"
                    value={petalWidth}
                    onChange={(e) => setPetalWidth(parseFloat(e.target.value) || 0.1)}
                  />
                  <span>cm</span>
                </div>
              </div>
            </div>

            <div className="btn-group">
              <button
                id="predictBtn"
                className="main-btn"
                onClick={handlePredict}
                disabled={loading}
              >
                <span>🌐</span> {loading ? '⏳ Đang phân loại...' : 'Phân loại bằng SVM'}
              </button>
              <button className="reset-btn" onClick={handleReset}>
                🔄 Đặt lại
              </button>
            </div>
          </div>
        </div>

        {/* Cột Phải - Result Card */}
        <div>
          <div className="result-card-box">
            <div>
              <div className="result-badge-title">✔ KẾT QUẢ PHÂN LOẠI</div>
              <div id="flowerName" className="result-flower-name">
                {currentFlower.name}
              </div>
              <div style={{ fontSize: '13px', color: '#047857', marginTop: '6px', fontWeight: 600 }}>
                Độ tin cậy: {confidence}% · <span style={{ opacity: 0.85 }}>({apiSource})</span>
              </div>
            </div>
            <img
              id="flowerImage"
              className="result-img-circle"
              src={currentFlower.image}
              alt="Iris"
              onError={(e) => {
                (e.target as HTMLImageElement).src = currentFlower.image.replace('.jpg', '.svg');
              }}
            />
          </div>

          <div className="card">
            <div className="card-header">
              <span>📋</span>
              <h3>Thông số mẫu đầu vào</h3>
            </div>
            <div className="summary-list">
              <div className="summary-row">
                <span>Sepal length</span>
                <span className="val" id="res_sepal_length">{sepalLength} cm</span>
              </div>
              <div className="summary-row">
                <span>Sepal width</span>
                <span className="val" id="res_sepal_width">{sepalWidth} cm</span>
              </div>
              <div className="summary-row">
                <span>Petal length</span>
                <span className="val" id="res_petal_length">{petalLength} cm</span>
              </div>
              <div className="summary-row">
                <span>Petal width</span>
                <span className="val" id="res_petal_width">{petalWidth} cm</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* BIỂU ĐỒ POINT RADIUS = 8 */}
      <div className="card" style={{ marginTop: '24px' }}>
        <div className="card-header">
          <span>📈</span>
          <h3>Biểu đồ Siêu phẳng SVM & Vị trí Mẫu dữ liệu (Petal Length vs Petal Width)</h3>
        </div>
        <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '15px' }}>
          Biểu đồ biểu diễn ranh giới phân chia các loài dựa trên cánh hoa. Điểm 🔴 <b>Màu đỏ</b> chính là vị trí thông số hiện tại bạn vừa nhập!
        </p>
        <div style={{ height: '340px', position: 'relative' }}>
          <canvas ref={chartRef} id="svmChart"></canvas>
        </div>
      </div>

      {/* Đặc điểm các loài */}
      <div className="card" style={{ marginBottom: 0 }}>
        <div className="card-header">
          <span>💡</span>
          <h3>Đặc điểm các loài Iris</h3>
        </div>
        <div className="species-grid">
          <div className="species-card">
            <img
              src="images/setosa.jpg"
              alt="Setosa"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'images/setosa.svg';
              }}
            />
            <div>
              <h4 style={{ fontSize: '15px', margin: '0 0 4px 0', fontWeight: 'bold' }}>Iris Setosa</h4>
              <p style={{ fontSize: '12px', margin: 0, color: '#6b7280' }}>Cánh hoa nhỏ, màu tím nhạt</p>
            </div>
          </div>
          <div className="species-card">
            <img
              src="images/versicolor.jpg"
              alt="Versicolor"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'images/versicolor.svg';
              }}
            />
            <div>
              <h4 style={{ fontSize: '15px', margin: '0 0 4px 0', fontWeight: 'bold' }}>Iris Versicolor</h4>
              <p style={{ fontSize: '12px', margin: 0, color: '#6b7280' }}>Cánh hoa lớn hơn, màu xanh tím</p>
            </div>
          </div>
          <div className="species-card">
            <img
              src="images/virginica.jpg"
              alt="Virginica"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'images/virginica.svg';
              }}
            />
            <div>
              <h4 style={{ fontSize: '15px', margin: '0 0 4px 0', fontWeight: 'bold' }}>Iris Virginica</h4>
              <p style={{ fontSize: '12px', margin: 0, color: '#6b7280' }}>Cánh hoa to, màu tím đậm</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
