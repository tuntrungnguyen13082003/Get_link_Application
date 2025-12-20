import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Import các trang
import AdminPage from './Page/AdminPage';
import SolarPage from './Page/SolarPage';
import SuCoPage from './Page/SuCoPage'; // Khi nào làm xong file SuCoPage thì mở comment này ra

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Mặc định vào Admin */}
        <Route path="/" element={<Navigate to="/admin" replace />} />

        {/* Trang Admin: /admin */}
        <Route path="/admin" element={<AdminPage />} />

        {/* Trang Solar: /solar */}
        <Route path="/solar" element={<SolarPage />} />

        {/* Trang Sự Cố: /su-co */}
        <Route path="/su-co" element={<SuCoPage />} />

        {/* Trang lỗi 404 */}
        <Route path="*" element={<div className="p-10 text-center font-bold">404 - Trang không tồn tại</div>} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;