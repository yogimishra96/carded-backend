const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getCards, saveCards } = require('../utils/fileStore');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
const MAX_CARDS = 5;

// All routes require auth
router.use(authMiddleware);

// ─── GET /cards ───────────────────────────────────────────────────────────────
router.get('/', (req, res) => {
  const cards = getCards(req.userId);
  return res.json({ success: true, cards });
});

// ─── POST /cards ──────────────────────────────────────────────────────────────
router.post('/', (req, res) => {
  const cards = getCards(req.userId);

  if (cards.length >= MAX_CARDS) {
    return res.status(403).json({
      success: false,
      message: `Card limit reached. Maximum ${MAX_CARDS} cards allowed.`,
    });
  }

  const { nickname, name, designation, company, email1, email2,
          phone1, phone2, website, address, templateIndex } = req.body;

  if (!name || !designation || !company || !email1 || !phone1) {
    return res.status(400).json({ success: false, message: 'Required fields missing (name, designation, company, email1, phone1)' });
  }

  const card = {
    id: uuidv4(),
    nickname: nickname || name,
    name,
    designation,
    company,
    email1,
    email2: email2 || '',
    phone1,
    phone2: phone2 || '',
    website: website || '',
    address: address || '',
    templateIndex: templateIndex ?? 0,
    createdAt: new Date().toISOString(),
  };

  cards.push(card);
  saveCards(req.userId, cards);

  return res.status(201).json({ success: true, card });
});

// ─── PUT /cards/:id ───────────────────────────────────────────────────────────
router.put('/:id', (req, res) => {
  const cards = getCards(req.userId);
  const idx = cards.findIndex(c => c.id === req.params.id);

  if (idx === -1) {
    return res.status(404).json({ success: false, message: 'Card not found' });
  }

  const updated = {
    ...cards[idx],
    ...req.body,
    id: cards[idx].id,         // prevent id override
    createdAt: cards[idx].createdAt, // preserve created time
    updatedAt: new Date().toISOString(),
  };

  cards[idx] = updated;
  saveCards(req.userId, cards);

  return res.json({ success: true, card: updated });
});

// ─── DELETE /cards/:id ────────────────────────────────────────────────────────
router.delete('/:id', (req, res) => {
  const cards = getCards(req.userId);
  const filtered = cards.filter(c => c.id !== req.params.id);

  if (filtered.length === cards.length) {
    return res.status(404).json({ success: false, message: 'Card not found' });
  }

  saveCards(req.userId, filtered);
  return res.json({ success: true, message: 'Card deleted' });
});

// ─── GET /cards/:id ───────────────────────────────────────────────────────────
router.get('/:id', (req, res) => {
  const cards = getCards(req.userId);
  const card = cards.find(c => c.id === req.params.id);
  if (!card) return res.status(404).json({ success: false, message: 'Card not found' });
  return res.json({ success: true, card });
});

module.exports = router;
