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

const USERS_PATH = path.join(__dirname, 'users.json');

// --- HÀM KHỞI TẠO FILE USER (Tạo mặc định 1 admin nếu chưa có) ---
if (!fs.existsSync(USERS_PATH)) {
    const defaultUser = [{ username: "admin", password: "admin", role: "admin" }];
    fs.writeFileSync(USERS_PATH, JSON.stringify(defaultUser, null, 2));
}

// --- HÀM KHỞI TẠO FILE DỮ LIỆU ---
if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify([], null, 2));
}

// --- CẤU HÌNH LƯU FILE ZIP ---
// --- CẤU HÌNH LƯU FILE ZIP THEO SHEETNAME ---
const storage = multer.memoryStorage();
const upload = multer({ storage });

// --- 1. API: TẠO MÃ MỚI (Admin) ---
app.post('/api/create-link', (req, res) => {
    // Nhận dữ liệu từ Admin gửi lên (Lưu ý: Admin gửi 'code', 'token', 'sheet_name')
    const { code, token, sheet_name } = req.body;
    
    // 1. Đọc database hiện có
    const db = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));

    // 2. KIỂM TRA TRÙNG: Tìm xem đã có mã này cho ứng dụng này mà vẫn đang 'active' chưa
    const isDuplicate = db.find(item => 
        item.realCode === code && 
        item.sheetName === sheet_name
    );

    if (isDuplicate) {
        // Nếu trùng, trả về lỗi để Admin hiển thị thông báo "Hãy chọn mã mới"
        return res.json({ 
            status: 'error', 
            message: 'Mã này đã tồn tại, vui lòng chọn mã khác!' 
        });
    }

    // 3. Nếu không trùng, tiến hành lưu như bình thường
    db.push({
        realCode: code,
        token: token,
        sheetName: sheet_name,
        status: 'active',
        createdAt: new Date().toISOString()
    });

    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
    
    // Trả về thành công để Admin biết và hiện link
    res.json({ status: 'success' });
});

// --- 2. API: KIỂM TRA MÃ (ChecklistApp) ---
// --- API KIỂM TRA MÃ (3 LỚP BẢO MẬT) ---
app.post('/api/check-status', (req, res) => {
    try {
        console.log("--- ChecklistApp vừa gửi dữ liệu tới ---");
        console.log("Dữ liệu nhận được:", req.body); 
        console.log("-----------------------------------------");
        const { token, sheetName } = req.body;
        
        // Đọc dữ liệu mới nhất từ file
        const db = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
        
        // 1. Tìm bản ghi khớp cả Token VÀ tên ứng dụng (SheetName)
        const entry = db.find(item => item.token === token && item.sheetName === sheetName);
        
        if (!entry) {
            return res.json({ result: 'invalid', message: 'Mã không tồn tại hoặc sai ứng dụng' });
        }

        // 2. Kiểm tra trạng thái (Status)
        if (entry.status !== 'active') {
            return res.json({ result: 'used', message: 'Mã này đã được sử dụng' });
        }

        // 3. Nếu mọi thứ hợp lệ
        res.json({ 
            result: 'active', 
            realCode: entry.realCode 
        });
    } catch (error) {
        res.status(500).json({ result: 'error', message: error.message });
    }
});

// --- 3. API: NHẬN BÁO CÁO & KHÓA MÃ ---
app.post('/api/upload-report', upload.single('file'), (req, res) => {
    try {
        const { token } = req.body;
        
        // 1. Đọc database tìm sheetName dựa vào token
        const db = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
        const entry = db.find(item => item.token === token);

        if (!entry) {
            return res.status(400).json({ status: 'error', message: 'Token không hợp lệ' });
        }

        // 2. Xác định thư mục đích theo sheetName (Ví dụ: SOLAR)
        const sheetFolder = entry.sheetName; 
        const targetDir = path.join(UPLOADS_DIR, sheetFolder);

        // 3. Tự động tạo thư mục nếu chưa có
        if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir, { recursive: true });
        }

        // 4. Ghi file từ bộ nhớ vào thư mục đích
        const filePath = path.join(targetDir, req.file.originalname);
        fs.writeFileSync(filePath, req.file.buffer);

        // 5. Cập nhật trạng thái 'used' như cũ
        const index = db.findIndex(item => item.token === token);
        if (index !== -1) {
            db[index].status = 'used';
            db[index].updatedAt = new Date().toISOString();
            fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
        }

        console.log(`✅ Đã lưu báo cáo vào: ${targetDir}`);
        res.json({ status: 'success', message: 'Báo cáo đã lưu thành công' });

    } catch (error) {
        console.error("Lỗi upload:", error);
        res.status(500).json({ status: 'error', message: error.message });
    }
});

app.listen(17004, '0.0.0.0', () => {
    console.log('✅ Backend Server đang chạy tại cổng 17004 (ES Module mode)');
});

// --- 4. API: ĐĂNG NHẬP ---
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    const users = JSON.parse(fs.readFileSync(USERS_PATH, 'utf8'));
    
    // Tìm user khớp cả tên lẫn pass
    const user = users.find(u => u.username === username && u.password === password);
    
    if (user) {
        res.json({ status: 'success', user: { username: user.username, role: user.role } });
    } else {
        res.json({ status: 'error', message: 'Sai tên đăng nhập hoặc mật khẩu!' });
    }
});

// --- 5. API: ĐỔI MẬT KHẨU ---
app.post('/api/change-password', (req, res) => {
    const { username, oldPassword, newPassword } = req.body;
    const users = JSON.parse(fs.readFileSync(USERS_PATH, 'utf8'));
    
    const index = users.findIndex(u => u.username === username);
    
    if (index === -1) return res.json({ status: 'error', message: 'User không tồn tại' });
    
    if (users[index].password !== oldPassword) {
        return res.json({ status: 'error', message: 'Mật khẩu cũ không đúng' });
    }

    users[index].password = newPassword;
    fs.writeFileSync(USERS_PATH, JSON.stringify(users, null, 2));
    res.json({ status: 'success', message: 'Đổi mật khẩu thành công!' });
});

// --- 6. API: TẠO USER MỚI (Chỉ Admin mới tạo được) ---
app.post('/api/create-user', (req, res) => {
    const { newUsername, newPassword } = req.body;
    const users = JSON.parse(fs.readFileSync(USERS_PATH, 'utf8'));

    if (users.find(u => u.username === newUsername)) {
        return res.json({ status: 'error', message: 'Tên đăng nhập này đã tồn tại!' });
    }

    users.push({ username: newUsername, password: newPassword, role: 'staff' });
    fs.writeFileSync(USERS_PATH, JSON.stringify(users, null, 2));
    res.json({ status: 'success', message: 'Tạo tài khoản mới thành công!' });
});

// --- 7. API: LẤY DANH SÁCH USER (Chỉ trả về tên và quyền, giấu mật khẩu) ---
app.get('/api/users', (req, res) => {
    try {
        const users = JSON.parse(fs.readFileSync(USERS_PATH, 'utf8'));
        // Chỉ lấy username và role, không gửi password về client
        const safeUsers = users.map(u => ({ username: u.username, role: u.role || 'staff' }));
        res.json({ status: 'success', users: safeUsers });
    } catch (e) {
        res.status(500).json({ status: 'error', message: 'Lỗi đọc danh sách user' });
    }
});

// --- 8. API: XÓA USER (Chỉ Admin) ---
app.post('/api/delete-user', (req, res) => {
    const { targetUser } = req.body; // Tên người cần xóa
    let users = JSON.parse(fs.readFileSync(USERS_PATH, 'utf8'));

    // Không cho phép xóa user admin gốc
    if (targetUser === 'admin') {
        return res.json({ status: 'error', message: 'Không thể xóa tài khoản Admin gốc!' });
    }

    const newUsers = users.filter(u => u.username !== targetUser);
    
    if (newUsers.length === users.length) {
        return res.json({ status: 'error', message: 'User không tồn tại' });
    }

    fs.writeFileSync(USERS_PATH, JSON.stringify(newUsers, null, 2));
    res.json({ status: 'success', message: 'Đã xóa tài khoản thành công!' });
});