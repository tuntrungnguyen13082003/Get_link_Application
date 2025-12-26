import React, { useState, useEffect } from 'react';
import ChecklistRouter from '../components/ChecklistRouter';

const ChecklistPage = () => {
  const [data, setData] = useState(null);
  const BACKEND_URL = import.meta.env.VITE_API_URL;
  useEffect(() => {
    // Gọi API lấy danh sách ứng dụng
    fetch(`${BACKEND_URL}/apps`)
      .then(res => res.json())
      .then(json => {
        // Chuyển đổi từ Mảng [] sang Object {} để khớp với logic cũ
        const dataObj = {};
        if (json.data) json.data.forEach(app => dataObj[app.sheetName] = app);
        setData(dataObj);
      })
      .catch(err => console.error("Lỗi tải data:", err));
  }, []);

  // Nếu chưa tải xong thì hiện màn hình trắng hoặc chữ Loading
  if (!data) return <div className="p-10 text-center">⏳ Đang tải cấu hình...</div>;

  // Tải xong thì ném vào Router như cũ
  return <ChecklistRouter data={data} />;
};

export default ChecklistPage;