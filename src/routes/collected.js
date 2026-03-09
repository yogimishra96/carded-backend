const express    = require('express');
const cloudinary = require('cloudinary').v2;
const multer     = require('multer');
const { query }  = require('../db/pool');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const upload = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_, file, cb) => {
    const mime = (file.mimetype || '').toLowerCase();
    const name = (file.originalname || '').toLowerCase();
    const okMime = mime.startsWith('image/') || mime === 'application/octet-stream';
    const okExt  = name.endsWith('.jpg') || name.endsWith('.jpeg') ||
                   name.endsWith('.png') || name.endsWith('.webp');
    if (okMime || okExt) cb(null, true);
    else cb(new Error(`Unsupported type: ${mime}`));
  },
});

async function genAutoName(userId) {
  const now  = new Date();
  const dd   = String(now.getDate()).padStart(2, '0');
  const mm   = String(now.getMonth() + 1).padStart(2, '0');
  const yyyy = now.getFullYear();
  const countRes = await query(
    'SELECT COUNT(*) FROM collected_cards WHERE user_id = $1', [userId]);
  const n = parseInt(countRes.rows[0].count) + 1;
  return `${dd}-${mm}-${yyyy} (${n})`;
}

function toCollected(row) {
  return {
    id:            row.id,
    autoName:      row.auto_name,
    name:          row.name,
    designation:   row.designation   || '',
    company:       row.company       || '',
    email1:        row.email1        || '',
    email2:        row.email2        || '',
    phone1:        row.phone1        || '',
    phone2:        row.phone2        || '',
    website:       row.website       || '',
    address:       row.address       || '',
    templateIndex: row.template_index || 0,
    category:      row.category      || '',
    leadType:      row.lead_type     || '',
    remarks:       row.remarks       || '',
    scanType:      row.scan_type     || 'carded',
    cardImageUrl:  row.card_image_url || '',
    qrRawData:     row.qr_raw_data   || '',
    photoUrl:      row.photo_url     || '',
    scannedAt:     row.scanned_at,
    updatedAt:     row.updated_at,
  };
}

// GET /collected
router.get('/', async (req, res) => {
  try {
    const { type } = req.query;
    let sql    = 'SELECT * FROM collected_cards WHERE user_id = $1';
    const args = [req.userId];
    if (type) { sql += ' AND scan_type = $2'; args.push(type); }
    sql += ' ORDER BY scanned_at DESC';
    const result = await query(sql, args);
    return res.json({ success: true, collected: result.rows.map(toCollected) });
  } catch (err) {
    console.error('Get collected:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// GET /collected/:id
router.get('/:id', async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM collected_cards WHERE id = $1 AND user_id = $2',
      [req.params.id, req.userId]
    );
    if (result.rowCount === 0)
      return res.status(404).json({ success: false, message: 'Not found' });
    return res.json({ success: true, card: toCollected(result.rows[0]) });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// POST /collected — Carded QR scan
router.post('/', async (req, res) => {
  try {
    const { name, designation, company, email1, email2,
            phone1, phone2, website, address, templateIndex, photoUrl } = req.body;

    if (!name)
      return res.status(400).json({ success: false, message: 'name is required' });

    const autoName = await genAutoName(req.userId);
    const result = await query(
      `INSERT INTO collected_cards
         (user_id, auto_name, name, designation, company,
          email1, email2, phone1, phone2, website, address,
          template_index, photo_url, scan_type)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,'carded')
       RETURNING *`,
      [req.userId, autoName, name, designation||'', company||'',
       email1||'', email2||'', phone1||'', phone2||'',
       website||'', address||'', templateIndex??0, photoUrl||'']
    );
    return res.status(201).json({ success: true, card: toCollected(result.rows[0]) });
  } catch (err) {
    console.error('Create collected:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// POST /collected/photo-card — Physical card photo + OCR fields
router.post('/photo-card', upload.single('cardImage'), async (req, res) => {
  try {
    if (!req.file)
      return res.status(400).json({ success: false, message: 'Card image required' });

    const { name, designation, company, email1, email2,
            phone1, phone2, website, address } = req.body;

    if (!name)
      return res.status(400).json({ success: false, message: 'name is required' });

    console.log('[photo-card] uploading to cloudinary, size:', req.file.size);

    const cloudRes = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder:        'carded/physical-cards',
          public_id:     `card_${req.userId}_${Date.now()}`,
          resource_type: 'image',
          format:        'jpg',
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      stream.end(req.file.buffer);
    });

    console.log('[photo-card] cloudinary url:', cloudRes.secure_url);

    const autoName = await genAutoName(req.userId);

    const result = await query(
      `INSERT INTO collected_cards
         (user_id, auto_name, name, designation, company,
          email1, email2, phone1, phone2, website, address,
          card_image_url, scan_type)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,'photo_card')
       RETURNING *`,
      [
        req.userId, autoName,
        name,
        designation || '',
        company     || '',
        email1      || '',
        email2      || '',
        phone1      || '',
        phone2      || '',
        website     || '',
        address     || '',
        cloudRes.secure_url,
      ]
    );

    return res.status(201).json({ success: true, card: toCollected(result.rows[0]) });
  } catch (err) {
    console.error('[photo-card] ERROR:', err);
    return res.status(500).json({ success: false, message: err.message || 'Upload failed' });
  }
});

// POST /collected/qr-other
router.post('/qr-other', async (req, res) => {
  try {
    const { name, qrRawData, parsedData } = req.body;

    if (!name)
      return res.status(400).json({ success: false, message: 'name is required' });
    if (!qrRawData)
      return res.status(400).json({ success: false, message: 'qrRawData is required' });

    const autoName = await genAutoName(req.userId);
    const p = parsedData || {};

    const result = await query(
      `INSERT INTO collected_cards
         (user_id, auto_name, name, designation, company,
          email1, phone1, website, qr_raw_data, scan_type)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'qr_other')
       RETURNING *`,
      [req.userId, autoName, name,
       p.designation||'', p.company||'',
       p.email||'', p.phone||'',
       p.website||qrRawData,
       qrRawData]
    );
    return res.status(201).json({ success: true, card: toCollected(result.rows[0]) });
  } catch (err) {
    console.error('QR other save:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// PUT /collected/:id
router.put('/:id', async (req, res) => {
  try {
    const existing = await query(
      'SELECT id FROM collected_cards WHERE id = $1 AND user_id = $2',
      [req.params.id, req.userId]
    );
    if (existing.rowCount === 0)
      return res.status(404).json({ success: false, message: 'Not found' });

    const { category, leadType, remarks, name } = req.body;
    const result = await query(
      `UPDATE collected_cards SET
         category  = COALESCE($1, category),
         lead_type = COALESCE($2, lead_type),
         remarks   = COALESCE($3, remarks),
         name      = COALESCE($4, name)
       WHERE id = $5 AND user_id = $6
       RETURNING *`,
      [category, leadType, remarks, name, req.params.id, req.userId]
    );
    return res.json({ success: true, card: toCollected(result.rows[0]) });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// DELETE /collected/:id
router.delete('/:id', async (req, res) => {
  try {
    const result = await query(
      'DELETE FROM collected_cards WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.userId]
    );
    if (result.rowCount === 0)
      return res.status(404).json({ success: false, message: 'Not found' });
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

module.exports = router;