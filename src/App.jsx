import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Import các trang
// LƯU Ý: Kiểm tra kỹ tên thư mục của bạn là 'Page' hay 'pages' nhé!
import AdminPage from './pages/AdminPage'; 
import SolarPage from './pages/SolarPage';
import SuCoPage from './pages/SuCoPage'; 

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/admin" replace />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/solar" element={<SolarPage />} />
        <Route path="/su-co" element={<SuCoPage />} />
        {/* -------------------------------- */}

        <Route path="*" element={<div className="p-10 text-center">404 - Trang không tồn tại</div>} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;