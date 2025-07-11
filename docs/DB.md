**Database open-give**, bao gồm:

1. Tạo database
2. Enable extension cần thiết
3. Định nghĩa enums
4. Tạo tất cả bảng
5. Tạo các index

---

## 📝 **🎯 Mục tiêu**

➡️ **DB name:** `open_give`
➡️ **DB platform:** PostgreSQL
➡️ **Scope:** Bao gồm các bảng:

* users
* user\_login\_history
* refresh\_tokens
* campaigns
* campaign\_updates
* campaign\_beneficiaries
* donations
* kyc\_verifications
* notifications

… cùng toàn bộ ENUMS liên quan.

---

## 🔨 **FULL SCRIPT TẠO DATABASE open-give**

```sql
-- 🔧 1. Tạo Database
CREATE DATABASE open_give;

-- 🔧 2. Kết nối vào database mới
\c open_give;

-- 🔧 3. Enable extension UUID
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 🔧 4. ENUMS

CREATE TYPE user_role AS ENUM ('admin', 'donor', 'beneficiary');
CREATE TYPE kyc_status AS ENUM ('pending', 'approved', 'rejected', 'requires_additional_info');
CREATE TYPE kyc_method AS ENUM ('manual_review', 'government_db', 'hospital_verification');
CREATE TYPE id_type AS ENUM ('citizen_id', 'passport', 'driver_license');
CREATE TYPE campaign_status AS ENUM ('draft', 'active', 'paused', 'completed', 'cancelled');
CREATE TYPE donation_status AS ENUM ('pending', 'completed', 'failed', 'refunded');
CREATE TYPE notification_type AS ENUM ('donation_received', 'campaign_update', 'kyc_status', 'system');

-- 🔧 5. USERS TABLE

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  avatar_url TEXT,
  role user_role NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  is_verified BOOLEAN DEFAULT FALSE,

  failed_login_attempts INT DEFAULT 0,
  last_failed_login_at TIMESTAMP,
  last_login_at TIMESTAMP,
  token_version INT DEFAULT 0,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_failed_login_attempts ON users(failed_login_attempts);
CREATE INDEX idx_users_last_login_at ON users(last_login_at);

-- 🔧 6. USER LOGIN HISTORY TABLE

CREATE TABLE user_login_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  ip_address VARCHAR(50),
  user_agent TEXT,
  success BOOLEAN,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_user_login_history_user_id ON user_login_history(user_id);
CREATE INDEX idx_user_login_history_created_at ON user_login_history(created_at);

-- 🔧 7. REFRESH TOKENS TABLE

CREATE TABLE refresh_tokens (
  token UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  expires_at TIMESTAMP NOT NULL,
  revoked_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);

-- 🔧 8. CAMPAIGNS TABLE

CREATE TABLE campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(500) NOT NULL,
  description TEXT NOT NULL,
  target_amount DECIMAL(15,2) NOT NULL,
  current_amount DECIMAL(15,2) DEFAULT 0,
  minimum_beneficiaries INTEGER DEFAULT 10,
  current_beneficiaries INTEGER DEFAULT 0,
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP NOT NULL,
  status campaign_status DEFAULT 'draft',
  category VARCHAR(100) NOT NULL,
  location VARCHAR(255),
  images TEXT[],
  documents TEXT[],
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_campaigns_status ON campaigns(status);
CREATE INDEX idx_campaigns_category ON campaigns(category);
CREATE INDEX idx_campaigns_created_at ON campaigns(created_at);
CREATE INDEX idx_campaigns_dates ON campaigns(start_date, end_date);

-- 🔧 9. CAMPAIGN UPDATES TABLE

CREATE TABLE campaign_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  images TEXT[],
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 🔧 10. CAMPAIGN BENEFICIARIES TABLE

CREATE TABLE campaign_beneficiaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  beneficiary_id UUID REFERENCES users(id),
  allocation_amount DECIMAL(15,2),
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 🔧 11. DONATIONS TABLE

CREATE TABLE donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  donor_id UUID REFERENCES users(id),
  amount DECIMAL(15,2) NOT NULL,
  message TEXT,
  is_anonymous BOOLEAN DEFAULT FALSE,
  payment_method VARCHAR(50),
  transaction_id VARCHAR(255),
  status donation_status DEFAULT 'pending',
  donated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  processed_at TIMESTAMP
);

CREATE INDEX idx_donations_campaign_id ON donations(campaign_id);
CREATE INDEX idx_donations_donor_id ON donations(donor_id);
CREATE INDEX idx_donations_status ON donations(status);

-- 🔧 12. KYC VERIFICATIONS TABLE

CREATE TABLE kyc_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  id_number VARCHAR(50) NOT NULL,
  id_type id_type NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  date_of_birth DATE NOT NULL,
  address TEXT NOT NULL,
  front_id_image TEXT NOT NULL,
  back_id_image TEXT NOT NULL,
  selfie_image TEXT NOT NULL,
  additional_documents TEXT[],
  verification_method kyc_method DEFAULT 'manual_review',
  status kyc_status DEFAULT 'pending',
  rejection_reason TEXT,
  verified_by UUID REFERENCES users(id),
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  verified_at TIMESTAMP
);

CREATE INDEX idx_kyc_user_id ON kyc_verifications(user_id);
CREATE INDEX idx_kyc_status ON kyc_verifications(status);

-- 🔧 13. NOTIFICATIONS TABLE

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type notification_type NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  related_id UUID,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
```

---

## ✅ **Script này sẽ:**

* Tạo database `open_give`
* Enable extension UUID
* Tạo tất cả ENUMS, bảng, và indexes chuẩn chỉnh
* Đảm bảo ready cho dev, staging, production

---

💡 **Tiếp theo:**

* Seed data roles & admin?
* Viết stored procedures revoke tokens?
* Viết API auth full (JWT + refresh + revoke + MFA)?
