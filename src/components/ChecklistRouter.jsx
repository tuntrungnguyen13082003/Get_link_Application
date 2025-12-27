// src/components/ChecklistRouter.jsx
import React, { useEffect } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import ChecklistApp from './ChecklistApp'; // Gọi tiếp ông cháu ChecklistApp

// Component này nhận vào 1 props duy nhất: data (chính là APP_DATA)
const ChecklistRouter = ({ data }) => {
  const { appId } = useParams(); // Lấy id từ URL
  const currentApp = data[appId]; // Soi vào kho dữ liệu

  // 1. Logic đổi tên Tab
  useEffect(() => {
    if (currentApp) {
      document.title = currentApp.name;
    }
    return () => { document.title = "App Báo Cáo"; };
  }, [currentApp]);

  // 2. Logic chặn lỗi 404
  if (!currentApp) {
    return <Navigate to="/404" replace />;
  }

  // 3. Logic hiển thị App
  return (
    <ChecklistApp
      sheetName={currentApp.sheetName}
      name={currentApp.name}
      questions={currentApp.questions}
    />
  );
};

export default ChecklistRouter;