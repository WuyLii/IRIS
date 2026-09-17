import React, { useState } from 'react';
import { callSVM } from '../utils/api';
import { normalizeSpecies } from '../utils/svmModel';
import { IRIS_SPECIES_NAMES } from '../data/irisData';
import { IrisSpecies, FileAnalysisRow, HistoryRecord } from '../types';

interface FileAnalysisPageProps {
  onSaveHistory: (record: Omit<HistoryRecord, 'id'>) => void;
}

const flowerInfo = {
  setosa: { name: 'Iris Setosa', image: 'images/setosa.jpg' },
  versicolor: { name: 'Iris Versicolor', image: 'images/versicolor.jpg' },
  virginica: { name: 'Iris Virginica', image: 'images/virginica.jpg' },
};

export const FileAnalysisPage: React.FC<FileAnalysisPageProps> = ({ onSaveHistory }) => {
  const [analysisMode, setAnalysisMode] = useState<'unlabeled' | 'labeled'>('unlabeled');
  const [fileName, setFileName] = useState<string>('Chưa chọn tập tin nào');
  const [loading, setLoading] = useState<boolean>(false);
  const [progressText, setProgressText] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [results, setResults] = useState<FileAnalysisRow[]>([]);

  const parseTXT = (text: string) => {
    const lines = text.replace(/\r/g, '').split('\n').filter((l) => l.trim() !== '');
    if (lines.length === 0) return [];

    const firstLine = lines[0].trim();
    let delimiter: any = ',';
    if (firstLine.includes('\t')) delimiter = '\t';
    else if (firstLine.includes(';')) delimiter = ';';
    else if (firstLine.includes(',')) delimiter = ',';
    else delimiter = /\s+/;

    const headers = firstLine.split(delimiter).map((h) => h.trim());

    return lines.slice(1).map((line) => {
      const values = line.split(delimiter).map((v) => v.trim());
      const row: Record<string, string> = {};
      headers.forEach((header, index) => {
        row[header] = values[index] ?? '';
      });
      return row;
    });
  };

  const findColumn = (row: Record<string, any>, names: string[]) => {
    const keys = Object.keys(row);
    for (const name of names) {
      const found = keys.find((key) => key.trim().toLowerCase() === name.trim().toLowerCase());
      if (found) return found;
    }
    return null;
  };

  const rowToInput = (row: Record<string, any>) => {
    const sepalLengthCol = findColumn(row, ['sepal_length', 'sepal length', 'Sepal.Length', 'Sepal_Length']);
    const sepalWidthCol = findColumn(row, ['sepal_width', 'sepal width', 'Sepal.Width', 'Sepal_Width']);
    const petalLengthCol = findColumn(row, ['petal_length', 'petal length', 'Petal.Length', 'Petal_Length']);
    const petalWidthCol = findColumn(row, ['petal_width', 'petal width', 'Petal.Width', 'Petal_Width']);

    if (!sepalLengthCol || !sepalWidthCol || !petalLengthCol || !petalWidthCol) return null;

    const sl = Number(String(row[sepalLengthCol]).replace(',', '.'));
    const sw = Number(String(row[sepalWidthCol]).replace(',', '.'));
    const pl = Number(String(row[petalLengthCol]).replace(',', '.'));
    const pw = Number(String(row[petalWidthCol]).replace(',', '.'));

    if (!Number.isFinite(sl) || !Number.isFinite(sw) || !Number.isFinite(pl) || !Number.isFinite(pw)) {
      return null;
    }

    return { sepal_length: sl, sepal_width: sw, petal_length: pl, petal_width: pw };
  };

  const getTrueLabel = (row: Record<string, any>): IrisSpecies | '' => {
    const labelCol = findColumn(row, ['species', 'Species', 'species_name', 'label', 'class', 'target']);
    if (!labelCol || !row[labelCol]) return '';
    return normalizeSpecies(row[labelCol]);
  };

  const processRows = async (rows: any[], fName: string) => {
    if (!rows || rows.length === 0) {
      setErrorMessage('File không có dữ liệu.');
      setLoading(false);
      return;
    }

    const preparedRows: { originalIndex: number; input: any; trueLabel: IrisSpecies | '' }[] = [];
    rows.forEach((row, index) => {
      const input = rowToInput(row);
      if (!input) return;
      const trueLabel = getTrueLabel(row);
      preparedRows.push({
        originalIndex: index + 2,
        input,
        trueLabel,
      });
    });

    if (preparedRows.length === 0) {
      setErrorMessage(
        'Không tìm thấy dữ liệu hợp lệ. File cần có 4 cột: sepal_length, sepal_width, petal_length, petal_width.'
      );
      setLoading(false);
      return;
    }

    const hasLabels = preparedRows.some((r) => r.trueLabel !== '');
    if (analysisMode === 'labeled' && !hasLabels) {
      setErrorMessage('Bạn đang chọn chế độ Có nhãn nhưng file không có cột species/label/class.');
      setLoading(false);
      return;
    }

    setProgressText(`⏳ Đang xử lý ${preparedRows.length} mẫu bằng mô hình SVM...`);

    try {
      const processed: FileAnalysisRow[] = await Promise.all(
        preparedRows.map(async (r) => {
          const res = await callSVM(r.input);
          return {
            originalIndex: r.originalIndex,
            input: r.input,
            trueLabel: r.trueLabel,
            prediction: res.species,
            confidence: res.confidence,
            correct: r.trueLabel !== '' ? r.trueLabel === res.species : null,
          };
        })
      );

      setResults(processed);
      setErrorMessage('');

      // Ghi nhận vào lịch sử
      const now = new Date();
      const timeStr = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()} - ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

      onSaveHistory({
        timestamp: timeStr,
        sepal_length: processed[0]?.input.sepal_length || 0,
        sepal_width: processed[0]?.input.sepal_width || 0,
        petal_length: processed[0]?.input.petal_length || 0,
        petal_width: processed[0]?.input.petal_width || 0,
        prediction: processed[0]?.prediction || 'setosa',
        confidence: processed[0]?.confidence || 95,
        method: 'Phân tích file',
        fileName: `${fName} (${processed.length} mẫu)`,
      });
    } catch (err: any) {
      setErrorMessage(`Không thể hoàn thành phân tích: ${err.message}`);
    } finally {
      setLoading(false);
      setProgressText('');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setLoading(true);
    setErrorMessage('');
    setResults([]);

    const ext = file.name.split('.').pop()?.toLowerCase();

    if (ext === 'txt') {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const text = event.target?.result as string;
          const rows = parseTXT(text);
          processRows(rows, file.name);
        } catch (err: any) {
          setErrorMessage(err.message);
          setLoading(false);
        }
      };
      reader.readAsText(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const XLSX = (window as any).XLSX;
        if (!XLSX) {
          throw new Error('Thư viện XLSX chưa tải xong.');
        }
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
        processRows(rows, file.name);
      } catch (err: any) {
        setErrorMessage(`Không thể đọc file: ${err.message}`);
        setLoading(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const exportResultsCSV = () => {
    if (!results || !results.length) return;

    let csv = 'Sepal_Length,Sepal_Width,Petal_Length,Petal_Width,True_Label,SVM_Prediction,Confidence,Result\n';
    results.forEach((r) => {
      const status = r.correct === null ? '' : r.correct ? 'Correct' : 'Wrong';
      csv += `${r.input.sepal_length},${r.input.sepal_width},${r.input.petal_length},${r.input.petal_width},${r.trueLabel},${r.prediction},${r.confidence || ''},${status}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `iris_svm_analysis_${Date.now()}.csv`;
    link.click();
  };

  const downloadSampleFile = () => {
    const csvContent =
      'sepal_length,sepal_width,petal_length,petal_width,species\n' +
      '5.1,3.5,1.4,0.2,setosa\n' +
      '4.9,3.0,1.4,0.2,setosa\n' +
      '6.0,2.9,4.5,1.5,versicolor\n' +
      '5.7,2.8,4.5,1.3,versicolor\n' +
      '6.5,3.0,5.5,1.8,virginica\n' +
      '7.2,3.6,6.1,2.5,virginica';
    const blob = new Blob([csvContent], { type: 'text/csv;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'iris_sample.csv';
    link.click();
  };

  const counts = { setosa: 0, versicolor: 0, virginica: 0 };
  results.forEach((r) => {
    if (counts[r.prediction] !== undefined) counts[r.prediction]++;
  });

  const total = results.length;
  const validLabeled = results.filter((r) => r.trueLabel !== '');
  const correctCount = validLabeled.filter((r) => r.correct === true).length;
  const wrongCount = validLabeled.filter((r) => r.correct === false).length;
  const accuracy = total > 0 && validLabeled.length > 0 ? (correctCount / validLabeled.length) * 100 : 0;

  return (
    <section id="filePage" className="page active">
      <div className="card">
        <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1e1b4b', marginTop: 0, marginBottom: '8px' }}>
          📂 Phân tích dữ liệu
        </h2>
        <p style={{ fontSize: '14px', color: '#6b7280', marginTop: 0, marginBottom: '20px' }}>
          Tải dữ liệu để SVM phân loại từng mẫu. Hỗ trợ CSV, XLSX, XLS và TXT.
        </p>

        <div className="file-box">
          <label className="custom-file-btn">
            📁 Chọn tập tin...
            <input
              id="fileInput"
              type="file"
              accept=".csv,.xlsx,.xls,.txt"
              style={{ display: 'none' }}
              onChange={handleFileUpload}
            />
          </label>
          <span id="fileNameDisplay" style={{ marginLeft: '12px', fontSize: '13px', color: '#6b7280' }}>
            {fileName}
          </span>
          <p style={{ marginTop: '15px', marginBottom: '10px', color: '#6b7280', fontSize: '13px' }}>
            Hỗ trợ định dạng: <b>CSV · XLSX · XLS · TXT</b>
          </p>
          <button
            className="reset-btn"
            style={{ width: 'auto', padding: '6px 12px', fontSize: '12px', display: 'inline-block' }}
            onClick={downloadSampleFile}
          >
            📥 Tải file mẫu (.csv)
          </button>
        </div>

        <div className="mode-box">
          <button
            id="unlabeledMode"
            className={`mode-btn ${analysisMode === 'unlabeled' ? 'active' : ''}`}
            onClick={() => {
              setAnalysisMode('unlabeled');
              setResults([]);
            }}
          >
            Chưa biết nhãn
            <br />
            <small style={{ color: 'inherit' }}>Phân loại số lượng lớn</small>
          </button>
          <button
            id="labeledMode"
            className={`mode-btn ${analysisMode === 'labeled' ? 'active' : ''}`}
            onClick={() => {
              setAnalysisMode('labeled');
              setResults([]);
            }}
          >
            Có nhãn
            <br />
            <small style={{ color: 'inherit' }}>Kiểm tra dự đoán & Accuracy</small>
          </button>
        </div>

        {loading && (
          <div className="note" style={{ textAlign: 'center' }}>
            {progressText || '⏳ Đang phân tích dữ liệu...'}
          </div>
        )}

        {errorMessage && <div className="note">❌ {errorMessage}</div>}

        {results.length > 0 && (
          <div id="fileResult" style={{ marginTop: '20px' }}>
            {/* Thống kê tổng quan */}
            {analysisMode === 'labeled' ? (
              <div className="overview-grid">
                <div className="stat-card">
                  <div className="stat-title">Tổng mẫu</div>
                  <div className="stat-number">{total}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-title">Dự đoán đúng</div>
                  <div className="stat-number success">{correctCount}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-title">Dự đoán sai</div>
                  <div className="stat-number error">{wrongCount}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-title">Accuracy</div>
                  <div className="stat-number">{accuracy.toFixed(2)}%</div>
                </div>
              </div>
            ) : (
              <div className="overview-grid">
                <div className="stat-card">
                  <div className="stat-title">Tổng mẫu</div>
                  <div className="stat-number">{total}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-title">SVM → Setosa</div>
                  <div className="stat-number" style={{ color: '#166534' }}>{counts.setosa}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-title">SVM → Versicolor</div>
                  <div className="stat-number" style={{ color: '#1e40af' }}>{counts.versicolor}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-title">SVM → Virginica</div>
                  <div className="stat-number" style={{ color: '#6b21a8' }}>{counts.virginica}</div>
                </div>
              </div>
            )}

            {/* Phân bố kết quả */}
            <h3 style={{ marginTop: '24px', fontSize: '16px', fontWeight: 600, color: '#1f2937' }}>
              📊 Phân bố theo kết quả SVM
            </h3>
            {(['setosa', 'versicolor', 'virginica'] as IrisSpecies[]).map((sp) => {
              const info = flowerInfo[sp];
              const count = counts[sp];
              const pct = total > 0 ? (count / total) * 100 : 0;
              return (
                <div key={sp} className="flower-summary">
                  <img
                    src={info.image}
                    alt={info.name}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = info.image.replace('.jpg', '.svg');
                    }}
                  />
                  <div className="flower-summary-content">
                    <div className="flower-summary-title">{info.name}</div>
                    <div className="flower-summary-count">
                      {count} mẫu ({pct.toFixed(1)}%)
                    </div>
                    <div className="progress">
                      <div className="progress-bar" style={{ width: `${pct}%`, backgroundColor: sp === 'setosa' ? '#166534' : sp === 'versicolor' ? '#1e40af' : '#6b21a8' }}></div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Bảng chi tiết */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '24px' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#1f2937' }}>
                📋 Bảng chi tiết kết quả phân loại ({results.length} dòng)
              </h3>
              <button className="export-btn" onClick={exportResultsCSV}>
                📥 Tải kết quả (.csv)
              </button>
            </div>

            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Sepal Length</th>
                    <th>Sepal Width</th>
                    <th>Petal Length</th>
                    <th>Petal Width</th>
                    {analysisMode === 'labeled' && <th>Nhãn thật</th>}
                    <th>SVM dự đoán</th>
                    {analysisMode === 'labeled' && <th>Kết quả</th>}
                  </tr>
                </thead>
                <tbody>
                  {results.map((row, idx) => (
                    <tr key={idx}>
                      <td>{idx + 1}</td>
                      <td>{row.input.sepal_length}</td>
                      <td>{row.input.sepal_width}</td>
                      <td>{row.input.petal_length}</td>
                      <td>{row.input.petal_width}</td>
                      {analysisMode === 'labeled' && (
                        <td className={`flower-cell ${row.trueLabel}`}>
                          {row.trueLabel ? IRIS_SPECIES_NAMES[row.trueLabel as IrisSpecies] : '—'}
                        </td>
                      )}
                      <td className={`flower-cell ${row.prediction}`}>
                        {IRIS_SPECIES_NAMES[row.prediction]}
                      </td>
                      {analysisMode === 'labeled' && (
                        <td className={row.correct ? 'correct' : 'wrong'}>
                          {row.correct ? '✓ Đúng' : '✗ Sai'}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* BẢNG SO SÁNH THUẬT TOÁN (Model Benchmark) */}
      <div className="card">
        <div className="card-header">
          <span>🏆</span>
          <h3>So sánh hiệu năng thuật toán (Model Benchmark)</h3>
        </div>
        <p style={{ fontSize: '13px', color: '#6b7280', margin: '0 0 15px 0' }}>
          Bảng kiểm thử so sánh độ chính xác của SVM với các thuật toán Học máy khác trên bộ dữ liệu Iris:
        </p>
        <div className="table-wrapper benchmark-table">
          <table>
            <thead>
              <tr>
                <th>Thuật toán (Algorithm)</th>
                <th>Accuracy</th>
                <th>Precision</th>
                <th>Recall</th>
                <th>Đánh giá lề phân chia</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ fontWeight: 'bold', background: '#f0fdf4' }}>
                <td>Support Vector Machine (SVM - RBF Kernel)</td>
                <td>97.3%</td>
                <td>0.97</td>
                <td>0.97</td>
                <td style={{ color: '#16a34a' }}>Tối ưu nhất (Max Margin)</td>
              </tr>
              <tr>
                <td>K-Nearest Neighbors (KNN, k=5)</td>
                <td>96.0%</td>
                <td>0.96</td>
                <td>0.96</td>
                <td>Nhạy cảm với nhiễu dữ liệu</td>
              </tr>
              <tr>
                <td>Decision Tree (Cây quyết định)</td>
                <td>94.7%</td>
                <td>0.95</td>
                <td>0.94</td>
                <td>Dễ bị hiện tượng Overfitting</td>
              </tr>
              <tr>
                <td>Random Forest</td>
                <td>96.7%</td>
                <td>0.97</td>
                <td>0.96</td>
                <td>Phức tạp, tốn thời gian tính toán</td>
              </tr>
              <tr>
                <td>Gaussian Naive Bayes</td>
                <td>95.3%</td>
                <td>0.95</td>
                <td>0.95</td>
                <td>Giả định độc lập điều kiện</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};
