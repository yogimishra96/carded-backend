const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../../data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

// ─── Ensure directories exist ─────────────────────────────────────────────────

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

ensureDir(DATA_DIR);

// ─── Generic JSON read/write ──────────────────────────────────────────────────

function readJSON(filePath, fallback = null) {
  try {
    if (!fs.existsSync(filePath)) return fallback;
    const raw = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function writeJSON(filePath, data) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

// ─── Users store (global) ─────────────────────────────────────────────────────

function readUsers() {
  return readJSON(USERS_FILE, {});
}

function writeUsers(users) {
  writeJSON(USERS_FILE, users);
}

function getUserById(userId) {
  const users = readUsers();
  return users[userId] || null;
}

function getUserByEmail(email) {
  const users = readUsers();
  return Object.values(users).find(u => u.email === email) || null;
}

function getUserByPhone(phone) {
  const users = readUsers();
  return Object.values(users).find(u => u.phone === phone) || null;
}

function saveUser(user) {
  const users = readUsers();
  users[user.id] = user;
  writeUsers(users);
}

// ─── Per-user data paths ──────────────────────────────────────────────────────

function userDir(userId) {
  return path.join(DATA_DIR, 'users', userId);
}

function cardsFile(userId) {
  return path.join(userDir(userId), 'cards.json');
}

function collectedFile(userId) {
  return path.join(userDir(userId), 'collected.json');
}

// ─── Cards ────────────────────────────────────────────────────────────────────

function getCards(userId) {
  return readJSON(cardsFile(userId), []);
}

function saveCards(userId, cards) {
  writeJSON(cardsFile(userId), cards);
}

// ─── Collected Cards ──────────────────────────────────────────────────────────

function getCollected(userId) {
  return readJSON(collectedFile(userId), []);
}

function saveCollected(userId, collected) {
  writeJSON(collectedFile(userId), collected);
}

module.exports = {
  getUserById,
  getUserByEmail,
  getUserByPhone,
  saveUser,
  readUsers,
  getCards,
  saveCards,
  getCollected,
  saveCollected,
};
