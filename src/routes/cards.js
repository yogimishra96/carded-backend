const express = require('express');
const { query } = require('../db/pool');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
const MAX_CARDS = 5;

router.use(authMiddleware);

// ─── Helper: map DB row → API response shape ──────────────────
function toCard(row) {
  return {
    id:            row.id,
    nickname:      row.nickname,
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
    createdAt:     row.created_at,
    updatedAt:     row.updated_at,
  };
}

// ─── GET /cards ───────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM cards WHERE user_id = $1 ORDER BY created_at ASC',
      [req.userId]
    );
    return res.json({ success: true, cards: result.rows.map(toCard) });
  } catch (err) {
    console.error('Get cards error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// ─── GET /cards/:id ───────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM cards WHERE id = $1 AND user_id = $2',
      [req.params.id, req.userId]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Card not found' });
    }
    return res.json({ success: true, card: toCard(result.rows[0]) });
  } catch (err) {
    console.error('Get card error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// ─── POST /cards ──────────────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    // Enforce card limit
    const countRes = await query(
      'SELECT COUNT(*) FROM cards WHERE user_id = $1',
      [req.userId]
    );
    if (parseInt(countRes.rows[0].count) >= MAX_CARDS) {
      return res.status(403).json({
        success: false,
        message: `Card limit reached. Maximum ${MAX_CARDS} cards allowed.`,
      });
    }

    const { nickname, name, designation, company, email1, email2,
            phone1, phone2, website, address, templateIndex } = req.body;

    if (!name || !designation || !company || !email1 || !phone1) {
      return res.status(400).json({
        success: false,
        message: 'Required: name, designation, company, email1, phone1',
      });
    }

    const result = await query(
      `INSERT INTO cards
         (user_id, nickname, name, designation, company,
          email1, email2, phone1, phone2, website, address, template_index)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
       RETURNING *`,
      [
        req.userId,
        nickname || name,
        name,
        designation,
        company,
        email1,
        email2 || '',
        phone1,
        phone2 || '',
        website || '',
        address || '',
        templateIndex ?? 0,
      ]
    );

    return res.status(201).json({ success: true, card: toCard(result.rows[0]) });
  } catch (err) {
    console.error('Create card error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// ─── PUT /cards/:id ───────────────────────────────────────────
router.put('/:id', async (req, res) => {
  try {
    // Check card exists and belongs to user
    const existing = await query(
      'SELECT id FROM cards WHERE id = $1 AND user_id = $2',
      [req.params.id, req.userId]
    );
    if (existing.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Card not found' });
    }

    const { nickname, name, designation, company, email1, email2,
            phone1, phone2, website, address, templateIndex } = req.body;

    const result = await query(
      `UPDATE cards SET
         nickname       = COALESCE($1, nickname),
         name           = COALESCE($2, name),
         designation    = COALESCE($3, designation),
         company        = COALESCE($4, company),
         email1         = COALESCE($5, email1),
         email2         = COALESCE($6, email2),
         phone1         = COALESCE($7, phone1),
         phone2         = COALESCE($8, phone2),
         website        = COALESCE($9, website),
         address        = COALESCE($10, address),
         template_index = COALESCE($11, template_index)
       WHERE id = $12 AND user_id = $13
       RETURNING *`,
      [
        nickname,
        name,
        designation,
        company,
        email1,
        email2,
        phone1,
        phone2,
        website,
        address,
        templateIndex,
        req.params.id,
        req.userId,
      ]
    );

    return res.json({ success: true, card: toCard(result.rows[0]) });
  } catch (err) {
    console.error('Update card error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// ─── DELETE /cards/:id ────────────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    const result = await query(
      'DELETE FROM cards WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.userId]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Card not found' });
    }
    return res.json({ success: true, message: 'Card deleted' });
  } catch (err) {
    console.error('Delete card error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

module.exports = router;
