// api/check-license.js
// Bu bir Vercel Serverless Function'dır (Node.js)

const { MongoClient } = require('mongodb');

// Vercel Environment Variable olarak ayarlayın: MONGODB_URI
const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = 'MuffinV'; // Kendi veritabanı adınızı girin
const COLLECTION_NAME = 'maddex-license'; // Lisans anahtarlarını tutan koleksiyonunuzun adı

let cachedDb = null;

async function connectToDatabase() {
    if (cachedDb) {
        console.log('[MuffinV API] Using cached DB connection.');
        return cachedDb;
    }

    if (!MONGODB_URI) {
        console.error('[MuffinV API] Error: MONGODB_URI environment variable is not set!');
        throw new Error('MONGODB_URI environment variable is not set.');
    }

    try {
        console.log('[MuffinV API] Attempting to connect to MongoDB...');
        const client = await MongoClient.connect(MONGODB_URI);
        const db = client.db(DB_NAME);
        cachedDb = db;
        console.log('[MuffinV API] MongoDB connected successfully to database: ' + DB_NAME);
        return db;
    } catch (error) {
        console.error('[MuffinV API] MongoDB connection failed:', error.message);
        console.error('[MuffinV API] Full error details:', JSON.stringify(error, Object.getOwnPropertyNames(error))); // Tüm hata detaylarını logla
        throw error; // Hatayı tekrar fırlat ki Vercel loglarında görebilelim
    }
}

module.exports = async (req, res) => {
    res.setHeader('Content-Type', 'application/json');

    // Sadece GET metoduna izin ver
    if (req.method !== 'GET') {
        console.warn(`[MuffinV API] Method Not Allowed: ${req.method} request received.`);
        return res.status(405).json({ status: 'error', message: 'Yalnızca GET metoduna izin verilir.' });
    }

    const { key } = req.query;

    // Lisans anahtarı sağlanıp sağlanmadığını kontrol et
    if (!key) {
        console.warn('[MuffinV API] Bad Request: License key not provided.');
        return res.status(400).json({ status: 'error', message: 'Lisans anahtarı sağlanmadı.' });
    }

    try {
        const db = await connectToDatabase();
        const collection = db.collection(COLLECTION_NAME);

        console.log(`[MuffinV API] Checking license key: ${key} in collection: ${COLLECTION_NAME}`);
        const licenseDoc = await collection.findOne({ license_key: key });

        // Lisans anahtarı veritabanında bulunamazsa
        if (!licenseDoc) {
            console.warn(`[MuffinV API] License key not found in DB: ${key}`);
            return res.status(200).json({ status: 'invalid', message: 'Lisans geçersiz veya bulunamadı.' });
        }

        // Lisans aktif değilse
        if (!licenseDoc.is_active) {
            console.warn(`[MuffinV API] License key found but inactive: ${key}`);
            return res.status(200).json({ status: 'invalid', message: 'Lisans pasif durumda.' });
        }

        // Lisans süresi kontrolü (expires_at alanı varsa)
        if (licenseDoc.expires_at) {
            const expirationDate = new Date(licenseDoc.expires_at);
            const now = new Date(); // API'nin çalıştığı sunucunun şu anki zamanı

            console.log(`[MuffinV API] License expiration check for ${key}: Expires at ${expirationDate.toISOString()}, Current time ${now.toISOString()}`);

            if (now > expirationDate) {
                // Süresi dolmuş lisans
                console.warn(`[MuffinV API] License expired: ${key}. Expired on ${expirationDate.toISOString()}`);
                // İsteğe bağlı: Burada lisansı otomatik olarak pasife çekebiliriz
                // await collection.updateOne({ license_key: key }, { $set: { is_active: false, status: 'expired_auto' } });
                return res.status(200).json({ status: 'expired', message: 'Lisansın süresi doldu.' });
            }
        } else {
            // expires_at alanı yoksa veya null ise süresiz olarak kabul edilir
            console.log(`[MuffinV API] License key ${key} is unlimited (no expiration date).`);
        }

        // Tüm kontrollerden geçtiyse lisans geçerlidir
        console.log(`[MuffinV API] License valid: ${key}.`);
        return res.status(200).json({ status: 'valid', message: 'Lisans doğrulandı.' });

    } catch (error) {
        console.error('[MuffinV API] CRITICAL ERROR during license check:', error.message);
        console.error('[MuffinV API] Full error object for critical error:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
        // Hata durumunda 500 kodu ve genel bir mesaj dön
        return res.status(500).json({ status: 'error', message: 'Dahili bir sunucu hatası oluştu. Lütfen geliştiriciyle iletişime geçin.' });
    }
};
