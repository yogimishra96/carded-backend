# ============================================================
# 🃏 CARDED API — CURL COMMANDS (COPY PASTE READY)
# Base URL: http://localhost:3000
# ============================================================


# ============================================================
# ✅ HEALTH CHECK
# ============================================================

curl -s -X GET http://localhost:3000/health \
  -H "Content-Type: application/json"


# ============================================================
# 🔐 AUTH — REGISTER
# ============================================================

curl -s -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "John Doe",
    "email": "john@example.com",
    "phone": "9876543210",
    "password": "test123"
  }'


# ============================================================
# 🔐 AUTH — LOGIN (with email)
# ============================================================

curl -s -X POST  https://carded-backend.vercel.app/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "emailOrPhone": "john@example.com",
    "password": "test123"
  }'


# ============================================================
# 🔐 AUTH — LOGIN (with phone)
# ============================================================

curl -s -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "emailOrPhone": "9876543210",
    "password": "test123"
  }'


# ============================================================
# 🔐 AUTH — GET CURRENT USER (me)
# NOTE: Replace TOKEN_HERE with token from login/register
# ============================================================

curl -s -X GET http://localhost:3000/auth/me \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN_HERE"


# ============================================================
# 🔐 AUTH — CHANGE PASSWORD
# ============================================================

curl -s -X PUT http://localhost:3000/auth/password \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN_HERE" \
  -d '{
    "currentPassword": "test123",
    "newPassword": "newpass456"
  }'


# ============================================================
# 🔐 AUTH — FORGOT PASSWORD
# ============================================================

curl -s -X POST http://localhost:3000/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{
    "emailOrPhone": "john@example.com"
  }'


# ============================================================
# 🔐 AUTH — REGISTER DUPLICATE (should return 409 error)
# ============================================================

curl -s -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "John Again",
    "email": "john@example.com",
    "phone": "9876543210",
    "password": "test123"
  }'


# ============================================================
# 🔐 AUTH — WRONG PASSWORD (should return 401 error)
# ============================================================

curl -s -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "emailOrPhone": "john@example.com",
    "password": "wrongpassword"
  }'


# ============================================================
# 💳 CARDS — CREATE CARD 1 (Midnight template)
# ============================================================

curl -s -X POST http://localhost:3000/cards \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN_HERE" \
  -d '{
    "nickname": "Work Card",
    "name": "John Doe",
    "designation": "Senior Product Manager",
    "company": "Acme Corp",
    "email1": "john@acme.com",
    "email2": "john@personal.com",
    "phone1": "+91 98765 43210",
    "phone2": "+91 98765 43211",
    "website": "https://johndoe.com",
    "address": "123 Business Park, Mumbai, MH",
    "templateIndex": 0
  }'


# ============================================================
# 💳 CARDS — CREATE CARD 2 (Forest template)
# ============================================================

curl -s -X POST http://localhost:3000/cards \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN_HERE" \
  -d '{
    "nickname": "Freelance",
    "name": "John Doe",
    "designation": "Freelance Designer",
    "company": "Self Employed",
    "email1": "john.design@gmail.com",
    "phone1": "+91 98765 43210",
    "website": "https://johndesigns.com",
    "templateIndex": 2
  }'


# ============================================================
# 💳 CARDS — CREATE CARD 3 (Rose template)
# ============================================================

curl -s -X POST http://localhost:3000/cards \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN_HERE" \
  -d '{
    "nickname": "Startup",
    "name": "John Doe",
    "designation": "Co-Founder",
    "company": "TechLaunch Ventures",
    "email1": "john@techlaunch.io",
    "phone1": "+91 98765 43210",
    "website": "https://techlaunch.io",
    "address": "91 Springboard, Bangalore",
    "templateIndex": 3
  }'


# ============================================================
# 💳 CARDS — GET ALL MY CARDS
# ============================================================

curl -s -X GET http://localhost:3000/cards \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN_HERE"


# ============================================================
# 💳 CARDS — GET SINGLE CARD
# NOTE: Replace CARD_ID_HERE with id from create response
# ============================================================

curl -s -X GET http://localhost:3000/cards/CARD_ID_HERE \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN_HERE"


# ============================================================
# 💳 CARDS — UPDATE CARD
# ============================================================

curl -s -X PUT http://localhost:3000/cards/CARD_ID_HERE \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN_HERE" \
  -d '{
    "nickname": "Work Card (Updated)",
    "designation": "Lead Product Manager",
    "website": "https://johndoe.dev"
  }'


# ============================================================
# 💳 CARDS — DELETE CARD
# ============================================================

curl -s -X DELETE http://localhost:3000/cards/CARD_ID_HERE \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN_HERE"


# ============================================================
# 💳 CARDS — GET CARD THAT DOES NOT EXIST (should return 404)
# ============================================================

curl -s -X GET http://localhost:3000/cards/00000000-0000-0000-0000-000000000000 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN_HERE"


# ============================================================
# 💳 CARDS — NO AUTH TOKEN (should return 401)
# ============================================================

curl -s -X GET http://localhost:3000/cards \
  -H "Content-Type: application/json"


# ============================================================
# 📇 COLLECTED — SAVE SCANNED CARD 1
# ============================================================

curl -s -X POST http://localhost:3000/collected \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN_HERE" \
  -d '{
    "name": "Jane Smith",
    "designation": "CEO",
    "company": "TechStart Inc",
    "email1": "jane@techstart.com",
    "email2": "jane.smith@gmail.com",
    "phone1": "+91 87654 32109",
    "website": "https://techstart.com",
    "address": "456 Tech Hub, Bangalore",
    "templateIndex": 1
  }'


# ============================================================
# 📇 COLLECTED — SAVE SCANNED CARD 2
# ============================================================

curl -s -X POST http://localhost:3000/collected \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN_HERE" \
  -d '{
    "name": "Ravi Kumar",
    "designation": "CTO",
    "company": "DevHouse Solutions",
    "email1": "ravi@devhouse.io",
    "phone1": "+91 99887 76655",
    "website": "https://devhouse.io",
    "templateIndex": 3
  }'


# ============================================================
# 📇 COLLECTED — SAVE SCANNED CARD 3
# ============================================================

curl -s -X POST http://localhost:3000/collected \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN_HERE" \
  -d '{
    "name": "Priya Mehta",
    "designation": "Marketing Head",
    "company": "GrowthBox Agency",
    "email1": "priya@growthbox.in",
    "phone1": "+91 91234 56789",
    "templateIndex": 4
  }'


# ============================================================
# 📇 COLLECTED — GET ALL COLLECTED CARDS
# ============================================================

curl -s -X GET http://localhost:3000/collected \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN_HERE"


# ============================================================
# 📇 COLLECTED — GET SINGLE COLLECTED CARD
# NOTE: Replace COLLECTED_ID_HERE with id from post response
# ============================================================

curl -s -X GET http://localhost:3000/collected/COLLECTED_ID_HERE \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN_HERE"


# ============================================================
# 📇 COLLECTED — UPDATE TAGS AND REMARKS (all fields)
# ============================================================

curl -s -X PUT http://localhost:3000/collected/COLLECTED_ID_HERE \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN_HERE" \
  -d '{
    "category": "Client",
    "leadType": "Hot",
    "remarks": "Met at TechConf 2025. Very interested. Follow up next week."
  }'


# ============================================================
# 📇 COLLECTED — UPDATE ONLY REMARKS
# ============================================================

curl -s -X PUT http://localhost:3000/collected/COLLECTED_ID_HERE \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN_HERE" \
  -d '{
    "remarks": "Called on 21-02-2026. Demo scheduled for Monday."
  }'


# ============================================================
# 📇 COLLECTED — UPDATE ONLY LEAD TYPE
# ============================================================

curl -s -X PUT http://localhost:3000/collected/COLLECTED_ID_HERE \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN_HERE" \
  -d '{
    "leadType": "Warm"
  }'


# ============================================================
# 📇 COLLECTED — DELETE COLLECTED CARD
# ============================================================

curl -s -X DELETE http://localhost:3000/collected/COLLECTED_ID_HERE \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN_HERE"


# ============================================================
# 📇 COLLECTED — GET NON EXISTENT CARD (should return 404)
# ============================================================

curl -s -X GET http://localhost:3000/collected/00000000-0000-0000-0000-000000000000 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN_HERE"


# ============================================================
# ❌ INVALID ROUTE (should return 404)
# ============================================================

curl -s -X GET http://localhost:3000/invalid-route \
  -H "Content-Type: application/json"