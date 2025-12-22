import React, { useState } from 'react';
import { Plus, Trash2, Save, Layout, Image as ImageIcon, CheckCircle, Sun, Zap, Droplet, Flame, FileText, Settings, Shield, Camera, Home, PenTool } from 'lucide-react';

const ICON_LIST = [ {n:'Sun',c:<Sun/>}, {n:'Zap',c:<Zap/>}, {n:'Droplet',c:<Droplet/>}, {n:'Flame',c:<Flame/>}, {n:'FileText',c:<FileText/>}, {n:'Settings',c:<Settings/>}, {n:'Shield',c:<Shield/>}, {n:'Camera',c:<Camera/>}, {n:'Home',c:<Home/>}, {n:'PenTool',c:<PenTool/>} ];

const AdminPage = () => {
  // --- ĐÃ SỬA: Xóa đoạn text thừa ở đầu link ---
  const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbw9LCBL0ahbD-M7ENyUymlIkd2ImYep6POzdX-Bbsqqi4MqetR0Pna3yB4TysBsYxYa7w/exec"; 
  
  const [isLoading, setIsLoading] = useState(false);
  
  // Form Data
  const [appId, setAppId] = useState("");
  const [appName, setAppName] = useState("");
  const [selectedIcon, setSelectedIcon] = useState("FileText");
  const [sheetName, setSheetName] = useState("");
  const [reportName, setReportName] = useState("");
  const [tabTitle, setTabTitle] = useState("");
  const [questions, setQuestions] = useState([{ id: 1, title: "", desc: "", imageFile: null, imagePreview: null }]);

  const addQuestion = () => setQuestions([...questions, { id: questions.length + 1, title: "", desc: "", imageFile: null, imagePreview: null }]);
  const removeQuestion = (idx) => setQuestions(questions.filter((_, i) => i !== idx));
  const handleQChange = (idx, field, val) => { const newQ = [...questions]; newQ[idx][field] = val; setQuestions(newQ); };
  
  const handleImageSelect = (idx, e) => {
    const file = e.target.files[0];
    if (file) { const newQ = [...questions]; newQ[idx].imageFile = file; newQ[idx].imagePreview = URL.createObjectURL(file); setQuestions(newQ); }
  };
  
  const fileToBase64 = (file) => new Promise((resolve) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result.split(',')[1]); reader.readAsDataURL(file); });

  // --- HÀM LƯU ĐÃ SỬA LẠI (QUAN TRỌNG) ---
  const handleSave = async () => {
    if(!appId || !appName || !sheetName || !reportName || !tabTitle) return alert("Điền đủ 5 thông tin cơ bản!");
    if(!window.confirm("Tạo ứng dụng này?")) return;
    
    setIsLoading(true);
    
    try {
      // BƯỚC 1: Upload từng ảnh một (Sử dụng vòng lặp for thay vì Promise.all)
      // Cách này chậm hơn xíu nhưng đảm bảo Google Script không bị quá tải
      const processedQuestions = [];

      for (const q of questions) {
        let imgUrl = null;
        
        // Nếu câu hỏi này có file ảnh thì thực hiện upload
        if(q.imageFile) {
          const base64 = await fileToBase64(q.imageFile);
          
          const res = await fetch(GOOGLE_SCRIPT_URL, {
            method: "POST",
            body: JSON.stringify({
              action: "upload_image",
              folderName: sheetName,
              folderType: "templates", // Lưu vào folder templates
              fileName: `Ref_Q${q.id}_${q.imageFile.name}`,
              mimeType: q.imageFile.type,
              base64: base64
            })
          }).then(r => r.json());
          
          if(res.status === 'success') {
            imgUrl = res.url;
          } else {
            console.error("Lỗi upload ảnh ở câu:", q.id);
          }
        }
        
        // Sau khi (có thể) upload xong, lưu kết quả vào mảng
        processedQuestions.push({ 
          id: q.id, 
          title: q.title, 
          desc: q.desc, 
          refImage: imgUrl ? [imgUrl] : (q.refImage || []) 
        });
      }

      // BƯỚC 2: Sau khi xử lý xong hết ảnh, mới gửi cấu hình App đi
      await fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        body: JSON.stringify({
          action: "save_app_config",
          id: appId, 
          name: appName, 
          icon: selectedIcon, 
          sheetName: sheetName, 
          reportName: reportName, 
          tabTitle: tabTitle,
          questions: processedQuestions
        })
      });

      alert("✅ Thành công! Ứng dụng đã được tạo.");
      
      // Reset form sau khi thành công
      setAppId(""); setAppName(""); setSheetName(""); setReportName(""); setTabTitle("");
      setQuestions([{id:1, title:"", desc:"", imageFile:null}]);
      
    } catch(err) { 
      alert("Lỗi: " + err.message + "\n(Hãy kiểm tra xem Google Script đã được Deploy chế độ 'Anyone' chưa)"); 
    } finally { 
      setIsLoading(false); 
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 font-sans">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow p-8">
        <h1 className="text-2xl font-bold mb-6 flex items-center gap-2"><Layout/> ADMIN PAGE</h1>
        
        {/* INPUTS */}
        <div className="grid md:grid-cols-2 gap-4 mb-8 bg-slate-50 p-4 rounded border">
           <div><label className="text-xs font-bold text-slate-500">ID (Link)</label><input className="border p-2 w-full rounded" value={appId} onChange={e=>setAppId(e.target.value)} placeholder="solar"/></div>
           <div><label className="text-xs font-bold text-slate-500">Sheet Name</label><input className="border p-2 w-full rounded uppercase" value={sheetName} onChange={e=>setSheetName(e.target.value)} placeholder="SOLAR_DATA"/></div>
           <div><label className="text-xs font-bold text-slate-500">Report Name</label><input className="border p-2 w-full rounded" value={reportName} onChange={e=>setReportName(e.target.value)} placeholder="Solar_Report"/></div>
           <div><label className="text-xs font-bold text-slate-500">Tab Title</label><input className="border p-2 w-full rounded" value={tabTitle} onChange={e=>setTabTitle(e.target.value)} placeholder="Kiểm tra Solar"/></div>
           <div className="md:col-span-2">
             <label className="text-xs font-bold text-slate-500">Tên App & Icon</label>
             <div className="flex gap-2">
               <input className="border p-2 flex-1 rounded font-bold" value={appName} onChange={e=>setAppName(e.target.value)} placeholder="Tên hiển thị"/>
               <div className="flex gap-1 border p-1 rounded bg-white">
                 {ICON_LIST.map(ic=><button key={ic.n} onClick={()=>setSelectedIcon(ic.n)} className={`p-2 rounded ${selectedIcon===ic.n?'bg-blue-600 text-white':''}`}>{ic.c}</button>)}
               </div>
             </div>
           </div>
        </div>

        {/* QUESTIONS */}
        <div className="space-y-4 mb-6">
          {questions.map((q, i) => (
            <div key={i} className="border p-4 rounded relative">
              <button onClick={()=>removeQuestion(i)} className="absolute top-2 right-2 text-red-500"><Trash2 size={16}/></button>
              <div className="font-bold text-blue-600 mb-2">Câu {i+1}