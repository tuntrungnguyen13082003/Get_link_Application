import React, { useState, useEffect } from 'react';
import { Camera, ChevronRight, ChevronLeft, Upload, RefreshCw, X, Loader } from 'lucide-react';
import JSZip from 'jszip';

const ChecklistApp = ({ sheetName, name, questions }) => {
  const [currentStep, setCurrentStep] = useState(0); 
  const [userImages, setUserImages] = useState({});
  const [isUploading, setIsUploading] = useState(false);
  const [isCheckingCode, setIsCheckingCode] = useState(true); 
  const [sessionStatus, setSessionStatus] = useState("checking"); 
  const [realCode, setRealCode] = useState(""); 
  const [selectedImageForModal, setSelectedImageForModal] = useState(null);

  // THAY ĐỔI: Trỏ về cổng 3001 của Server thay vì Google
  const BACKEND_URL = import.meta.env.VITE_API_URL; 

const urlParts = window.location.href.split('code=');
const fakeTokenFromUrl = urlParts.length > 1 ? urlParts[1] : null; 

  // --- LOGIC KIỂM TRA MÃ TRÊN SERVER NỘI BỘ ---
  useEffect(() => {
const checkTokenStatus = async () => {
    console.log("Đang bắt đầu gọi Server..."); // Thêm dòng này

    try {
        // 2. GỬI YÊU CẦU: Tới server để kiểm tra 3 yếu tố
        const response = await fetch(`${BACKEND_URL}/check-status`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                token: fakeTokenFromUrl,
                sheetName: sheetName,
            })
        });

        const data = await response.json();

        // 3. XỬ LÝ KẾT QUẢ TỪ SERVER
        if (data.result === 'active') {
            // Trường hợp 1: Mọi thứ OK (Khớp Token, Khớp App, Status là Active)
            setSessionStatus("active");
            setRealCode(data.realCode);
        } else if (data.result === 'used') {
            // Trường hợp 2: Khớp Token, Khớp App nhưng Status là Used
            setSessionStatus("used");
        } else {
            // Trường hợp 3: Token không tồn tại hoặc sai App
            setSessionStatus("invalid");
        }
    } catch (error) {
        // Trường hợp 4: Lỗi kết nối (Server chưa bật hoặc sai cổng)
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

  // --- HÀM GỬI BÁO CÁO VỀ THƯ MỤC TRÊN SERVER ---
  const uploadReport = async () => {
      if (Object.keys(userImages).length === 0 && !window.confirm("Gửi báo cáo rỗng?")) return;
      setIsUploading(true);
      try {
        const now = new Date();
        
        // 1. Tạo chuỗi yyyymmdd
        const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
        
        // 2. Tạo chuỗi hhmmss (Giờ phút giây)
        const timeStr = `${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;
        
        const finalCode = String(realCode || "Unknown").trim(); 
        
        // 3. Ghép tên theo định dạng: yyyymmdd_hhmmss_TênFolder_MãCode
        const baseName = `${dateStr}${timeStr}_${sheetName}_${finalCode}`;
        const zipFileName = `${baseName}.zip`;
        
        const zip = new JSZip();
        // Folder bên trong Zip cũng dùng chung định dạng tên này
        const imgFolder = zip.folder(baseName);
        
        questions.forEach(q => {
          if (userImages[q.id]) {
              imgFolder.file(`${q.id}.jpg`, userImages[q.id].split(',')[1], { base64: true });
          }
        });
        
        const zipBlob = await zip.generateAsync({ type: "blob" });
        
        const formData = new FormData();
        formData.append('file', zipBlob, zipFileName);
        formData.append('appName', sheetName); 
        formData.append('token', fakeTokenFromUrl); 

        const response = await fetch(`${BACKEND_URL}/upload-report`, {
          method: "POST",
          body: formData 
        });

        const result = await response.json();
        if (result.status === 'success') {
            alert("✅ Báo cáo đã gửi và lưu về server thành công!");
            setSessionStatus("used");
        } else throw new Error(result.message);
      } catch (error) {
        alert("❌ Lỗi gửi báo cáo: " + error.message);
      } finally {
        setIsUploading(false);
      }
  };

  const handleNextOrSubmit = () => {
      const isLastStep = currentStep === questions.length - 1;
      if (isLastStep) uploadReport();
      else setCurrentStep(currentStep + 1);
  };

  // --- GIAO DIỆN (GIỮ NGUYÊN HOÀN TOÀN) ---
  if (isCheckingCode) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
         <Loader className="w-10 h-10 text-blue-600 animate-spin mb-4"/>
         <p className="text-gray-500 font-medium">Đang kiểm tra mã truy cập nội bộ...</p>
      </div>
    );
  }

  if (sessionStatus !== "active") {
      let message = "Mã truy cập không hợp lệ.";
      let subMsg = "Vui lòng liên hệ quản trị viên để lấy mã mới.";
      if (sessionStatus === "used") {
        message = "Mã này đã được sử dụng!";
        subMsg = "Báo cáo đã được lưu trữ an toàn trên hệ thống máy chủ.";
      } else if (sessionStatus === "error") {
        message = "Lỗi kết nối Server!";
        subMsg = "Vui lòng kiểm tra lại cổng 3001 hoặc liên hệ kỹ thuật.";
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

  const currentQ = questions[currentStep];
  const hasCaptured = !!userImages[currentQ.id];
  const isLastStep = currentStep === questions.length - 1;

return (
    <div className="min-h-screen bg-gray-100 font-sans text-gray-800 flex justify-center items-start pt-0 md:pt-10 pb-0 md:pb-10">
      {isUploading && (
        <div className="fixed inset-0 bg-black/80 z-[60] flex flex-col items-center justify-center text-white backdrop-blur-sm">
            <RefreshCw className="w-16 h-16 animate-spin mb-4 text-blue-400"/>
            <p className="text-xl font-bold">Đang lưu báo cáo về server...</p>
        </div>
      )}
      <div className="w-full max-w-md bg-white md:rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[100vh] md:h-[90vh] relative border border-gray-200">
        <div className="bg-white px-6 py-4 border-b border-gray-100 z-20">
            <div className="flex items-center justify-between mb-3">
                <h2 className="font-bold text-gray-800 text-lg whitespace-normal break-words flex-1 pr-2">
                    B{currentStep + 1}: {currentQ.title}
                </h2>
                <span className={`text-[10px] font-bold px-2 py-1 rounded-full whitespace-nowrap ${hasCaptured ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {hasCaptured ? 'Đã xong' : 'Chưa chụp'}
                </span>
            </div>
            <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-600 transition-all duration-500" style={{ width: `${((currentStep + 1) / questions.length) * 100}%` }}></div>
            </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                <p className="text-gray-700 text-sm mb-3 font-medium">{currentQ.desc}</p>
                <div className={`bg-gray-100 rounded-xl overflow-hidden border border-gray-200 relative group transition-all duration-500 ${
                        currentQ.hasPhoto === false ? 'h-96' : 'h-48'
                    }`}>
                    {Array.isArray(currentQ.refImage) ? (
                        <div className="flex w-full h-full gap-1">
                            {currentQ.refImage.map((img, index) => (
                                  <div 
                                      key={index} 
                                      className="flex-1 h-full relative cursor-pointer group/img"
                                      // 👇👇👇 THÊM DÒNG NÀY: Bấm vào thì set ảnh đó làm ảnh phóng to
                                      onClick={() => setSelectedImageForModal(img)}
                                  >
                                      <img src={img} alt={`Ref ${index}`} className="w-full h-full object-contain bg-gray-200 hover:scale-105 transition-transform duration-300" />
                                      <div className="absolute bottom-1 right-1 bg-black/40 text-white text-[9px] w-4 h-4 flex items-center justify-center rounded-full">{index + 1}</div>
                                  </div>
                              ))}
                        </div>
                    ) : (
                        currentQ.refImage ? (
                            <img src={currentQ.refImage} alt="Ref" className="w-full h-full object-contain bg-gray-200"/>
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">Chưa có ảnh mẫu</div>
                        )
                    )}
                </div>
                <p className="text-center text-xs text-gray-400 mt-2 italic">
                    {Array.isArray(currentQ.refImage) ? "Nhấn vào ảnh để xem rõ hơn" : "Ảnh mẫu tham khảo"}
                </p>
            </div>
            {currentQ.hasPhoto !== false && (
              <div className="flex flex-col gap-2">
                  <label className="block text-sm font-bold text-gray-700 ml-1">Ảnh thực tế:</label>
                  <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden shadow-sm bg-white border-2 border-dashed border-blue-200 hover:border-blue-400 transition-colors group">
                      {hasCaptured ? (
                          <>
                              <img src={userImages[currentQ.id]} alt="Captured" className="w-full h-full object-cover" />
                              {/* ... các nút Xóa ảnh giữ nguyên ... */}
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
          )}

        </div>
        <div className="bg-white p-4 border-t border-gray-200 z-30">
            <div className="flex gap-3">
            <button onClick={() => setCurrentStep(Math.max(0, currentStep - 1))} disabled={currentStep === 0 || isUploading} className="px-4 py-3 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30">
                <ChevronLeft size={24} />
            </button>
            <button onClick={handleNextOrSubmit} disabled={isUploading} className={`flex-1 py-3 rounded-xl font-bold text-white shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all ${isLastStep ? 'bg-green-600 hover:bg-green-700' : (hasCaptured || currentQ.hasPhoto === false ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-400')}`}>
                                                                                                                                                                                                                 {isLastStep ? (<><Upload size={20}/> HOÀN THÀNH</>) : ( (hasCaptured || currentQ.hasPhoto === false) ? <>Tiếp theo <ChevronRight size={20}/></> : <>Bỏ qua <ChevronRight size={20}/></>)}
            </button>
            </div>
        </div>
      </div>
      {/* ... (Phần code giao diện chính ở trên giữ nguyên) ... */}
      {selectedImageForModal && (
        // Lớp nền đen mờ, bấm vào nền cũng đóng modal
        <div 
            className="fixed inset-0 z-[70] bg-black/95 flex items-center justify-center p-2 md:p-8 animate-in fade-in duration-200 backdrop-blur-sm"
            onClick={() => setSelectedImageForModal(null)}
        >
            {/* Nút đóng (X) ở góc */}
            <button 
                onClick={() => setSelectedImageForModal(null)}
                className="absolute top-4 right-4 text-white/70 hover:text-white bg-white/10 hover:bg-white/30 rounded-full p-2 transition-all z-50"
            >
                <X size={32} />
            </button>

            {/* Ảnh lớn */}
            <img 
                src={selectedImageForModal} 
                alt="Full screen reference" 
                // Class giúp ảnh không bao giờ vượt quá màn hình, giữ đúng tỷ lệ
                className="max-w-full max-h-full object-contain rounded animate-in zoom-in-95 duration-200 shadow-2xl drop-shadow-2xl"
                // Chặn sự kiện click vào ảnh để không bị đóng modal nhầm
                onClick={(e) => e.stopPropagation()} 
            />
             <p className="absolute bottom-4 text-white/50 text-sm">Bấm ra ngoài hoặc nút X để đóng</p>
        </div>
      )}
    </div>
  );
};

export default ChecklistApp;