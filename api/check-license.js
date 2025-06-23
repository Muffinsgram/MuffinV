const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = 'MuffinV';
const COLLECTION_NAME = 'maddex-license';
const REQUEST_LIMIT = 100; // Dakikada 100 istek limiti

let cachedDb = null;

async function connectToDatabase() {
    if (cachedDb) {
        console.log('[MuffinV API] Using cached DB connection.');
        return cachedDb;
    }

    if (!MONGODB_URI) {
        console.error('[MuffinV API] Error: MONGODB_URI environment variable not set!');
        throw new Error('MONGODB_URI not set.');
    }

    try {
        const client = await MongoClient.connect(MONGODB_URI);
        const db = client.db(DB_NAME);
        cachedDb = db;
        console.log('[MuffinV API] MongoDB connected to: ' + DB_NAME);
        return db;
    } catch (error) {
        console.error('[MuffinV API] MongoDB connection failed:', error.message);
        await sendErrorReport('MongoDB connection error', 'unknown', 'unknown', error.message);
        throw error;
    }
}

async function sendErrorReport(errorMsg, key, ip, details) {
    try {
        await fetch('https://muffinv.vercel.app/api/report-error', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                error: errorMsg,
                license_key: key,
                ip,
                details,
                timestamp: new Date().toISOString()
            })
        });
    } catch (e) {
        console.error('[MuffinV API] Error reporting failed:', e.message);
    }
}

module.exports = async (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*'); // Güvenlik için belirli domain'lere sınırla

    if (req.method !== 'GET') {
        console.warn(`[MuffinV API] Method Not Allowed: ${req.method}`);
        return res.status(405).json({ status: 'error', message: 'Yalnızca GET metoduna izin verilir.' });
    }

    const { key, ip, hash } = req.query;
    const authHeader = req.headers.authorization;

    if (!key || !ip || !hash) {
        console.warn('[MuffinV API] Bad Request: Missing key, ip, or hash.');
        await sendErrorReport('Missing parameters', key || 'unknown', ip || 'unknown', 'Missing key, ip, or hash');
        return res.status(400).json({ status: 'error', message: 'Lisans anahtarı, IP veya hash eksik.' });
    }

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.warn('[MuffinV API] Unauthorized: No valid Bearer token.');
        await sendErrorReport('Invalid authorization', key, ip, 'No Bearer token');
        return res.status(401).json({ status: 'error', message: 'Geçersiz yetkilendirme başlığı.' });
    }

    const token = authHeader.split(' ')[1];
    if (token !== key) {
        console.warn(`[MuffinV API] Token mismatch: ${token} vs ${key}`);
        await sendErrorReport('Token mismatch', key, ip, 'Token does not match key');
        return res.status(401).json({ status: 'error', message: 'Token uyuşmazlığı.' });
    }

    try {
        const db = await connectToDatabase();
        const collection = db.collection(COLLECTION_NAME);

        // Rate limiting kontrolü
        const requestLog = await db.collection('request_logs').findOneAndUpdate(
            { ip, timestamp: { $gte: new Date(Date.now() - 60 * 1000) } },
            { $inc: { count: 1 }, $set: { lastUpdate: new Date() } },
            { upsert: true, returnDocument: 'after' }
        );

        if (requestLog.count > REQUEST_LIMIT) {
            console.warn(`[MuffinV API] Rate limit exceeded for IP: ${ip}`);
            await sendErrorReport('Rate limit exceeded', key, ip, `Limit: ${REQUEST_LIMIT}`);
            return res.status(429).json({ status: 'error', message: 'İstek limiti aşıldı.' });
        }

        const licenseDoc = await collection.findOne({ license_key: key, server_ip: ip, script_hash: hash });

        if (!licenseDoc) {
            console.warn(`[MuffinV API] License not found: ${key}, IP: ${ip}, Hash: ${hash}`);
            await sendErrorReport('License not found', key, ip, 'Key, IP, or hash mismatch');
            return res.status(200).json({ status: 'invalid', message: 'Lisans, IP veya hash geçersiz.' });
        }

        if (!licenseDoc.is_active) {
            console.warn(`[MuffinV API] License inactive: ${key}`);
            await sendErrorReport('License inactive', key, ip, 'License is not active');
            return res.status(200).json({ status: 'invalid', message: 'Lisans pasif durumda.' });
        }

        if (licenseDoc.expires_at) {
            const expirationDate = new Date(licenseDoc.expires_at);
            const now = new Date();
            if (now > expirationDate) {
                console.warn(`[MuffinV API] License expired: ${key}, Expired on: ${expirationDate.toISOString()}`);
                await sendErrorReport('License expired', key, ip, `Expired on: ${expirationDate.toISOString()}`);
                await collection.updateOne({ license_key: key }, { $set: { is_active: false, status: 'expired_auto' } });
                return res.status(200).json({ status: 'expired', message: 'Lisansın süresi doldu.' });
            }
        }

        console.log(`[MuffinV API] Valid license: ${key}, IP: ${ip}, Hash: ${hash}`);
        return res.status(200).json({
            status: 'valid',
            message: 'Lisans doğrulandı.',
            expires: licenseDoc.expires_at || null
        });

    } catch (error) {
        console.error('[MuffinV API] CRITICAL ERROR:', error.message);
        await sendErrorReport('Critical error', key || 'unknown', ip || 'unknown', error.message);
        return res.status(500).json({ status: 'error', message: 'Dahili sunucu hatası.' });
    }
};
