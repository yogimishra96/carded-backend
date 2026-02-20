const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getCollected, saveCollected } = require('../utils/fileStore');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.use(authMiddleware);

// ─── GET /collected ───────────────────────────────────────────────────────────
router.get('/', (req, res) => {
  const collected = getCollected(req.userId);
  // Return newest first
  return res.json({ success: true, collected: collected.reverse() });
});

// ─── POST /collected  (called after scanning a QR) ───────────────────────────
router.post('/', (req, res) => {
  const collected = getCollected(req.userId);

  const { name, designation, company, email1, email2,
          phone1, phone2, website, address, templateIndex } = req.body;

  if (!name) {
    return res.status(400).json({ success: false, message: 'name is required' });
  }

  // Auto-name: dd-mm-yyyy (N)
  const now = new Date();
  const day   = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year  = now.getFullYear();
  const count = collected.length + 1;
  const autoName = `${day}-${month}-${year} (${count})`;

  const card = {
    id: uuidv4(),
    autoName,
    name,
    designation: designation || '',
    company: company || '',
    email1: email1 || '',
    email2: email2 || '',
    phone1: phone1 || '',
    phone2: phone2 || '',
    website: website || '',
    address: address || '',
    templateIndex: templateIndex ?? 0,
    category: '',
    leadType: '',
    remarks: '',
    scannedAt: now.toISOString(),
  };

  collected.push(card);
  saveCollected(req.userId, collected);

  return res.status(201).json({ success: true, card });
});

// ─── PUT /collected/:id  (update category, leadType, remarks) ────────────────
router.put('/:id', (req, res) => {
  const collected = getCollected(req.userId);
  const idx = collected.findIndex(c => c.id === req.params.id);

  if (idx === -1) {
    return res.status(404).json({ success: false, message: 'Collected card not found' });
  }

  // Only allow updating editable fields
  const { category, leadType, remarks } = req.body;
  collected[idx] = {
    ...collected[idx],
    ...(category  !== undefined && { category }),
    ...(leadType  !== undefined && { leadType }),
    ...(remarks   !== undefined && { remarks }),
    updatedAt: new Date().toISOString(),
  };

  saveCollected(req.userId, collected);
  return res.json({ success: true, card: collected[idx] });
});

// ─── DELETE /collected/:id ────────────────────────────────────────────────────
router.delete('/:id', (req, res) => {
  const collected = getCollected(req.userId);
  const filtered = collected.filter(c => c.id !== req.params.id);

  if (filtered.length === collected.length) {
    return res.status(404).json({ success: false, message: 'Collected card not found' });
  }

  saveCollected(req.userId, filtered);
  return res.json({ success: true, message: 'Collected card deleted' });
});

// ─── GET /collected/:id ───────────────────────────────────────────────────────
router.get('/:id', (req, res) => {
  const collected = getCollected(req.userId);
  const card = collected.find(c => c.id === req.params.id);
  if (!card) return res.status(404).json({ success: false, message: 'Not found' });
  return res.json({ success: true, card });
});

module.exports = router;
