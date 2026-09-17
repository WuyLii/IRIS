import React, { useState } from 'react';

interface VerifyModalProps {
  onVerified: () => void;
}

export const VerifyModal: React.FC<VerifyModalProps> = ({ onVerified }) => {
  const [selectedVerify, setSelectedVerify] = useState<boolean | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [message, setMessage] = useState<string>('');

  const images = [
    { src: 'images/setosa.jpg', isIris: true, type: 'img' },
    { emoji: '☕', isIris: false, type: 'emoji' },
    { src: 'images/versicolor.jpg', isIris: true, type: 'img' },
    { emoji: '🐱', isIris: false, type: 'emoji' },
    { emoji: '🍎', isIris: false, type: 'emoji' },
    { src: 'images/virginica.jpg', isIris: true, type: 'img' },
  ];

  const handleSelect = (index: number, isIris: boolean) => {
    setSelectedIndex(index);
    setSelectedVerify(isIris);
    setMessage('');
  };

  const handleVerify = () => {
    if (selectedVerify === null) {
      setMessage('Vui lòng chọn một hình ảnh.');
      return;
    }
    if (!selectedVerify) {
      setMessage('❌ Đây không phải hoa Iris. Vui lòng chọn lại.');
      return;
    }
    setMessage('✓ Xác minh thành công.');
    setTimeout(() => {
      onVerified();
    }, 400);
  };

  return (
    <div id="verifyScreen">
      <div className="verify-box">
        <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1e1b4b', marginBottom: '8px' }}>
          Xác minh người dùng
        </h2>
        <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>
          Chọn hình ảnh có hoa Iris để tiếp tục.
        </p>

        <div className="verify-images">
          {images.map((img, idx) => (
            <div
              key={idx}
              className={`verify-image ${selectedIndex === idx ? 'selected' : ''}`}
              onClick={() => handleSelect(idx, img.isIris)}
            >
              {img.type === 'img' ? (
                <img
                  src={img.src}
                  alt="Iris"
                  onError={(e) => {
                    // Fallback to svg if needed
                    if (img.src) {
                      (e.target as HTMLImageElement).src = img.src.replace('.jpg', '.svg');
                    }
                  }}
                />
              ) : (
                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '45px' }}>
                  {img.emoji}
                </div>
              )}
            </div>
          ))}
        </div>

        <button className="verify-btn" onClick={handleVerify}>
          Xác minh
        </button>
        <p id="verifyMessage" style={{ color: message.startsWith('✓') ? '#16a34a' : '#dc2626' }}>
          {message}
        </p>
      </div>
    </div>
  );
};
