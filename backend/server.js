const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// تقديم ملفات الواجهات الأمامية
app.use('/customer', express.static(path.join(__dirname, '../frontend/customer')));
app.use('/branch', express.static(path.join(__dirname, '../frontend/branch')));
app.use('/admin', express.static(path.join(__dirname, '../frontend/admin')));

// قاعدة بيانات وهمية مؤقتة
let orders = [];
let branches = [{ id: 1, name: 'الفرع الرئيسي' }, { id: 2, name: 'فرع الشمال' }];
let menu = [
    { id: 1, name: 'برجر لحم', price: 25, available: true },
    { id: 2, name: 'بيتزا دجاج', price: 35, available: true }
];

// مسارات الـ API
app.get('/api/branches', (req, res) => res.json(branches));
app.get('/api/menu', (req, res) => res.json(menu));

// إنشاء طلب جديد (تطبيق العميل)
app.post('/api/orders', (req, res) => {
    const newOrder = { 
        id: orders.length + 1, 
        ...req.body, 
        status: 'استلام الطلب', 
        time: new Date().toLocaleTimeString() 
    };
    orders.push(newOrder);
    res.json({ success: true, order: newOrder });
});

// جلب طلبات فرع معين (تطبيق الفرع)
app.get('/api/orders/:branchId', (req, res) => {
    const branchOrders = orders.filter(o => o.branchId == req.params.branchId);
    res.json(branchOrders);
});

// تحديث حالة الطلب (تطبيق الفرع)
app.put('/api/orders/:orderId/status', (req, res) => {
    const order = orders.find(o => o.id == req.params.orderId);
    if(order) {
        order.status = req.body.status;
        res.json({ success: true, order });
    } else {
        res.status(404).json({ error: 'الطلب غير موجود' });
    }
});

// جلب ملخص الإدارة (تطبيق الإدارة)
app.get('/api/admin/summary', (req, res) => {
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
    res.json({ totalOrders, totalRevenue, branchesCount: branches.length });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log('=================================');
    console.log('🚀 الخادم يعمل بنجاح على المنفذ ' + PORT);
    console.log('📱 تطبيق العميل: http://localhost:' + PORT + '/customer' );
    console.log('🏪 شاشة الفرع:  http://localhost:' + PORT + '/branch' );
    console.log('⚙️ شاشة الإدارة: http://localhost:' + PORT + '/admin' );
    console.log('=================================');
});
