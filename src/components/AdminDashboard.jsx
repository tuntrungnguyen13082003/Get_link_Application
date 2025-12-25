import React, { useEffect, useState } from 'react';
import { Trash2, FileText, ExternalLink, ShieldAlert, FolderOpen } from 'lucide-react';

const AdminDashboard = ({ currentUser }) => {
    // 👇👇 Sửa đúng IP/Port Server của bạn
    const API_URL = "http://solar-field.ddns.net:17004/api"; 
    
    const [groupedData, setGroupedData] = useState({});
    const [activeSheet, setActiveSheet] = useState('');
    const [loading, setLoading] = useState(false);

    // 1. Load dữ liệu (Dùng Fetch cho giống AdminPage)
    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/admin/reports`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ requester: currentUser })
            });
            const json = await res.json();
            if (json.status === 'success') {
                processData(json.data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    // 2. Xử lý chia nhóm
    const processData = (data) => {
        const groups = {};
        data.reverse().forEach(item => {
            const sheet = item.sheetName || "Chưa phân loại";
            if (!groups[sheet]) groups[sheet] = [];
            groups[sheet].push(item);
        });
        setGroupedData(groups);
        if (!activeSheet && Object.keys(groups).length > 0) {
            setActiveSheet(Object.keys(groups)[0]);
        }
    };

    // 3. Xóa 1 dòng
    const handleDeleteRow = async (token) => {
        if (!window.confirm("Bạn muốn xóa dòng báo cáo này?")) return;
        try {
            await fetch(`${API_URL}/admin/delete-record`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token })
            });
            fetchData();
        } catch (e) { alert("Lỗi xóa dòng!"); }
    };

    // 4. Xóa cả Sheet
    const handleDeleteSheet = async () => {
        const confirmCode = prompt(`CẢNH BÁO NGUY HIỂM!\nNhập chữ "XOA" để xóa toàn bộ dữ liệu của "${activeSheet}":`);
        if (confirmCode !== "XOA") return;
        try {
            await fetch(`${API_URL}/admin/delete-sheet`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sheetName: activeSheet })
            });
            setActiveSheet('');
            fetchData();
        } catch (e) { alert("Lỗi xóa sheet!"); }
    };

    return (
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden animate-in fade-in">
            {/* Header màu tím cho khác biệt */}
            <div className="bg-purple-700 p-6 text-white flex justify-between items-center">
                <h2 className="text-xl font-bold flex items-center gap-2">
                    <FolderOpen size={24}/> KHO DỮ LIỆU TẬP TRUNG
                </h2>
                <button onClick={fetchData} className="text-sm bg-purple-600 hover:bg-purple-500 px-3 py-1 rounded border border-purple-400">
                    Làm mới
                </button>
            </div>

            <div className="p-6">
                {/* 1. Tab Sheet */}
                <div className="flex gap-2 mb-6 overflow-x-auto pb-2 border-b border-slate-200">
                    {Object.keys(groupedData).map(sheet => (
                        <button 
                            key={sheet}
                            onClick={() => setActiveSheet(sheet)}
                            className={`px-4 py-2 rounded-lg font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
                                activeSheet === sheet 
                                ? 'bg-purple-100 text-purple-700 border border-purple-200' 
                                : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                            }`}
                        >
                            <FileText size={16}/> {sheet} 
                            <span className="bg-white px-2 py-0.5 rounded-full text-xs shadow-sm border">
                                {groupedData[sheet].length}
                            </span>
                        </button>
                    ))}
                </div>

                {/* 2. Nội dung bảng */}
                {loading ? (
                    <p className="text-center text-slate-500 py-10">⏳ Đang tải dữ liệu...</p>
                ) : activeSheet && groupedData[activeSheet] ? (
                    <div>
                        <div className="flex justify-end mb-4">
                            <button onClick={handleDeleteSheet} className="bg-red-50 text-red-600 hover:bg-red-100 px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition-colors">
                                <Trash2 size={18}/> Xóa toàn bộ Sheet "{activeSheet}"
                            </button>
                        </div>

                        <div className="overflow-x-auto border border-slate-200 rounded-xl">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-slate-50 text-slate-700 uppercase text-xs font-bold">
                                    <tr>
                                        <th className="p-4 border-b">STT</th>
                                        <th className="p-4 border-b">Mã Code</th>
                                        <th className="p-4 border-b">Token ID</th>
                                        <th className="p-4 border-b">Trạng Thái</th>
                                        <th className="p-4 border-b">Ngày Nộp</th>
                                        <th className="p-4 border-b">File</th>
                                        <th className="p-4 border-b text-center">Xóa</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm text-slate-600">
                                    {groupedData[activeSheet].map((row, index) => (
                                        <tr key={index} className="hover:bg-slate-50 border-b last:border-0">
                                            <td className="p-4">{index + 1}</td>
                                            <td className="p-4 font-bold text-slate-800">{row.realCode}</td>
                                            <td className="p-4 font-mono text-xs">{row.token}</td>
                                            <td className="p-4">
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                                    row.status === 'used' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                                }`}>
                                                    {row.status === 'used' ? 'Đã Nộp' : 'Chưa Nộp'}
                                                </span>
                                            </td>
                                            <td className="p-4 whitespace-nowrap">
                                                {row.updatedAt ? new Date(row.updatedAt).toLocaleString('vi-VN') : '-'}
                                            </td>
                                            <td className="p-4">
                                                {row.driveLink ? (
                                                    <a href={row.driveLink} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline flex items-center gap-1 font-bold">
                                                        <ExternalLink size={14}/> Mở File
                                                    </a>
                                                ) : <span className="text-slate-400">-</span>}
                                            </td>
                                            <td className="p-4 text-center">
                                                <button onClick={() => handleDeleteRow(row.token)} className="text-slate-400 hover:text-red-600 p-2 rounded-full hover:bg-red-50 transition-all">
                                                    <Trash2 size={18}/>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-20 text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
                        <ShieldAlert size={48} className="mx-auto mb-4 opacity-20"/>
                        <p>Không có dữ liệu báo cáo nào.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminDashboard;