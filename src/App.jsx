import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import HomePage from './Page/HomePage';
import ChecklistPage from './Page/ChecklistPage';
import AdminPage from './Page/AdminPage';

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* 1. TRANG CHỦ (Mặc định) -> Giờ sẽ là trang ADMIN */}
        <Route path="/" element={<AdminPage />} />

        {/* 2. Trang làm bài (Giữ nguyên) */}
        <Route path="/checklist/:appId" element={<ChecklistPage />} />
        
        {/* 3. Trang Admin (Giữ thêm đường dẫn này để gõ /admin cũng vào được) */}
        <Route path="/admin" element={<AdminPage />} />

        {/* 4. [TÙY CHỌN] Danh sách công việc cũ */}
        {/* Nếu muốn xem danh sách việc cho nhân viên, giờ phải vào link /jobs */}
        <Route path="/jobs" element={<HomePage />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;