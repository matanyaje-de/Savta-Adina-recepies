-- תגובות של מבקרים על מתכונים.
-- created_at נשמר כשניות יוניקס (מספר) כדי שהשוואות זמן יהיו זולות.
-- ip_hash הוא SHA-256 של הכתובת + מלח — משמש רק להגבלת קצב, לא לזיהוי.
-- approved: 1 = מוצג. הערך נקבע ב-Worker (AUTO_APPROVE), לא כאן.

CREATE TABLE comments (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  recipe_id  INTEGER NOT NULL,
  name       TEXT    NOT NULL,
  text       TEXT    NOT NULL,
  created_at INTEGER NOT NULL,
  ip_hash    TEXT    NOT NULL,
  approved   INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX idx_comments_recipe ON comments (recipe_id, approved, created_at);
CREATE INDEX idx_comments_ip ON comments (ip_hash, created_at);
