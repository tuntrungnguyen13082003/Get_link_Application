import React from 'react';
import ChecklistApp from '../components/ChecklistApp';

// Import ảnh mẫu
import anhminhhoa1 from '../assets/Solar/Ref_1.jpg';
import anhminhhoa2 from '../assets/Solar/Ref_2.jpg';
import anhminhhoa3 from '../assets/Solar/Ref_3.jpg';

const SHEET_NAME = "SU_CO";
const REPORT_NAME = "Process_Problem";

const QUESTIONS = [
  { id: 1, title: "Ảnh tổng quan Inverter, Tủ AC Solar", desc: "Có bị chất đồ dễ gây cháy không?", refImage: anhminhhoa1 },
  { id: 2, title: "Ảnh các đầu MC4 ở tủ AC", desc: "Có bị biến dạng không? (Chảy nhựa,...)", refImage: anhminhhoa2 },
  { id: 3, title: "Ảnh các đầu MC4 ở Inverter", desc: "Có bị biến dạng không? (chảy nhựa,...)", refImage: anhminhhoa3 },
];

const SuCoPage = () => {
  return (
    <ChecklistApp
      sheetName={SHEET_NAME}
      reportName={REPORT_NAME}
      questions={QUESTIONS}
    />
  );
};
export default SuCoPage;