const fs = require('fs');

console.log('🚀 بدء تطبيق التحديث الذكي للكميات...');

// 1. تحديث السيرفر (Backend)
try {
    let serverCode = fs.readFileSync('backend/server.js', 'utf8');
    if (!serverCode.includes('/api/menu/:id/toggle/:branchId')) {
        serverCode = serverCode.replace(/app\.listen\(/, `
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

app.listen(`);
        fs.writeFileSync('backend/server.js', serverCode);
        console.log('✅ تم تحديث السيرفر بنجاح.');
    } else {
        console.log('⚡ السيرفر محدث مسبقاً.');
    }
} catch (e) { console.log('❌ خطأ في السيرفر:', e.message); }

// 2. تحديث شاشة المطبخ (Branch App)
try {
    let branchCode = fs.readFileSync('frontend/branch/index.html', 'utf8');
    if (!branchCode.includes('التحديث الذكي للكميات (شاشة المطبخ)')) {
        const branchInjection = `
<script>
// --- التحديث الذكي للكميات (شاشة المطبخ) ---
window.loadMenu = async function() {
    if(!branchData) return;
    const r = await fetch('/api/menu?v=' + Date.now());
    const menu = await r.json();
    const container = document.getElementById('sec-menu');
    if(!container) return;
    container.innerHTML = menu.map(m => {
        const isOut = (m.outOfStockBranches || []).includes(branchData.branchId);
        return \`<div class="card" style="text-align:center; justify-content:center; background:rgba(0,0,0,0.5); border:1px solid #333; border-radius:12px; padding:15px;">
            <h3 style="margin-top:0; color:#fff;">\${m.name}</h3>
            <button class="btn \${isOut ? 'btn-red' : 'btn-green'}" style="width:100%; padding:12px; font-size:16px; border:none; border-radius:8px; color:#fff; font-weight:bold; cursor:pointer; background:\${isOut ? '#E50914' : '#27ae60'};" onclick="window.tog('\${m.id}')">
                \${isOut ? 'نفدت الكمية ❌' : 'متوفر ✅'}
            </button>
        </div>\`;
    }).join('');
};
window.tog = async function(id) {
    await fetch('/api/menu/' + id + '/toggle/' + branchData.branchId, { method: 'PUT' });
    window.loadMenu();
};
</script>
</body>`;
        branchCode = branchCode.replace('</body>', branchInjection);
        fs.writeFileSync('frontend/branch/index.html', branchCode);
        console.log('✅ تم تحديث شاشة المطبخ بنجاح.');
    } else {
        console.log('⚡ شاشة المطبخ محدثة مسبقاً.');
    }
} catch (e) { console.log('❌ خطأ في شاشة المطبخ:', e.message); }

// 3. تحديث تطبيق العميل (Customer App)
try {
    let customerCode = fs.readFileSync('frontend/customer/index.html', 'utf8');
    if (!customerCode.includes('التحديث الذكي للكميات (تطبيق العميل)')) {
        const customerInjection = `
<script>
// --- التحديث الذكي للكميات (تطبيق العميل) ---
setInterval(async () => {
    if (!window.orderData || !window.orderData.branchId) return;
    try {
        const r = await fetch('/api/menu?v=' + Date.now());
        const menu = await r.json();
        let cartChanged = false;

        document.querySelectorAll('.menu-item').forEach(el => {
            const actDiv = el.querySelector('[id^="act-"]');
            if (actDiv) {
                const id = actDiv.id.replace('act-', '');
                const menuItem = menu.find(m => m.id === id);
                
                if (menuItem && menuItem.outOfStockBranches && menuItem.outOfStockBranches.includes(window.orderData.branchId)) {
                    el.style.display = 'none'; // إخفاء الصنف
                    if (window.cart && window.cart[id]) {
                        delete window.cart[id]; // حذفه من السلة
                        cartChanged = true;
                    }
                } else {
                    el.style.display = 'block'; // إظهار الصنف
                }
            }
        });

        if (cartChanged) {
            if (typeof window.renderCart === 'function') window.renderCart();
            if (typeof window.updateAllUI === 'function') window.updateAllUI();
            if (window.Swal) {
                Swal.fire({
                    title: 'تنبيه',
                    text: 'تم إزالة بعض الأصناف من سلتك لأنها نفدت في الفرع المحدد.',
                    icon: 'info',
                    confirmButtonColor: '#E50914',
                    background: 'rgba(20,20,20,0.9)',
                    color: '#ffffff'
                });
            }
        }
    } catch (e) {}
}, 3000);
</script>
</body>`;
        customerCode = customerCode.replace('</body>', customerInjection);
        fs.writeFileSync('frontend/customer/index.html', customerCode);
        console.log('✅ تم تحديث تطبيق العميل بنجاح.');
    } else {
        console.log('⚡ تطبيق العميل محدث مسبقاً.');
    }
} catch (e) { console.log('❌ خطأ في تطبيق العميل:', e.message); }

console.log('🎉 اكتمل الحقن الذكي بنجاح!');
