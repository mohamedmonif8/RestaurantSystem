const { MongoClient } = require('mongodb');
require('dotenv').config();
async function fixDB() {
    try {
        const client = new MongoClient(process.env.MONGODB_URI);
        await client.connect();
        const db = client.db();
        
        const branch = await db.collection('branches').findOne({});
        if (!branch) {
            console.log('❌ لا يوجد فروع في قاعدة البيانات!');
            process.exit(1);
        }
        
        await db.collection('users').updateOne(
            { username: 'branch1' },
            { $set: { username: 'branch1', password: '123', role: 'branch', branchId: branch.id, name: 'موظف المطبخ' } },
            { upsert: true }
        );
        
        console.log('=====================================');
        console.log('✅ تم ضبط حساب المطبخ في قاعدة البيانات بنجاح!');
        console.log('👤 اسم المستخدم: branch1');
        console.log('🔑 كلمة المرور: 123');
        console.log('=====================================');
        process.exit(0);
    } catch(e) {
        console.log('خطأ:', e.message);
        process.exit(1);
    }
}
fixDB();
