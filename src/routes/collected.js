const express = require('express');
const { query } = require('../db/pool');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.use(authMiddleware);

// ─── Helper: map DB row → API response shape ──────────────────
function toCollected(row) {
  return {
    id:            row.id,
    autoName:      row.auto_name,
    name:          row.name,
    designation:   row.designation,
    company:       row.company,
    email1:        row.email1,
    email2:        row.email2,
    phone1:        row.phone1,
    phone2:        row.phone2,
    website:       row.website,
    address:       row.address,
    templateIndex: row.template_index,
    category:      row.category,
    leadType:      row.lead_type,
    remarks:       row.remarks,
    scannedAt:     row.scanned_at,
    updatedAt:     row.updated_at,
  };
}

// ─── GET /collected ───────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM collected_cards WHERE user_id = $1 ORDER BY scanned_at DESC',
      [req.userId]
    );
    return res.json({ success: true, collected: result.rows.map(toCollected) });
  } catch (err) {
    console.error('Get collected error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// ─── GET /collected/:id ───────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM collected_cards WHERE id = $1 AND user_id = $2',
      [req.params.id, req.userId]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Collected card not found' });
    }
    return res.json({ success: true, card: toCollected(result.rows[0]) });
  } catch (err) {
    console.error('Get collected card error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// ─── POST /collected ──────────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const { name, designation, company, email1, email2,
            phone1, phone2, website, address, templateIndex } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'name is required' });
    }

    // Generate auto-name: dd-mm-yyyy (N)
    const now = new Date();
    const dd  = String(now.getDate()).padStart(2, '0');
    const mm  = String(now.getMonth() + 1).padStart(2, '0');
    const yyyy = now.getFullYear();

    const countRes = await query(
      'SELECT COUNT(*) FROM collected_cards WHERE user_id = $1',
      [req.userId]
    );
    const n = parseInt(countRes.rows[0].count) + 1;
    const autoName = `${dd}-${mm}-${yyyy} (${n})`;

    const result = await query(
      `INSERT INTO collected_cards
         (user_id, auto_name, name, designation, company,
          email1, email2, phone1, phone2, website, address, template_index)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
       RETURNING *`,
      [
        req.userId,
        autoName,
        name,
        designation || '',
        company || '',
        email1 || '',
        email2 || '',
        phone1 || '',
        phone2 || '',
        website || '',
        address || '',
        templateIndex ?? 0,
      ]
    );

    return res.status(201).json({ success: true, card: toCollected(result.rows[0]) });
  } catch (err) {
    console.error('Create collected error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// ─── PUT /collected/:id  (only category, leadType, remarks) ──
router.put('/:id', async (req, res) => {
  try {
    const existing = await query(
      'SELECT id FROM collected_cards WHERE id = $1 AND user_id = $2',
      [req.params.id, req.userId]
    );
    if (existing.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Collected card not found' });
    }

    const { category, leadType, remarks } = req.body;

    const result = await query(
      `UPDATE collected_cards SET
         category  = COALESCE($1, category),
         lead_type = COALESCE($2, lead_type),
         remarks   = COALESCE($3, remarks)
       WHERE id = $4 AND user_id = $5
       RETURNING *`,
      [category, leadType, remarks, req.params.id, req.userId]
    );

    return res.json({ success: true, card: toCollected(result.rows[0]) });
  } catch (err) {
    console.error('Update collected error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// ─── DELETE /collected/:id ────────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    const result = await query(
      'DELETE FROM collected_cards WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.userId]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Collected card not found' });
    }
    return res.json({ success: true, message: 'Collected card deleted' });
  } catch (err) {
    console.error('Delete collected error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

module.exports = router;
