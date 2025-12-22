import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronLeft, Camera, CheckCircle, Loader } from 'lucide-react';

const ChecklistPage = () => {
  const { appId } = useParams();
  const GOOGLE_SCRIPT_URL = "LINK_SCRIPT_CUA_BANhttps://script.google.com/macros/s/AKfycbw9LCBL0ahbD-M7ENyUymlIkd2ImYep6POzdX-Bbsqqi4MqetR0Pna3yB4TysBsYxYa7w/exec"; 

  const [appData, setAppData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState({}); 
  const [uploadingQ, setUploadingQ] = useState(null); 

  useEffect(() => {
    fetch(GOOGLE_SCRIPT_URL, { method: "POST", body: JSON.stringify({ action: "get_all_apps" }) })
    .then(r => r.json())
    .then(data => {
      if(data.status === 'success' && data.data[appId]) {
        setAppData(data.data[appId]);
        document.title = data.data[appId].tabTitle;
      }
      setLoading(false);
    });
  }, [appId]);

  const handleCapture = async (questionId, e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingQ(questionId);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        const base64 = reader.result.split(',')[1];
        const res = await fetch(GOOGLE_SCRIPT_URL, {
          method: "POST",
          body: JSON.stringify({
            action: "upload_image",
            folderName: appData.sheetName,
            folderType: "reports", // <--- QUAN TRỌNG: Lưu vào reports
            fileName: `Report_${new Date().getTime()}.jpg`,
            mimeType: file.type,
            base64: base64
          })
        }).then(r => r.json());

        if (res.status === 'success') setReports(prev => ({ ...prev, [questionId]: res.url }));
        setUploadingQ(null);
      };
    } catch (err) { alert("Lỗi: " + err.message); setUploadingQ(null); }
  };

  if(loading) return <div className="p-10 text-center">⏳ Đang tải...</div>;
  if(!appData) return <div className="p-10 text-center">❌ App không tồn tại</div>;

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-20">
      <div className="bg-white p-4 shadow-sm sticky top-0 z-10 flex items-center gap-4">
        <Link to="/" className="p-2 hover:bg-slate-100 rounded-full"><ChevronLeft/></Link>
        <div><h1 className="font-bold text-lg">{appData.name}</h1></div>
      </div>

      <div className="p-4 space-y-6">
        {appData.questions.map((q, i) => (
          <div key={q.id} className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
             <div className="flex justify-between items-start mb-2"><span className="bg-slate-100 text-slate-600 font-bold px-2 py-1 rounded text-xs">Câu {i+1}</span></div>
             <h3 className="font-bold text-slate-800 text-lg">{q.title}</h3>
             <p className="text-slate-500 text-sm mb-4">{q.desc}</p>

             {/* ẢNH MẪU */}
             {q.refImage && q.refImage.length > 0 && (
                <div className="mb-4 bg-blue-50 p-2 rounded border border-blue-100 flex gap-2 items-center">
                    <span className="text-xs font-bold text-blue-600">📷 MẪU:</span>
                    <img src={q.refImage[0]} className="h-16 w-16 object-cover rounded border bg-white"/>
                    <a href={q.refImage[0]} target="_blank" className="text-xs underline text-blue-500 ml-auto">Xem rõ</a>
                </div>
             )}

             {/* NÚT CHỤP ẢNH / KẾT QUẢ */}
             {reports[q.id] ? (
               <div className="mb-3 relative">
                 <img src={reports[q.id]} className="w-full h-48 object-cover rounded-lg border-2 border-green-500" />
                 <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full font-bold flex items-center gap-1"><CheckCircle size={12}/> Đã lưu</div>
                 <label className="block mt-2 text-center text-sm text-blue-600 underline cursor-pointer">Chụp lại <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => handleCapture(q.id, e)} /></label>
               </div>
             ) : (
               <label className={`w-full py-3 border-2 border-dashed rounded-lg flex items-center justify-center gap-2 font-bold cursor-pointer transition-all ${uploadingQ === q.id ? 'bg-slate-100' : 'hover:bg-blue-50'}`}>
                  {uploadingQ === q.id ? <><Loader className="animate-spin" size={20}/> Đang tải...</> : <><Camera size={20}/> Chụp ảnh</>}
                  <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => handleCapture(q.id, e)} disabled={uploadingQ === q.id}/>
               </label>
             )}
          </div>
        ))}
        <button className="w-full py-4 bg-green-600 text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 mt-8"><CheckCircle/> GỬI BÁO CÁO TỔNG</button>
      </div>
    </div>
  );
};
export default ChecklistPage;