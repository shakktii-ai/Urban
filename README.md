# Municipal Citizen Complaint Management System

Full-stack Next.js application for automated municipal citizen complaint management using **BagAChat WhatsApp APIs 1.1, 1.2, and 4**.

---

## 🛠️ Environment Variables Configuration

The project strictly relies on official **BagAChat cURL documentation** parameters:

```env
# Server & App Config
PORT=3000
NODE_ENV=development
APP_URL=http://localhost:3000

# Database Connection
MONGODB_URI=mongodb://localhost:27017/gov_service_platform

# Authentication
JWT_SECRET=super_secret_jwt_key_gov_platform_2026

# Official BagAChat WhatsApp APIs (APIs 1.1, 1.2, 4)
BAGACHAT_BASIC_AUTH=PRJK22051611BHI2
BAGACHAT_TRANSACTIONAL_API=https://push.bagachat.com/api/sendtransactionalmsg_waentapi.bg
BAGACHAT_SESSION_API=https://link.bagachat.com/api/sendcustomercaremsg_waentapi.bg
BAGACHAT_VERIFY_TOKEN=919022557901
BAGACHAT_WEBHOOK_URL=/api/webhook/bagachat
BAGACHAT_PHONE_NUMBER=919022557901
```

---

## 🚀 Running Locally

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start development server:
   ```bash
   npm run dev
   ```

3. Open [http://localhost:3000/login](http://localhost:3000/login) (Default Super Admin: `admin@municipal.gov.in` / `admin`).
