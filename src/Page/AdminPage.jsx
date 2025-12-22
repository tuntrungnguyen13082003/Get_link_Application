import React, { useState, useEffect } from 'react';
import { Lock, LogIn, LogOut, Users, Link as LinkIcon, Plus, Trash2, KeyRound, Save } from 'lucide-react';
import { APP_DATA } from './ChecklistPage'; // Nhớ import đúng file

const AdminPage = () => {
  // --- CẤU HÌNH ---
  // Thay LINK SCRIPT MỚI CỦA BẠN VÀO ĐÂY
  const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxTHnebOkrRRHZYsiI5JzeHvTZrSalCz-EikuUkBXb4Brbo4JxXky9j2rq2zH_nzC-mug/exec"; 

  const AVAILABLE_APPS = APP_DATA ? Object.values(APP_DATA).map(app => ({
    id: app.id, name: app.name, sheetName: app.sheetName,
    url: `${window.location.origin}/report/${app.id}`
  })) : [];

  // --- STATE ---
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(""); // Lưu user đang đăng nhập
  const [activeTab, setActiveTab] = useState("link"); // 'link' hoặc 'users'
  
  // Login State
  const [loginUser, setLoginUser] = useState("");
  const [loginPass, setLoginPass] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Link Gen State
  const [selectedApp, setSelectedApp] = useState(null); 
  const [code, setCode] = useState('');
  const [generatedLink, setGeneratedLink] = useState('');

  // User Mgmt State
  const [userList, setUserList] = useState([]);
  const [newUser, setNewUser] = useState("");
  const [newPass, setNewPass] = useState("");
  const [editingUser, setEditingUser] = useState(null); // User đang được chọn để đổi mk

  useEffect(() => { document.title = "Admin System"; }, []);

  // --- LOGIC API GỌI GOOGLE SCRIPT ---
  const callApi = async (body) => {
    setIsLoading(true);
    try {
      const res = await fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        body: JSON.stringify(body)
      });
      const data = await res.json();
      setIsLoading(false);
      return data;
    } catch (error) {
      setIsLoading(false);
      alert("Lỗi kết nối: " + error.message);
      return { status: "error" };
    }
  };

  // 1. XỬ LÝ ĐĂNG NHẬP
  const handleLogin = async (e) => {
    e.preventDefault();
    const res = await callApi({ action: "login", username: loginUser, password: loginPass });
    if (res.status === "success") {
      setIsLoggedIn(true);
      setCurrentUser(loginUser);
      // Nếu đăng nhập thành công thì tải luôn danh sách user
      fetchUserList();
    } else {
      alert(res.message);
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false); setLoginUser(""); setLoginPass(""); setActiveTab("link");
  };

  // 2. XỬ LÝ TẠO LINK (Giữ nguyên logic cũ)
  const handleCreateLink = async () => {
    if (!selectedApp || !code.trim()) return alert("Thiếu thông tin!");
    const randomToken = Math.random().toString(36).substring(2, 10).toUpperCase();
    const finalLink = `${selectedApp.url}?code=${randomToken}`; 
    
    const res = await callApi({
      action: "create_link",
      code: code.trim().toUpperCase(),
      full_link: finalLink,
      sheet_name: selectedApp.sheetName
    });

    if (res.status === "success") {
      setGeneratedLink(finalLink);
      navigator.clipboard.writeText(finalLink);
    } else {
      alert("Lỗi: " + res.message);
    }
  };

  // 3. QUẢN LÝ USER: Lấy danh sách
  const fetchUserList = async () => {
    const res = await callApi({ action: "get_users" });
    if (res.status === "success") setUserList(res.data);
  };

  // 4. QUẢN LÝ USER: Tạo mới
  const handleAddUser = async () => {
    if (!newUser || !newPass) return alert("Nhập đủ tên và mật khẩu!");
    const res = await callApi({ action: "create_user", new_username: newUser, new_password: newPass });
    if (res.status === "success") {
      alert("✅ Tạo user thành công!");
      setNewUser(""); setNewPass("");
      fetchUserList(); // Load lại bảng
    } else {
      alert("Lỗi: " + res.message);
    }
  };

  // 5. QUẢN LÝ USER: Xóa
  const handleDeleteUser = async (targetUser) => {
    if (targetUser === "admin") return alert("Không được xóa Admin gốc!");
    if (!window.confirm(`Bạn chắc chắn muốn xóa user: ${targetUser}?`)) return;
    
    const res = await callApi({ action: "delete_user", target_username: targetUser });
    if (res.status === "success") fetchUserList();
  };

  // 6. QUẢN LÝ USER: Đổi mật khẩu
  const handleChangePass = async () => {
    if (!newPass) return alert("Vui lòng nhập mật khẩu mới!");
    const res = await callApi({ 
      action: "change_password", 
      target_username: editingUser, 
      new_password: newPass 
    });
    if (res.status === "success") {
      alert("✅ Đổi mật khẩu thành công!");
      setEditingUser(null); setNewPass("");
      fetchUserList();
    } else {
      alert("Lỗi: " + res.message);
    }
  };


  // --- GIAO DIỆN ĐĂNG NHẬP ---
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4 font-sans">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200">
          <div className="bg-slate-800 p-8 text-center text-white">
            <Lock size={40} className="mx-auto mb-4 text-blue-400" />
            <h1 className="text-2xl font-bold uppercase">Hệ Thống Admin</h1>
          </div>
          <form onSubmit={handleLogin} className="p-8 space-y-4">
            <input type="text" value={loginUser} onChange={(e)=>setLoginUser(e.target.value)} className="w-full p-3 bg-slate-50 border rounded-xl" placeholder="Tài khoản (VD: admin)"/>
            <input type="password" value={loginPass} onChange={(e)=>setLoginPass(e.target.value)} className="w-full p-3 bg-slate-50 border rounded-xl" placeholder="Mật khẩu"/>
            <button disabled={isLoading} className="w-full bg-blue-600 text-white p-3 rounded-xl font-bold hover:bg-blue-700">
              {isLoading ? "Đang kiểm tra..." : "ĐĂNG NHẬP"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // --- GIAO DIỆN CHÍNH (SAU KHI LOGIN) ---
  return (
    <div className="min-h-screen bg-slate-100 font-sans p-4 md:p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden min-h-[600px] flex flex-col">
        
        {/* HEADER */}
        <div className="bg-slate-800 text-white p-4 flex justify-between items-center">
          <h1 className="font-bold text-lg flex items-center gap-2"><Lock size={18}/> Admin Dashboard</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-400">Xin chào, {currentUser}</span>
            <button onClick={handleLogout} className="bg-slate-700 hover:bg-red-600 p-2 rounded-full transition-colors"><LogOut size={16}/></button>
          </div>
        </div>

        {/* NAVIGATION TABS */}
        <div className="flex border-b border-slate-200">
          <button onClick={() => setActiveTab("link")} className={`flex-1 py-4 font-bold flex items-center justify-center gap-2 ${activeTab === "link" ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50" : "text-slate-500 hover:bg-slate-50"}`}>
            <LinkIcon size={18}/> Tạo Link Báo Cáo
          </button>
          <button onClick={() => setActiveTab("users")} className={`flex-1 py-4 font-bold flex items-center justify-center gap-2 ${activeTab === "users" ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50" : "text-slate-500 hover:bg-slate-50"}`}>
            <Users size={18}/> Quản Lý User
          </button>
        </div>

        {/* CONTENT AREA */}
        <div className="p-6 flex-1 bg-slate-50">
          
          {/* TAB 1: TẠO LINK (Giữ nguyên giao diện cũ của bạn nhưng gọn hơn) */}
          {activeTab === "link" && (
            <div className="max-w-md mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4">
              <div>
                <label className="font-bold text-slate-700 block mb-2">Chọn ứng dụng</label>
                <select className="w-full p-3 border rounded-xl" onChange={(e) => {setSelectedApp(AVAILABLE_APPS.find(a=>a.id===e.target.value)); setGeneratedLink('');}}>
                  <option value="">-- Chọn App --</option>
                  {AVAILABLE_APPS.map(app => <option key={app.id} value={app.id}>{app.name}</option>)}
                </select>
              </div>
              
              {selectedApp && (
                <>
                  <div>
                    <label className="font-bold text-slate-700 block mb-2">Mã báo cáo ({selectedApp.sheetName})</label>
                    <input type="text" className="w-full p-3 border rounded-xl font-bold uppercase" placeholder="NHẬP MÃ..." value={code} onChange={(e) => setCode(e.target.value)} onFocus={() => setGeneratedLink('')}/>
                  </div>
                  {!generatedLink && (
                    <button onClick={handleCreateLink} disabled={isLoading} className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl shadow hover:bg-blue-700">
                      {isLoading ? "Đang xử lý..." : "🚀 TẠO LINK"}
                    </button>
                  )}
                </>
              )}

              {generatedLink && (
                <div className="bg-green-100 p-4 rounded-xl border border-green-300 text-center">
                  <p className="text-green-800 font-bold text-sm mb-1">Link đã tạo & Copy:</p>
                  <div className="text-xs break-all font-mono bg-white p-2 rounded border">{generatedLink}</div>
                  <button onClick={() => navigator.clipboard.writeText(generatedLink)} className="mt-2 text-xs text-blue-600 font-bold underline">Copy lại</button>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: QUẢN LÝ USER (Tính năng mới) */}
          {activeTab === "users" && (
            <div className="animate-in fade-in slide-in-from-bottom-4">
              
              {/* Form thêm User mới */}
              <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6 flex flex-col md:flex-row gap-2 items-end">
                <div className="flex-1 w-full">
                  <label className="text-xs font-bold text-slate-500 ml-1">Tên đăng nhập mới</label>
                  <input type="text" value={newUser} onChange={(e)=>setNewUser(e.target.value)} className="w-full p-2 border rounded-lg" placeholder="VD: kythuatvien1"/>
                </div>
                <div className="flex-1 w-full">
                  <label className="text-xs font-bold text-slate-500 ml-1">Mật khẩu</label>
                  <input type="text" value={newPass} onChange={(e)=>setNewPass(e.target.value)} className="w-full p-2 border rounded-lg" placeholder="Nhập mật khẩu..."/>
                </div>
                <button onClick={handleAddUser} disabled={isLoading} className="bg-green-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-green-700 flex items-center gap-1 h-10 w-full md:w-auto justify-center">
                  <Plus size={18}/> Thêm
                </button>
              </div>

              {/* Bảng danh sách User */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-600 text-sm uppercase">
                      <th className="p-4">Username</th>
                      <th className="p-4">Mật khẩu</th>
                      <th className="p-4 text-center">Hành động</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {userList.map((user, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="p-4 font-medium text-slate-800">{user.username} {user.role === 'admin' && <span className="text-[10px] bg-yellow-100 text-yellow-800 px-1 rounded border border-yellow-200">ADMIN</span>}</td>
                        <td className="p-4 text-slate-500 font-mono">
                           {editingUser === user.username ? (
                             <div className="flex gap-1">
                               <input type="text" className="border p-1 rounded w-32 text-sm" placeholder="Mật khẩu mới..." value={newPass} onChange={(e)=>setNewPass(e.target.value)} autoFocus/>
                               <button onClick={handleChangePass} className="bg-blue-600 text-white p-1 rounded"><Save size={14}/></button>
                               <button onClick={()=>{setEditingUser(null); setNewPass("")}} className="bg-gray-400 text-white p-1 rounded">✕</button>
                             </div>
                           ) : (
                             "••••••" // Che mật khẩu cho an toàn
                           )}
                        </td>
                        <td className="p-4 flex justify-center gap-2">
                          <button onClick={()=>{setEditingUser(user.username); setNewPass("");}} title="Đổi mật khẩu" className="p-2 text-blue-600 hover:bg-blue-50 rounded-full"><KeyRound size={18}/></button>
                          {user.role !== 'admin' && (
                            <button onClick={()=>handleDeleteUser(user.username)} title="Xóa User" className="p-2 text-red-500 hover:bg-red-50 rounded-full"><Trash2 size={18}/></button>
                          )}
                        </td>
                      </tr>
                    ))}
                    {userList.length === 0 && <tr><td colSpan="3" className="p-8 text-center text-slate-400">Đang tải danh sách...</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default AdminPage;