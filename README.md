<<<<<<< HEAD
# EventFlow — Complete Event Management Platform v1.1
### Production-Ready · React + Node + MongoDB · RBAC · Analytics · QR Tickets · Notifications

---

## 🚀 Features

### 👤 User Features
- Signup & Login with JWT authentication
- Browse & search events with filters (category, city, date)
- View full event details: location, map link, price, countdown timer
- Register for events with attendee info form
- Online payment via **Razorpay** (or Stripe)
- Instant QR-code ticket generation
- Email confirmation with QR attached
- SMS & WhatsApp confirmation via Twilio
- View & download all personal tickets
- User dashboard with stats
- Edit profile & change password
- Dark mode support

### 🛠 Admin Features
- Admin dashboard with **Recharts** analytics:
  - Revenue over time (Area chart)
  - Registrations per event (Bar chart)
  - User growth (Line chart)
  - Popular events fill-rate (Progress bars)
- Create / Edit / Delete events (with map link, coordinates, ticket types)
- View all registrations + CSV export
- Track payments (Razorpay + Stripe)
- QR code check-in scanner
- Manage users & change roles

### 🔐 Role-Based Access Control
- JWT embeds `role` (admin / user)
- `/api/auth/permissions` returns granular UI permission map
- `hasPermission(key)` hook for frontend gating
- `authorise(...roles)` middleware for backend route protection

---

## 🗂 Project Structure

```
eventflow/
├── backend/
│   ├── middleware/
│   │   └── auth.js              JWT protect, adminOnly, authorise(), generateToken(id, role)
│   ├── models/
│   │   ├── User.js              role field (admin/user), bcrypt, JWT helpers
│   │   ├── Event.js             Enhanced location (mapLink, coordinates, fullAddress)
│   │   ├── Registration.js      QR storage, check-in tracking, attendeeInfo
│   │   └── Payment.js           Razorpay + Stripe payment records
│   ├── routes/
│   │   ├── auth.js              Register, Login, /me, /permissions, profile, password
│   │   ├── events.js            CRUD + text search + category + pagination
│   │   ├── registrations.js     Register for event, my tickets, cancel
│   │   ├── payments.js          Razorpay + Stripe + free — fires SMS/WhatsApp
│   │   ├── admin.js             Dashboard, 4 analytics endpoints, CSV export, check-in
│   │   └── tickets.js           Get QR ticket by registrationId
│   ├── utils/
│   │   ├── email.js             Nodemailer: confirmation, welcome, password reset
│   │   ├── qrcode.js            QR generation + tamper-proof checksum validation
│   │   ├── notifications.js     Twilio SMS + WhatsApp (feature-flagged)
│   │   └── seed.js              Seeds admin, demo user, 4 sample events
│   ├── server.js                Express app, CORS, Helmet, rate limiting
│   ├── package.json
│   ├── .env.example
│   └── .gitignore
│
└── frontend/
    ├── public/
    │   └── index.html
    ├── src/
    │   ├── components/
    │   │   ├── ui/index.js       Spinner, Button, Badge, EventCard, CountdownTimer, StatsCard
    │   │   ├── layout/
    │   │   │   ├── Navbar.js     Responsive + dark mode + user dropdown + admin link
    │   │   │   └── Footer.js
    │   │   └── admin/
    │   │       └── AdminLayout.js  Sidebar layout for all admin pages
    │   ├── context/
    │   │   ├── AuthContext.js    JWT decode, permissions map, hasPermission()
    │   │   └── ThemeContext.js   Dark / light mode toggle
    │   ├── pages/
    │   │   ├── Home.js           Hero, category grid, featured events, how-it-works, CTA
    │   │   ├── Events.js         Search, filter, sort, paginate
    │   │   ├── EventDetail.js    Full details + map link + role-gated CTA + countdown
    │   │   ├── Login.js          With demo credentials panel
    │   │   ├── Register.js
    │   │   ├── Dashboard.js      User dashboard with stats + recent registrations
    │   │   ├── MyTickets.js      All registrations with filter tabs
    │   │   ├── TicketView.js     Full QR ticket + download
    │   │   ├── Checkout.js       Razorpay payment flow
    │   │   ├── PaymentSuccess.js Confirmation + QR display
    │   │   ├── Profile.js        Edit profile + change password
    │   │   └── admin/
    │   │       ├── AdminDashboard.js   Recharts analytics + stats + activity feed
    │   │       ├── AdminEvents.js      Events table + publish/unpublish/delete
    │   │       ├── AdminEventForm.js   Create/edit with mapLink + coordinates
    │   │       ├── AdminRegistrations.js  Table + CSV export
    │   │       ├── AdminPayments.js    Payment history table
    │   │       ├── AdminCheckin.js     Camera scanner + manual QR check-in
    │   │       └── AdminUsers.js       User list + role management
    │   ├── utils/
    │   │   └── api.js            Axios instance + all API calls (auth, events, admin, analytics)
    │   ├── App.js                Routes + PrivateRoute + AdminRoute guards
    │   ├── index.js
    │   └── index.css             Tailwind + Google Fonts + custom scrollbar
    ├── tailwind.config.js        Dark mode class + violet palette + animations
    ├── package.json
    ├── .env.example
    └── .gitignore
```

---

## ⚡ Local Setup (5 Minutes)

### Prerequisites
- Node.js 18+
- MongoDB Atlas account (free M0 tier)
- Razorpay test account
- Gmail account (for email)

### 1. Install Dependencies

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Configure Backend `.env`

```bash
cd backend
cp .env.example .env
```

Edit `.env`:

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/eventflow

JWT_SECRET=your-super-secret-minimum-32-chars-here
JWT_EXPIRE=7d

FRONTEND_URL=http://localhost:3000

# Razorpay (razorpay.com/dashboard)
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
RAZORPAY_KEY_SECRET=your_razorpay_secret

# Gmail email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your@gmail.com
EMAIL_PASS=your-16-char-app-password
EMAIL_FROM=EventFlow <noreply@eventflow.com>

# Admin seed credentials
ADMIN_EMAIL=admin@eventflow.com
ADMIN_PASSWORD=Admin@123456

# Twilio — SMS & WhatsApp (optional)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+1XXXXXXXXXX
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
TWILIO_SMS_ENABLED=false
TWILIO_WHATSAPP_ENABLED=false
```

> **Gmail App Password:** Google Account → Security → 2-Step Verification → App Passwords → Generate for Mail

### 3. Configure Frontend `.env`

```bash
cd frontend
cp .env.example .env
```

Edit `.env`:
```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
```

### 4. Seed the Database

```bash
cd backend
npm run seed
```

Creates:
- Admin: `admin@eventflow.com` / `Admin@123456`
- Demo user: `rahul@demo.com` / `Demo@1234`
- 4 sample events (Technology, Music, Business, Free workshop)

### 5. Run Both Servers

```bash
# Terminal 1 — Backend (port 5000)
cd backend && npm run dev

# Terminal 2 — Frontend (port 3000)
cd frontend && npm start
```

Open **http://localhost:3000** 🎉

---

## 💳 Test Payments (Razorpay)

| Field | Value |
|---|---|
| Card Number | 4111 1111 1111 1111 |
| Expiry | Any future date |
| CVV | Any 3 digits |
| OTP | 1234 |
| UPI Test ID | success@razorpay |

---

## 📲 Enable SMS / WhatsApp Notifications

### Twilio Setup
1. Sign up at [twilio.com](https://twilio.com)
2. Copy **Account SID** + **Auth Token** from Console
3. Buy or use a trial phone number
4. Add to `.env` and set flags to `true`:
   ```env
   TWILIO_SMS_ENABLED=true
   TWILIO_WHATSAPP_ENABLED=true
   ```

### WhatsApp Sandbox (Testing)
1. Twilio Console → Messaging → Try WhatsApp
2. Follow sandbox join instructions
3. Use `whatsapp:+14155238886` as `TWILIO_WHATSAPP_FROM`

---

## 🔐 Role-Based Access Control

### How It Works
- JWT token contains `{ id, role }` in payload
- All protected routes verify JWT via `protect` middleware
- Admin routes additionally check `adminOnly` middleware
- Frontend reads role from token to show/hide UI elements
- `/api/auth/permissions` returns full permission map per role

### Permission Keys

```js
// Admin gets: createEvent, editEvent, deleteEvent,
//             viewAllRegistrations, viewAllPayments,
//             viewAllUsers, changeUserRole, viewAnalytics,
//             exportData, checkInAttendees

// User gets:  registerForEvent, makePayment,
//             viewOwnRegistrations, viewEventDetails
```

### Using in Your Own Components

```jsx
import { useAuth } from '../context/AuthContext';

function MyPage() {
  const { hasPermission, isAdmin } = useAuth();

  return (
    <>
      {hasPermission('createEvent') && <CreateButton />}
      {hasPermission('registerForEvent') && <RegisterButton />}
    </>
  );
}
```

### Protecting a New Backend Route

```js
const { protect, authorise } = require('../middleware/auth');

// Admin only
router.post('/admin-action', protect, authorise('admin'), handler);

// Any authenticated user
router.get('/user-data', protect, handler);
```

---

## 📊 Analytics API

All require Admin JWT.

| Endpoint | Description |
|---|---|
| `GET /api/admin/dashboard` | Stats, monthly revenue, recent activity |
| `GET /api/admin/analytics/registrations-per-event?limit=8` | Top events by registration count + fill rate |
| `GET /api/admin/analytics/revenue-over-time?months=12` | Monthly revenue + transaction count |
| `GET /api/admin/analytics/popular-events` | Top 10 events with fill-rate % |
| `GET /api/admin/analytics/user-growth?months=6` | New user sign-ups per month |

---

## 🗺 Event Map Links

When creating an event in the Admin panel, the Location section offers:

- **Google Maps Link** — paste any Maps URL directly
- **Latitude / Longitude** — auto-generates a `maps.google.com?q=lat,lng` URL
- **Leave blank** — auto-generates a search URL from venue + city

On the event detail page, a **"View on Google Maps"** button appears for physical events.

---

## 🚀 Deployment

### Backend → Render.com

1. Push `/backend` to a GitHub repo
2. Render → New Web Service → connect repo
3. Build command: `npm install`
4. Start command: `node server.js`
5. Add all env variables
6. Set `NODE_ENV=production`
7. Copy your Render URL

### Frontend → Vercel

1. Push `/frontend` to GitHub
2. Vercel → New Project → import repo
3. Framework: Create React App
4. Add env variables:
   ```
   REACT_APP_API_URL=https://your-render-url.onrender.com/api
   REACT_APP_RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxx
   ```
5. Deploy

### Database → MongoDB Atlas

1. [cloud.mongodb.com](https://cloud.mongodb.com) → Create free M0 cluster
2. Database Access → Add user (read/write)
3. Network Access → Allow `0.0.0.0/0`
4. Connect → copy URI → use as `MONGODB_URI`

### Post-Deploy: Seed Production DB

```bash
cd backend
MONGODB_URI=your_prod_uri node utils/seed.js
```

---

## 🔑 Full API Reference

### Auth
```
POST   /api/auth/register          Create account
POST   /api/auth/login             Login → JWT
GET    /api/auth/me                Current user (protected)
GET    /api/auth/permissions       Role permission map (protected)
PUT    /api/auth/profile           Update name/phone (protected)
PUT    /api/auth/change-password   Change password (protected)
```

### Events
```
GET    /api/events                 List (search, filter, paginate)
GET    /api/events/featured        Featured events
GET    /api/events/categories      Category counts
GET    /api/events/:id             Detail by ID or slug
POST   /api/events                 Create (admin)
PUT    /api/events/:id             Update (admin)
DELETE /api/events/:id             Delete (admin)
```

### Registrations
```
POST   /api/registrations          Register for event (user)
GET    /api/registrations/my       My registrations (user)
GET    /api/registrations/:id      Single registration (owner/admin)
DELETE /api/registrations/:id      Cancel (owner)
```

### Payments
```
POST   /api/payments/razorpay/create-order   Create Razorpay order
POST   /api/payments/razorpay/verify         Verify + generate QR + notify
POST   /api/payments/stripe/create-intent    Stripe intent
POST   /api/payments/stripe/webhook          Stripe webhook
POST   /api/payments/free                    Confirm free ticket + notify
```

### Tickets
```
GET    /api/tickets/:registrationId   Get QR ticket (owner/admin)
```

### Admin
```
GET    /api/admin/dashboard                          Stats + charts data
GET    /api/admin/users                              All users (paginated)
GET    /api/admin/registrations                      All registrations (filter)
GET    /api/admin/payments                           All payments
GET    /api/admin/export/registrations               CSV download
POST   /api/admin/checkin                            QR check-in
PATCH  /api/admin/users/:id/role                     Change user role
GET    /api/admin/analytics/registrations-per-event  Chart data
GET    /api/admin/analytics/revenue-over-time        Chart data
GET    /api/admin/analytics/popular-events           Chart data
GET    /api/admin/analytics/user-growth              Chart data
```

---

## 🧩 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Tailwind CSS, Framer Motion, Recharts |
| Backend | Node.js, Express.js |
| Database | MongoDB + Mongoose |
| Auth | JWT (role-embedded) + bcrypt |
| Payments | Razorpay (primary), Stripe (alternative) |
| Email | Nodemailer (Gmail SMTP) |
| SMS/WhatsApp | Twilio |
| QR Codes | qrcode npm package |
| Deployment | Vercel (FE) + Render (BE) + MongoDB Atlas |

---

## 🐛 Troubleshooting

| Problem | Fix |
|---|---|
| CORS errors | Check `FRONTEND_URL` in `.env` matches exactly |
| Razorpay not loading | Check network — script loads from CDN dynamically |
| Emails not sending | Use Gmail **App Password**, not regular password |
| MongoDB connection fail | Atlas → Network Access → allow `0.0.0.0/0` |
| Admin shows 403 | Log in as admin, not user account |
| Charts not showing | Run `npm install` in frontend — recharts required |
| SMS not sending | Check `TWILIO_SMS_ENABLED=true` and valid phone format |
| Permissions always false | Clear localStorage and log in fresh for new JWT |

---

## 🔑 Demo Credentials

| Role | Email | Password |
|---|---|---|
| Admin | admin@eventflow.com | Admin@123456 |
| User | rahul@demo.com | Demo@1234 |

---

*EventFlow v1.1 — Built for production* 🚀
=======
# Eventflow
>>>>>>> d84fb03d82b8db21b84dd3045cd22d1a72bce20f
