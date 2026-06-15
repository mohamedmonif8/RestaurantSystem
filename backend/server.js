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

// --- الاتصال بقاعدة البيانات ---
const dbURI = 'mongodb+srv://mohamedmonif8:Aa701427124Aa@admin.rq7mrub.mongodb.net/RestaurantDB?retryWrites=true&w=majority';
mongoose.connect(dbURI)
    .then(() => console.log('✅ تم الاتصال بقاعدة البيانات بنجاح!'))
    .catch(err => console.log('❌ خطأ في الاتصال بقاعدة البيانات:', err));

// --- إعداد الجداول (Schemas) ---
// هذه الإضافة لتحويل _id الخاص بـ Mongo إلى id العادي ليتوافق مع واجهاتنا
const schemaOptions = {
    toJSON: {
        virtuals: true,
        transform: function(doc, ret) { ret.id = ret._id; delete ret._id; delete ret.__v; }
    }
};

const User = mongoose.model('User', new mongoose.Schema({ name: String, username: String, password: String, role: String, branchId: String }, schemaOptions));
const Branch = mongoose.model('Branch', new mongoose.Schema({ name: String }, schemaOptions));
const Menu = mongoose.model('Menu', new mongoose.Schema({ name: String, price: Number, available: { type: Boolean, default: true } }, schemaOptions));
const Order = mongoose.model('Order', new mongoose.Schema({ name: String, phone: String, branchId: String, items: Array, total: Number, status: String, time: String }, schemaOptions));

// إنشاء حساب المدير الافتراضي إذا لم يكن موجوداً
setTimeout(async () => {
    const adminExists = await User.findOne({ username: 'admin' });
    if (!adminExists) await User.create({ name: 'المدير العام', username: 'admin', password: '123', role: 'admin' });
}, 2000);

// --- مسارات تسجيل الدخول والمستخدمين ---
app.post('/api/login', async (req, res) => {
    const user = await User.findOne({ username: req.body.username, password: req.body.password });
    if (user) res.json({ success: true, user });
    else res.json({ success: false, message: 'اسم المستخدم أو كلمة المرور غير صحيحة' });
});
app.get('/api/users', async (req, res) => res.json(await User.find()));
app.post('/api/users', async (req, res) => {
    if(await User.findOne({ username: req.body.username })) return res.json({ success: false, message: 'اسم المستخدم موجود مسبقاً' });
    await User.create(req.body); res.json({ success: true });
});
app.delete('/api/users/:id', async (req, res) => { await User.findByIdAndDelete(req.params.id); res.json({ success: true }); });

// --- مسارات الفروع ---
app.get('/api/branches', async (req, res) => res.json(await Branch.find()));
app.post('/api/branches', async (req, res) => { await Branch.create(req.body); res.json({ success: true }); });
app.delete('/api/branches/:id', async (req, res) => { await Branch.findByIdAndDelete(req.params.id); res.json({ success: true }); });

// --- مسارات المنيو ---
app.get('/api/menu', async (req, res) => res.json(await Menu.find()));
app.post('/api/menu', async (req, res) => { await Menu.create(req.body); res.json({ success: true }); });
app.delete('/api/menu/:id', async (req, res) => { await Menu.findByIdAndDelete(req.params.id); res.json({ success: true }); });
app.put('/api/menu/:id/toggle', async (req, res) => {
    const item = await Menu.findById(req.params.id);
    if(item) { item.available = !item.available; await item.save(); res.json({ success: true }); }
});

// --- مسارات الطلبات ---
app.post('/api/orders', async (req, res) => {
    const order = await Order.create({ ...req.body, status: 'استلام الطلب', time: new Date().toLocaleTimeString() });
    res.json({ success: true, orderId: order.id });
});
app.get('/api/orders/:branchId', async (req, res) => res.json(await Order.find({ branchId: req.params.branchId })));
app.get('/api/orders/track/:orderId', async (req, res) => {
    try { const order = await Order.findById(req.params.orderId); res.json(order || { error: 'غير موجود' }); } 
    catch(e) { res.json({ error: 'غير موجود' }); }
});
app.put('/api/orders/:orderId/status', async (req, res) => {
    await Order.findByIdAndUpdate(req.params.orderId, { status: req.body.status }); res.json({ success: true });
});

// --- مسار الإدارة (الملخص) ---
app.get('/api/admin/summary', async (req, res) => {
    const totalOrders = await Order.countDocuments();
    const branchesCount = await Branch.countDocuments();
    const usersCount = await User.countDocuments();
    const orders = await Order.find();
    const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
    res.json({ totalOrders, totalRevenue, branchesCount, usersCount });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Server running on port ' + PORT));
