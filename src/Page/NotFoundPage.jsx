import React, { useEffect } from 'react';
import { Home, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const NotFoundPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "404 - Not Found";
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-100 flex items-center justify-center p-4 overflow-hidden relative font-sans">
      
      {/* Hiệu ứng nền trang trí (Những quả bóng mờ ảo) */}
      <div className="absolute top-20 left-20 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
      <div className="absolute top-20 right-20 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>

      {/* KHUNG THÔNG BÁO CHÍNH */}
      <div className="relative bg-white/60 backdrop-blur-xl border border-white/50 shadow-2xl rounded-3xl p-10 md:p-16 text-center max-w-lg w-full transform hover:scale-[1.01] transition-transform duration-300">
        
        {/* Icon Bay Bay */}
        <div className="mb-6 relative">
             <div className="absolute inset-0 bg-red-200 blur-2xl opacity-50 rounded-full"></div>
             <AlertTriangle size={80} className="text-red-500 mx-auto relative z-10 animate-bounce" />
        </div>

        {/* Chữ 404 to đùng */}
        <h1 className="text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 mb-2 drop-shadow-sm">
          404
        </h1>

        <h2 className="text-2xl md:text-3xl font-bold text-slate-800 mb-4">
          Không tìm thấy trang yêu cầu
        </h2>
        
        <p className="text-slate-500 mb-8 text-lg">
          Đường dẫn bạn truy cập có thể đã bị thay đổi hoặc không tồn tại trong hệ thống báo cáo.
        </p>

        {/* Nút bấm quay về */}
        <button 
          onClick={() => navigate('/admin')}
          className="group relative inline-flex items-center justify-center gap-3 px-8 py-4 bg-slate-900 text-white font-bold rounded-2xl overflow-hidden transition-all hover:bg-blue-600 hover:shadow-lg hover:shadow-blue-500/30"
        >
          <Home size={20} className="group-hover:-translate-x-1 transition-transform"/>
          <span>Quay về trang chủ</span>
        </button>

      </div>

      {/* Footer nhỏ */}
      <div className="absolute bottom-6 text-slate-400 text-sm font-medium">
        System Error • Page Not Found
      </div>
    </div>
  );
};

export default NotFoundPage;