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

// إعداد قاعدة البيانات (ملف JSON)
const dbFile = path.join(__dirname, 'data.json');
let db = { orders: [], branches: [{ id: 1, name: 'الفرع الرئيسي' }], menu: [{ id: 1, name: 'برجر لحم', price: 25, available: true }] };

if (fs.existsSync(dbFile)) {
    db = JSON.parse(fs.readFileSync(dbFile));
}
const saveDb = () => fs.writeFileSync(dbFile, JSON.stringify(db, null, 2));

// --- مسارات الفروع ---
app.get('/api/branches', (req, res) => res.json(db.branches));
app.post('/api/branches', (req, res) => {
    const newBranch = { id: Date.now(), name: req.body.name };
    db.branches.push(newBranch); saveDb(); res.json({ success: true });
});
app.delete('/api/branches/:id', (req, res) => {
    db.branches = db.branches.filter(b => b.id != req.params.id); saveDb(); res.json({ success: true });
});

// --- مسارات المنيو ---
app.get('/api/menu', (req, res) => res.json(db.menu));
app.post('/api/menu', (req, res) => {
    const newItem = { id: Date.now(), name: req.body.name, price: req.body.price, available: true };
    db.menu.push(newItem); saveDb(); res.json({ success: true });
});
app.delete('/api/menu/:id', (req, res) => {
    db.menu = db.menu.filter(m => m.id != req.params.id); saveDb(); res.json({ success: true });
});
app.put('/api/menu/:id/toggle', (req, res) => {
    const item = db.menu.find(m => m.id == req.params.id);
    if(item) { item.available = !item.available; saveDb(); res.json({ success: true }); }
});

// --- مسارات الطلبات ---
app.post('/api/orders', (req, res) => {
    const newOrder = { id: Date.now(), ...req.body, status: 'استلام الطلب', time: new Date().toLocaleTimeString() };
    db.orders.push(newOrder); saveDb(); res.json({ success: true, orderId: newOrder.id });
});
app.get('/api/orders/:branchId', (req, res) => {
    res.json(db.orders.filter(o => o.branchId == req.params.branchId));
});
app.get('/api/orders/track/:orderId', (req, res) => {
    const order = db.orders.find(o => o.id == req.params.orderId);
    res.json(order || { error: 'غير موجود' });
});
app.put('/api/orders/:orderId/status', (req, res) => {
    const order = db.orders.find(o => o.id == req.params.orderId);
    if(order) { order.status = req.body.status; saveDb(); res.json({ success: true }); }
});

// --- مسارات الإدارة ---
app.get('/api/admin/summary', (req, res) => {
    const totalRevenue = db.orders.reduce((sum, o) => sum + o.total, 0);
    res.json({ totalOrders: db.orders.length, totalRevenue, branchesCount: db.branches.length });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Server running on port ' + PORT));
