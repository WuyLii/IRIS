import React, { useState, useEffect } from 'react';
import { callSVM } from '../utils/api';
import { IRIS_SPECIES_NAMES } from '../data/irisData';
import { IrisSpecies, HistoryRecord } from '../types';

interface GuessPageProps {
  onSaveHistory: (record: Omit<HistoryRecord, 'id'>) => void;
}

export const GuessPage: React.FC<GuessPageProps> = ({ onSaveHistory }) => {
  const [currentGuessData, setCurrentGuessData] = useState<{
    sepal_length: number;
    sepal_width: number;
    petal_length: number;
    petal_width: number;
  }>({
    sepal_length: 5.8,
    sepal_width: 3.0,
    petal_length: 4.2,
    petal_width: 1.3,
  });

  const [selectedGuess, setSelectedGuess] = useState<IrisSpecies | ''>('');
  const [resultState, setResultState] = useState<{
    status: 'idle' | 'checking' | 'correct' | 'wrong' | 'error';
    userChoice?: IrisSpecies;
    svmPrediction?: IrisSpecies;
    explanation?: string;
  }>({ status: 'idle' });

  const randomValue = (min: number, max: number) => {
    return Math.round((Math.random() * (max - min) + min) * 10) / 10;
  };

  const generateRandomSample = () => {
    const sample = {
      sepal_length: randomValue(4.3, 7.9),
      sepal_width: randomValue(2.0, 4.4),
      petal_length: randomValue(1.0, 6.9),
      petal_width: randomValue(0.1, 2.5),
    };
    setCurrentGuessData(sample);
    setSelectedGuess('');
    setResultState({ status: 'idle' });
  };

  useEffect(() => {
    generateRandomSample();
  }, []);

  const handleCheckGuess = async () => {
    if (!selectedGuess) {
      alert('Vui lòng chọn một loài hoa trước khi kiểm tra!');
      return;
    }

    setResultState({ status: 'checking' });

    try {
      const svmRes = await callSVM(currentGuessData);
      const prediction = svmRes.species;

      let reasonText = '';
      const pl = currentGuessData.petal_length;
      if (pl < 2.5) {
        reasonText = `Lý do: Cánh hoa chỉ dài ${pl}cm (< 2.5cm) nên nằm hoàn toàn trong vùng thuộc tính của loài Iris Setosa.`;
      } else if (pl >= 2.5 && pl <= 4.8) {
        reasonText = `Lý do: Kích thước cánh hoa ${pl}cm thuộc vùng siêu phẳng phân chia của Iris Versicolor.`;
      } else {
        reasonText = `Lý do: Cánh hoa dài ${pl}cm (> 4.8cm) vượt qua ranh giới sang không gian của loài Iris Virginica.`;
      }

      const isCorrect = selectedGuess === prediction;

      setResultState({
        status: isCorrect ? 'correct' : 'wrong',
        userChoice: selectedGuess,
        svmPrediction: prediction,
        explanation: reasonText,
      });

      // Ghi nhận lịch sử
      const now = new Date();
      const timeStr = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()} - ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

      onSaveHistory({
        timestamp: timeStr,
        sepal_length: currentGuessData.sepal_length,
        sepal_width: currentGuessData.sepal_width,
        petal_length: currentGuessData.petal_length,
        petal_width: currentGuessData.petal_width,
        prediction: prediction,
        confidence: svmRes.confidence,
        method: 'Bạn đoán trước SVM',
      });
    } catch (err) {
      setResultState({ status: 'error' });
    }
  };

  return (
    <section id="guessPage" className="page active">
      <div className="card">
        <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1e1b4b', marginTop: 0, marginBottom: '8px' }}>
          🧠 Bạn đoán trước SVM
        </h2>
        <p style={{ fontSize: '14px', color: '#6b7280', marginTop: 0, marginBottom: '20px' }}>
          Hệ thống tạo một bộ thông số ngẫu nhiên. Hãy xem thông số và đoán loài hoa trước khi SVM kiểm tra.
        </p>

        <div className="guess-current">
          <h3 style={{ marginTop: 0, fontSize: '16px', fontWeight: 600, color: '#1f2937' }}>
            Thông số mẫu ngẫu nhiên
          </h3>
          <div className="predict-grid" style={{ gridTemplateColumns: '1fr 1fr', marginBottom: '15px' }}>
            <div><b>Sepal Length:</b> <span>{currentGuessData.sepal_length}</span> cm</div>
            <div><b>Sepal Width:</b> <span>{currentGuessData.sepal_width}</span> cm</div>
            <div><b>Petal Length:</b> <span>{currentGuessData.petal_length}</span> cm</div>
            <div><b>Petal Width:</b> <span>{currentGuessData.petal_width}</span> cm</div>
          </div>
          <button
            className="reset-btn"
            style={{ width: 'auto', padding: '8px 16px', fontWeight: 500 }}
            onClick={generateRandomSample}
          >
            🔄 Tạo thông số ngẫu nhiên khác
          </button>
        </div>

        <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#374151', margin: '20px 0 10px 0' }}>
          Bạn dự đoán đây là loài hoa nào:
        </h3>
        <div className="guess-options">
          <button
            className={selectedGuess === 'setosa' ? 'selected' : ''}
            onClick={() => setSelectedGuess('setosa')}
          >
            <img
              src="images/setosa.jpg"
              alt="Setosa"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'images/setosa.svg';
              }}
            />
            Setosa
          </button>
          <button
            className={selectedGuess === 'versicolor' ? 'selected' : ''}
            onClick={() => setSelectedGuess('versicolor')}
          >
            <img
              src="images/versicolor.jpg"
              alt="Versicolor"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'images/versicolor.svg';
              }}
            />
            Versicolor
          </button>
          <button
            className={selectedGuess === 'virginica' ? 'selected' : ''}
            onClick={() => setSelectedGuess('virginica')}
          >
            <img
              src="images/virginica.jpg"
              alt="Virginica"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'images/virginica.svg';
              }}
            />
            Virginica
          </button>
        </div>

        <button
          id="guessBtn"
          className="main-btn"
          onClick={handleCheckGuess}
          disabled={resultState.status === 'checking'}
        >
          {resultState.status === 'checking' ? '⏳ Đang để SVM kiểm tra...' : 'Để SVM kiểm tra'}
        </button>

        <div id="guessResult" className={resultState.status === 'correct' ? 'result-correct' : resultState.status === 'wrong' ? 'result-wrong' : ''}>
          {resultState.status === 'idle' && 'Chưa có kết quả. Vui lòng chọn loài và bấm "Để SVM kiểm tra".'}
          {resultState.status === 'checking' && 'Đang gửi thông số đến mô hình SVM...'}
          {resultState.status === 'error' && '❌ Lỗi kết nối mô hình. Vui lòng thử lại.'}
          {resultState.status === 'correct' && (
            <div>
              <b>🎉 Đúng rồi! Bạn đoán rất chuẩn!</b>
              <br />
              Bạn chọn: <b>{resultState.userChoice && IRIS_SPECIES_NAMES[resultState.userChoice]}</b>
              <br />
              SVM dự đoán: <b>{resultState.svmPrediction && IRIS_SPECIES_NAMES[resultState.svmPrediction]}</b>
              <div className="explanation-box">
                💡 <b>Phân tích mô hình:</b> {resultState.explanation}
              </div>
            </div>
          )}
          {resultState.status === 'wrong' && (
            <div>
              <b>❌ Chưa đúng. Đừng nản lòng!</b>
              <br />
              Bạn chọn: <b>{resultState.userChoice && IRIS_SPECIES_NAMES[resultState.userChoice]}</b>
              <br />
              SVM dự đoán: <b>{resultState.svmPrediction && IRIS_SPECIES_NAMES[resultState.svmPrediction]}</b>
              <div className="explanation-box">
                💡 <b>Giải thích lý do:</b> {resultState.explanation}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
