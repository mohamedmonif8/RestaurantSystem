const express = require('express'); const cors = require('cors'); const path = require('path'); const mongoose = require('mongoose');
const app = express(); app.use(cors()); app.use(express.json());
app.use('/customer', express.static(path.join(__dirname, '../frontend/customer')));
app.use('/branch', express.static(path.join(__dirname, '../frontend/branch')));
app.use('/admin', express.static(path.join(__dirname, '../frontend/admin')));

mongoose.connect('mongodb+srv://mohamedmonif8:Aa701427124Aa@admin.rq7mrub.mongodb.net/RestaurantDB?retryWrites=true&w=majority').then(() => { initAdmin(); });

const schemaOptions = { toJSON: { virtuals: true, transform: function(doc, ret) { ret.id = ret._id; delete ret._id; delete ret.__v; } } };
const User = mongoose.model('User', new mongoose.Schema({ name: String, username: String, password: String, role: String, branchId: String }, schemaOptions));
const Branch = mongoose.model('Branch', new mongoose.Schema({ name: String, location: String, details: String }, schemaOptions));
const Category = mongoose.model('Category', new mongoose.Schema({ name: String }, schemaOptions));
const Menu = mongoose.model('Menu', new mongoose.Schema({ name: String, price: Number, categoryId: String, available: { type: Boolean, default: true } }, schemaOptions));
const Order = mongoose.model('Order', new mongoose.Schema({ name: String, phone: String, branchId: String, items: Array, total: Number, status: String, time: String, timestamps: Object }, schemaOptions));

async function initAdmin() { try { if (!(await User.findOne({ username: 'admin' }))) await User.create({ name: 'المدير العام', username: 'admin', password: '123', role: 'admin' }); } catch(e) {} }

app.post('/api/login', async (req, res) => { try { const user = await User.findOne({ username: req.body.username, password: req.body.password }); if (user) res.json({ success: true, user }); else res.json({ success: false }); } catch(e) { res.json({ success: false }); } });
app.get('/api/users', async (req, res) => { res.json(await User.find()); }); app.post('/api/users', async (req, res) => { await User.create(req.body); res.json({ success: true }); }); app.delete('/api/users/:id', async (req, res) => { await User.findByIdAndDelete(req.params.id); res.json({ success: true }); });
app.get('/api/branches', async (req, res) => { res.json(await Branch.find()); }); app.post('/api/branches', async (req, res) => { await Branch.create(req.body); res.json({ success: true }); }); app.put('/api/branches/:id', async (req, res) => { await Branch.findByIdAndUpdate(req.params.id, req.body); res.json({ success: true }); }); app.delete('/api/branches/:id', async (req, res) => { await Branch.findByIdAndDelete(req.params.id); res.json({ success: true }); });
app.get('/api/categories', async (req, res) => { res.json(await Category.find()); }); app.post('/api/categories', async (req, res) => { await Category.create(req.body); res.json({ success: true }); }); app.put('/api/categories/:id', async (req, res) => { await Category.findByIdAndUpdate(req.params.id, req.body); res.json({ success: true }); }); app.delete('/api/categories/:id', async (req, res) => { await Category.findByIdAndDelete(req.params.id); res.json({ success: true }); });
app.get('/api/menu', async (req, res) => { res.json(await Menu.find()); }); app.post('/api/menu', async (req, res) => { await Menu.create(req.body); res.json({ success: true }); }); app.put('/api/menu/:id', async (req, res) => { await Menu.findByIdAndUpdate(req.params.id, req.body); res.json({ success: true }); }); app.delete('/api/menu/:id', async (req, res) => { await Menu.findByIdAndDelete(req.params.id); res.json({ success: true }); }); app.put('/api/menu/:id/toggle', async (req, res) => { const item = await Menu.findById(req.params.id); if(item) { item.available = !item.available; await item.save(); res.json({ success: true }); } });
app.post('/api/orders', async (req, res) => { const now = new Date().toLocaleTimeString('ar-SA'); const order = await Order.create({ ...req.body, status: 'استلام الطلب', time: now, timestamps: { received: now } }); res.json({ success: true, orderId: order.id }); }); app.get('/api/orders/:branchId', async (req, res) => { res.json(await Order.find({ branchId: req.params.branchId })); }); app.get('/api/orders/track/:orderId', async (req, res) => { res.json(await Order.findById(req.params.orderId) || { error: 'غير موجود' }); }); app.put('/api/orders/:orderId/status', async (req, res) => { const order = await Order.findById(req.params.orderId); if(order) { order.status = req.body.status; const now = new Date().toLocaleTimeString('ar-SA'); if(!order.timestamps) order.timestamps = {}; if(req.body.status === 'قيد التجهيز') order.timestamps.preparing = now; if(req.body.status === 'الطلب جاهز') order.timestamps.ready = now; if(req.body.status === 'استلم الطلب') order.timestamps.delivered = now; order.markModified('timestamps'); await order.save(); res.json({ success: true }); } });
app.get('/api/admin/summary', async (req, res) => { const orders = await Order.find(); res.json({ totalOrders: orders.length, totalRevenue: orders.reduce((sum, o) => sum + o.total, 0), branchesCount: await Branch.countDocuments(), usersCount: await User.countDocuments() }); }); app.get('/api/admin/orders', async (req, res) => { res.json(await Order.find().sort({_id: -1})); });
app.get('/api/admin/customers', async (req, res) => { const orders = await Order.find(); const cMap = {}; orders.forEach(o => { if(!cMap[o.phone]) cMap[o.phone] = { name: o.name, phone: o.phone, count: 0, total: 0 }; cMap[o.phone].count++; cMap[o.phone].total += o.total; }); res.json(Object.values(cMap)); });


app.put('/api/menu/:id/toggle/:branchId', async (req, res) => {
    try {
        const db = client.db(dbName);
        const item = await db.collection('menu').findOne({ id: req.params.id });
        if (!item) return res.status(404).json({ success: false });
        let outOfStockBranches = item.outOfStockBranches || [];
        if (outOfStockBranches.includes(req.params.branchId)) {
            outOfStockBranches = outOfStockBranches.filter(b => b !== req.params.branchId);
        } else {
            outOfStockBranches.push(req.params.branchId);
        }
        await db.collection('menu').updateOne({ id: req.params.id }, { $set: { outOfStockBranches } });
        res.json({ success: true, outOfStockBranches });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

app.listen(process.env.PORT || 3000);

const Log=mongoose.model('Log',new mongoose.Schema({user:String,action:String,date:String},{versionKey:false}));
app.post('/api/logs',async(req,res)=>{await Log.create({...req.body,date:new Date().toLocaleString('ar-SA')});res.json({success:true});});
app.get('/api/logs',async(req,res)=>{res.json(await Log.find().sort({_id:-1}).limit(100));});
