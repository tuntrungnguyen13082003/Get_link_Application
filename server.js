import express from 'express';
import multer from 'multer';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
app.use(cors());
app.use(express.json());

// Cấu hình để lấy đường dẫn thư mục trong ES Module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = path.join(__dirname, 'database.json');
const UPLOADS_DIR = path.join(__dirname, 'uploads');

// --- HÀM KHỞI TẠO FILE DỮ LIỆU ---
if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify([], null, 2));
}

// --- CẤU HÌNH LƯU FILE ZIP ---
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const { type, appName } = req.body;
        const dir = path.join(UPLOADS_DIR, type || 'anh_chup', appName || 'default');
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    }
});
const upload = multer({ storage });

// --- 1. API: TẠO MÃ MỚI (Admin) ---
app.post('/api/create-link', (req, res) => {
    const { code, token, sheet_name } = req.body;
    const db = JSON.parse(fs.readFileSync(DB_PATH));
    db.push({
        realCode: code,
        token: token,
        sheetName: sheet_name,
        status: 'active',
        createdAt: new Date().toISOString()
    });
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
    res.json({ status: 'success' });
});

// --- 2. API: KIỂM TRA MÃ (ChecklistApp) ---
app.post('/api/check-status', (req, res) => {
    // Nhận cả token và sheetName từ Frontend gửi lên
    const { token, sheetName } = req.body; 
    
    const db = JSON.parse(fs.readFileSync(DB_PATH));
    
    // Tìm mã khớp cả Token VÀ SheetName
    const entry = db.find(item => item.token === token && item.sheetName === sheetName);
    
    if (!entry) {
        return res.json({ result: 'invalid', message: 'Mã không tồn tại hoặc sai ứng dụng' });
    }

    // Kiểm tra trạng thái (Active hay đã Used)
    if (entry.status !== 'active') {
        return res.json({ result: 'used', message: 'Mã này đã được sử dụng trước đó' });
    }

    // Nếu vượt qua tất cả, trả về thành công và mã thật
    res.json({ 
        result: 'active', 
        realCode: entry.realCode 
    });
});

// --- 3. API: NHẬN BÁO CÁO & KHÓA MÃ ---
app.post('/api/upload-report', upload.single('file'), (req, res) => {
    const { token } = req.body;
    let db = JSON.parse(fs.readFileSync(DB_PATH));
    const index = db.findIndex(item => item.token === token);
    if (index !== -1) {
        db[index].status = 'used';
        db[index].updatedAt = new Date().toISOString();
        fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
    }
    res.json({ status: 'success', message: 'Báo cáo đã lưu' });
});

app.listen(17004, '0.0.0.0', () => {
    console.log('✅ Backend Server đang chạy tại cổng 17004 (ES Module mode)');
});