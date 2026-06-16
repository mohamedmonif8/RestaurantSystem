const fs = require('fs');

console.log('🚀 بدء التحديث الآمن للوحة الإدارة...');

// 1. تحديث السيرفر (إضافة مسار جلب الطلبات)
try {
    let serverCode = fs.readFileSync('backend/server.js', 'utf8');
    if (!serverCode.includes('/api/admin/orders')) {
        serverCode = serverCode.replace(/app\.listen\(/, `
app.get('/api/admin/orders', async (req, res) => {
    try {
        const db = client.db(dbName);
        const orders = await db.collection('orders').find().sort({_id: -1}).toArray();
        res.json(orders);
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

app.listen(`);
        fs.writeFileSync('backend/server.js', serverCode);
        console.log('✅ تم تحديث السيرفر بنجاح.');
    }
} catch (e) { console.log('❌ خطأ في السيرفر:', e.message); }

// 2. تحديث لوحة الإدارة (حقن آمن بدون المساس بالكود القديم)
try {
    let adminCode = fs.readFileSync('frontend/admin/index.html', 'utf8');
    if (!adminCode.includes('SafeArchiveInjection')) {
        const injection = `
<script id="SafeArchiveInjection">
// --- نظام أرشيف الطلبات (حقن آمن) ---
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        const nav = document.querySelector('.nav');
        const mainApp = document.getElementById('mainApp');
        if(!nav || !mainApp) return;

        // 1. إضافة زر الأرشيف
        const arcBtn = document.createElement('button');
        arcBtn.id = 'tab-archive';
        arcBtn.innerHTML = '🗂️ سجل الطلبات';
        arcBtn.style.cssText = 'flex:1; padding:15px; font-size:16px; background:#222; border:1px solid #333; color:#fff; border-radius:8px; cursor:pointer; font-family:"Cairo"; font-weight:bold; transition:0.3s; margin-right:10px;';
        nav.appendChild(arcBtn);

        // 2. إضافة قسم الأرشيف
        const arcSec = document.createElement('div');
        arcSec.id = 'sec-archive';
        arcSec.style.display = 'none';
        arcSec.innerHTML = \`
            <div style="background:rgba(20,20,20,0.8); border:1px solid rgba(255,255,255,0.1); border-radius:15px; padding:20px; margin-bottom:20px;">
                <h3 style="margin-top:0; color:#E50914;">🔍 فرز وبحث الطلبات</h3>
                <div style="display:flex; gap:10px; flex-wrap:wrap;">
                    <input type="date" id="filter-date-from" style="flex:1; background:#111; color:#fff; border:1px solid #333; padding:12px; border-radius:8px;">
                    <input type="date" id="filter-date-to" style="flex:1; background:#111; color:#fff; border:1px solid #333; padding:12px; border-radius:8px;">
                    <select id="filter-branch" style="flex:1; background:#111; color:#fff; border:1px solid #333; padding:12px; border-radius:8px;">
                        <option value="">كل الفروع</option>
                    </select>
                    <select id="filter-status" style="flex:1; background:#111; color:#fff; border:1px solid #333; padding:12px; border-radius:8px;">
                        <option value="">كل الحالات</option>
                        <option value="استلام الطلب">جديد</option>
                        <option value="قيد التجهيز">قيد التجهيز</option>
                        <option value="الطلب جاهز">جاهز</option>
                        <option value="استلم الطلب">مكتمل</option>
                    </select>
                    <input type="text" id="filter-search" placeholder="بحث برقم الطلب أو الجوال..." style="flex:2; background:#111; color:#fff; border:1px solid #333; padding:12px; border-radius:8px;">
                    <button onclick="window.loadArchive()" style="flex:1; background:#E50914; color:#fff; border:none; border-radius:8px; font-weight:bold; cursor:pointer;">بحث 🔍</button>
                </div>
                <div style="margin-top:20px; display:flex; justify-content:space-between; background:#000; padding:15px; border-radius:8px; border:1px solid #333;">
                    <span style="font-size:18px;">الطلبات: <b id="arc-count" style="color:#E50914;">0</b></span>
                    <span style="font-size:18px;">المبيعات: <b id="arc-total" style="color:#27ae60;">0 ريال</b></span>
                </div>
            </div>
            <div id="archive-results" style="display:grid; grid-template-columns:repeat(auto-fill, minmax(300px, 1fr)); gap:20px;"></div>
        \`;
        mainApp.appendChild(arcSec);

        // 3. ربط الأزرار بدون تخريب الكود القديم
        const allOldBtns = Array.from(nav.querySelectorAll('button')).filter(b => b.id !== 'tab-archive');
        const allOldSecs = Array.from(mainApp.children).filter(c => c.id && c.id.startsWith('sec-') && c.id !== 'sec-archive');

        arcBtn.addEventListener('click', () => {
            allOldSecs.forEach(sec => sec.style.display = 'none');
            allOldBtns.forEach(btn => { btn.style.background = '#222'; btn.style.borderColor = '#333'; });
            arcSec.style.display = 'block';
            arcBtn.style.background = '#E50914';
            arcBtn.style.borderColor = '#E50914';
            window.loadArchive();
        });

        allOldBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                arcSec.style.display = 'none';
                arcBtn.style.background = '#222';
                arcBtn.style.borderColor = '#333';
            });
        });

    }, 1000);
});

window.loadArchive = async function() {
    try {
        const brSelect = document.getElementById('filter-branch');
        if(brSelect && brSelect.options.length === 1) {
            const brRes = await fetch('/api/branches');
            const branches = await brRes.json();
            branches.forEach(b => brSelect.innerHTML += \`<option value="\${b.id}">\${b.name}</option>\`);
        }

        const res = await fetch('/api/admin/orders');
        let orders = await res.json();
        
        const dFrom = document.getElementById('filter-date-from').value;
        const dTo = document.getElementById('filter-date-to').value;
        const branch = document.getElementById('filter-branch').value;
        const status = document.getElementById('filter-status').value;
        const search = document.getElementById('filter-search').value.toLowerCase();

        if(dFrom) {
            const fromDate = new Date(dFrom).setHours(0,0,0,0);
            orders = orders.filter(o => new Date(parseInt(o._id.substring(0, 8), 16) * 1000).setHours(0,0,0,0) >= fromDate);
        }
        if(dTo) {
            const toDate = new Date(dTo).setHours(23,59,59,999);
            orders = orders.filter(o => new Date(parseInt(o._id.substring(0, 8), 16) * 1000).getTime() <= toDate);
        }
        if(branch) orders = orders.filter(o => o.branchId === branch);
        if(status) orders = orders.filter(o => o.status === status);
        if(search) orders = orders.filter(o => o.id.toLowerCase().includes(search) || o.phone.includes(search) || o.name.toLowerCase().includes(search));

        document.getElementById('arc-count').innerText = orders.length;
        document.getElementById('arc-total').innerText = orders.reduce((sum, o) => sum + (o.total || 0), 0);

        document.getElementById('archive-results').innerHTML = orders.map(o => {
            const exactDate = new Date(parseInt(o._id.substring(0, 8), 16) * 1000).toLocaleDateString('ar-SA');
            let statusColor = o.status === 'استلم الطلب' ? '#27ae60' : (o.status === 'قيد التجهيز' ? '#3498db' : '#f39c12');
            return \`
            <div style="background:rgba(0,0,0,0.6); border:1px solid #333; border-radius:12px; padding:15px; border-top:4px solid \${statusColor};">
                <div style="display:flex; justify-content:space-between; border-bottom:1px solid #222; padding-bottom:10px; margin-bottom:10px;">
                    <h3 style="margin:0; color:#fff;">طلب #\${o.id.substring(o.id.length-4)}</h3>
                    <span style="font-size:12px; color:#aaa;">\${exactDate} - \${o.time || ''}</span>
                </div>
                <div style="font-size:14px; color:#ccc; margin-bottom:10px;">👤 \${o.name} | 📱 \${o.phone}</div>
                <div style="font-size:14px; margin-bottom:10px;">الحالة: <b style="color:\${statusColor};">\${o.status}</b> | الإجمالي: <b style="color:#27ae60;">\${o.total} ريال</b></div>
                <div style="background:#111; padding:10px; border-radius:8px; font-size:13px; color:#aaa;">
                    \${o.items.map(i => \`<div>\${i.qty}x \${i.name}</div>\`).join('')}
                </div>
            </div>\`;
        }).join('');
    } catch(e) { console.error(e); }
};
</script>
</body>`;
        adminCode = adminCode.replace('</body>', injection);
        fs.writeFileSync('frontend/admin/index.html', adminCode);
        console.log('✅ تم تحديث لوحة الإدارة بنجاح.');
    }
} catch (e) { console.log('❌ خطأ في لوحة الإدارة:', e.message); }

console.log('🎉 اكتمل التحديث بنجاح!');
