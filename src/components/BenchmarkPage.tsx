import React from 'react';

export const BenchmarkPage: React.FC = () => {
  return (
    <section id="benchmarkPage" className="page active">
      <div className="card">
        <div className="card-header">
          <span>🏆</span>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1e1b4b', margin: 0 }}>
            So sánh hiệu năng thuật toán (Model Benchmark)
          </h2>
        </div>
        <p style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 20px 0' }}>
          Đánh giá hiệu suất toàn diện của Support Vector Machine (SVM) so với các mô hình Học máy kinh điển trên chuẩn Fisher Iris Dataset.
        </p>

        <div className="table-wrapper benchmark-table">
          <table>
            <thead>
              <tr>
                <th>Thuật toán (Algorithm)</th>
                <th>Accuracy</th>
                <th>Precision</th>
                <th>Recall</th>
                <th>F1-Score</th>
                <th>Đánh giá lề phân chia & Khả năng tổng quát hóa</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ fontWeight: 'bold', background: '#f0fdf4' }}>
                <td style={{ color: '#166534', textAlign: 'left', paddingLeft: '16px' }}>
                  ⭐ Support Vector Machine (SVM - RBF Kernel)
                </td>
                <td style={{ color: '#16a34a', fontSize: '15px' }}>97.3%</td>
                <td>0.97</td>
                <td>0.97</td>
                <td>0.97</td>
                <td style={{ color: '#16a34a', textAlign: 'left' }}>
                  Tối ưu nhất (Max-Margin Hyperplane). Không bị ảnh hưởng bởi điểm nằm ngoài biên lề.
                </td>
              </tr>
              <tr>
                <td style={{ textAlign: 'left', paddingLeft: '16px' }}>K-Nearest Neighbors (KNN, k=5)</td>
                <td>96.0%</td>
                <td>0.96</td>
                <td>0.96</td>
                <td>0.96</td>
                <td style={{ textAlign: 'left', color: '#4b5563' }}>
                  Hiệu quả tốt nhưng nhạy cảm với nhiễu dữ liệu và tỷ lệ khoảng cách đặc trưng.
                </td>
              </tr>
              <tr>
                <td style={{ textAlign: 'left', paddingLeft: '16px' }}>Random Forest (100 Trees)</td>
                <td>96.7%</td>
                <td>0.97</td>
                <td>0.96</td>
                <td>0.96</td>
                <td style={{ textAlign: 'left', color: '#4b5563' }}>
                  Mạnh mẽ, chống overfitting tốt nhưng tốn tài nguyên và khó trực quan hóa ranh giới.
                </td>
              </tr>
              <tr>
                <td style={{ textAlign: 'left', paddingLeft: '16px' }}>Gaussian Naive Bayes</td>
                <td>95.3%</td>
                <td>0.95</td>
                <td>0.95</td>
                <td>0.95</td>
                <td style={{ textAlign: 'left', color: '#4b5563' }}>
                  Tốc độ tính toán tức thì, nhưng giả định ngây thơ các đặc trưng độc lập với nhau.
                </td>
              </tr>
              <tr>
                <td style={{ textAlign: 'left', paddingLeft: '16px' }}>Decision Tree (Cây quyết định CART)</td>
                <td>94.7%</td>
                <td>0.95</td>
                <td>0.94</td>
                <td>0.94</td>
                <td style={{ textAlign: 'left', color: '#4b5563' }}>
                  Dễ hiểu, tuy nhiên ranh giới phân tách chỉ là các đường song song với trục toạ độ, dễ overfitting.
                </td>
              </tr>
              <tr>
                <td style={{ textAlign: 'left', paddingLeft: '16px' }}>Logistic Regression (Multinomial)</td>
                <td>96.0%</td>
                <td>0.96</td>
                <td>0.96</td>
                <td>0.96</td>
                <td style={{ textAlign: 'left', color: '#4b5563' }}>
                  Mô hình xác suất tuyến tính, hiệu quả cao trên bài toán phân chia tuyến tính.
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Why SVM is King on Iris */}
        <div style={{ marginTop: '24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
          <div style={{ padding: '16px', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '15px', color: '#1e1b4b', fontWeight: 'bold' }}>
              🎯 Nguyên lý Tối đa hóa Lề (Maximum Margin)
            </h4>
            <p style={{ margin: 0, fontSize: '13px', color: '#4b5563', lineHeight: 1.6 }}>
              SVM không chỉ tìm bất kỳ một đường phân chia, mà tìm đường phân chia nằm cách xa nhất các điểm dữ liệu gần nhất của mỗi lớp (Support Vectors). Điều này tạo ra biên độ an toàn cực lớn cho các mẫu chưa từng gặp.
            </p>
          </div>

          <div style={{ padding: '16px', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '15px', color: '#1e1b4b', fontWeight: 'bold' }}>
              ⚡ Kernel Trick (Mẹo hạt nhân)
            </h4>
            <p style={{ margin: 0, fontSize: '13px', color: '#4b5563', lineHeight: 1.6 }}>
              Khi dữ liệu Versicolor và Virginica chồng chéo trong không gian 2D/4D, RBF kernel chiếu dữ liệu lên không gian vô hạn chiều mà không cần tính toán toạ độ thực tế, biến bài toán phi tuyến thành tuyến tính.
            </p>
          </div>

          <div style={{ padding: '16px', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '15px', color: '#1e1b4b', fontWeight: 'bold' }}>
              🛡️ Kháng nhiễu với tham số C
            </h4>
            <p style={{ margin: 0, fontSize: '13px', color: '#4b5563', lineHeight: 1.6 }}>
              Tham số C cho phép cân bằng mềm dẻo giữa việc tối đa hóa độ rộng của lề và tối thiểu hóa số điểm vi phạm lề (Soft Margin), giúp mô hình tránh bị ảnh hưởng bởi những mẫu cá biệt.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
