const express = require('express');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');

const app = express();
app.use(cors());
app.use(express.json());

// تقديم ملفات الواجهات الأمامية
app.use('/customer', express.static(path.join(__dirname, '../frontend/customer')));
app.use('/branch', express.static(path.join(__dirname, '../frontend/branch')));
app.use('/admin', express.static(path.join(__dirname, '../frontend/admin')));

// مسار رئيسي للتأكد من عمل السيرفر
app.get('/', (req, res) => res.send('🚀 Server is running perfectly!'));

// --- الاتصال بقاعدة البيانات ---
const dbURI = 'mongodb+srv://mohamedmonif8:Aa701427124Aa@admin.rq7mrub.mongodb.net/RestaurantDB?retryWrites=true&w=majority';

mongoose.connect(dbURI)
    .then(() => {
        console.log('✅ تم الاتصال بقاعدة البيانات بنجاح!');
        initAdmin(); // إنشاء المدير فقط بعد نجاح الاتصال
    })
    .catch(err => console.log('❌ خطأ في الاتصال بقاعدة البيانات:', err.message));

const schemaOptions = {
    toJSON: { virtuals: true, transform: function(doc, ret) { ret.id = ret._id; delete ret._id; delete ret.__v; } }
};

const User = mongoose.model('User', new mongoose.Schema({ name: String, username: String, password: String, role: String, branchId: String }, schemaOptions));
const Branch = mongoose.model('Branch', new mongoose.Schema({ name: String }, schemaOptions));
const Menu = mongoose.model('Menu', new mongoose.Schema({ name: String, price: Number, available: { type: Boolean, default: true } }, schemaOptions));
const Order = mongoose.model('Order', new mongoose.Schema({ name: String, phone: String, branchId: String, items: Array, total: Number, status: String, time: String }, schemaOptions));

async function initAdmin() {
    try {
        const adminExists = await User.findOne({ username: 'admin' });
        if (!adminExists) await User.create({ name: 'المدير العام', username: 'admin', password: '123', role: 'admin' });
    } catch(e) { console.log('خطأ في إنشاء المدير:', e.message); }
}

// --- مسارات تسجيل الدخول والمستخدمين ---
app.post('/api/login', async (req, res) => {
    try {
        const user = await User.findOne({ username: req.body.username, password: req.body.password });
        if (user) res.json({ success: true, user });
        else res.json({ success: false, message: 'اسم المستخدم أو كلمة المرور غير صحيحة' });
    } catch(e) { res.status(500).json({ success: false, message: 'خطأ في السيرفر' }); }
});
app.get('/api/users', async (req, res) => { try { res.json(await User.find()); } catch(e) { res.json([]); } });
app.post('/api/users', async (req, res) => {
    try {
        if(await User.findOne({ username: req.body.username })) return res.json({ success: false, message: 'موجود مسبقاً' });
        await User.create(req.body); res.json({ success: true });
    } catch(e) { res.json({ success: false }); }
});
app.delete('/api/users/:id', async (req, res) => { try { await User.findByIdAndDelete(req.params.id); res.json({ success: true }); } catch(e) { res.json({ success: false }); } });

// --- مسارات الفروع ---
app.get('/api/branches', async (req, res) => { try { res.json(await Branch.find()); } catch(e) { res.json([]); } });
app.post('/api/branches', async (req, res) => { try { await Branch.create(req.body); res.json({ success: true }); } catch(e) { res.json({ success: false }); } });
app.delete('/api/branches/:id', async (req, res) => { try { await Branch.findByIdAndDelete(req.params.id); res.json({ success: true }); } catch(e) { res.json({ success: false }); } });

// --- مسارات المنيو ---
app.get('/api/menu', async (req, res) => { try { res.json(await Menu.find()); } catch(e) { res.json([]); } });
app.post('/api/menu', async (req, res) => { try { await Menu.create(req.body); res.json({ success: true }); } catch(e) { res.json({ success: false }); } });
app.delete('/api/menu/:id', async (req, res) => { try { await Menu.findByIdAndDelete(req.params.id); res.json({ success: true }); } catch(e) { res.json({ success: false }); } });
app.put('/api/menu/:id/toggle', async (req, res) => {
    try { const item = await Menu.findById(req.params.id); if(item) { item.available = !item.available; await item.save(); res.json({ success: true }); } } catch(e) { res.json({ success: false }); }
});

// --- مسارات الطلبات ---
app.post('/api/orders', async (req, res) => {
    try { const order = await Order.create({ ...req.body, status: 'استلام الطلب', time: new Date().toLocaleTimeString() }); res.json({ success: true, orderId: order.id }); } catch(e) { res.json({ success: false }); }
});
app.get('/api/orders/:branchId', async (req, res) => { try { res.json(await Order.find({ branchId: req.params.branchId })); } catch(e) { res.json([]); } });
app.get('/api/orders/track/:orderId', async (req, res) => { try { const order = await Order.findById(req.params.orderId); res.json(order || { error: 'غير موجود' }); } catch(e) { res.json({ error: 'غير موجود' }); } });
app.put('/api/orders/:orderId/status', async (req, res) => { try { await Order.findByIdAndUpdate(req.params.orderId, { status: req.body.status }); res.json({ success: true }); } catch(e) { res.json({ success: false }); } });

// --- مسار الإدارة (الملخص) ---
app.get('/api/admin/summary', async (req, res) => {
    try {
        const totalOrders = await Order.countDocuments();
        const branchesCount = await Branch.countDocuments();
        const usersCount = await User.countDocuments();
        const orders = await Order.find();
        const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
        res.json({ totalOrders, totalRevenue, branchesCount, usersCount });
    } catch(e) { res.json({ totalOrders: 0, totalRevenue: 0, branchesCount: 0, usersCount: 0 }); }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Server running on port ' + PORT));
