import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import * as Icons from 'lucide-react';

const HomePage = () => {
  const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbw9LCBL0ahbD-M7ENyUymlIkd2ImYep6POzdX-Bbsqqi4MqetR0Pna3yB4TysBsYxYa7w/exec"; 
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(GOOGLE_SCRIPT_URL, { method: "POST", body: JSON.stringify({ action: "get_all_apps" }) })
    .then(r => r.json())
    .then(data => {
      if(data.status === 'success') setApps(Object.values(data.data));
      setLoading(false);
    });
  }, []);

  const getIcon = (iconName) => {
    const IconComponent = Icons[iconName] || Icons.FileText;
    return <IconComponent size={32} />;
  };

  return (
    <div className="min-h-screen bg-slate-100 p-6 font-sans">
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold text-center text-slate-800 mb-8">DANH SÁCH CÔNG VIỆC</h1>
        {loading ? <div className="text-center">⏳ Đang tải...</div> : (
          <div className="grid gap-4">
            {apps.map((app) => (
              <Link to={`/checklist/${app.id}`} key={app.id} className="block group">
                <div className="bg-white p-6 rounded-2xl shadow-sm border flex items-center gap-4 hover:border-blue-500 hover:shadow-md transition-all">
                  <div className="w-16 h-16 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white">
                    {getIcon(app.icon)}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{app.name}</h3>
                    <p className="text-xs text-slate-400 font-bold uppercase">{app.reportName}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
        <div className="mt-12 text-center"><Link to="/admin" className="text-sm text-slate-400 underline">Vào trang Admin</Link></div>
      </div>
    </div>
  );
};
export default HomePage;