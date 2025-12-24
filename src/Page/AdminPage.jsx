import React, { useState, useEffect } from 'react';
import { Lock, User, Key, LogIn, LogOut, UserPlus, Settings } from 'lucide-react';
import { APP_DATA } from './ChecklistPage';

const AdminPage = () => {
  const BACKEND_URL = "http://solar-field.ddns.net:17004/api"; 

  useEffect(() => { document.title = "Get Link Sys"; }, []);

  const AVAILABLE_APPS = Object.values(APP_DATA).map(app => ({
    id: app.id, name: app.name, sheetName: app.sheetName,
    url: `${window.location.origin}/#/checklist/${app.id}`
  }));

  // --- STATE ---
  const [currentUser, setCurrentUser] = useState(null); // Lưu thông tin user đang login
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  
  // State cho chức năng chính
  const [selectedApp, setSelectedApp] = useState(null); 
  const [code, setCode] = useState('');
  const [generatedLink, setGeneratedLink] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // State cho Modal quản lý tài khoản
  const [showSettings, setShowSettings] = useState(false);
  const [newPassForm, setNewPassForm] = useState({ old: '', new: '' });
  const [newUserForm, setNewUserForm] = useState({ user: '', pass: '' });

  // --- LOGIC HỆ THỐNG ---

  // 1. ĐĂNG NHẬP (Gọi API)
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
        const res = await fetch(`${BACKEND_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await res.json();
        
        if (data.status === 'success') {
            setCurrentUser(data.user); // Lưu user vào state
            localStorage.setItem('user_session', JSON.stringify(data.user)); // Lưu phiên đăng nhập
        } else {
            alert("❌ " + data.message);
        }
    } catch (err) { alert("Lỗi kết nối Server!"); }
  };

  // Tự động đăng nhập nếu còn phiên
  useEffect(() => {
    const savedUser = localStorage.getItem('user_session');
    if (savedUser) setCurrentUser(JSON.parse(savedUser));
  }, []);

  // 2. ĐĂNG XUẤT
  const handleLogout = () => {
    setCurrentUser(null); setUsername(""); setPassword("");
    localStorage.removeItem('user_session');
  };

  // 3. ĐỔI MẬT KHẨU
  const handleChangePassword = async () => {
    if (!newPassForm.old || !newPassForm.new) return alert("Vui lòng nhập đủ thông tin!");
    const res = await fetch(`${BACKEND_URL}/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            username: currentUser.username, 
            oldPassword: newPassForm.old, 
            newPassword: newPassForm.new 
        })
    });
    const data = await res.json();
    alert(data.message);
    if(data.status === 'success') setNewPassForm({ old: '', new: '' });
  };

  // 4. TẠO USER MỚI
  const handleCreateUser = async () => {
    if (!newUserForm.user || !newUserForm.pass) return alert("Vui lòng nhập đủ thông tin!");
    const res = await fetch(`${BACKEND_URL}/create-user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            newUsername: newUserForm.user, 
            newPassword: newUserForm.pass 
        })
    });
    const data = await res.json();
    alert(data.message);
    if(data.status === 'success') setNewUserForm({ user: '', pass: '' });
  };

  // --- LOGIC TẠO LINK & COPY (Giữ nguyên logic cũ của bạn) ---
  const handleCopy = (textToCopy) => { /* ...Giữ nguyên hàm copy đa năng nãy tôi đưa... */ 
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(textToCopy).then(() => {}).catch(() => fallbackCopyTextToClipboard(textToCopy));
    } else { fallbackCopyTextToClipboard(textToCopy); }
  };
  const fallbackCopyTextToClipboard = (text) => { /* ...Giữ nguyên hàm fallback... */
    var textArea = document.createElement("textarea"); textArea.value = text;
    textArea.style.position = "fixed"; document.body.appendChild(textArea);
    textArea.focus(); textArea.select();
    try { document.execCommand('copy'); } catch (err) {}
    document.body.removeChild(textArea);
  };

  const generateRandomToken = (length) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = ''; for (let i = 0; i < length; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
    return result;
  };

  const handleCreateLink = async () => {
    if (!selectedApp || !code.trim()) return alert("Thiếu thông tin!");
    setIsLoading(true); setGeneratedLink('');
    const rawCode = code.trim().toUpperCase();
    const randomToken = generateRandomToken(15);
    const finalLink = `${selectedApp.url}?code=${randomToken}`;

    try {
      const response = await fetch(`${BACKEND_URL}/create-link`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: rawCode, token: randomToken, sheet_name: selectedApp.sheetName })
      });
      const result = await response.json();
      if (result.status === 'success') {
        setGeneratedLink(finalLink);
        alert(`✅ Đã tạo mã thành công`);
        handleCopy(finalLink);
      } else { alert(result.message); }
    } catch (error) { alert("Lỗi kết nối Server: " + error.message); } 
    finally { setIsLoading(false); }
  };


  // --- GIAO DIỆN ---
  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4 font-sans">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200">
          <div className="bg-slate-800 p-8 text-center text-white">
            <h1 className="text-2xl font-bold uppercase">ĐĂNG NHẬP HỆ THỐNG</h1>
            <p className="text-sm text-slate-400 mt-2">Server V2.0 - Secure Access</p>
          </div>
          <form onSubmit={handleLogin} className="p-8 space-y-6">
            <div>
              <label className="font-bold text-slate-700">Tài khoản</label>
              <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full p-3 bg-slate-50 border rounded-xl mt-1" />
            </div>
            <div>
              <label className="font-bold text-slate-700">Mật khẩu</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full p-3 bg-slate-50 border rounded-xl mt-1" />
            </div>
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl shadow-lg">ĐĂNG NHẬP</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-100 font-sans relative">
      
      {/* Nút cài đặt tài khoản */}
      <button onClick={() => setShowSettings(!showSettings)} className="fixed top-4 left-4 bg-white p-3 rounded-full shadow-lg hover:bg-slate-200 z-50">
        <Settings size={24} className="text-slate-700" />
      </button>

      {/* PANEL CÀI ĐẶT (Hiện khi bấm nút bánh răng) */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-lg rounded-2xl p-6 shadow-2xl animate-in zoom-in duration-200">
                <div className="flex justify-between items-center mb-6 border-b pb-4">
                    <h2 className="text-xl font-bold text-slate-800">Quản lý tài khoản</h2>
                    <button onClick={() => setShowSettings(false)} className="text-red-500 font-bold">ĐÓNG</button>
                </div>
                
                {/* Form Đổi mật khẩu */}
                <div className="mb-6">
                    <h3 className="font-bold text-blue-600 mb-2 flex items-center gap-2"><Key size={18}/> Đổi mật khẩu</h3>
                    <input placeholder="Mật khẩu cũ" type="password" className="w-full p-2 border rounded mb-2" 
                        value={newPassForm.old} onChange={e => setNewPassForm({...newPassForm, old: e.target.value})} />
                    <input placeholder="Mật khẩu mới" type="password" className="w-full p-2 border rounded mb-2"
                        value={newPassForm.new} onChange={e => setNewPassForm({...newPassForm, new: e.target.value})} />
                    <button onClick={handleChangePassword} className="bg-blue-600 text-white px-4 py-2 rounded w-full">Cập nhật mật khẩu</button>
                </div>

                {/* Form Tạo User mới (Chỉ hiện nếu cần) */}
                <div className="pt-4 border-t">
                    <h3 className="font-bold text-green-600 mb-2 flex items-center gap-2"><UserPlus size={18}/> Tạo User mới</h3>
                    <div className="flex gap-2">
                        <input placeholder="Username mới" className="flex-1 p-2 border rounded" 
                            value={newUserForm.user} onChange={e => setNewUserForm({...newUserForm, user: e.target.value})} />
                        <input placeholder="Password" className="flex-1 p-2 border rounded" 
                            value={newUserForm.pass} onChange={e => setNewUserForm({...newUserForm, pass: e.target.value})} />
                    </div>
                    <button onClick={handleCreateUser} className="bg-green-600 text-white px-4 py-2 rounded w-full mt-2">Tạo tài khoản</button>
                </div>
            </div>
        </div>
      )}

      {/* GIAO DIỆN CHÍNH (TẠO LINK) */}
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200">
        <div className="bg-blue-600 p-6 text-center text-white relative">
          <h1 className="text-2xl font-bold uppercase">Hệ Thống Get Link</h1>
          <p className="text-sm opacity-80">Xin chào, {currentUser.username}!</p>
          <button onClick={handleLogout} className="absolute top-6 right-6 p-2 bg-blue-700 rounded-full hover:bg-blue-800">
            <LogOut size={16}/>
          </button>
        </div>

        <div className="p-8 space-y-6">
           {/* ...Phần chọn App và nhập mã giữ nguyên như cũ... */}
           <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">1. CHỌN ỨNG DỤNG</label>
            <select className="w-full p-4 border-2 rounded-xl outline-none" onChange={(e) => { setSelectedApp(AVAILABLE_APPS.find(app => app.id === e.target.value)); setGeneratedLink(''); }} defaultValue="">
              <option value="" disabled>-- Chọn ứng dụng --</option>
              {AVAILABLE_APPS.map((app) => (<option key={app.id} value={app.id}>{app.name}</option>))}
            </select>
          </div>
          
          {selectedApp && (
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">2. NHẬP MÃ ({selectedApp.sheetName})</label>
              <input type="text" value={code} onChange={(e) => setCode(e.target.value)} placeholder="VD: MAY-A" className="w-full p-4 border-2 rounded-xl font-bold uppercase" />
              {!generatedLink && (
                 <button onClick={handleCreateLink} disabled={isLoading || !code} className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg">
                   {isLoading ? "⏳..." : "🚀 TẠO LINK"}
                 </button>
              )}
            </div>
          )}

          {generatedLink && (
            <div className="mt-6">
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-3">
                 <p className="text-green-700 font-bold text-sm mb-2">✅ Link đã tạo:</p>
                 <div className="bg-white p-2 rounded border border-green-100 text-xs font-mono break-all">{generatedLink}</div>
              </div>
              <button onClick={() => { handleCopy(generatedLink); alert("✅ Đã copy!"); }} className="w-full bg-slate-800 text-white font-bold py-3 rounded-xl hover:bg-black">COPY LINK LẠI</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPage;