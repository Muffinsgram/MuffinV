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
        return cachedDb;
    }

    if (!MONGODB_URI) {
        throw new Error('MONGODB_URI environment variable is not set.');
    }

    const client = await MongoClient.connect(MONGODB_URI);
    const db = client.db(DB_NAME);
    cachedDb = db;
    return db;
}

module.exports = async (req, res) => {
    res.setHeader('Content-Type', 'application/json');

    if (req.method !== 'GET') {
        return res.status(405).json({ status: 'error', message: 'Yalnızca GET metoduna izin verilir.' });
    }

    const { key } = req.query;

    if (!key) {
        return res.status(400).json({ status: 'error', message: 'Lisans anahtarı sağlanmadı.' });
    }

    try {
        const db = await connectToDatabase();
        const collection = db.collection(COLLECTION_NAME);

        // Lisans anahtarını veritabanında ara ve aktif olup olmadığını kontrol et
        const licenseDoc = await collection.findOne({ license_key: key, is_active: true });

        if (licenseDoc) {
            console.log(`Lisans doğrulandı: ${key}`);
            return res.status(200).json({ status: 'valid', message: 'Lisans doğrulandı.' });
        } else {
            console.warn(`Geçersiz veya aktif olmayan lisans denemesi: ${key}`);
            return res.status(200).json({ status: 'invalid', message: 'Lisans geçersiz veya aktif değil.' });
        }
    } catch (error) {
        console.error('Veritabanı veya API hatası:', error);
        return res.status(500).json({ status: 'error', message: 'Bir sunucu hatası oluştu.' });
    }
};
