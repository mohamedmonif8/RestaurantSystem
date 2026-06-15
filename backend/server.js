const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/customer', express.static(path.join(__dirname, '../frontend/customer')));
app.use('/branch', express.static(path.join(__dirname, '../frontend/branch')));
app.use('/admin', express.static(path.join(__dirname, '../frontend/admin')));

const dbFile = path.join(__dirname, 'data.json');
let db = { 
    orders: [], 
    branches: [{ id: 1, name: 'الفرع الرئيسي' }], 
    menu: [{ id: 1, name: 'برجر لحم', price: 25, available: true }],
    users: [{ id: 1, username: 'admin', password: '123', role: 'admin', name: 'المدير العام' }]
};

if (fs.existsSync(dbFile)) {
    const savedDb = JSON.parse(fs.readFileSync(dbFile));
    db = { ...db, ...savedDb };
    if(!db.users) db.users = [{ id: 1, username: 'admin', password: '123', role: 'admin', name: 'المدير العام' }];
}
const saveDb = () => fs.writeFileSync(dbFile, JSON.stringify(db, null, 2));

// --- مسار تسجيل الدخول ---
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    const user = db.users.find(u => u.username === username && u.password === password);
    if (user) {
        res.json({ success: true, user: { id: user.id, name: user.name, role: user.role, branchId: user.branchId } });
    } else {
        res.json({ success: false, message: 'اسم المستخدم أو كلمة المرور غير صحيحة' });
    }
});

// --- مسارات المستخدمين (للإدارة) ---
app.get('/api/users', (req, res) => res.json(db.users.map(u => ({ id: u.id, username: u.username, name: u.name, role: u.role, branchId: u.branchId }))));
app.post('/api/users', (req, res) => {
    if(db.users.find(u => u.username === req.body.username)) return res.json({ success: false, message: 'اسم المستخدم موجود مسبقاً' });
    const newUser = { id: Date.now(), ...req.body };
    db.users.push(newUser); saveDb(); res.json({ success: true });
});
app.delete('/api/users/:id', (req, res) => {
    db.users = db.users.filter(u => u.id != req.params.id); saveDb(); res.json({ success: true });
});

// --- باقي المسارات (الفروع، المنيو، الطلبات) ---
app.get('/api/branches', (req, res) => res.json(db.branches));
app.post('/api/branches', (req, res) => { db.branches.push({ id: Date.now(), name: req.body.name }); saveDb(); res.json({ success: true }); });
app.delete('/api/branches/:id', (req, res) => { db.branches = db.branches.filter(b => b.id != req.params.id); saveDb(); res.json({ success: true }); });

app.get('/api/menu', (req, res) => res.json(db.menu));
app.post('/api/menu', (req, res) => { db.menu.push({ id: Date.now(), name: req.body.name, price: req.body.price, available: true }); saveDb(); res.json({ success: true }); });
app.delete('/api/menu/:id', (req, res) => { db.menu = db.menu.filter(m => m.id != req.params.id); saveDb(); res.json({ success: true }); });
app.put('/api/menu/:id/toggle', (req, res) => { const item = db.menu.find(m => m.id == req.params.id); if(item) { item.available = !item.available; saveDb(); res.json({ success: true }); } });

app.post('/api/orders', (req, res) => { const newOrder = { id: Date.now(), ...req.body, status: 'استلام الطلب', time: new Date().toLocaleTimeString() }; db.orders.push(newOrder); saveDb(); res.json({ success: true, orderId: newOrder.id }); });
app.get('/api/orders/:branchId', (req, res) => res.json(db.orders.filter(o => o.branchId == req.params.branchId)));
app.get('/api/orders/track/:orderId', (req, res) => res.json(db.orders.find(o => o.id == req.params.orderId) || { error: 'غير موجود' }));
app.put('/api/orders/:orderId/status', (req, res) => { const order = db.orders.find(o => o.id == req.params.orderId); if(order) { order.status = req.body.status; saveDb(); res.json({ success: true }); } });

app.get('/api/admin/summary', (req, res) => res.json({ totalOrders: db.orders.length, totalRevenue: db.orders.reduce((sum, o) => sum + o.total, 0), branchesCount: db.branches.length, usersCount: db.users.length }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Server running on port ' + PORT));
