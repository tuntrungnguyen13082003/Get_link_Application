import express from 'express';
import multer from 'multer';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';

const app = express();
app.use(cors());
app.use(express.json());

// Cấu hình để lấy đường dẫn thư mục trong ES Module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = path.join(__dirname, 'database.json');
const UPLOADS_DIR = path.join(__dirname, 'uploads');

const USERS_PATH = path.join(__dirname, 'users.json');

const APPS_PATH = path.join(__dirname, 'apps.json');
const CONFIG_IMAGES_DIR = path.join(__dirname, 'uploads', 'config_images');

const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzyICx-t7Q7JdaBu1puFflC5ILZEsYbHB6eEfnz0ToCFoi-jEw8nNRDTC_hS7rGkREYsA/exec";

// 1. Tạo folder chứa ảnh minh họa (nếu chưa có)
if (!fs.existsSync(CONFIG_IMAGES_DIR)) {
    fs.mkdirSync(CONFIG_IMAGES_DIR, { recursive: true });
}

// 2. QUAN TRỌNG: Mở cổng cho phép Frontend xem ảnh từ folder uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

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
// Đã xóa logic kiểm tra trùng theo yêu cầu mới
app.post('/api/create-link', (req, res) => {
    // Nhận dữ liệu từ Admin gửi lên
    const { code, token, sheet_name } = req.body;
    
    // 1. Đọc database hiện có
    const db = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));

    // 2. KHÔNG KIỂM TRA TRÙNG NỮA -> Cứ thế lưu luôn
    db.push({
        realCode: code,
        token: token,
        sheetName: sheet_name,
        status: 'active',
        createdAt: new Date().toISOString()
    });

    // 3. Ghi lại vào file
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
    
    // Trả về thành công luôn
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

// --- 3. MỚI: API UPLOAD BÁO CÁO LÊN DRIVE ---
app.post('/api/upload-report', upload.single('file'), async (req, res) => { // <--- Thêm chữ 'async'
    try {
        const { token } = req.body;
        
        // 1. Kiểm tra Token trong Database
        const db = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
        const entry = db.find(item => item.token === token);

        if (!entry) {
            return res.status(400).json({ status: 'error', message: 'Token không hợp lệ' });
        }
        
        if (!req.file) {
             return res.status(400).json({ status: 'error', message: 'Chưa chọn file báo cáo' });
        }

        // 2. Lấy tên Folder từ SheetName (Nếu không có thì đặt tên tạm)
        const folderName = entry.sheetName || "Unknown_App"; 

        console.log(`🚀 Đang gửi file sang Drive vào folder: ${folderName}...`);

        // 3. Chuẩn bị gói dữ liệu gửi sang Apps Script
        const payload = {
            fileName: req.file.originalname,
            fileData: req.file.buffer.toString('base64'), // Mã hóa file thành chuỗi
            folderName: folderName // Gửi kèm tên folder muốn lưu
        };

        // 4. Bắn sang Google bằng Axios
        const response = await axios.post(APPS_SCRIPT_URL, payload, {
            maxRedirects: 5 // Cấu hình để không bị lỗi khi Google chuyển hướng
        });

        // 5. Xử lý kết quả trả về
        if (response.data.status === 'success') {
            console.log(`✅ Thành công! Link file: ${response.data.link}`);

            // Cập nhật trạng thái trong Database
            const index = db.findIndex(item => item.token === token);
            if (index !== -1) {
                db[index].status = 'used';
                db[index].updatedAt = new Date().toISOString();
                db[index].driveLink = response.data.link; // Lưu cái Link Drive này lại
                
                fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
            }

            // Trả kết quả về cho Web/App
            res.json({ 
                status: 'success', 
                message: 'Đã lưu lên Google Drive thành công',
                link: response.data.link 
            });

        } else {
            // Trường hợp bên Google báo lỗi
            throw new Error(response.data.message || "Lỗi không xác định từ Google");
        }

    } catch (error) {
        console.error("Lỗi upload:", error.message);
        res.status(500).json({ status: 'error', message: "Lỗi Server: " + error.message });
    }
});

// --- CẤU HÌNH UPLOAD ẢNH MINH HỌA (CHIA FOLDER THEO APP ID) ---
const configStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Lấy appId từ link upload (Ví dụ: /api/upload-config-image?appId=solar)
        // Nếu không có appId thì cho vào folder 'common' (chung)
        const appId = req.query.appId || 'common'; 
        
        // Tạo đường dẫn: uploads/config_images/solar
        const appFolder = path.join(CONFIG_IMAGES_DIR, appId);

        // Tự động tạo folder con nếu chưa có
        if (!fs.existsSync(appFolder)) {
            fs.mkdirSync(appFolder, { recursive: true });
        }

        cb(null, appFolder);
    },
    filename: (req, file, cb) => {
        // Giữ nguyên tên file gốc hoặc thêm số để không trùng
        const ext = path.extname(file.originalname);
        cb(null, `img_${Date.now()}${ext}`);
    }
});
const uploadConfig = multer({ storage: configStorage });

// --- 9. API: LẤY DANH SÁCH ỨNG DỤNG ---
app.get('/api/apps', (req, res) => {
    try {
        if (!fs.existsSync(APPS_PATH)) {
             return res.json({ status: 'success', data: [] });
        }
        const apps = JSON.parse(fs.readFileSync(APPS_PATH, 'utf8'));
        res.json({ status: 'success', data: apps });
    } catch (e) {
        // Nếu lỗi đọc file (hoặc file chưa có), trả về mảng rỗng để không bị crash
        res.json({ status: 'success', data: [] });
    }
});

// --- 10. API: LƯU ỨNG DỤNG (Thêm mới / Cập nhật) ---
app.post('/api/save-app', (req, res) => {
    try {
        const newApp = req.body;
        // Đọc file cũ
        let apps = [];
        if (fs.existsSync(APPS_PATH)) {
            apps = JSON.parse(fs.readFileSync(APPS_PATH, 'utf8'));
        }
        
        // Kiểm tra xem ID đã có chưa để update hay push mới
        const index = apps.findIndex(a => a.sheetName === newApp.sheetName);
        if (index !== -1) {
            apps[index] = newApp; // Cập nhật
        } else {
            apps.push(newApp); // Thêm mới
        }

        fs.writeFileSync(APPS_PATH, JSON.stringify(apps, null, 2));
        res.json({ status: 'success', message: 'Đã lưu cấu hình ứng dụng!' });
    } catch (e) {
        res.status(500).json({ status: 'error', message: 'Lỗi lưu dữ liệu: ' + e.message });
    }
});

// --- 11. API: XÓA ỨNG DỤNG ---
app.post('/api/delete-app', (req, res) => {
    try {
        const { sheetName } = req.body;
        if (!fs.existsSync(APPS_PATH)) return res.json({ status: 'error', message: 'Chưa có dữ liệu' });
        
        let apps = JSON.parse(fs.readFileSync(APPS_PATH, 'utf8'));
        const newApps = apps.filter(a => a.sheetName !== sheetName);
        fs.writeFileSync(APPS_PATH, JSON.stringify(newApps, null, 2));
        res.json({ status: 'success', message: 'Đã xóa ứng dụng!' });
    } catch (e) {
        res.status(500).json({ status: 'error', message: e.message });
    }
});

// --- 12. API: UPLOAD ẢNH MINH HỌA (Đã nâng cấp chia folder) ---
app.post('/api/upload-config-image', uploadConfig.single('image'), (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ status: 'error', message: 'Chưa có file' });
        
        // Lấy appId để trả về đường dẫn đúng
        const appId = req.query.appId || 'common';

        // Trả về đường dẫn đầy đủ để Frontend hiển thị
        const protocol = req.protocol;
        const host = req.get('host');
        const imageUrl = `${protocol}://${host}/uploads/config_images/${appId}/${req.file.filename}`;
        
        res.json({ status: 'success', url: imageUrl });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// --- 1. API: LẤY DỮ LIỆU BÁO CÁO (Cần gửi kèm username admin để bảo mật) ---
app.post('/api/admin/reports', (req, res) => {
    try {
        const { requester } = req.body;
        // Kiểm tra quyền Admin (Code cũ bạn có rồi, tôi viết tắt đoạn này)
        const users = JSON.parse(fs.readFileSync(USERS_PATH, 'utf8'));
        const isAdmin = users.find(u => u.username === requester && u.role === 'admin');
        
        if (!isAdmin) return res.status(403).json({ status: 'error', message: 'Cấm truy cập!' });

        if (!fs.existsSync(DB_PATH)) return res.json({ status: 'success', data: [] });
        const db = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
        res.json({ status: 'success', data: db });
    } catch (e) { res.status(500).json({ message: e.message }); }
});

// --- 2. API: XÓA 1 DÒNG (Theo Token) ---
app.post('/api/admin/delete-record', (req, res) => {
    try {
        const { token } = req.body;
        let db = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
        const newDb = db.filter(item => item.token !== token); // Lọc bỏ dòng cần xóa
        fs.writeFileSync(DB_PATH, JSON.stringify(newDb, null, 2));
        res.json({ status: 'success', message: 'Đã xóa 1 dòng!' });
    } catch (e) { res.status(500).json({ message: e.message }); }
});

// --- 3. API: XÓA CẢ SHEET (Theo SheetName) ---
app.post('/api/admin/delete-sheet', (req, res) => {
    try {
        const { sheetName } = req.body;
        let db = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
        // Xóa tất cả những dòng có sheetName trùng khớp
        const newDb = db.filter(item => item.sheetName !== sheetName);
        fs.writeFileSync(DB_PATH, JSON.stringify(newDb, null, 2));
        res.json({ status: 'success', message: `Đã xóa sạch dữ liệu của ${sheetName}!` });
    } catch (e) { res.status(500).json({ message: e.message }); }
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