import React, { useState } from 'react';
import { HistoryRecord } from '../types';
import { IRIS_SPECIES_NAMES } from '../data/irisData';

interface HistoryPageProps {
  history: HistoryRecord[];
  onDeleteHistoryItem: (id: string) => void;
  onClearHistory: () => void;
  onNavigateToPredict: () => void;
}

export const HistoryPage: React.FC<HistoryPageProps> = ({
  history,
  onDeleteHistoryItem,
  onClearHistory,
  onNavigateToPredict,
}) => {
  const [selectedRecord, setSelectedRecord] = useState<HistoryRecord | null>(null);

  const getSpeciesBadgeStyle = (species: string) => {
    switch (species) {
      case 'setosa':
        return { bg: '#dcfce7', text: '#166534', border: '#86efac' };
      case 'versicolor':
        return { bg: '#dbeafe', text: '#1e40af', border: '#93c5fd' };
      case 'virginica':
        return { bg: '#f3e8ff', text: '#6b21a8', border: '#d8b4fe' };
      default:
        return { bg: '#f3f4f6', text: '#374151', border: '#e5e7eb' };
    }
  };

  return (
    <section id="historyPage" className="page active">
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1e1b4b', margin: 0 }}>
              🕘 Lịch sử nhận diện Iris
            </h2>
            <p style={{ fontSize: '13px', color: '#6b7280', margin: '4px 0 0 0' }}>
              Danh sách các lần người dùng phân loại hoa Iris bằng mô hình SVM (Tự động ghi nhận).
            </p>
          </div>
          {history.length > 0 && (
            <button className="clear-btn" onClick={onClearHistory}>
              🗑️ Xóa toàn bộ lịch sử
            </button>
          )}
        </div>

        {history.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: '#6b7280' }}>
            <div style={{ fontSize: '40px', marginBottom: '10px' }}>🕒</div>
            <h4 style={{ fontSize: '16px', fontWeight: 600, color: '#374151', margin: '0 0 6px 0' }}>
              Chưa có lịch sử nhận diện nào
            </h4>
            <p style={{ fontSize: '13px', margin: '0 0 16px 0' }}>
              Mỗi khi bạn thực hiện phân loại ở mục "Nhận diện" hoặc "Bạn đoán trước", kết quả sẽ tự động được lưu lại tại đây.
            </p>
            <button className="main-btn" style={{ width: 'auto', display: 'inline-flex' }} onClick={onNavigateToPredict}>
              🎯 Đi đến trang Nhận diện
            </button>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Thời gian</th>
                  <th>Kích thước (SL / SW / PL / PW)</th>
                  <th>Phương thức</th>
                  <th>Kết quả dự đoán</th>
                  <th>Độ tin cậy (Confidence)</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {history.map((item) => {
                  const badge = getSpeciesBadgeStyle(item.prediction);
                  return (
                    <tr key={item.id}>
                      <td style={{ fontSize: '13px', color: '#4b5563', fontWeight: 500 }}>
                        {item.timestamp}
                      </td>
                      <td style={{ fontWeight: 600, color: '#111827' }}>
                        {item.sepal_length} / {item.sepal_width} / {item.petal_length} / {item.petal_width} cm
                      </td>
                      <td>
                        <span
                          style={{
                            fontSize: '12px',
                            color: '#6b7280',
                            backgroundColor: '#f3f4f6',
                            padding: '3px 8px',
                            borderRadius: '6px',
                          }}
                        >
                          {item.fileName ? `Tệp: ${item.fileName}` : item.method}
                        </span>
                      </td>
                      <td>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '4px 12px',
                            borderRadius: '20px',
                            backgroundColor: badge.bg,
                            color: badge.text,
                            border: `1px solid ${badge.border}`,
                            fontWeight: 700,
                            fontSize: '13px',
                          }}
                        >
                          {IRIS_SPECIES_NAMES[item.prediction]}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                          <span style={{ fontWeight: 'bold', color: item.confidence >= 95 ? '#16a34a' : '#2563eb' }}>
                            {item.confidence.toFixed(1)}%
                          </span>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                          <button
                            onClick={() => setSelectedRecord(item)}
                            style={{
                              border: '1px solid #d1d5db',
                              background: 'white',
                              borderRadius: '6px',
                              padding: '4px 8px',
                              fontSize: '12px',
                              cursor: 'pointer',
                              fontWeight: 500,
                            }}
                          >
                            Chi tiết
                          </button>
                          <button
                            onClick={() => onDeleteHistoryItem(item.id)}
                            style={{
                              border: 'none',
                              background: 'transparent',
                              color: '#dc2626',
                              cursor: 'pointer',
                              fontSize: '14px',
                              padding: '4px',
                            }}
                            title="Xóa mục này"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Chi tiết Modal */}
      {selectedRecord && (
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
              width: '420px',
              maxWidth: '90%',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: '#1e1b4b' }}>
                Chi tiết kết quả nhận diện
              </h3>
              <button
                onClick={() => setSelectedRecord(null)}
                style={{ border: 'none', background: 'transparent', fontSize: '18px', cursor: 'pointer', color: '#9ca3af' }}
              >
                ✕
              </button>
            </div>

            <div style={{ textAlign: 'center', margin: '16px 0' }}>
              <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Thời gian thực hiện</div>
              <div style={{ fontSize: '14px', fontWeight: 600 }}>{selectedRecord.timestamp}</div>

              <div
                style={{
                  margin: '16px 0',
                  padding: '16px',
                  borderRadius: '12px',
                  backgroundColor: selectedRecord.prediction === 'setosa' ? '#ecfdf5' : selectedRecord.prediction === 'versicolor' ? '#eff6ff' : '#faf5ff',
                  border: `1px solid ${selectedRecord.prediction === 'setosa' ? '#a7f3d0' : selectedRecord.prediction === 'versicolor' ? '#bfdbfe' : '#e9d5ff'}`,
                }}
              >
                <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px', color: '#059669', marginBottom: '4px' }}>
                  KẾT QUẢ SVM
                </div>
                <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#111827' }}>
                  {IRIS_SPECIES_NAMES[selectedRecord.prediction]}
                </div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#16a34a', marginTop: '4px' }}>
                  Confidence: {selectedRecord.confidence}%
                </div>
              </div>
            </div>

            <div className="summary-list" style={{ marginTop: '16px' }}>
              <div className="summary-row">
                <span>Sepal length (Đài hoa)</span>
                <span className="val">{selectedRecord.sepal_length} cm</span>
              </div>
              <div className="summary-row">
                <span>Sepal width (Đài hoa)</span>
                <span className="val">{selectedRecord.sepal_width} cm</span>
              </div>
              <div className="summary-row">
                <span>Petal length (Cánh hoa)</span>
                <span className="val">{selectedRecord.petal_length} cm</span>
              </div>
              <div className="summary-row">
                <span>Petal width (Cánh hoa)</span>
                <span className="val">{selectedRecord.petal_width} cm</span>
              </div>
              <div className="summary-row">
                <span>Phương thức ghi nhận</span>
                <span className="val">{selectedRecord.method}</span>
              </div>
            </div>

            <button
              className="main-btn"
              style={{ marginTop: '20px' }}
              onClick={() => setSelectedRecord(null)}
            >
              Đóng
            </button>
          </div>
        </div>
      )}
    </section>
  );
};
