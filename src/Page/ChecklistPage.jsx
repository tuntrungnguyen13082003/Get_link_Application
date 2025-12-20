import React from 'react';
import { useParams, Navigate } from 'react-router-dom';
import ChecklistApp from '../components/ChecklistApp';

import anhminhhoa1 from '../assets/Solar/Ref_1.jpg';
import anhminhhoa2 from '../assets/Solar/Ref_2.jpg';
import anhminhhoa3 from '../assets/Solar/Ref_3.jpg';
import anhminhhoa4 from '../assets/Solar/Ref_4.jpg';
import anhminhhoa5 from '../assets/Solar/Ref_5.jpg';
// --- PHẦN 1: KHO DỮ LIỆU (CONFIG) ---
// Bạn gom hết cấu hình Solar, Sự Cố vào đây
// Lưu ý: Export nó ra để AdminPage còn lấy được tên và link
export const APP_DATA = {
  
  // 1. Cấu hình SOLAR
  solar: {
    id: 'solar', // ID này phải trùng với key của object
    name: '📸 Báo cáo Solar',
    sheetName: 'SOLAR',
    reportName: 'SolarCheckListEvent',
    // Mẹo: Nếu lười import ảnh, bạn có thể để ảnh trong thư mục public và điền đường dẫn string như này: "/images/solar/ref1.jpg"
    // Hoặc nếu muốn import thì viết import ở đầu file rồi điền biến vào đây như cũ.
    questions: [
       { id: 1, title: "Ảnh tổng quan Inverter, Tủ AC Solar", desc: "Có bị chất đồ dễ gây cháy không?", refImage: [anhminhhoa1, anhminhhoa2] },
       { id: 2, title: "Ảnh các đầu MC4 ở tủ AC", desc: "Có bị biến dạng không? (Chảy nhựa,...)", refImage: [anhminhhoa2] },
       { id: 3, title: "Ảnh các đầu MC4 ở Inverter", desc: "Có bị biến dạng không? (chảy nhựa,...)", refImage: [anhminhhoa3] },
       { id: 4, title: "Ảnh mở cửa tủ AC Solar", desc: "Chụp ảnh trong tủ AC Solar", refImage: [anhminhhoa4] },
       { id: 5, title: "Ảnh đấu nối Solar và tủ MSB Cửa hàng", desc: "Phần đấu nối có khả năng phát nhiệt không?", refImage: [anhminhhoa5] },
    ]
  },

  // 2. Cấu hình SỰ CỐ
  su_co: {
    id: 'su_co',
    name: '⚠️ Báo cáo Sự Cố',
    sheetName: 'SU_CO',
    reportName: 'Process_Problem',
    questions: [
       { id: 1, title: "Ảnh tổng quan Inverter, Tủ AC Solar", desc: "Có bị chất đồ dễ gây cháy không?", refImage: anhminhhoa1 },
       { id: 2, title: "Ảnh các đầu MC4 ở tủ AC", desc: "Có bị biến dạng không? (Chảy nhựa,...)", refImage: anhminhhoa2 },
       { id: 3, title: "Ảnh các đầu MC4 ở Inverter", desc: "Có bị biến dạng không? (chảy nhựa,...)", refImage: anhminhhoa3 },
    ]
  },

  // 3.Thêm Ứng dụng: Copy paste vào đây.
};

// --- PHẦN 2: COMPONENT HIỂN THỊ (LOGIC) ---
const ReportPage = () => {
  const { appId } = useParams(); // Lấy chữ "solar" hoặc "su_co" trên thanh địa chỉ
  
  const currentApp = APP_DATA[appId]; // Tìm trong kho dữ liệu xem có không

  // Nếu khách gõ link linh tinh (vd: /report/tinh-yeu) -> Đá về trang 404
  if (!currentApp) {
    return <Navigate to="/404" replace />;
  }

  // Nếu tìm thấy -> Hiển thị ChecklistApp với dữ liệu tương ứng
  return (
    <ChecklistApp
      sheetName={currentApp.sheetName}
      reportName={currentApp.reportName}
      questions={currentApp.questions}
    />
  );
};

export default ReportPage;