export default function handler(req, res) {
    const validKeys = ['MADDEX_1234-5678-9012', 'MADDEX_5678-9012-3456'];
    const key = req.query.key;

    if (validKeys.includes(key)) {
      res.status(200).json({ status: 'valid' });
    } else {
      res.status(200).json({ status: 'invalid' });
    }
  }