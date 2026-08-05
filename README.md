# CinTic — Advanced Cinema Booking System

CinTic is a high-performance, business-oriented movie ticket booking application designed with a robust, scalable architecture. At its core, the application features a proprietary Seat Recommendation Engine named **Vision IQ** which utilises geometric mathematics and heuristic algorithms to maximise both theatre revenue management and user viewing comfort.

## Architecture and Key Features

### 1. Vision IQ Seat Recommendation Engine (Arc Calculus)
Unlike traditional seat booking applications that rely on randomised selection or naive proximity logic, CinTic utilises a complex geometric algorithm to calculate the physically optimised viewing angle for any given group of patrons.
- **Neck Strain (Vertical Parallax):** The engine mathematically penalises rows positioned closest to the screen (Rows A through C) through a linear scalar function representing physical neck strain. The "Sweet Spot" is anchored to the exact middle rows (Rows E through G), resulting in a baseline vertical penalty of 0.
- **Parallax Skew (Horizontal Parallax):** Edge seats are severely penalised in the front rows, but practically face zero penalty in the back rows. This is achieved by generating a hypothetical "Viewing Cone" (similar to a megaphone). The algorithm calculates Parallax Skew by dividing the horizontal distance from the centre aisle by the depth to the screen squared.
- **Cluster IQ:** When large groups (4 or more patrons) attempt to book in a densely populated theatre, the algorithm automatically executes a splitting protocol. Rather than failing the recommendation, the group is divided into two symmetrical chunks (e.g., 2 and 2) while algorithmically minimising both the vertical and horizontal distance between the split clusters.
- **Anti-Stranding Heuristics:** The system utilises strict graph distance logic to penalise leaving single "orphan" seats stranded between booked groups or adjacent to an aisle. This prevents the "Swiss Cheese" layout effect, optimising the remaining contiguous blocks and allowing the theatre to successfully sell out at maximum capacity.

### 2. Dynamic Yield Management (Capacity Pricing)
The application behaves identically to modern airline and hotel yield management economies. The system continuously evaluates real-time theatre capacity by scanning the booked and locked seats in the persistence layer.
- **Capacity Thresholds:** When total theatre capacity crosses 80%, a global "High Demand" Boolean flag triggers across the application stack.
- **Profit Scaling:** Under High Demand conditions, the highest-tier seats (Platinum tier, Rows H-J) programmatically inflate in price by 15% at checkout. Simultaneously, the lowest-tier seats (Gold tier, front rows) predictably discount by 10%.

### 3. ADA Accessibility Compliance
- **Algorithmic Bypass:** When the ADA checkbox is activated in the UI, the engine suspends all Arc Calculus physics.
- **Dedicated Seating:** The algorithm strictly locks onto pre-designated wheelchair-accessible zones (Rows D and J). Companions are automatically seated in contiguous standard seats directly adjacent to the designated wheelchair space.

### 4. Persona-Driven Selection Matrices
The engine applies distinct modifier weights based on a user's selected viewing preference:
- **Cinephile:** Strongly weighted toward the mathematical global centre.
- **Couple:** Seeks isolated corner seats on the Platinum tier for maximum privacy.
- **Introvert:** Aggressively calculates global distance to other booked blocks to maximise empty buffer seats.
- **Family / Friends:** Enforces absolute contiguous grouping.

### 5. Secure Admin Analytics Dashboard
- **Authentication:** Requires the active JWT session token to contain the `isAdmin` boolean flag.
- **Live Aggregation:** Performs real-time Map-Reduce operations on the NoSQL bookings collection to calculate Total Gross Revenue, Total Tickets Sold, and Highest-Grossing Movies.

---

## Technology Stack

### Frontend
- **Rendering:** Vanilla HTML5 + CSS3 — no React, Vue, or Angular; zero framework overhead.
- **Styling:** CSS Custom Properties (Variables) driving dynamic dark-mode theming.
- **JavaScript:** ES6 Vanilla JS with Modules and Async/Await.
- **Libraries (CDN):** `qrcode-generator` (ticket QR codes), `jsPDF` + `html2canvas` (PDF ticket export), Google Identity Services (OAuth).

### Backend
- **Runtime:** Node.js (Serverless-ready; deploys to Vercel Functions or self-hosted via PM2).
- **API:** RESTful JSON endpoints, all served from the `/api/` directory.
- **Rate Limiting:** MongoDB-backed distributed rate limiter (per-IP and per-user).
- **Security:** JWT HTTP-Only cookies, CSRF Double-Submit tokens, BCrypt password hashing.

### Database
- **System:** MongoDB Atlas (NoSQL).
- **Design:** Optimised for real-time atomic seat-locking under high concurrency.

### AI / External Services
- **CinBot:** Groq API (`openai/gpt-oss-20b`) — cinema-domain AI concierge with security filtering (LLM-as-Judge).
- **Google OAuth:** Google Identity Services SDK + `google-auth-library` for server-side token verification.
- **Email:** Nodemailer — supports any SMTP provider (falls back to Ethereal in development).

---

## Installation & Deployment

### 1. Clone the repository
```bash
git clone https://github.com/Silentboy07A/sead.git
cd sead
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure Environment Variables

Copy the example file and fill in your values:
```bash
cp .env.example .env
```

| Variable | Required | Description |
|---|---|---|
| `MONGODB_URI` | ✅ **Required** | MongoDB Atlas connection string. URL-encode special chars in password (`@` → `%40`). |
| `JWT_SECRET` | ✅ **Required** | Secret for signing JWT tokens. Use 32+ random characters. |
| `GROQ_API_KEY` | ✅ **Required** | Groq API key for the CinBot AI concierge. Get one at [console.groq.com](https://console.groq.com/keys). |
| `GOOGLE_CLIENT_ID` | ✅ **Required** | Google OAuth 2.0 Client ID for "Sign in with Google". |
| `GOOGLE_CLIENT_SECRET` | ⚙️ Optional | Google OAuth Client Secret. Required for server-side token exchange. |
| `APP_URL` | ⚙️ Optional | Base URL for email links. Defaults to `http://localhost:3000`. |
| `SMTP_HOST` | ⚙️ Optional | SMTP server hostname. Falls back to Ethereal (test account) if omitted. |
| `SMTP_PORT` | ⚙️ Optional | SMTP port. Defaults to `587`. |
| `SMTP_SECURE` | ⚙️ Optional | Use TLS. Set to `true` for port 465. |
| `SMTP_USER` | ⚙️ Optional | SMTP username/address. |
| `SMTP_PASS` | ⚙️ Optional | SMTP password. |
| `MONGODB_DB` | ⚙️ Optional | MongoDB database name. Defaults to `cintic`. |
| `PORT` | ⚙️ Optional | Local server port. Defaults to `3000`. |

> [!IMPORTANT]
> If your MongoDB password contains special characters (e.g., `@`), you **must** URL-encode them in the connection string: `Sakthi@123` → `Sakthi%40123`.

> [!NOTE]
> **Not used:** This project does **not** use Supabase, Prisma, PostgreSQL, Redis, Upstash, Vercel KV, Stripe, SendGrid, Twilio, or any AWS SDK. The only external services are MongoDB Atlas, Groq, and optionally Google OAuth + SMTP.

### 4. Seed the Database
Start the server, then hit the seed endpoint once to populate movies and theatres:
```bash
npm run dev
# In another terminal:
curl http://localhost:3000/api/seed
```

### 5. Access the Application
```
http://localhost:3000
```

### 6. Production (Self-hosted with PM2)
```bash
npm run production
```

### 7. Deploy to Vercel
Set the environment variables in your Vercel project dashboard (Settings → Environment Variables), then push to `main`:
```bash
git push origin main
```
Vercel will auto-deploy using the serverless functions in the `/api/` directory.

---

## External Service Audit

| Service | Status | Used By |
|---|---|---|
| **MongoDB Atlas** | ✅ Required | All API routes — user auth, bookings, seat locks, rate limiting, movies/theatres data |
| **Groq API** | ✅ Required | `api/chat.js` — CinBot AI concierge (`openai/gpt-oss-20b` model) |
| **Google Identity Services** | ✅ Required | `api/_lib/auth/_google.js` + frontend OAuth button |
| **Nodemailer (SMTP)** | ⚙️ Optional | `api/_lib/auth/_register.js`, `_forgot-password.js` — email verification & password reset |
| **Supabase** | ❌ Not used | — |
| **Prisma / PostgreSQL** | ❌ Not used | — |
| **Upstash Redis / Vercel KV** | ❌ Not used | — |
| **Stripe** | ❌ Not used | Payment UI is simulated; no real payment processor is integrated |
| **AWS SDK** | ❌ Not used | — |
| **Firebase** | ❌ Not used | — |
| **OpenAI** | ❌ Not used | Groq is used instead (OpenAI-compatible API format) |

---

## Scripts

| Script | Command | Description |
|---|---|---|
| Dev server | `npm run dev` | Starts the Node.js server locally on port 3000 |
| Production | `npm run production` | Starts via PM2 cluster for self-hosted production |
| Seed DB | `GET /api/seed` | Populates MongoDB with 85 movies and 15 theatres |
| Set Admin | `node set_admin.js <email>` | Promotes a registered user to administrator |
| Verify Auth | `node verify_auth_flow.js` | Tests DB connection, user auth, and email dispatch |
| Lint | `npx eslint "**/*.js" --ignore-pattern node_modules/` | Runs ESLint code quality checks |
