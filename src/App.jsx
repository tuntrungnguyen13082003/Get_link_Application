import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Import các trang
import AdminPage from './Page/AdminPage';
import ChecklistPage from './Page/ChecklistPage';
import NotFoundPage from './Page/NotFoundPage';

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/admin" replace />} />
        <Route path="/admin" element={<AdminPage />} />
        
        {/* DÒNG QUAN TRỌNG: :appId là biến động */}
        <Route path="/checklist/:appId" element={<ChecklistPage />} />

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
};
export default App;