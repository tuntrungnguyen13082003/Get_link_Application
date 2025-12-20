// src/components/ChecklistApp.jsx
import React, { useState, useEffect } from 'react';
import { Camera, ChevronRight, ChevronLeft, Upload, RefreshCw, X, Loader } from 'lucide-react';
import JSZip from 'jszip';

// Component này nhận vào 3 tham số quan trọng:
// 1. sheetName: Tên sheet cần check (SOLAR, SU_CO...)
// 2. reportName: Tiền tố tên file báo cáo (SolarCheckListEvent...)
// 3. questions: Danh sách câu hỏi và ảnh mẫu
const ChecklistApp = ({ sheetName, reportName, questions }) => {
  
  const [currentStep, setCurrentStep] = useState(0); 
  const [userImages, setUserImages] = useState({});
  const [isUploading, setIsUploading] = useState(false);
  const [isCheckingCode, setIsCheckingCode] = useState(true); 
  const [sessionStatus, setSessionStatus] = useState("checking"); 
  const [realCode, setRealCode] = useState(""); 

  // URL Script (Dùng chung cho cả hệ thống)
  const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxiHfxLHOBwADHixZk5QerQFVyPFNqwfXqqfwAoskYMdjQs97pON-K-mVA-EjiNRWbeVA/exec"; 

  const queryParams = new URLSearchParams(window.location.search);
  const fakeTokenFromUrl = queryParams.get("code"); 

  // --- LOGIC GIỮ NGUYÊN (Chỉ thay biến thành props) ---
  useEffect(() => {
    const checkTokenStatus = async () => {
      if (!fakeTokenFromUrl) {
        setSessionStatus("invalid"); setIsCheckingCode(false); return;
      }
      try {
        const response = await fetch(GOOGLE_SCRIPT_URL, {
          method: "POST",
          body: JSON.stringify({
             action: "check_status", 
             token: fakeTokenFromUrl, 
             sheet_name: sheetName // <--- Dùng props
          })
        });
        const data = await response.json();
        setSessionStatus(data.result); 
        if (data.realCode) setRealCode(data.realCode);
      } catch (error) {
        setSessionStatus("error");
      } finally {
        setIsCheckingCode(false);
      }
    };
    checkTokenStatus();
  }, [fakeTokenFromUrl, sheetName]);

  const handleImageCapture = (e, questionId) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => setUserImages(prev => ({ ...prev, [questionId]: event.target.result }));
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  const removeImage = (questionId) => {
    if (window.confirm("Xóa ảnh này?")) {
      const newImages = { ...userImages };
      delete newImages[questionId];
      setUserImages(newImages);
    }
  };

  const uploadReport = async () => {
    if (Object.keys(userImages).length === 0 && !window.confirm("Gửi báo cáo rỗng?")) return;
    setIsUploading(true);
    try {
      const now = new Date();
      const datePrefix = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
      const finalCode = (realCode || "Unknown").trim(); 
      // Dùng props reportName
      const zipFileName = `${datePrefix}_${reportName}_${finalCode}.zip`;
      
      const zip = new JSZip();
      const imgFolder = zip.folder(`${reportName}_${finalCode}`);
      
      // Dùng props questions
      questions.forEach(q => {
        if (userImages[q.id]) imgFolder.file(`${q.id}.jpg`, userImages[q.id].split(',')[1], { base64: true });
      });
      const content = await zip.generateAsync({ type: "base64" });
      
      const response = await fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        body: JSON.stringify({
            filename: zipFileName, 
            fileData: content,
            token: finalCode, 
            sheet_name: sheetName // <--- Dùng props
        })
      });

      const result = await response.json();
      if (result.status === 'success') {
          alert("✅ Báo cáo đã gửi thành công!");
          setSessionStatus("used");
      } else throw new Error(result.message);
    } catch (error) {
      alert("❌ Lỗi: " + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleNextOrSubmit = () => {
      // Dùng props questions.length
      const isLastStep = currentStep === questions.length - 1;
      if (isLastStep) uploadReport();
      else setCurrentStep(currentStep + 1);
  };

  // --- GIAO DIỆN ---
  if (isCheckingCode) return <div className="min-h-screen flex items-center justify-center"><Loader className="animate-spin text-blue-600 w-10 h-10"/></div>;
  
  if (sessionStatus !== "active") {
      let msg = sessionStatus === "used" ? "Mã này đã sử dụng!" : "Mã không hợp lệ!";
      return <div className="min-h-screen flex items-center justify-center text-red-500 font-bold text-xl">{msg}</div>;
  }

  // Dùng props questions
  const currentQ = questions[currentStep];
  const hasCaptured = !!userImages[currentQ.id];
  const isLastStep = currentStep === questions.length - 1;

  return (
    <div className="min-h-screen bg-gray-100 font-sans text-gray-800 flex justify-center items-start pt-0 md:pt-10 pb-0 md:pb-10">
      {isUploading && <div className="fixed inset-0 bg-black/80 z-50 flex flex-col items-center justify-center text-white"><RefreshCw className="animate-spin mb-2"/>Sending...</div>}
      
      <div className="w-full max-w-md bg-white md:rounded-3xl shadow-2xl flex flex-col h-[100vh] md:h-[90vh] overflow-hidden border border-gray-200">
        {/* HEADER */}
        <div className="bg-white px-6 py-4 border-b">
            <h2 className="font-bold text-lg truncate">Câu {currentStep + 1}: {currentQ.title}</h2>
            <div className="w-full h-1 bg-gray-100 mt-2"><div className="h-full bg-blue-600 transition-all" style={{ width: `${((currentStep + 1) / questions.length) * 100}%` }}></div></div>
        </div>

        {/* BODY */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            <div className="bg-white p-4 rounded-xl shadow-sm">
                <p className="mb-2">{currentQ.desc}</p>
                <img src={currentQ.refImage} className="w-full h-40 object-contain bg-gray-100 rounded"/>
            </div>
            
            <div className="relative w-full aspect-[4/3] bg-white border-2 border-dashed border-blue-300 rounded-xl overflow-hidden">
                {hasCaptured ? (
                    <>
                        <img src={userImages[currentQ.id]} className="w-full h-full object-cover"/>
                        <button onClick={() => removeImage(currentQ.id)} className="absolute top-2 right-2 bg-white p-1 rounded-full text-red-500"><X/></button>
                    </>
                ) : (
                    <label className="flex flex-col items-center justify-center h-full cursor-pointer">
                        <Camera size={32} className="text-blue-500 mb-2"/>
                        <span className="text-blue-600 font-bold">Chụp ảnh</span>
                        <input type="file" accept="image/*" capture="environment" onChange={(e) => handleImageCapture(e, currentQ.id)} className="hidden"/>
                    </label>
                )}
            </div>
        </div>

        {/* FOOTER */}
        <div className="p-4 border-t flex gap-3">
            <button onClick={() => setCurrentStep(Math.max(0, currentStep - 1))} disabled={currentStep === 0} className="p-3 rounded-xl border"><ChevronLeft/></button>
            <button onClick={handleNextOrSubmit} className="flex-1 bg-blue-600 text-white font-bold rounded-xl py-3 flex items-center justify-center gap-2">
                {isLastStep ? <><Upload size={20}/> Gửi báo cáo</> : <>Tiếp theo <ChevronRight size={20}/></>}
            </button>
        </div>
      </div>
    </div>
  );
};

export default ChecklistApp;