import React, { useEffect, useState } from 'react';
import { Trash2, FileText, ExternalLink, ShieldAlert, FolderOpen, Copy, Check } from 'lucide-react';

const AdminDashboard = ({ currentUser, isAdmin, apps }) => {
    // 👇 Sửa đúng IP/Port Server của bạn
    const API_URL = import.meta.env.VITE_API_URL; 
    
    const [groupedData, setGroupedData] = useState({});
    const [activeSheet, setActiveSheet] = useState('');
    const [loading, setLoading] = useState(false);
    const [copiedToken, setCopiedToken] = useState(null); // Để hiện hiệu ứng "Đã copy"

    // 1. Load dữ liệu
    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/admin/reports`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ requester: currentUser })
            });
            const json = await res.json();
            if (json.status === 'success') processData(json.data);
        } catch (error) { console.error(error); } 
        finally { setLoading(false); }
    };

    useEffect(() => { fetchData(); }, []);

    // 2. Chia nhóm theo Sheet
    const processData = (data) => {
        const groups = {};
        data.reverse().forEach(item => {
            const sheet = item.sheetName || "Chưa phân loại";
            if (!groups[sheet]) groups[sheet] = [];
            groups[sheet].push(item);
        });
        setGroupedData(groups);
        if (!activeSheet && Object.keys(groups).length > 0) setActiveSheet(Object.keys(groups)[0]);
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
        const confirmCode = prompt(`CẢNH BÁO!\nNhập chữ "XOA" để xóa toàn bộ dữ liệu của "${activeSheet}":`);
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

    // 5. Hàm Tạo Link Web (Checklist)
    const getWebLink = (row) => {
        // Tìm App ID dựa trên SheetName hiện tại
        const appId = row.sheetName;
        
        // Link dạng: domain/#/checklist/APP_ID?code=TOKEN
        return `${window.location.origin}/#/checklist/${appId}?code=${row.token}`;
    };

    // 6. Hàm Mở Folder Drive (Tìm kiếm theo tên Sheet)
    const openDriveFolder = () => {
        // 👇 THAY bằng chuỗi ký tự ID thực tế trên thanh địa chỉ Google Drive
        const FOLDER_ID = '1rApCukRbxjEXLSN7zIFW1rmTYZQBoS-9';
        
        const driveUrl = `https://drive.google.com/drive/u/0/folders/${FOLDER_ID}`;
        
        window.open(driveUrl, '_blank');
    };

    // 7. Copy Link
    const handleCopyLink = (link, token) => {
        navigator.clipboard.writeText(link);
        setCopiedToken(token);
        setTimeout(() => setCopiedToken(null), 2000);
    };

    return (
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden animate-in fade-in">
            {/* Header */}
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
                        {/* Hàng nút chức năng bên phải */}
                        <div className="flex justify-end mb-4 gap-3">
                            {/* Nút Mở Folder Drive (MỚI) */}
                            <button onClick={openDriveFolder} className="bg-blue-50 text-blue-600 hover:bg-blue-100 px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition-colors border border-blue-200">
                                <ExternalLink size={18}/> Mở Folder Drive
                            </button>

                            {/* Nút Xóa Sheet */}
                            {isAdmin && (
                            <button onClick={handleDeleteSheet} className="bg-red-50 text-red-600 hover:bg-red-100 px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition-colors border border-red-200">
                                <Trash2 size={18}/> Xóa toàn bộ Sheet
                            </button>
                            )}
                        </div>

                        <div className="overflow-x-auto border border-slate-200 rounded-xl">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-slate-50 text-slate-700 uppercase text-xs font-bold">
                                    <tr>
                                        <th className="p-4 border-b w-16">STT</th>
                                        <th className="p-4 border-b">Mã Code</th>
                                        <th className="p-4 border-b">Trạng Thái</th>
                                        <th className="p-4 border-b">Ngày Nộp</th>
                                        {/* Cột Link Mới */}
                                        <th className="p-4 border-b">Link Báo Cáo</th> 
                                        <th className="p-4 border-b text-center w-20">Xóa</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm text-slate-600">
                                    {groupedData[activeSheet].map((row, index) => {
                                        const webLink = getWebLink(row);
                                        return (
                                            <tr key={index} className="hover:bg-slate-50 border-b last:border-0">
                                                <td className="p-4">{index + 1}</td>
                                                <td className="p-4 font-bold text-slate-800">{row.realCode}</td>
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
                                                
                                                {/* Ô Link Báo Cáo */}
                                                <td className="p-4">
                                                    <div className="flex items-center gap-2">
                                                        <a href={webLink} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline font-medium truncate max-w-[200px]" title={webLink}>
                                                            {webLink}
                                                        </a>
                                                        <button 
                                                            onClick={() => handleCopyLink(webLink, row.token)}
                                                            className="p-1.5 rounded hover:bg-slate-200 text-slate-500 transition-colors"
                                                            title="Copy Link"
                                                        >
                                                            {copiedToken === row.token ? <Check size={16} className="text-green-600"/> : <Copy size={16}/>}
                                                        </button>
                                                    </div>
                                                </td>

                                                <td className="p-4 text-center">
                                                    {isAdmin && (
                                                    <button onClick={() => handleDeleteRow(row.token)} className="text-slate-400 hover:text-red-600 p-2 rounded-full hover:bg-red-50 transition-all">
                                                        <Trash2 size={18}/>
                                                    </button>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
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