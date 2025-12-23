import React, { useState, useEffect } from 'react';
import { Lock, User, Key, LogIn, LogOut } from 'lucide-react';
import { APP_DATA } from './ChecklistPage';

const AdminPage = () => {
  // --- CẤU HÌNH ---
  const ADMIN_USER = "admin";
  const ADMIN_PASS = "admin";
  
  // THAY ĐỔI TẠI ĐÂY: Trỏ về cổng 3001 của Server Ubuntu thay vì Google Script
  const BACKEND_URL = "http://solar-field.ddns.net:3001/api"; 

  useEffect(() => {
    document.title = "Get Link Sys";
  }, []);

  const AVAILABLE_APPS = Object.values(APP_DATA).map(app => ({
    id: app.id,
    name: app.name,
    sheetName: app.sheetName,
    url: `${window.location.origin}/#/checklist/${app.id}`
  }));

  // --- STATE ---
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [selectedApp, setSelectedApp] = useState(null); 
  const [code, setCode] = useState('');
  const [generatedLink, setGeneratedLink] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // --- LOGIC ---
  const handleLogin = (e) => {
    e.preventDefault(); 
    if (username === ADMIN_USER && password === ADMIN_PASS) {
      setIsLoggedIn(true);
    } else {
      alert("❌ Incorrect account or password!");
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false); setUsername(""); setPassword(""); setSelectedApp(null); setCode(""); setGeneratedLink("");
  };

  const generateRandomToken = (length) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  // --- HÀM TẠO LINK (ĐÃ SỬA ĐỂ GỬI VỀ SERVER UBUNTU) ---
  const handleCreateLink = async () => {
    if (!selectedApp) return alert("Vui lòng chọn ứng dụng trước!");
    if (!code.trim()) return alert("Vui lòng nhập mã báo cáo!");
    
    setIsLoading(true);
    setGeneratedLink('');

    const rawCode = code.trim().toUpperCase();
    const randomToken = generateRandomToken(15);
    const finalLink = `${selectedApp.url}?code=${randomToken}`;

    try {
      // Gửi yêu cầu lưu mã vào database.json trên máy chủ
      const response = await fetch(`${BACKEND_URL}/create-link`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create_link",
          code: rawCode,
          token: randomToken,       
          full_link: finalLink,
          sheet_name: selectedApp.sheetName 
        })
      });
      
      const result = await response.json();
      if (result.status === 'success') {
        setGeneratedLink(finalLink);
        alert(`✅ Đã tạo mã và lưu vào máy chủ thành công`);
        
        // Xử lý Clipboard an toàn cho HTTP
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(finalLink).catch(err => console.error(err));
        }
      } else {
        alert("Lỗi Server: " + result.message);
      }
    } catch (error) {
      alert("Lỗi kết nối Server (Cổng 3001): " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(generatedLink);
        alert("✅ Đã copy link!");
    } else {
        alert("Tính năng copy bị trình duyệt chặn trên HTTP. Vui lòng copy thủ công.");
    }
  };

  // --- GIAO DIỆN GIỮ NGUYÊN 100% ---
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4 font-sans">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200">
          <div className="bg-slate-800 p-8 text-center text-white">
            <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
               <Lock size={32} className="text-blue-400" />
            </div>
            <h1 className="text-2xl font-bold uppercase tracking-wider">Get Link</h1>
          </div>
          <form onSubmit={handleLogin} className="p-8 space-y-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">User</label>
              <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full pl-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none" placeholder="Enter Account"/>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full pl-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none" placeholder="Enter Password"/>
            </div>
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl shadow-lg flex items-center justify-center gap-2"><LogIn size={20}/> SIGN IN</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-100 font-sans">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200">
        <div className="bg-blue-600 p-6 text-center text-white relative">
          <h1 className="text-2xl font-bold uppercase tracking-wider">Hệ Thống Get Link</h1>
          <button onClick={handleLogout} className="absolute top-6 right-6 p-2 bg-blue-700 rounded-full hover:bg-blue-800 text-xs flex items-center gap-1">
            <LogOut size={16}/>
          </button>
        </div>
        <div className="p-8 space-y-6">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">1. CHỌN ỨNG DỤNG</label>
            <select 
              className="w-full p-4 bg-white border-2 border-slate-200 rounded-xl outline-none focus:border-blue-500 font-medium cursor-pointer" 
              onChange={(e) => { 
                  setSelectedApp(AVAILABLE_APPS.find(app => app.id === e.target.value)); 
                  setGeneratedLink(''); 
              }} 
              defaultValue=""
            >
              <option value="" disabled>-- Nhấn để chọn ứng dụng --</option>
              {AVAILABLE_APPS.map((app) => (<option key={app.id} value={app.id}>{app.name}</option>))}
            </select>
          </div>
          {selectedApp && (
            <div className="animate-in fade-in slide-in-from-top-4 duration-300">
              <label className="block text-sm font-bold text-slate-700 mb-2">2. NHẬP MÃ ({selectedApp.sheetName})</label>
              <input 
                type="text" 
                value={code} 
                onFocus={() => setGeneratedLink('')} 
                onChange={(e) => {
                    setCode(e.target.value);
                    if (generatedLink) setGeneratedLink(''); 
                }} 
                placeholder="VD: MAY-A-NGAY-B" 
                className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-xl outline-none focus:border-blue-500 text-lg font-bold uppercase"
              />
              {!generatedLink && (
                  <button 
                    onClick={handleCreateLink} 
                    disabled={isLoading || !code} 
                    className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all"
                  >
                    {isLoading ? "⏳ ĐANG XỬ LÝ..." : "🚀 TẠO LINK NGAY"}
                  </button>
              )}
            </div>
          )}
          {generatedLink && (
            <div className="mt-6 animate-pulse">
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-3 relative">
                <p className="text-green-700 font-bold text-sm mb-2 flex justify-between">
                    <span>✅ Link ({selectedApp.sheetName}):</span>
                    <span className="text-[10px] bg-green-200 px-2 py-0.5 rounded text-green-800">Đã tự động copy</span>
                </p>
                <div className="bg-white p-2 rounded border border-green-100 text-xs font-mono text-slate-600 break-all">
                    {generatedLink}
                </div>
              </div>
              <button onClick={copyToClipboard} className="w-full bg-slate-800 text-white font-bold py-3 rounded-xl hover:bg-black transition-colors">
                COPY LINK LẠI
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPage;