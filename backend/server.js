const express = require('express');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/customer', express.static(path.join(__dirname, '../frontend/customer')));
app.use('/branch', express.static(path.join(__dirname, '../frontend/branch')));
app.use('/admin', express.static(path.join(__dirname, '../frontend/admin')));

app.get('/', (req, res) => res.send('🚀 Abu Mahal Server is running!'));

const dbURI = 'mongodb+srv://mohamedmonif8:Aa701427124Aa@admin.rq7mrub.mongodb.net/RestaurantDB?retryWrites=true&w=majority';
mongoose.connect(dbURI).then(() => { console.log('✅ DB Connected!'); initAdmin(); }).catch(err => console.log('❌ DB Error:', err.message));

const schemaOptions = { toJSON: { virtuals: true, transform: function(doc, ret) { ret.id = ret._id; delete ret._id; delete ret.__v; } } };

const User = mongoose.model('User', new mongoose.Schema({ name: String, username: String, password: String, role: String, branchId: String }, schemaOptions));
// تحديث جدول الفروع ليقبل الموقع والتفاصيل
const Branch = mongoose.model('Branch', new mongoose.Schema({ name: String, location: String, details: String }, schemaOptions));
const Menu = mongoose.model('Menu', new mongoose.Schema({ name: String, price: Number, available: { type: Boolean, default: true } }, schemaOptions));
const Order = mongoose.model('Order', new mongoose.Schema({ name: String, phone: String, branchId: String, items: Array, total: Number, status: String, time: String, timestamps: Object }, schemaOptions));

async function initAdmin() { try { if (!(await User.findOne({ username: 'admin' }))) await User.create({ name: 'المدير العام', username: 'admin', password: '123', role: 'admin' }); } catch(e) {} }

app.post('/api/login', async (req, res) => { try { const user = await User.findOne({ username: req.body.username, password: req.body.password }); if (user) res.json({ success: true, user }); else res.json({ success: false, message: 'خطأ' }); } catch(e) { res.json({ success: false }); } });
app.get('/api/users', async (req, res) => { try { res.json(await User.find()); } catch(e) { res.json([]); } });
app.post('/api/users', async (req, res) => { try { await User.create(req.body); res.json({ success: true }); } catch(e) { res.json({ success: false }); } });
app.delete('/api/users/:id', async (req, res) => { try { await User.findByIdAndDelete(req.params.id); res.json({ success: true }); } catch(e) { res.json({ success: false }); } });

app.get('/api/branches', async (req, res) => { try { res.json(await Branch.find()); } catch(e) { res.json([]); } });
app.post('/api/branches', async (req, res) => { try { await Branch.create(req.body); res.json({ success: true }); } catch(e) { res.json({ success: false }); } });
app.delete('/api/branches/:id', async (req, res) => { try { await Branch.findByIdAndDelete(req.params.id); res.json({ success: true }); } catch(e) { res.json({ success: false }); } });

app.get('/api/menu', async (req, res) => { try { res.json(await Menu.find()); } catch(e) { res.json([]); } });
app.post('/api/menu', async (req, res) => { try { await Menu.create(req.body); res.json({ success: true }); } catch(e) { res.json({ success: false }); } });
app.delete('/api/menu/:id', async (req, res) => { try { await Menu.findByIdAndDelete(req.params.id); res.json({ success: true }); } catch(e) { res.json({ success: false }); } });
app.put('/api/menu/:id/toggle', async (req, res) => { try { const item = await Menu.findById(req.params.id); if(item) { item.available = !item.available; await item.save(); res.json({ success: true }); } } catch(e) { res.json({ success: false }); } });

app.post('/api/orders', async (req, res) => { try { const now = new Date().toLocaleTimeString('ar-SA'); const order = await Order.create({ ...req.body, status: 'استلام الطلب', time: now, timestamps: { received: now } }); res.json({ success: true, orderId: order.id }); } catch(e) { res.json({ success: false }); } });
app.get('/api/orders/:branchId', async (req, res) => { try { res.json(await Order.find({ branchId: req.params.branchId })); } catch(e) { res.json([]); } });
app.get('/api/orders/track/:orderId', async (req, res) => { try { res.json(await Order.findById(req.params.orderId) || { error: 'غير موجود' }); } catch(e) { res.json({ error: 'غير موجود' }); } });
app.put('/api/orders/:orderId/status', async (req, res) => { try { const order = await Order.findById(req.params.orderId); if(order) { order.status = req.body.status; const now = new Date().toLocaleTimeString('ar-SA'); if(!order.timestamps) order.timestamps = {}; if(req.body.status === 'قيد التجهيز') order.timestamps.preparing = now; if(req.body.status === 'الطلب جاهز') order.timestamps.ready = now; if(req.body.status === 'استلم الطلب') order.timestamps.delivered = now; order.markModified('timestamps'); await order.save(); res.json({ success: true }); } else { res.json({ success: false }); } } catch(e) { res.json({ success: false }); } });

app.get('/api/admin/summary', async (req, res) => { try { const orders = await Order.find(); res.json({ totalOrders: orders.length, totalRevenue: orders.reduce((sum, o) => sum + o.total, 0), branchesCount: await Branch.countDocuments(), usersCount: await User.countDocuments() }); } catch(e) { res.json({ totalOrders: 0, totalRevenue: 0, branchesCount: 0, usersCount: 0 }); } });
app.get('/api/admin/orders', async (req, res) => { try { res.json(await Order.find().sort({_id: -1})); } catch(e) { res.json([]); } });

app.listen(process.env.PORT || 3000, () => console.log('Server running'));
