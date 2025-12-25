  import React from 'react';
  import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';

  // Import các trang
  import AdminPage from './Page/AdminPage';
  import ChecklistPage from './Page/ChecklistPage';
  import NotFoundPage from './Page/NotFoundPage';

  const App = () => {
    return (
      <HashRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/Admin" replace />} />
          <Route path="/admin" element={<AdminPage />} />
          
          {/* DÒNG QUAN TRỌNG: :appId là biến động */}
          <Route path="/checklist/:appId" element={<ChecklistPage />} />

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </HashRouter>
    );
  };
  export default App;