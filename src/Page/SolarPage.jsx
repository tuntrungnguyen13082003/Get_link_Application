import React, { useState, useEffect } from 'react';
import { Camera, ChevronRight, ChevronLeft, Upload, RefreshCw, X, Loader } from 'lucide-react';
import JSZip from 'jszip';

// Import ảnh mẫu
import anhminhhoa1 from '../assets/Solar/Ref_1.jpg';
import anhminhhoa2 from '../assets/Solar/Ref_2.jpg';
import anhminhhoa3 from '../assets/Solar/Ref_3.jpg';
import anhminhhoa4 from '../assets/Solar/Ref_4.jpg';
import anhminhhoa5 from '../assets/Solar/Ref_5.jpg';
const SHEET_NAME = "SOLAR";
const REPORT_NAME = "SolarCheckListEvent";

const QUESTIONS = [
  { id: 1, title: "Ảnh tổng quan Inverter, Tủ AC Solar", desc: "Có bị chất đồ dễ gây cháy không?", refImage: anhminhhoa1 },
  { id: 2, title: "Ảnh các đầu MC4 ở tủ AC", desc: "Có bị biến dạng không? (Chảy nhựa,...)", refImage: anhminhhoa2 },
  { id: 3, title: "Ảnh các đầu MC4 ở Inverter", desc: "Có bị biến dạng không? (chảy nhựa,...)", refImage: anhminhhoa3 },
  { id: 4, title: "Ảnh mở cửa tủ AC Solar", desc: "Chụp ảnh trong tủ AC Solar", refImage: anhminhhoa4 },
  { id: 5, title: "Ảnh đấu nối Solar và tủ MSB Cửa hàng", desc: "Phần đấu nối có khả năng phát nhiệt không?", refImage: anhminhhoa5 },
];

const SolarPage = () => {
  return (
    <ChecklistApp
      sheetName="SOLAR" 
      reportName="SolarCheckListEvent" 
      questions={SOLAR_QUESTIONS} 
    />
  );
};

export default SolarPage;