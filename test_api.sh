#!/bin/bash
# ============================================================
# 🃏 CARDED API — CURL TEST COMMANDS
# ============================================================
# Base URL — change if using Render
BASE="http://localhost:3000"

# After login/register, paste your token here:
TOKEN="PASTE_YOUR_TOKEN_HERE"

# After creating a card, paste its ID here:
CARD_ID="PASTE_CARD_ID_HERE"

# After collecting a card, paste its ID here:
COLLECTED_ID="PASTE_COLLECTED_ID_HERE"


# ============================================================
# 🔐 AUTH ROUTES
# ============================================================

# ── 1. Health Check ──────────────────────────────────────────
curl -s "$BASE/health" | python3 -m json.tool


# ── 2. Register ──────────────────────────────────────────────
curl -s -X POST "$BASE/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "John Doe",
    "email": "john@example.com",
    "phone": "9876543210",
    "password": "test123"
  }' | python3 -m json.tool

# 👆 Copy the "token" from response and set TOKEN= above


# ── 3. Login ─────────────────────────────────────────────────
curl -s -X POST "$BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "emailOrPhone": "john@example.com",
    "password": "test123"
  }' | python3 -m json.tool

# Login with phone instead of email:
curl -s -X POST "$BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "emailOrPhone": "9876543210",
    "password": "test123"
  }' | python3 -m json.tool


# ── 4. Get Current User (me) ──────────────────────────────────
curl -s -X GET "$BASE/auth/me" \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool


# ── 5. Change Password ────────────────────────────────────────
curl -s -X PUT "$BASE/auth/password" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "currentPassword": "test123",
    "newPassword": "newpass456"
  }' | python3 -m json.tool


# ── 6. Forgot Password ────────────────────────────────────────
curl -s -X POST "$BASE/auth/forgot-password" \
  -H "Content-Type: application/json" \
  -d '{"emailOrPhone": "john@example.com"}' | python3 -m json.tool


# ── 7. Wrong password (should fail) ──────────────────────────
curl -s -X POST "$BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "emailOrPhone": "john@example.com",
    "password": "wrongpassword"
  }' | python3 -m json.tool


# ── 8. Duplicate register (should fail) ──────────────────────
curl -s -X POST "$BASE/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "John Again",
    "email": "john@example.com",
    "phone": "9999999999",
    "password": "test123"
  }' | python3 -m json.tool


# ============================================================
# 💳 CARDS ROUTES (My Visiting Cards)
# ============================================================

# ── 9. Create Card ────────────────────────────────────────────
curl -s -X POST "$BASE/cards" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
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
  }' | python3 -m json.tool

# 👆 Copy the "id" from response and set CARD_ID= above


# ── 10. Create Second Card (different template) ───────────────
curl -s -X POST "$BASE/cards" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "nickname": "Freelance",
    "name": "John Doe",
    "designation": "Freelance Designer",
    "company": "Self Employed",
    "email1": "john.freelance@gmail.com",
    "phone1": "+91 98765 43210",
    "templateIndex": 2
  }' | python3 -m json.tool


# ── 11. Get All My Cards ──────────────────────────────────────
curl -s -X GET "$BASE/cards" \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool


# ── 12. Get Single Card ───────────────────────────────────────
curl -s -X GET "$BASE/cards/$CARD_ID" \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool


# ── 13. Update Card ───────────────────────────────────────────
curl -s -X PUT "$BASE/cards/$CARD_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "nickname": "Work Card (Updated)",
    "designation": "Lead Product Manager",
    "website": "https://johndoe.dev"
  }' | python3 -m json.tool


# ── 14. Delete Card ───────────────────────────────────────────
curl -s -X DELETE "$BASE/cards/$CARD_ID" \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool


# ── 15. Card limit test (create 5 then try 6th — should fail) ─
for i in 1 2 3 4 5 6; do
  echo "--- Creating card $i ---"
  curl -s -X POST "$BASE/cards" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
      \"nickname\": \"Card $i\",
      \"name\": \"John Doe\",
      \"designation\": \"Manager\",
      \"company\": \"Company $i\",
      \"email1\": \"john$i@test.com\",
      \"phone1\": \"98765432$i\",
      \"templateIndex\": $((i % 6))
    }" | python3 -m json.tool
done


# ── 16. No auth (should fail with 401) ───────────────────────
curl -s -X GET "$BASE/cards" | python3 -m json.tool


# ============================================================
# 📇 COLLECTED CARDS ROUTES (Scanned Cards)
# ============================================================

# ── 17. Save Collected Card (simulates QR scan) ───────────────
curl -s -X POST "$BASE/collected" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Smith",
    "designation": "CEO",
    "company": "TechStart Inc",
    "email1": "jane@techstart.com",
    "email2": "jane.smith@gmail.com",
    "phone1": "+91 87654 32109",
    "phone2": "",
    "website": "https://techstart.com",
    "address": "456 Tech Hub, Bangalore",
    "templateIndex": 1
  }' | python3 -m json.tool

# 👆 Copy the "id" and set COLLECTED_ID= above


# ── 18. Save Another Collected Card ──────────────────────────
curl -s -X POST "$BASE/collected" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Ravi Kumar",
    "designation": "CTO",
    "company": "DevHouse Solutions",
    "email1": "ravi@devhouse.io",
    "phone1": "+91 99887 76655",
    "templateIndex": 3
  }' | python3 -m json.tool


# ── 19. Get All Collected Cards ───────────────────────────────
curl -s -X GET "$BASE/collected" \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool


# ── 20. Get Single Collected Card ────────────────────────────
curl -s -X GET "$BASE/collected/$COLLECTED_ID" \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool


# ── 21. Update Tags / Notes (category, leadType, remarks) ────
curl -s -X PUT "$BASE/collected/$COLLECTED_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "category": "Client",
    "leadType": "Hot",
    "remarks": "Met at TechConf 2025. Very interested in our product. Follow up next week."
  }' | python3 -m json.tool


# ── 22. Update only remarks ───────────────────────────────────
curl -s -X PUT "$BASE/collected/$COLLECTED_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"remarks": "Called on 20-02-2026. Scheduled demo for next Monday."}' | python3 -m json.tool


# ── 23. Delete Collected Card ─────────────────────────────────
curl -s -X DELETE "$BASE/collected/$COLLECTED_ID" \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool


# ── 24. Get non-existent card (should fail with 404) ─────────
curl -s -X GET "$BASE/collected/fake-id-12345" \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool


# ── 25. Invalid route (should fail with 404) ─────────────────
curl -s -X GET "$BASE/invalid-route" | python3 -m json.tool
