import React, { useState, useEffect } from 'react';
import { Lock, LogIn, LogOut, UserPlus, Settings, Trash2, Shield, User, Key } from 'lucide-react';
import { APP_DATA } from './ChecklistPage';

const AdminPage = () => {
  const BACKEND_URL = "http://solar-field.ddns.net:17004/api"; 
  
  useEffect(() => { document.title = "Get Link Dashboard"; }, []);

  const AVAILABLE_APPS = Object.values(APP_DATA).map(app => ({
    id: app.id, name: app.name, sheetName: app.sheetName,
    url: `${window.location.origin}/#/checklist/${app.id}`
  }));

  // --- STATE ---
  const [currentUser, setCurrentUser] = useState(null); 
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  
  // State bên TRÁI (Tạo Link)
  const [selectedApp, setSelectedApp] = useState(null); 
  const [code, setCode] = useState('');
  const [generatedLink, setGeneratedLink] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // State bên PHẢI (Quản trị)
  const [newPassForm, setNewPassForm] = useState({ old: '', new: '' });
  const [newUserForm, setNewUserForm] = useState({ user: '', pass: '' });
  const [userList, setUserList] = useState([]); // Danh sách user (Cho Admin)

  // --- LOGIC HỆ THỐNG ---

  // 1. ĐĂNG NHẬP
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
            // Nếu là admin thì tải luôn danh sách user
            if (user.role === 'admin') fetchUserList();
        } else { alert("❌ " + data.message); }
    } catch (err) { alert("Lỗi kết nối Server!"); }
  };

  useEffect(() => {
    const savedUser = localStorage.getItem('user_session');
    if (savedUser) {
        const user = JSON.parse(savedUser);
        setCurrentUser(user);
        if (user.role === 'admin') fetchUserList();
    }
  }, []);

  const handleLogout = () => {
    setCurrentUser(null); setUsername(""); setPassword("");
    localStorage.removeItem('user_session');
  };

  // 2. LẤY DANH SÁCH USER (Chỉ Admin)
  const fetchUserList = async () => {
    try {
        const res = await fetch(`${BACKEND_URL}/users`);
        const data = await res.json();
        if (data.status === 'success') setUserList(data.users);
    } catch (e) { console.error(e); }
  };

  // 3. XÓA USER (Chỉ Admin)
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

  // 4. TẠO USER MỚI (Chỉ Admin)
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

  // 5. ĐỔI MẬT KHẨU (Ai cũng dùng được)
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

  // --- LOGIC HELPER ---
  const handleCopy = (text) => {
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).then(()=>alert("Đã copy!")).catch(()=>fallbackCopy(text));
    else fallbackCopy(text);
  };
  const fallbackCopy = (text) => {
    var ta = document.createElement("textarea"); ta.value = text; ta.style.position="fixed"; 
    document.body.appendChild(ta); ta.focus(); ta.select(); 
    try { document.execCommand('copy'); alert("Đã copy!"); } catch (e) {}
    document.body.removeChild(ta);
  };
  const generateRandomToken = (l) => {
    const c = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let r = ''; for (let i=0; i<l; i++) r += c.charAt(Math.floor(Math.random()*c.length)); return r;
  };
  const handleCreateLink = async () => {
    if (!selectedApp || !code.trim()) return alert("Thiếu thông tin!");
    setIsLoading(true); setGeneratedLink('');
    const rawCode = code.trim().toUpperCase(); const t = generateRandomToken(15);
    const finalLink = `${selectedApp.url}?code=${t}`;
    try {
      const res = await fetch(`${BACKEND_URL}/create-link`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: rawCode, token: t, sheet_name: selectedApp.sheetName })
      });
      const r = await res.json();
      if (r.status === 'success') { setGeneratedLink(finalLink); handleCopy(finalLink); } 
      else { alert(r.message); }
    } catch (e) { alert("Lỗi Server: " + e.message); } finally { setIsLoading(false); }
  };

  // --- GIAO DIỆN 1: MÀN HÌNH ĐĂNG NHẬP ---
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

  // --- GIAO DIỆN 2: DASHBOARD CHIA ĐÔI ---
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl mx-auto">
        
        {/* === CỘT TRÁI: KHU VỰC LÀM VIỆC (GET LINK) === */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden h-fit">
            <div className="bg-blue-600 p-4 text-white font-bold text-lg flex items-center gap-2">
                <Settings size={20}/> TẠO LIÊN KẾT BÁO CÁO
            </div>
            <div className="p-6 space-y-6">
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">1. CHỌN ỨNG DỤNG</label>
                    <select className="w-full p-3 border rounded-xl outline-none focus:border-blue-500 bg-slate-50" 
                        onChange={(e) => { setSelectedApp(AVAILABLE_APPS.find(app => app.id === e.target.value)); setGeneratedLink(''); }} defaultValue="">
                        <option value="" disabled>-- Chọn ứng dụng --</option>
                        {AVAILABLE_APPS.map((app) => (<option key={app.id} value={app.id}>{app.name}</option>))}
                    </select>
                </div>
                {selectedApp && (
                    <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                        <label className="block text-sm font-bold text-slate-700 mb-2">2. NHẬP MÃ ({selectedApp.sheetName})</label>
                        <input type="text" value={code} onChange={(e) => setCode(e.target.value)} placeholder="VD: MAY-A" 
                            className="w-full p-3 border rounded-xl font-bold uppercase outline-none focus:border-blue-500 bg-slate-50" />
                        {!generatedLink && (
                            <button onClick={handleCreateLink} disabled={isLoading || !code} 
                                className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl shadow transition-all">
                                {isLoading ? "⏳ Đang xử lý..." : "🚀 TẠO LINK NGAY"}
                            </button>
                        )}
                    </div>
                )}
                {generatedLink && (
                    <div className="animate-pulse">
                        <div className="bg-green-50 border border-green-200 rounded-xl p-3 mb-2">
                            <p className="text-green-700 font-bold text-xs mb-1">✅ Link đã tạo:</p>
                            <div className="bg-white p-2 rounded border border-green-100 text-xs font-mono break-all text-slate-600">{generatedLink}</div>
                        </div>
                        <button onClick={() => handleCopy(generatedLink)} className="w-full bg-slate-800 text-white font-bold py-3 rounded-xl hover:bg-black">COPY LINK LẠI</button>
                    </div>
                )}
            </div>
        </div>

        {/* === CỘT PHẢI: KHU VỰC CÀI ĐẶT & QUẢN TRỊ === */}
        <div className="space-y-6">
            
            {/* 1. Đổi mật khẩu (Ai cũng thấy) */}
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
                <div className="bg-slate-700 p-4 text-white font-bold text-lg flex items-center gap-2">
                    <Key size={20}/> ĐỔI MẬT KHẨU CÁ NHÂN
                </div>
                <div className="p-6 space-y-3">
                    <input type="password" placeholder="Mật khẩu cũ" className="w-full p-3 border rounded-lg bg-slate-50"
                        value={newPassForm.old} onChange={e => setNewPassForm({...newPassForm, old: e.target.value})} />
                    <input type="password" placeholder="Mật khẩu mới" className="w-full p-3 border rounded-lg bg-slate-50"
                        value={newPassForm.new} onChange={e => setNewPassForm({...newPassForm, new: e.target.value})} />
                    <button onClick={handleChangePassword} className="w-full bg-slate-600 hover:bg-slate-700 text-white font-bold py-2 rounded-lg">Cập nhật mật khẩu</button>
                </div>
            </div>

            {/* 2. Quản lý User (CHỈ ADMIN MỚI THẤY) */}
            {currentUser.role === 'admin' && (
                <div className="bg-white rounded-2xl shadow-lg border border-orange-200 overflow-hidden">
                    <div className="bg-orange-600 p-4 text-white font-bold text-lg flex items-center gap-2">
                        <UserPlus size={20}/> QUẢN LÝ TÀI KHOẢN (ADMIN)
                    </div>
                    
                    {/* Form tạo user */}
                    <div className="p-6 border-b border-slate-100">
                        <h3 className="text-sm font-bold text-slate-700 mb-3 uppercase">Tạo tài khoản mới</h3>
                        <div className="flex gap-2 mb-3">
                            <input placeholder="Username" className="flex-1 p-3 border rounded-lg bg-slate-50"
                                value={newUserForm.user} onChange={e => setNewUserForm({...newUserForm, user: e.target.value})} />
                            <input placeholder="Password" className="flex-1 p-3 border rounded-lg bg-slate-50"
                                value={newUserForm.pass} onChange={e => setNewUserForm({...newUserForm, pass: e.target.value})} />
                        </div>
                        <button onClick={handleCreateUser} className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 rounded-lg">Thêm nhân viên</button>
                    </div>

                    {/* Danh sách user */}
                    <div className="p-6 bg-orange-50/30">
                        <h3 className="text-sm font-bold text-slate-700 mb-3 uppercase">Danh sách nhân viên</h3>
                        <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                            {userList.map((u, idx) => (
                                <div key={idx} className="flex justify-between items-center p-3 bg-white rounded-lg border border-slate-200 shadow-sm">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-full ${u.role === 'admin' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                                            <User size={16} />
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-800">{u.username}</p>
                                            <p className="text-xs text-slate-500 uppercase">{u.role}</p>
                                        </div>
                                    </div>
                                    {u.username !== 'admin' && u.username !== currentUser.username && (
                                        <button onClick={() => handleDeleteUser(u.username)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors" title="Xóa tài khoản này">
                                            <Trash2 size={18} />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>

      </div>
    </div>
  );
};

export default AdminPage;