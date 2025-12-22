import React, { useState, useEffect } from 'react';
import { 
  Layout, Image as ImageIcon, CheckCircle, Plus, Trash2, 
  Link as LinkIcon, LogIn, Save, RefreshCw, UserPlus, Key, Users,
  Sun, Zap, Droplet, Flame, FileText, Settings, Shield, Camera, Home, PenTool
} from 'lucide-react';

const ICON_LIST = [ {n:'Sun',c:<Sun/>}, {n:'Zap',c:<Zap/>}, {n:'Droplet',c:<Droplet/>}, {n:'Flame',c:<Flame/>}, {n:'FileText',c:<FileText/>}, {n:'Settings',c:<Settings/>}, {n:'Shield',c:<Shield/>}, {n:'Camera',c:<Camera/>}, {n:'Home',c:<Home/>}, {n:'PenTool',c:<PenTool/>} ];

const AdminPage = () => {
  // --- THAY LINK SCRIPT CỦA BẠN VÀO ĐÂY ---
  const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbw9LCBL0ahbD-M7ENyUymlIkd2ImYep6POzdX-Bbsqqi4MqetR0Pna3yB4TysBsYxYa7w/exec"; 

  // STATE CHUNG
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState("");
  const [activeTab, setActiveTab] = useState("create_link"); // 3 Tabs: 'create_link', 'create_app', 'manage_user'
  const [loading, setLoading] = useState(false);
  const [appList, setAppList] = useState([]); // Danh sách App để chọn tạo link

  // STATE LOGIN
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  // STATE TAB 1: TẠO LINK
  const [selectedAppId, setSelectedAppId] = useState("");
  const [linkCode, setLinkCode] = useState("");
  const [generatedLink, setGeneratedLink] = useState("");

  // STATE TAB 2: TẠO APP MỚI
  const [appId, setAppId] = useState("");
  const [appName, setAppName] = useState("");
  const [selectedIcon, setSelectedIcon] = useState("FileText");
  const [sheetName, setSheetName] = useState("");
  const [reportName, setReportName] = useState("");
  const [tabTitle, setTabTitle] = useState("");
  const [questions, setQuestions] = useState([{ id: 1, title: "", desc: "", imageFile: null, imagePreview: null }]);

  // STATE TAB 3: QUẢN LÝ USER
  const [newUser, setNewUser] = useState("");
  const [newPass, setNewPass] = useState("");
  const [targetUser, setTargetUser] = useState(""); // User cần đổi pass
  const [changePass, setChangePass] = useState("");

  // ==============================================
  // HÀM HỆ THỐNG (LOGIN & FETCH DATA)
  // ==============================================
  const handleLogin = async () => {
    setLoading(true);
    try {
      const res = await fetch(GOOGLE_SCRIPT_URL, {
        method: "POST", body: JSON.stringify({ action: "login", username, password })
      }).then(r => r.json());

      if (res.status === 'success') {
        setIsLoggedIn(true);
        setCurrentUser(username);
        fetchAppList(); // Tải danh sách App ngay khi login xong
      } else {
        alert("Đăng nhập thất bại: " + res.message);
      }
    } catch (err) { alert("Lỗi: " + err.message); }
    setLoading(false);
  };

  const fetchAppList = async () => {
    try {
      const res = await fetch(GOOGLE_SCRIPT_URL, {
        method: "POST", body: JSON.stringify({ action: "get_all_apps" })
      }).then(r => r.json());
      if(res.status === 'success') setAppList(Object.values(res.data));
    } catch(e) { console.error(e); }
  };

  // ==============================================
  // HÀM TAB 1: TẠO LINK
  // ==============================================
  const handleCreateLink = async () => {
    if (!selectedAppId || !linkCode) return alert("Vui lòng chọn App và nhập mã!");
    setLoading(true);
    const selectedApp = appList.find(a => a.id === selectedAppId);
    if (!selectedApp) return alert("App không hợp lệ");

    const fullLink = `${window.location.origin}/checklist/${selectedAppId}?code=${linkCode}`;

    try {
      await fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        body: JSON.stringify({
          action: "create_link",
          sheet_name: selectedApp.sheetName,
          code: linkCode,
          full_link: fullLink
        })
      });
      setGeneratedLink(fullLink);
      alert("✅ Tạo link thành công!");
    } catch (err) { alert("Lỗi: " + err.message); }
    setLoading(false);
  };

  // ==============================================
  // HÀM TAB 2: TẠO APP MỚI (Fix lỗi upload chậm)
  // ==============================================
  const addQuestion = () => setQuestions([...questions, { id: questions.length + 1, title: "", desc: "", imageFile: null, imagePreview: null }]);
  const removeQuestion = (idx) => setQuestions(questions.filter((_, i) => i !== idx));
  const handleQChange = (idx, field, val) => { const newQ = [...questions]; newQ[idx][field] = val; setQuestions(newQ); };
  const handleImageSelect = (idx, e) => {
    const file = e.target.files[0];
    if (file) { const newQ = [...questions]; newQ[idx].imageFile = file; newQ[idx].imagePreview = URL.createObjectURL(file); setQuestions(newQ); }
  };
  const fileToBase64 = (file) => new Promise((resolve) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result.split(',')[1]); reader.readAsDataURL(file); });

  const handleCreateApp = async () => {
    if(!appId || !appName || !sheetName || !reportName || !tabTitle) return alert("Điền đủ 5 thông tin cơ bản!");
    if(!window.confirm("Tạo ứng dụng này?")) return;
    setLoading(true);
    try {
      // 1. Upload từng ảnh một (Vòng lặp)
      const processedQuestions = [];
      for (const q of questions) {
        let imgUrl = null;
        if(q.imageFile) {
          const base64 = await fileToBase64(q.imageFile);
          const res = await fetch(GOOGLE_SCRIPT_URL, {
            method: "POST",
            body: JSON.stringify({
              action: "upload_image",
              folderName: sheetName,
              folderType: "templates",
              fileName: `Ref_Q${q.id}_${q.imageFile.name}`,
              mimeType: q.imageFile.type,
              base64: base64
            })
          }).then(r => r.json());
          if(res.status === 'success') imgUrl = res.url;
        }
        processedQuestions.push({ id: q.id, title: q.title, desc: q.desc, refImage: imgUrl ? [imgUrl] : (q.refImage || []) });
      }

      // 2. Lưu Config App
      await fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        body: JSON.stringify({
          action: "save_app_config",
          id: appId, name: appName, icon: selectedIcon, sheetName, reportName, tabTitle,
          questions: processedQuestions
        })
      });

      alert("✅ Thành công! Đã tạo App mới.");
      setAppId(""); setAppName(""); setSheetName(""); setQuestions([{id:1, title:"", desc:"", imageFile:null}]);
      fetchAppList(); // Refresh list cho Tab 1 dùng
    } catch(err) { alert("Lỗi: " + err.message); } finally { setLoading(false); }
  };

  // ==============================================
  // HÀM TAB 3: QUẢN LÝ USER
  // ==============================================
  const handleCreateUser = async () => {
    if(!newUser || !newPass) return alert("Nhập đủ tên và mật khẩu!");
    setLoading(true);
    try {
        const res = await fetch(GOOGLE_SCRIPT_URL, {
            method: "POST", body: JSON.stringify({ action: "create_user", new_username: newUser, new_password: newPass })
        }).then(r=>r.json());
        if(res.status === 'success') { alert("Đã tạo User: " + newUser); setNewUser(""); setNewPass(""); }
        else alert(res.message);
    } catch(e) { alert(e.message); }
    setLoading(false);
  };

  const handleChangePass = async () => {
    if(!targetUser || !changePass) return alert("Nhập đủ tên và mật khẩu mới!");
    setLoading(true);
    try {
        const res = await fetch(GOOGLE_SCRIPT_URL, {
            method: "POST", body: JSON.stringify({ action: "change_password", target_username: targetUser, new_password: changePass })
        }).then(r=>r.json());
        if(res.status === 'success') { alert("Đã đổi pass cho: " + targetUser); setTargetUser(""); setChangePass(""); }
        else alert(res.message);
    } catch(e) { alert(e.message); }
    setLoading(false);
  };


  // ==============================================
  // GIAO DIỆN HIỂN THỊ (RENDER)
  // ==============================================

  // 1. MÀN HÌNH LOGIN
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center font-sans">
        <div className="bg-white p-8 rounded-xl shadow-lg w-96">
          <h2 className="text-2xl font-bold text-center text-blue-900 mb-6 flex justify-center items-center gap-2">
            <Layout/> QUẢN TRỊ HỆ THỐNG
          </h2>
          <div className="space-y-4">
            <input className="w-full border p-3 rounded" placeholder="Tài khoản" value={username} onChange={e=>setUsername(e.target.value)} />
            <input className="w-full border p-3 rounded" type="password" placeholder="Mật khẩu" value={password} onChange={e=>setPassword(e.target.value)} />
            <button onClick={handleLogin} disabled={loading} className="w-full bg-blue-600 text-white p-3 rounded font-bold hover:bg-blue-700">
              {loading ? "Đang xử lý..." : "ĐĂNG NHẬP"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. MÀN HÌNH CHÍNH (3 TAB)
  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* HEADER */}
      <div className="bg-white shadow p-4 flex justify-between items-center sticky top-0 z-50">
        <h1 className="font-bold text-xl text-blue-900 flex items-center gap-2"><Layout/> ADMIN PAGE</h1>
        <div className="flex items-center gap-4">
            <span className="text-sm font-bold text-slate-500">Xin chào, {currentUser}</span>
            <button onClick={() => setIsLoggedIn(false)} className="text-red-500 text-sm font-bold flex items-center gap-1"><LogIn size={16}/> Thoát</button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6">
        {/* THANH TAB NAVIGATION */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <button onClick={() => setActiveTab("create_link")}
            className={`flex-1 p-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${activeTab === 'create_link' ? 'bg-blue-600 text-white shadow-lg' : 'bg-white text-slate-500 border hover:bg-slate-50'}`}>
            <LinkIcon/> 1. TẠO LINK
          </button>
          <button onClick={() => setActiveTab("create_app")}
            className={`flex-1 p-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${activeTab === 'create_app' ? 'bg-green-600 text-white shadow-lg' : 'bg-white text-slate-500 border hover:bg-slate-50'}`}>
            <Plus/> 2. TẠO ỨNG DỤNG
          </button>
          <button onClick={() => setActiveTab("manage_user")}
            className={`flex-1 p-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${activeTab === 'manage_user' ? 'bg-orange-500 text-white shadow-lg' : 'bg-white text-slate-500 border hover:bg-slate-50'}`}>
            <Users/> 3. QUẢN LÝ USER
          </button>
        </div>

        {/* --- NỘI DUNG TAB 1: TẠO LINK --- */}
        {activeTab === 'create_link' && (
          <div className="bg-white p-8 rounded-xl shadow border animate-fade-in">
            <h2 className="text-xl font-bold mb-6 text-slate-700 flex gap-2 items-center"><LinkIcon/> TẠO LINK LÀM VIỆC</h2>
            <div className="space-y-4 max-w-lg">
              <div>
                <label className="block text-sm font-bold mb-1">Chọn Ứng Dụng</label>
                <select className="w-full border p-3 rounded bg-slate-50" value={selectedAppId} onChange={e=>setSelectedAppId(e.target.value)}>
                  <option value="">-- Chọn App --</option>
                  {appList.map(app => ( <option key={app.id} value={app.id}>{app.name} ({app.id})</option> ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold mb-1">Mã Link (Code)</label>
                <input className="w-full border p-3 rounded" placeholder="VD: KHACH_A_001" value={linkCode} onChange={e=>setLinkCode(e.target.value)}/>
              </div>
              <button onClick={handleCreateLink} disabled={loading} className="w-full bg-blue-600 text-white p-3 rounded font-bold hover:bg-blue-700 flex justify-center items-center gap-2">
                {loading ? "Đang tạo..." : "TẠO LINK NGAY"}
              </button>
              {generatedLink && (
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded text-green-800 break-all">
                  <strong>Link đã tạo:</strong><br/>
                  <a href={generatedLink} target="_blank" rel="noreferrer" className="underline font-bold text-blue-600">{generatedLink}</a>
                </div>
              )}
            </div>
          </div>
        )}

        {/* --- NỘI DUNG TAB 2: TẠO APP MỚI --- */}
        {activeTab === 'create_app' && (
          <div className="bg-white p-8 rounded-xl shadow border animate-fade-in">
            <h2 className="text-xl font-bold mb-6 text-slate-700 flex gap-2 items-center"><Plus/> THIẾT LẬP ỨNG DỤNG MỚI</h2>
            
            {/* Form App */}
            <div className="grid md:grid-cols-2 gap-4 mb-8 bg-slate-50 p-4 rounded border">
                <div><label className="text-xs font-bold text-slate-500">ID (Link)</label><input className="border p-2 w-full rounded" value={appId} onChange={e=>setAppId(e.target.value)} placeholder="vd: solar"/></div>
                <div><label className="text-xs font-bold text-slate-500">Sheet Name</label><input className="border p-2 w-full rounded uppercase" value={sheetName} onChange={e=>setSheetName(e.target.value)} placeholder="vd: SOLAR_DATA"/></div>
                <div><label className="text-xs font-bold text-slate-500">Report Name</label><input className="border p-2 w-full rounded" value={reportName} onChange={e=>setReportName(e.target.value)} placeholder="vd: Báo Cáo Solar"/></div>
                <div><label className="text-xs font-bold text-slate-500">Tab Title</label><input className="border p-2 w-full rounded" value={tabTitle} onChange={e=>setTabTitle(e.target.value)} placeholder="vd: Kiểm tra hệ thống"/></div>
                <div className="md:col-span-2">
                  <label className="text-xs font-bold text-slate-500">Tên App & Icon</label>
                  <div className="flex gap-2">
                    <input className="border p-2 flex-1 rounded font-bold" value={appName} onChange={e=>setAppName(e.target.value)} placeholder="Tên hiển thị trên màn hình chính"/>
                    <div className="flex gap-1 border p-1 rounded bg-white">
                      {ICON_LIST.map(ic=><button key={ic.n} onClick={()=>setSelectedIcon(ic.n)} className={`p-2 rounded ${selectedIcon===ic.n?'bg-blue-600 text-white':''}`}>{ic.c}</button>)}
                    </div>
                  </div>
                </div>
            </div>

            {/* Questions */}
            <div className="space-y-4 mb-6">
              {questions.map((q, i) => (
                <div key={i} className="border p-4 rounded relative hover:border-blue-300 transition-colors">
                  <button onClick={()=>removeQuestion(i)} className="absolute top-2 right-2 text-red-500"><Trash2 size={16}/></button>
                  <div className="font-bold text-blue-600 mb-2">Câu {i+1}</div>
                  <input className="border p-2 w-full mb-2 rounded font-bold" placeholder="Tiêu đề câu hỏi..." value={q.title} onChange={e=>handleQChange(i,'title',e.target.value)}/>
                  <input className="border p-2 w-full mb-2 rounded text-sm" placeholder="Mô tả hướng dẫn..." value={q.desc} onChange={e=>handleQChange(i,'desc',e.target.value)}/>
                  <div className="mt-2">
                    {!q.imagePreview ? (
                      <label className="cursor-pointer bg-slate-100 px-3 py-1 rounded inline-flex items-center gap-2 text-sm hover:bg-blue-50">
                        <ImageIcon size={16}/> Thêm ảnh mẫu <input type="file" className="hidden" accept="image/*" onChange={e=>handleImageSelect(i,e)}/>
                      </label>
                    ) : (
                      <div className="flex gap-2 items-center bg-blue-50 p-2 rounded w-fit">
                        <img src={q.imagePreview} className="h-16 w-16 object-cover rounded border"/>
                        <label className="text-xs text-blue-600 underline cursor-pointer">Đổi ảnh<input type="file" className="hidden" accept="image/*" onChange={e=>handleImageSelect(i,e)}/></label>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <button onClick={addQuestion} className="px-4 py-2 bg-slate-200 rounded font-bold hover:bg-slate-300"><Plus/></button>
              <button onClick={handleCreateApp} disabled={loading} className="flex-1 px-4 py-2 bg-green-600 text-white rounded font-bold hover:bg-green-700 flex justify-center items-center gap-2">
                {loading ? "Đang xử lý (Chờ xíu)..." : "LƯU APP MỚI"}
              </button>
            </div>
          </div>
        )}

        {/* --- NỘI DUNG TAB 3: QUẢN LÝ USER --- */}
        {activeTab === 'manage_user' && (
          <div className="bg-white p-8 rounded-xl shadow border animate-fade-in">
             <h2 className="text-xl font-bold mb-6 text-slate-700 flex gap-2 items-center"><Users/> QUẢN LÝ TÀI KHOẢN</h2>
             <div className="grid md:grid-cols-2 gap-8">
                {/* FORM TẠO USER */}
                <div className="p-4 border rounded bg-slate-50">
                    <h3 className="font-bold text-green-700 mb-4 flex items-center gap-2"><UserPlus size={18}/> TẠO USER MỚI</h3>
                    <div className="space-y-3">
                        <input className="w-full border p-2 rounded" placeholder="Username mới" value={newUser} onChange={e=>setNewUser(e.target.value)}/>
                        <input className="w-full border p-2 rounded" placeholder="Mật khẩu" value={newPass} onChange={e=>setNewPass(e.target.value)}/>
                        <button onClick={handleCreateUser} className="w-full bg-green-600 text-white p-2 rounded font-bold hover:bg-green-700">TẠO USER</button>
                    </div>
                </div>

                {/* FORM ĐỔI PASS */}
                <div className="p-4 border rounded bg-slate-50">
                    <h3 className="font-bold text-orange-600 mb-4 flex items-center gap-2"><Key size={18}/> ĐỔI MẬT KHẨU</h3>
                    <div className="space-y-3">
                        <input className="w-full border p-2 rounded" placeholder="Username cần đổi" value={targetUser} onChange={e=>setTargetUser(e.target.value)}/>
                        <input className="w-full border p-2 rounded" placeholder="Mật khẩu mới" value={changePass} onChange={e=>setChangePass(e.target.value)}/>
                        <button onClick={handleChangePass} className="w-full bg-orange-500 text-white p-2 rounded font-bold hover:bg-orange-600">LƯU MẬT KHẨU</button>
                    </div>
                </div>
             </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default AdminPage;