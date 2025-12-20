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
  // --- MÀN HÌNH CHỜ (LOADING) ---
  if (isCheckingCode) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
         <Loader className="w-10 h-10 text-blue-600 animate-spin mb-4"/>
         <p className="text-gray-500 font-medium">Đang kiểm tra mã truy cập...</p>
      </div>
    );
  }

  // --- MÀN HÌNH CHẶN (NẾU MÃ SAI HOẶC ĐÃ DÙNG) ---
  if (sessionStatus !== "active") {
      let message = "Mã truy cập không hợp lệ.";
      let subMsg = "Vui lòng liên hệ quản trị viên để lấy mã mới.";
      
      if (sessionStatus === "used") {
        message = "Mã này đã được sử dụng!";
        subMsg = "Báo cáo cho mã này đã được gửi thành công trước đó.";
      } else if (sessionStatus === "error") {
        message = "Lỗi kết nối máy chủ!";
        subMsg = "Vui lòng kiểm tra internet và thử lại.";
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4 font-sans">
            <div className="bg-white p-8 rounded-2xl shadow-xl max-w-sm text-center border border-gray-200">
                <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-100">
                    <X size={32} />
                </div>
                <h2 className="text-xl font-bold text-gray-800 mb-2">{message}</h2>
                <p className="text-gray-500 text-sm">{subMsg}</p>
            </div>
        </div>
      );
  }

  // --- GIAO DIỆN CHÍNH (CHỈ HIỆN KHI status === "active") ---
  const currentQ = QUESTIONS[currentStep];
  const hasCaptured = !!userImages[currentQ.id];
  const isLastStep = currentStep === QUESTIONS.length - 1;

  return (
    <div className="min-h-screen bg-gray-100 font-sans text-gray-800 flex justify-center items-start pt-0 md:pt-10 pb-0 md:pb-10">
      
      {isUploading && (
        <div className="fixed inset-0 bg-black/80 z-[60] flex flex-col items-center justify-center text-white backdrop-blur-sm">
            <RefreshCw className="w-16 h-16 animate-spin mb-4 text-blue-400"/>
            <p className="text-xl font-bold">Đang gửi báo cáo...</p>
        </div>
      )}

      <div className="w-full max-w-md bg-white md:rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[100vh] md:h-[90vh] relative border border-gray-200">
        
        <div className="bg-white px-6 py-4 border-b border-gray-100 z-20">
            <div className="flex items-center justify-between mb-3">
                <h2 className="font-bold text-gray-800 text-lg truncate pr-2">
                    Câu {currentStep + 1}: {currentQ.title}
                </h2>
                <span className={`text-[10px] font-bold px-2 py-1 rounded-full whitespace-nowrap ${hasCaptured ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {hasCaptured ? 'Đã xong' : 'Chưa chụp'}
                </span>
            </div>
            <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-600 transition-all duration-500" style={{ width: `${((currentStep + 1) / QUESTIONS.length) * 100}%` }}></div>
            </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                <p className="text-gray-700 text-sm mb-3 font-medium">{currentQ.desc}</p>
                <div className="bg-gray-100 rounded-xl overflow-hidden border border-gray-200">
                     <img src={currentQ.refImage} alt="Ref" className="w-full h-48 object-contain bg-gray-200"/>
                </div>
                <p className="text-center text-xs text-gray-400 mt-2 italic">Ảnh mẫu tham khảo</p>
            </div>

            <div className="flex flex-col gap-2">
                <label className="block text-sm font-bold text-gray-700 ml-1">Ảnh thực tế:</label>
                <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden shadow-sm bg-white border-2 border-dashed border-blue-200 hover:border-blue-400 transition-colors group">
                    
                    {hasCaptured ? (
                        <>
                            <img src={userImages[currentQ.id]} alt="Captured" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/10"></div>
                            <button onClick={() => removeImage(currentQ.id)} className="absolute top-2 right-2 bg-white/90 text-red-500 p-2 rounded-full shadow-lg hover:bg-red-500 hover:text-white transition-all">
                                <X size={20} />
                            </button>
                            <div className="absolute bottom-2 left-2 bg-green-500 text-white text-[10px] font-bold px-2 py-1 rounded shadow">ĐÃ LƯU</div>
                        </>
                    ) : (
                        <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer">
                            <div className="bg-blue-50 p-4 rounded-full mb-2 group-hover:scale-110 transition-transform">
                                <Camera size={32} className="text-blue-500" />
                            </div>
                            <span className="font-bold text-blue-600 text-sm">Bấm để chụp ảnh</span>
                            <input type="file" accept="image/*" capture="environment" onChange={(e) => handleImageCapture(e, currentQ.id)} className="hidden" />
                        </label>
                    )}
                </div>
            </div>
        </div>

        <div className="bg-white p-4 border-t border-gray-200 z-30">
            <div className="flex gap-3">
            <button onClick={() => setCurrentStep(Math.max(0, currentStep - 1))} disabled={currentStep === 0 || isUploading} className="px-4 py-3 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30">
                <ChevronLeft size={24} />
            </button>
            
            <button onClick={handleNextOrSubmit} disabled={isUploading} className={`flex-1 py-3 rounded-xl font-bold text-white shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all ${isLastStep ? 'bg-green-600 hover:bg-green-700' : (hasCaptured ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-400')}`}>
                {isLastStep ? <><Upload size={20}/> GỬI BÁO CÁO</> : (hasCaptured ? <>Tiếp theo <ChevronRight size={20}/></> : <>Bỏ qua <ChevronRight size={20}/></>)}
            </button>
            </div>
        </div>

      </div>
    </div>
  );
};

export default ChecklistApp;