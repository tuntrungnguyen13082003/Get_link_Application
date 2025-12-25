import React, { useState, useEffect } from 'react';
import { Lock, LogOut, UserPlus, Settings, Trash2, Shield, User, Key, Link as LinkIcon, Plus, Save, Image as ImageIcon, X, LayoutGrid } from 'lucide-react';

const APP_ICONS = [
    "📝", "📸", "⚠️", "⚡", "🔧", "🧯", "🏭", "🔋", "✅", "🚒", "🏗️", "🔌", "💧", "🚲", "🚗", "🛡️"
];

const AdminPage = () => {
  const BACKEND_URL = "http://solar-field.ddns.net:17004/api"; 
  
  // --- STATE CŨ (GIỮ NGUYÊN) ---
  const [currentUser, setCurrentUser] = useState(null); 
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  
  // State Tạo Link
  const [selectedAppId, setSelectedAppId] = useState(''); // Sửa nhẹ: Lưu ID thay vì Object để dễ xử lý
  const [code, setCode] = useState('');
  const [generatedLink, setGeneratedLink] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // State Quản trị User
  const [newPassForm, setNewPassForm] = useState({ old: '', new: '' });
  const [newUserForm, setNewUserForm] = useState({ user: '', pass: '' });
  const [userList, setUserList] = useState([]);

  // --- STATE MỚI CHO 3 TAB & BUILDER ---
  const [activeTab, setActiveTab] = useState('links'); // 'links' | 'builder' | 'settings'
  const [apps, setApps] = useState([]); // Thay thế AVAILABLE_APPS cứng
  
  // State cho Builder (Tạo App)
  const [editingApp, setEditingApp] = useState(null);
  const [isSavingApp, setIsSavingApp] = useState(false);

  // --- 1. LOGIC HỆ THỐNG (GIỮ NGUYÊN) ---
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
        const res = await fetch(`${BACKEND_URL}/login`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await res.json();
        if (data.status === 'success') {
            const user = data.user;
            setCurrentUser(user);
            localStorage.setItem('user_session', JSON.stringify(user));
            if (user.role === 'admin') {
                fetchUserList();
            }
            fetchApps(); // Đăng nhập xong thì tải danh sách App luôn
        } else { alert("❌ " + data.message); }
    } catch (err) { alert("Lỗi kết nối Server!"); }
  };

  useEffect(() => {
// 1. Xóa sạch dấu vết cũ
    localStorage.removeItem('user_session');
    setCurrentUser(null);
    
    // 2. Chỉ giữ lại mỗi cái title
    document.title = "Admin System";
  }, []);

  const handleLogout = () => {
    // 1. Xóa thông tin User
    setCurrentUser(null); 
    setUsername(""); 
    setPassword("");
    localStorage.removeItem('user_session');

    // 2. XÓA SẠCH DỮ LIỆU CỦA TAB TẠO LINK (Fix lỗi của bạn ở đây)
    setCode('');                // Xóa mã đã nhập
    setGeneratedLink('');       // Xóa link đã tạo
    setSelectedAppId('');       // Reset app đã chọn
    setIsLoading(false);

    // 3. XÓA SẠCH DỮ LIỆU CỦA TAB KHÁC
    setEditingApp(null);        // Đóng form sửa ứng dụng
    setActiveTab('links');      // Quay về tab đầu tiên mặc định
    
    // 4. Xóa form nhập liệu cài đặt (nếu có)
    setNewPassForm({ old: '', new: '' });
    setNewUserForm({ user: '', pass: '' });
  };

  const fetchUserList = async () => {
    try {
        const res = await fetch(`${BACKEND_URL}/users`);
        const data = await res.json();
        if (data.status === 'success') setUserList(data.users);
    } catch (e) { console.error(e); }
  };

  const handleDeleteUser = async (targetUser) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa tài khoản "${targetUser}"?`)) return;
    const res = await fetch(`${BACKEND_URL}/delete-user`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUser })
    });
    const data = await res.json();
    alert(data.message);
    if (data.status === 'success') fetchUserList();
  };

  const handleCreateUser = async () => {
    if (!newUserForm.user || !newUserForm.pass) return alert("Nhập đủ thông tin!");
    const res = await fetch(`${BACKEND_URL}/create-user`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newUsername: newUserForm.user, newPassword: newUserForm.pass })
    });
    const data = await res.json();
    alert(data.message);
    if(data.status === 'success') { setNewUserForm({ user: '', pass: '' }); fetchUserList(); }
  };

  const handleChangePassword = async () => {
    if (!newPassForm.old || !newPassForm.new) return alert("Nhập đủ thông tin!");
    const res = await fetch(`${BACKEND_URL}/change-password`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: currentUser.username, oldPassword: newPassForm.old, newPassword: newPassForm.new })
    });
    const data = await res.json();
    alert(data.message);
    if(data.status === 'success') setNewPassForm({ old: '', new: '' });
  };

  // --- 2. LOGIC MỚI: QUẢN LÝ APP (BUILDER) ---
  const fetchApps = async () => {
    try {
        const res = await fetch(`${BACKEND_URL}/apps`);
        const json = await res.json();
        if (json.status === 'success') {
            setApps(json.data);
            // Auto chọn app đầu tiên cho tab Link
            if (json.data.length > 0 && !selectedAppId) setSelectedAppId(json.data[0].id);
        }
    } catch (e) { console.error("Lỗi tải apps"); }
  };

  // Các hàm hỗ trợ Builder
  const handleNewApp = () => {
    setEditingApp({
      id: '', 
      icon: '📝', // <--- QUAN TRỌNG: Thêm dòng này vào đây
      name: 'Ứng dụng mới', 
      sheetName: 'NEW_SHEET', 
      reportName: 'Report_Name', 
      tabTitle: 'New Checklist',
      questions: []
    });
  };

  const handleSaveApp = async () => {
    if (!editingApp.id) return alert("Chưa nhập ID ứng dụng!");
    setIsSavingApp(true);
    try {
      const res = await fetch(`${BACKEND_URL}/save-app`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingApp)
      });
      if ((await res.json()).status === 'success') {
        alert("✅ Đã lưu thành công!");
        fetchApps();
      }
    } catch (e) { alert("Lỗi lưu dữ liệu!"); } 
    finally { setIsSavingApp(false); }
  };

  const handleDeleteApp = async (id) => {
    if (!window.confirm(`Xóa ứng dụng ${id}?`)) return;
    try {
      await fetch(`${BACKEND_URL}/delete-app`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      fetchApps();
      if (editingApp?.id === id) setEditingApp(null);
    } catch (e) { alert("Lỗi xóa app!"); }
  };

  const handleUploadImage = async (qIndex, e) => {
    const file = e.target.files[0];
    if (!file || !editingApp.id) return alert("Chọn file và nhập ID App trước!");
    const formData = new FormData();
    formData.append('image', file);
    try {
      const res = await fetch(`${BACKEND_URL}/upload-config-image?appId=${editingApp.id}`, { method: 'POST', body: formData });
      const json = await res.json();
      if (json.status === 'success') {
        const newQs = [...editingApp.questions];
        const currentImgs = Array.isArray(newQs[qIndex].refImage) ? newQs[qIndex].refImage : [];
        newQs[qIndex].refImage = [...currentImgs, json.url];
        setEditingApp({ ...editingApp, questions: newQs });
      }
    } catch (err) { alert("Lỗi upload ảnh!"); }
  };

  // --- 3. LOGIC TẠO LINK (ĐÃ CẬP NHẬT DÙNG DỮ LIỆU ĐỘNG) ---
  const handleCopy = (text) => {
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).then(()=>alert("Đã copy link!")).catch(()=>fallbackCopy(text));
    else fallbackCopy(text);
  };
  const fallbackCopy = (text) => {
     /* Giữ nguyên hàm fallback của bạn */ 
     var ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed"; // Để không cuộn trang
    ta.style.left = "0";
    ta.style.top = "0";
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    try {
      document.execCommand('copy');
      alert("✅ Đã copy link vào bộ nhớ tạm!");
    } catch (e) {
      alert("⚠️ Không thể copy tự động. Hãy copy thủ công nhé.");
    }
    document.body.removeChild(ta);
    };
  
  const handleCreateLink = async () => {
    const currentApp = apps.find(a => a.id === selectedAppId);
    if (!currentApp || !code.trim()) return alert("Thiếu thông tin!");
    
    setIsLoading(true); setGeneratedLink('');
    const rawCode = code.trim().toUpperCase(); 
    // Tạo token ngẫu nhiên
    const t = Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
    // Link dùng HashRouter (#)
    const finalLink = `${window.location.origin}/#/checklist/${currentApp.id}?code=${t}`;
    
    try {
      const res = await fetch(`${BACKEND_URL}/create-link`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: rawCode, token: t, sheet_name: currentApp.sheetName })
      });
      const r = await res.json();
      if (r.status === 'success') { setGeneratedLink(finalLink); handleCopy(finalLink); } 
      else { alert(r.message); }
    } catch (e) { alert("Lỗi Server: " + e.message); } finally { setIsLoading(false); }
  };


  // --- GIAO DIỆN 1: MÀN HÌNH ĐĂNG NHẬP (GIỮ NGUYÊN) ---
  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4 font-sans">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200">
          <div className="bg-slate-800 p-8 text-center text-white">
            <h1 className="text-2xl font-bold uppercase">Hệ Thống Get Link</h1>
            <p className="text-sm text-slate-400 mt-2">Vui lòng đăng nhập để tiếp tục</p>
          </div>
          <form onSubmit={handleLogin} className="p-8 space-y-6">
            <div><label className="font-bold text-slate-700">Tài khoản</label><input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full p-3 bg-slate-50 border rounded-xl mt-1 outline-none focus:border-blue-500" /></div>
            <div><label className="font-bold text-slate-700">Mật khẩu</label><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full p-3 bg-slate-50 border rounded-xl mt-1 outline-none focus:border-blue-500" /></div>
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl shadow-lg transition-transform active:scale-95">ĐĂNG NHẬP</button>
          </form>
        </div>
      </div>
    );
  }

  // --- GIAO DIỆN 2: DASHBOARD (CHIA 3 TAB) ---
  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-8 font-sans">
      {/* Header */}
      <div className="flex justify-between items-center mb-8 max-w-7xl mx-auto">
        <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                <Shield className="text-blue-600" /> QUẢN TRỊ HỆ THỐNG
            </h1>
            <p className="text-slate-500 text-sm">Xin chào, <span className="font-bold text-blue-600">{currentUser.username}</span> ({currentUser.role === 'admin' ? 'Quản trị viên' : 'Nhân viên'})</p>
        </div>
        <button onClick={handleLogout} className="bg-white text-red-500 px-4 py-2 rounded-lg shadow hover:bg-red-50 font-bold flex items-center gap-2">
            <LogOut size={18}/> Đăng xuất
        </button>
      </div>

      <div className="max-w-7xl mx-auto">
        
        {/* THANH MENU TABS */}
        <div className="flex justify-center gap-2 mb-6 border-b border-slate-300 overflow-x-auto">
            <button onClick={() => setActiveTab('links')} className={`px-6 py-3 font-bold rounded-t-xl transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'links' ? 'bg-blue-600 text-white shadow-lg' : 'bg-white text-slate-500 hover:bg-slate-50'}`}>
                <LinkIcon size={18}/> TẠO LINK BÁO CÁO
            </button>
            
            {/* Tab Tạo Ứng Dụng (Chỉ Admin thấy) */}
            {currentUser.role === 'admin' && (
                <button onClick={() => setActiveTab('builder')} className={`px-6 py-3 font-bold rounded-t-xl transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'builder' ? 'bg-green-600 text-white shadow-lg' : 'bg-white text-slate-500 hover:bg-slate-50'}`}>
                    <LayoutGrid size={18}/> TẠO ỨNG DỤNG
                </button>
            )}

            <button onClick={() => setActiveTab('settings')} className={`px-6 py-3 font-bold rounded-t-xl transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'settings' ? 'bg-orange-600 text-white shadow-lg' : 'bg-white text-slate-500 hover:bg-slate-50'}`}>
                <Settings size={18}/> CÀI ĐẶT & USER
            </button>
        </div>

        {/* === TAB 1: TẠO LINK (Giao diện cũ của bạn) === */}
        {activeTab === 'links' && (
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden p-10 max-w-4xl mx-auto animate-in fade-in">
                <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                    <LinkIcon className="text-blue-600"/> TẠO LIÊN KẾT MỚI
                </h2>
                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">CHỌN ỨNG DỤNG</label>
                        <select className="w-full p-3 border rounded-xl outline-none focus:border-blue-500 bg-slate-50" 
                            onChange={(e) => { setSelectedAppId(e.target.value); setGeneratedLink(''); }} value={selectedAppId}>
                            {apps.map((app) => (<option key={app.id} value={app.id}> {app.icon} {app.name}</option>))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">NHẬP MÃ HIỂN THỊ</label>
                        <input type="text" value={code} onChange={(e) => {setCode(e.target.value); setGeneratedLink('');}} onFocus={() => setGeneratedLink('')} placeholder="VD: MAY-A" 
                            className="w-full p-3 border rounded-xl font-bold uppercase outline-none focus:border-blue-500 bg-slate-50" />
                        
                        {!generatedLink && (
                            <button onClick={handleCreateLink} disabled={isLoading || !code} 
                                className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl shadow transition-all">
                                {isLoading ? "⏳ Đang xử lý..." : "🚀 TẠO LINK NGAY"}
                            </button>
                        )}
                    </div>
                    {generatedLink && (
                        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mt-4">
                            <p className="text-green-700 font-bold text-sm mb-2">✅ Link đã tạo:</p>
                            <div className="bg-white p-3 rounded border border-green-100 text-xs font-mono break-all text-slate-600 mb-3">{generatedLink}</div>
                            <button onClick={() => handleCopy(generatedLink)} className="w-full bg-slate-800 text-white font-bold py-3 rounded-xl hover:bg-black">COPY LINK LẠI</button>
                        </div>
                    )}
                </div>
            </div>
        )}

        {/* === TAB 2: TẠO ỨNG DỤNG (BUILDER - MỚI) === */}
        {activeTab === 'builder' && currentUser.role === 'admin' && (
            <div className="flex flex-col lg:flex-row gap-6 animate-in fade-in">
                {/* Sidebar List */}
                <div className="w-full lg:w-1/4 bg-white p-4 rounded-2xl shadow-lg border border-slate-200 h-fit">
                    <button onClick={handleNewApp} className="w-full bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700 mb-4 flex items-center justify-center gap-2">
                        <Plus size={18}/> THÊM ỨNG DỤNG
                    </button>
                    <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                        {apps.map(app => (
                            <div key={app.id} onClick={() => setEditingApp(app)} 
                                className={`flex justify-between items-center p-3 rounded-xl cursor-pointer border transition-all ${editingApp?.id === app.id ? 'bg-green-50 border-green-500' : 'bg-slate-50 border-transparent hover:bg-slate-100'}`}>
                                
                                {/* 👇👇👇 THAY ĐỔI Ở ĐÂY: Thêm {app.icon} vào trước tên 👇👇👇 */}
                                <span className="font-bold text-slate-700 truncate flex-1">
                                    {app.icon} {app.name}
                                </span>
                                
                                <button onClick={(e) => {e.stopPropagation(); handleDeleteApp(app.id);}} className="text-slate-400 hover:text-red-500 p-1">
                                    <Trash2 size={16}/>
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Form Editor */}
                <div className="flex-1 bg-white p-6 rounded-2xl shadow-lg border border-slate-200">
                    {editingApp ? (
                        <div>
                            <div className="flex justify-between items-center mb-6 pb-4 border-b">
                                <h2 className="text-xl font-bold text-slate-700">✏️ {editingApp.name}</h2>
                                <button onClick={handleSaveApp} disabled={isSavingApp} className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-blue-700 flex items-center gap-2 shadow">
                                    {isSavingApp ? "Đang lưu..." : <><Save size={18}/> LƯU CẤU HÌNH</>}
                                </button>
                            </div>
                            
                            {/* Thông tin chung */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase">ID (Folder ảnh)</label>
                                    <input className="w-full p-2 border rounded-lg mt-1 font-mono bg-white" 
                                        value={editingApp.id} onChange={e => setEditingApp({...editingApp, id: e.target.value})} 
                                        placeholder="vd: solar_da_nang"/>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase">SheetName (Folder báo cáo)</label>
                                    <input className="w-full p-2 border rounded-lg mt-1 font-mono bg-white" 
                                        value={editingApp.sheetName} onChange={e => setEditingApp({...editingApp, sheetName: e.target.value})} 
                                        placeholder="vd: SOLAR_DN"/>
                                </div>
                            </div>

                            {/* Dòng 2: CHỌN ICON VÀ TÊN HIỂN THỊ (ĐÂY LÀ PHẦN QUAN TRỌNG BẠN CẦN) */}
                            <div className="mb-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                                <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Biểu tượng & Tên ứng dụng</label>
                                <div className="flex flex-col md:flex-row gap-4 items-start">
                                    
                                    {/* Phần chọn Icon */}
                                    <div className="w-full md:w-auto">
                                        <div className="grid grid-cols-8 md:grid-cols-4 gap-2">
                                            {APP_ICONS.map((ico) => (
                                                <button 
                                                    key={ico}
                                                    onClick={() => setEditingApp({...editingApp, icon: ico})}
                                                    className={`w-10 h-10 flex items-center justify-center text-xl rounded-lg border transition-all ${
                                                        editingApp.icon === ico 
                                                        ? 'bg-blue-100 border-blue-500 shadow-sm scale-110' 
                                                        : 'bg-white border-slate-200 hover:bg-slate-100'
                                                    }`}
                                                >
                                                    {ico}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Phần nhập tên (Text) */}
                                    <div className="flex-1 w-full">
                                        <input 
                                            className="w-full p-3 border rounded-xl font-bold text-lg text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none" 
                                            value={editingApp.name} 
                                            onChange={e => setEditingApp({...editingApp, name: e.target.value})} 
                                            placeholder="Nhập tên ứng dụng (VD: Báo cáo Solar)"
                                        />
                                        <p className="text-xs text-slate-400 mt-1">
                                            Hiển thị thực tế: <span className="font-bold text-slate-800">{editingApp.icon} {editingApp.name}</span>
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Dòng 3: Report Name và Tab Title (Giữ nguyên logic cũ) */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase">Report Name (File xuất ra)</label>
                                    <input className="w-full p-2 border rounded-lg mt-1 font-mono bg-white" 
                                        value={editingApp.reportName || ''} onChange={e => setEditingApp({...editingApp, reportName: e.target.value})} 
                                        placeholder="vd: SolarCheckListEvent"/>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500">Tiêu đề Tab</label>
                                    <input className="w-full p-2 border rounded-lg mt-1 bg-white" 
                                        value={editingApp.tabTitle} onChange={e => setEditingApp({...editingApp, tabTitle: e.target.value})} 
                                        placeholder="vd: Checklist Bảo Trì"/>
                                </div>
                            </div>

                            {/* Danh sách câu hỏi */}
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-bold text-slate-700">DANH SÁCH CÂU HỎI</h3>
                                <button onClick={() => setEditingApp({...editingApp, questions: [...editingApp.questions, {id: editingApp.questions.length + 1, title: '', desc: '', refImage: []}]})} className="text-sm bg-slate-100 px-3 py-2 rounded-lg hover:bg-slate-200 font-bold text-slate-600 border border-slate-300 flex items-center gap-1">
                                    <Plus size={14}/> Thêm câu hỏi
                                </button>
                            </div>
                            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                                {editingApp.questions.map((q, idx) => (
                                    <div key={idx} className="border border-slate-200 p-4 rounded-xl bg-slate-50 relative group">
                                        <button onClick={() => { const newQs = editingApp.questions.filter((_, i) => i !== idx); setEditingApp({...editingApp, questions: newQs}); }} className="absolute top-2 right-2 text-slate-300 hover:text-red-500 p-1"><X size={18}/></button>
                                        <div className="flex gap-3 mb-2">
                                            <input type="number" className="w-12 p-2 border rounded-lg text-center font-bold" value={q.id} onChange={(e) => { const newQs = [...editingApp.questions]; newQs[idx].id = parseInt(e.target.value); setEditingApp({...editingApp, questions: newQs}); }}/>
                                            <input className="flex-1 p-2 border rounded-lg font-bold" placeholder="Tiêu đề câu hỏi" value={q.title} onChange={(e) => { const newQs = [...editingApp.questions]; newQs[idx].title = e.target.value; setEditingApp({...editingApp, questions: newQs}); }}/>
                                        </div>
                                        <input className="w-full p-2 border rounded-lg text-sm bg-white mb-3" placeholder="Mô tả..." value={q.desc} onChange={(e) => { const newQs = [...editingApp.questions]; newQs[idx].desc = e.target.value; setEditingApp({...editingApp, questions: newQs}); }}/>
                                        
                                        {/* Ảnh minh họa */}
                                        <div className="flex flex-wrap gap-2 items-center pt-2 border-t border-slate-200">
                                            {(Array.isArray(q.refImage) ? q.refImage : []).map((imgUrl, i) => (
                                                <div key={i} className="relative w-12 h-12 rounded border bg-white group/img">
                                                    <img src={imgUrl} alt="ref" className="w-full h-full object-cover rounded"/>
                                                    <button onClick={() => { const newQs = [...editingApp.questions]; const currentImgs = newQs[idx].refImage; newQs[idx].refImage = currentImgs.filter(url => url !== imgUrl); setEditingApp({ ...editingApp, questions: newQs }); }} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] opacity-0 group-hover/img:opacity-100">×</button>
                                                </div>
                                            ))}
                                            <label className="w-12 h-12 border-2 border-dashed border-slate-300 rounded flex items-center justify-center cursor-pointer hover:bg-blue-50 text-slate-400 hover:text-blue-500">
                                                <ImageIcon size={16}/><input type="file" className="hidden" accept="image/*" onChange={(e) => handleUploadImage(idx, e)}/>
                                            </label>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="h-64 flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
                            <Settings size={48} className="mb-4 opacity-20"/>
                            <p>Chọn ứng dụng bên trái để chỉnh sửa</p>
                        </div>
                    )}
                </div>
            </div>
        )}

        {/* === TAB 3: CÀI ĐẶT & USER (Giao diện cũ của bạn) === */}
        {activeTab === 'settings' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in">
                 {/* Đổi mật khẩu */}
                 <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden h-fit">
                    <div className="bg-slate-700 p-4 text-white font-bold text-lg flex items-center gap-2"><Key size={20}/> ĐỔI MẬT KHẨU</div>
                    <div className="p-6 space-y-3">
                        <input type="password" placeholder="Mật khẩu cũ" className="w-full p-3 border rounded-lg bg-slate-50" value={newPassForm.old} onChange={e => setNewPassForm({...newPassForm, old: e.target.value})} />
                        <input type="password" placeholder="Mật khẩu mới" className="w-full p-3 border rounded-lg bg-slate-50" value={newPassForm.new} onChange={e => setNewPassForm({...newPassForm, new: e.target.value})} />
                        <button onClick={handleChangePassword} className="w-full bg-slate-600 hover:bg-slate-700 text-white font-bold py-2 rounded-lg">Cập nhật mật khẩu</button>
                    </div>
                </div>

                {/* Quản lý User (Chỉ Admin) */}
                {currentUser.role === 'admin' && (
                    <div className="bg-white rounded-2xl shadow-lg border border-orange-200 overflow-hidden h-fit">
                        <div className="bg-orange-600 p-4 text-white font-bold text-lg flex items-center gap-2"><UserPlus size={20}/> QUẢN LÝ TÀI KHOẢN</div>
                        <div className="p-6 border-b border-slate-100">
                            <div className="flex gap-2 mb-3">
                                <input placeholder="Username" className="flex-1 p-3 border rounded-lg bg-slate-50" value={newUserForm.user} onChange={e => setNewUserForm({...newUserForm, user: e.target.value})} />
                                <input placeholder="Password" className="flex-1 p-3 border rounded-lg bg-slate-50" value={newUserForm.pass} onChange={e => setNewUserForm({...newUserForm, pass: e.target.value})} />
                            </div>
                            <button onClick={handleCreateUser} className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 rounded-lg">Thêm nhân viên</button>
                        </div>
                        <div className="p-6 bg-orange-50/30">
                            <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                                {userList.map((u, idx) => (
                                    <div key={idx} className="flex justify-between items-center p-3 bg-white rounded-lg border border-slate-200 shadow-sm">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-full ${u.role === 'admin' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}><User size={16} /></div>
                                            <div><p className="font-bold text-slate-800">{u.username}</p><p className="text-xs text-slate-500 uppercase">{u.role}</p></div>
                                        </div>
                                        {u.username !== 'admin' && u.username !== currentUser.username && (
                                            <button onClick={() => handleDeleteUser(u.username)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-full"><Trash2 size={18} /></button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        )}

      </div>
    </div>
  );
};

export default AdminPage;