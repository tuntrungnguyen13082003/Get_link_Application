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
      // 1. Chuyển đổi từ Mảng [] sang Object {} để khớp với logic cũ
      const dataObj = {};
      if (json.data) {
        json.data.forEach(app => dataObj[app.sheetName] = app);
        
        // 2. TÌM APP HIỆN TẠI ĐỂ ĐỔI TIÊU ĐỀ TAB
        // Giả sử biến 'sheetName' bạn lấy từ useParams() ở phía trên
        const currentApp = dataObj[sheetName]; 
        if (currentApp) {
          // Ưu tiên tabTitle, không có thì dùng name, cuối cùng là mặc định
          document.title = currentApp.tabTitle || currentApp.name;
        }
      }
      setData(dataObj);
    })
    .catch(err => console.error("Lỗi tải data:", err));
}, [sheetName]); // Thêm [sheetName] vào đây để nó cập nhật khi đổi App

  // Nếu chưa tải xong thì hiện màn hình trắng hoặc chữ Loading
  if (!data) return <div className="p-10 text-center">⏳ Đang tải cấu hình...</div>;

  // Tải xong thì ném vào Router như cũ
  return <ChecklistRouter data={data} />;
};

export default ChecklistPage;