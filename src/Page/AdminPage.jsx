import React, { useState, useEffect } from 'react';
// 👇 Thêm 'Database' vào dòng import này
import { Lock, LogOut, UserPlus, Settings, Trash2, Shield, User, Key, Link as LinkIcon, Plus, Save, Image as ImageIcon, X, LayoutGrid, Database, FileUp, FileDown } from 'lucide-react';
// 👇 Import file dashboard
import AdminDashboard from '../components/AdminDashboard';

const AdminPage = () => {
  const BACKEND_URL = import.meta.env.VITE_API_URL; 
  
  // --- STATE CŨ (GIỮ NGUYÊN) ---
  const [currentUser, setCurrentUser] = useState(null); 
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  
  const fileInputRef = React.useRef(null);

  // State Tạo Link
  const [selectedAppId, setSelectedAppId] = useState(''); // Sửa nhẹ: Lưu ID thay vì Object để dễ xử lý
  const [code, setCode] = useState('');
  const [generatedLink, setGeneratedLink] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [originalSheetName, setOriginalSheetName] = useState(null);
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

        console.log("Dữ liệu Apps nhận được:", json);
 
        if (json.status === 'success') {
            setApps(json.data);
            // Auto chọn app đầu tiên cho tab Link
            if (json.data.length > 0 && !selectedAppId) setSelectedAppId(json.data[0].sheetName);
        }
    } catch (e) { console.error("Lỗi tải apps"); }
  };

  // Các hàm hỗ trợ Builder
  const handleNewApp = () => {
    setOriginalSheetName(null); // 👈 THÊM DÒNG NÀY (Reset biến nhớ)
    setEditingApp({
        sheetName: '', 
        name: 'Ứng dụng mới',  
        questions: []
    });
  };
  const handleEditAppClick = (app) => {
    setOriginalSheetName(app.sheetName); // Lưu lại tên cũ trước khi sửa
    setEditingApp(app);
  };

  const handleSaveApp = async () => {
    if (!editingApp.sheetName) return alert("Chưa nhập Sheet Name!");
    setIsSavingApp(true);
    try {
      const res = await fetch(`${BACKEND_URL}/save-app`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            ...editingApp,
            oldSheetName: originalSheetName // 👈 QUAN TRỌNG: Thêm dòng này
        })
      });
      if ((await res.json()).status === 'success') {
        alert("✅ Đã lưu thành công!");
        setOriginalSheetName(null); // 👈 Thêm dòng này để reset
        fetchApps();
      }
    } catch (e) { alert("Lỗi lưu dữ liệu!"); } 
    finally { setIsSavingApp(false); }
  };

  const handleDeleteApp = async (sheetName) => { // 1. Đổi tên tham số từ id -> sheetName cho dễ hiểu
    if (!window.confirm(`Bạn chắc chắn muốn XÓA ứng dụng có mã "${sheetName}"?`)) return;
    try {
      await fetch(`${BACKEND_URL}/delete-app`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        
        // 👇👇👇 LỖI Ở ĐÂY: Trước đây bạn gửi { id }, giờ phải gửi { sheetName }
        body: JSON.stringify({ sheetName: sheetName }) 
      });
      
      fetchApps(); // Tải lại danh sách
      
      // Nếu đang mở đúng app vừa xóa thì đóng form lại
      if (editingApp?.sheetName === sheetName) setEditingApp(null);
      
    } catch (e) { alert("Lỗi xóa app!"); }
  };

  // --- HÀM MỚI: XỬ LÝ EXPORT & IMPORT ---
  // --- HÀM MỚI: IMPORT TOÀN BỘ (Đã cập nhật thông báo) ---
  const handleRestoreSystem = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Reset input để lần sau chọn lại file cũ vẫn nhận
    e.target.value = null;

    // 👇 SỬA CÂU THÔNG BÁO TẠI ĐÂY 👇
    const msg = "Hệ thống sẽ GỘP dữ liệu từ file Backup vào danh sách hiện tại:\n\n" +
                "➕ Ứng dụng mới: Sẽ được THÊM vào.\n" +
                "🛡️ Ứng dụng trùng tên: Sẽ GIỮ NGUYÊN (Không bị ghi đè).\n\n" +
                "Bạn có muốn tiếp tục không?";

    if (!confirm(msg)) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
        const res = await fetch(`${BACKEND_URL}/import-all-apps`, {
            method: 'POST',
            body: formData
        });
        const json = await res.json();
        
        if (json.status === 'success') {
            alert("✅ " + json.message);
            fetchApps(); // Tải lại danh sách để thấy ứng dụng cũ hiện ra
            // Không cần setEditingApp(null) cũng được, để tiện so sánh
        } else {
            alert("❌ Lỗi: " + json.message);
        }
    } catch (err) {
        alert("Lỗi kết nối Server khi Restore!");
    }
  };

  const handleBackupSystem = () => {
    if (confirm("Bạn muốn tải về bản SAO LƯU TOÀN BỘ hệ thống (Dữ liệu + Hình ảnh)?")) {
        // Gọi API tải file zip
        window.location.href = `${BACKEND_URL}/export-all-apps`;
    }
  };

  const handleUploadImage = async (qIndex, e) => {
    const file = e.target.files[0];
    if (!file || !editingApp.sheetName) return alert("Chọn file và nhập Sheet Name trước!");
    const formData = new FormData();
    formData.append('image', file);
    try {
      const res = await fetch(`${BACKEND_URL}/upload-config-image?appId=${editingApp.sheetName}`, { method: 'POST', body: formData });
      const json = await res.json();
      if (json.status === 'success') {
        const newQs = [...editingApp.questions];
        const currentImgs = Array.isArray(newQs[qIndex].refImage) ? newQs[qIndex].refImage : [];
        newQs[qIndex].refImage = [...currentImgs, json.url];
        setEditingApp({ ...editingApp, questions: newQs });
      }
    } catch (err) { alert("Lỗi upload ảnh!"); }
  };
  // TỰ ĐỘNG SẮP XẾP LẠI THỨ TỰ CÂU HỎI ---
  const sortQuestions = () => {
    // 1. Copy ra mảng mới
    const sortedQs = [...editingApp.questions];
    
    // 2. Sắp xếp tăng dần theo ID
    sortedQs.sort((a, b) => a.id - b.id);
    
    // 3. Cập nhật lại State để giao diện tự nhảy lại vị trí đúng
    setEditingApp({ ...editingApp, questions: sortedQs });
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
    const currentApp = apps.find(a => a.sheetName === selectedAppId);
    if (!selectedAppId || !currentApp) {
        return alert("Lỗi: Bạn chưa chọn Ứng dụng!");
    }
    if (!code || !code.trim()) {
        return alert("Lỗi: Bạn chưa nhập Mã hiển thị (VD: MAY-A)!");
    }
    
    setIsLoading(true); setGeneratedLink('');
    const rawCode = code.trim().toUpperCase(); 
    // Tạo token ngẫu nhiên
    const t = Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
    // Link dùng HashRouter (#)
    const finalLink = `${window.location.origin}/#/checklist/${currentApp.sheetName}?code=${t}`;
    
    try {
      const res = await fetch(`${BACKEND_URL}/create-link`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: rawCode, token: t, sheet_name: currentApp.sheetName, name: currentApp.name})
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

            
                <button onClick={() => setActiveTab('database')} className={`px-6 py-3 font-bold rounded-t-xl transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'database' ? 'bg-purple-700 text-white shadow-lg' : 'bg-white text-slate-500 hover:bg-slate-50'}`}>
                    <Database size={18}/> KHO DỮ LIỆU
                </button>

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
                        <select className="w-full p-3 border rounded-xl outline-none focus:border-blue-500 bg-slate-50" value={selectedAppId}
                            onChange={(e) => { setSelectedAppId(e.target.value); setGeneratedLink(''); }}>
                                <option value="">-- Chọn ứng dụng --</option>
                            {apps.map((app) => (<option key={app.sheetName} value={app.sheetName}> {app.name}</option>))}
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
                    
                    <button 
                        onClick={handleBackupSystem} 
                        className="w-full bg-orange-100 text-orange-700 border border-orange-200 py-3 rounded-xl font-bold hover:bg-orange-200 mb-3 flex items-center justify-center gap-2 transition-colors"
                    >
                        <FileDown size={20}/> BACKUP TỔNG
                    </button>
                    
                    <button onClick={handleNewApp} className="w-full bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700 mb-4 flex items-center justify-center gap-2">
                        <Plus size={18}/> THÊM ỨNG DỤNG
                    </button>
                    <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                        {apps.map(app => (
                            <div key={app.sheetName} onClick={() => handleEditAppClick(app)} 
                                className={`flex justify-between items-center p-3 rounded-xl cursor-pointer border transition-all ${editingApp?.sheetName === app.sheetName ? 'bg-green-50 border-green-500' : 'bg-slate-50 border-transparent hover:bg-slate-100'}`}>
                                
                                {/* 👇👇👇 THAY ĐỔI Ở ĐÂY: Thêm {app.icon} vào trước tên 👇👇👇 */}
                                <span className="font-bold text-slate-700 truncate flex-1">
                                    {app.name}
                                </span>
                                
                                <button onClick={(e) => {e.stopPropagation(); handleDeleteApp(app.sheetName);}} className="text-slate-400 hover:text-red-500 p-1">
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
                            {/* --- HEADER --- */}
                            <div className="flex justify-between items-center mb-6 pb-4 border-b">
                                <h2 className="text-xl font-bold text-slate-700 flex items-center gap-2">
                                    ✏️ Chỉnh sửa: <span className="text-blue-600">{editingApp.name}</span>
                                </h2>
                                <div className="flex items-center gap-2">
                                    {/* 1. NÚT IMPORT (Hiện khi tạo mới) */}
                                    {!editingApp.sheetName && (
                                        <>
                                            <input type="file" ref={fileInputRef} onChange={handleRestoreSystem} className="hidden" accept=".zip" />
                                            <button 
                                                onClick={() => fileInputRef.current.click()}
                                                className="bg-white text-slate-600 border border-slate-300 px-4 py-2 rounded-xl font-bold hover:bg-slate-50 flex items-center gap-2 shadow-sm transition-all"
                                            >
                                                <FileUp size={18}/> Import
                                            </button>
                                        </>
                                    )}

                                    {/* 3. NÚT LƯU (Cũ) */}
                                    <button onClick={handleSaveApp} disabled={isSavingApp} className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-blue-700 flex items-center gap-2 shadow transition-all active:scale-95">
                                        {isSavingApp ? "⏳ Đang lưu..." : <><Save size={18}/> LƯU CẤU HÌNH</>}
                                    </button>
                                </div>
                            </div>
                            
                            {/* --- DÒNG 1: CẤU HÌNH CƠ BẢN (FOLDER & TÊN APP) --- */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                
                                {/* Cột 1: Tên Folder */}
                                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 h-full shadow-sm">
                                    <label className="text-xs font-bold text-blue-600 uppercase mb-2 block">1. Tên Folder (Mã hệ thống)</label>
                                    <input 
                                        className="w-full p-3 border border-blue-200 rounded-xl font-mono text-lg font-bold text-blue-800 bg-white focus:ring-2 focus:ring-blue-500 outline-none" 
                                        value={editingApp.sheetName} 
                                        onChange={e => setEditingApp({...editingApp, sheetName: e.target.value})} 
                                        placeholder="VD: SOLAR_DN"
                                    />
                                    <p className="text-[11px] text-blue-400 mt-2 flex items-center gap-1"><Shield size={12}/> Định danh Folder ảnh & Sheet báo cáo.</p>
                                </div>

                                {/* Cột 2: Tên App */}
                                <div className="bg-white p-4 rounded-xl border border-slate-200 h-full shadow-sm">
                                    <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">2. Tên Ứng Dụng</label>
                                    <input 
                                        className="w-full p-3 border border-slate-300 rounded-xl font-bold text-lg text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none placeholder:font-normal" 
                                        value={editingApp.name} 
                                        onChange={e => setEditingApp({ ...editingApp, name: e.target.value})} 
                                        placeholder="VD: Checklist Bảo Trì Solar"
                                    />
                                    <p className="text-[11px] text-slate-400 mt-2">Tên này sẽ hiển thị trên giao diện chính.</p>
                                </div>
                            </div>

                            {/* --- DANH SÁCH CÂU HỎI (GIỮ NGUYÊN) --- */}
                            <div className="flex justify-between items-center mb-4 mt-8 pt-6 border-t border-slate-200">
                                <h3 className="font-bold text-slate-700 flex items-center gap-2"><LayoutGrid size={18}/> DANH SÁCH CÂU HỎI</h3>
                                <button onClick={() => setEditingApp({...editingApp, questions: [...editingApp.questions, {id: editingApp.questions.length + 1, title: '', desc: '', refImage: [], hasPhoto: true}]})} className="text-sm bg-slate-800 text-white px-4 py-2 rounded-lg hover:bg-black font-bold flex items-center gap-2 shadow-lg transition-transform active:scale-95">
                                    <Plus size={16}/> Thêm câu hỏi
                                </button>
                            </div>

                            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar pb-10">
                                {editingApp.questions.length === 0 && (
                                    <div className="text-center py-10 text-slate-400 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
                                        <p>Chưa có câu hỏi nào. Bấm "Thêm câu hỏi" để bắt đầu.</p>
                                    </div>
                                )}
                                
                                {editingApp.questions.map((q, idx) => (
                                    <div key={idx} className="border border-slate-200 p-4 rounded-xl bg-white shadow-sm relative group transition-all hover:shadow-md">
                                        <button onClick={() => { const newQs = editingApp.questions.filter((_, i) => i !== idx); setEditingApp({...editingApp, questions: newQs}); }} className="absolute top-3 right-3 text-slate-300 hover:text-red-500 p-1 transition-colors"><X size={20}/></button>
                                       
                                        <div className="flex items-center gap-2 mt-2 mb-2 bg-slate-50 p-2 rounded-lg border border-slate-100 w-fit">
                                            <span className="text-[10px] font-bold text-slate-500 uppercase">Yêu cầu chụp ảnh:</span>
                                            <button 
                                                onClick={() => {
                                                    const newQs = [...editingApp.questions];
                                                    const currentValue = q.hasPhoto !== false;
                                                    newQs[idx].hasPhoto = !currentValue;
                                                    setEditingApp({...editingApp, questions: newQs});
                                                }}
                                                className={`text-[10px] font-bold px-3 py-1 rounded-full transition-all ${q.hasPhoto !== false ? 'bg-green-600 text-white' : 'bg-slate-300 text-slate-600'}`}
                                            >
                                                {q.hasPhoto !== false ? "CÓ CHỤP HÌNH" : "CHỈ HIỂN THỊ (HƯỚNG DẪN)"}
                                            </button>
                                        </div>

                                        <div className="flex gap-3 mb-2 pr-8">
                                            <div className="flex flex-col items-center gap-1">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase">STT</span>
                                                <input type="number" className="w-12 p-2 border rounded-lg text-center font-bold bg-slate-50" value={q.id} onChange={(e) => { const newQs = [...editingApp.questions]; newQs[idx].id = parseInt(e.target.value); setEditingApp({...editingApp, questions: newQs}); }}
                                                onBlur={sortQuestions}
                                                />
                                            </div>
                                            <div className="flex-1">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase">Nội dung câu hỏi</span>
                                                <input className="w-full p-2 border rounded-lg font-bold text-slate-700 focus:border-blue-500 outline-none" placeholder="Nhập tiêu đề câu hỏi..." value={q.title} onChange={(e) => { const newQs = [...editingApp.questions]; newQs[idx].title = e.target.value; setEditingApp({...editingApp, questions: newQs}); }}/>
                                            </div>
                                        </div>
                                        
                                        <input className="w-full p-2 border rounded-lg text-sm bg-slate-50 mb-3 text-slate-600 focus:bg-white transition-colors outline-none" placeholder="Mô tả hướng dẫn (nếu có)..." value={q.desc} onChange={(e) => { const newQs = [...editingApp.questions]; newQs[idx].desc = e.target.value; setEditingApp({...editingApp, questions: newQs}); }}/>
                                        
                                        {/* Ảnh minh họa */}
                                        <div className="flex flex-wrap gap-2 items-center pt-3 border-t border-slate-100">
                                            <span className="text-xs font-bold text-slate-400 mr-2">ẢNH MẪU:</span>
                                            {(Array.isArray(q.refImage) ? q.refImage : []).map((imgUrl, i) => (
                                                <div key={i} className="relative w-14 h-14 rounded-lg border bg-slate-100 group/img overflow-hidden">
                                                    <img src={imgUrl} alt="ref" className="w-full h-full object-cover"/>
                                                    <button 
                                                        onClick={async () => { 
                                                            if(!confirm("Bạn có chắc muốn xóa vĩnh viễn ảnh này khỏi Server?")) return;

                                                            // 1. Gọi API xóa file gốc trên Server trước
                                                            try {
                                                                await fetch(`${BACKEND_URL}/delete-image`, {
                                                                    method: 'POST',
                                                                    headers: { 'Content-Type': 'application/json' },
                                                                    body: JSON.stringify({ imageUrl: imgUrl })
                                                                });
                                                            } catch (err) {
                                                                console.error("Lỗi gọi API xóa ảnh", err);
                                                                // Vẫn cho phép xóa UI nếu lỗi mạng để đỡ kẹt
                                                            }

                                                            // 2. Sau đó mới xóa link trên Giao diện (UI)
                                                            const newQs = [...editingApp.questions]; 
                                                            const currentImgs = newQs[idx].refImage; 
                                                            newQs[idx].refImage = currentImgs.filter(url => url !== imgUrl); 
                                                            setEditingApp({ ...editingApp, questions: newQs }); 
                                                        }} 
                                                        className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity"
                                                        title="Xóa ảnh vĩnh viễn"
                                                    >
                                                        <Trash2 size={16}/>
                                                    </button>
                                                </div>
                                            ))}
                                            <label className="w-14 h-14 border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-blue-50 hover:border-blue-400 text-slate-400 hover:text-blue-500 transition-all">
                                                <ImageIcon size={18}/>
                                                <input type="file" className="hidden" accept="image/*" onChange={(e) => handleUploadImage(idx, e)}/>
                                            </label>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                            <div className="bg-white p-6 rounded-full shadow-sm mb-4">
                                <Settings size={48} className="text-slate-300"/>
                            </div>
                            <p className="font-bold text-lg">Chưa chọn ứng dụng</p>
                            <p className="text-sm">Chọn một ứng dụng bên trái hoặc bấm "Thêm mới"</p>
                        </div>
                    )}
                </div>
            </div>
        )}

        {/* === TAB 3: KHO DỮ LIỆU (MỚI) === */}
        {activeTab === 'database' && (
            <div className="max-w-7xl mx-auto animate-in fade-in">
                <AdminDashboard currentUser={currentUser.username} isAdmin={currentUser.role === 'admin'} apps={apps} />
            </div>
        )}

        {/* === TAB 4: CÀI ĐẶT & USER (Giao diện cũ của bạn) === */}
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