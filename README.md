# CinTic - Advanced Cinema Booking System

CinTic is a high-performance, business-oriented movie ticket booking application designed with a robust, scalable architecture. At its core, the application features a proprietary Seat Recommendation Engine named "Vision IQ" which utilizes geometric mathematics and heuristic algorithms to maximize both theater revenue management and user viewing comfort.

## Architecture and Key Features

### 1. Vision IQ Seat Recommendation Engine (Arc Calculus)
Unlike traditional seat booking applications that rely on randomized selection or naive proximity logic, CinTic utilizes a complex geometric algorithm to calculate the physically optimized viewing angle for any given group of patrons.
- **Neck Strain (Vertical Parallax):** The engine mathematically penalizes rows positioned closest to the screen (Rows A through C) through a linear scalar function representing physical neck strain. The "Sweet Spot" is anchored to the exact middle rows (Rows E through G), resulting in a baseline vertical penalty of 0.
- **Parallax Skew (Horizontal Parallax):** Edge seats are severely penalized in the front rows, but practically face zero penalty in the back rows. This is achieved by generating a hypothetical "Viewing Cone" (similar to a megaphone). The algorithm calculates Parallax Skew by dividing the horizontal distance from the center aisle by the depth to the screen squared.
- **Cluster IQ:** When large groups (4 or more patrons) attempt to book in a densely populated theater, the algorithm automatically executes a splitting protocol. Rather than failing the recommendation, the group is divided into two symmetrical chunks (e.g., 2 and 2) while algorithmically minimizing both the vertical and horizontal distance between the split clusters.
- **Anti-Stranding Heuristics:** The system utilizes strict graph distance logic to penalize leaving single "orphan" seats stranded between booked groups or adjacent to an aisle. This prevents the "Swiss Cheese" layout effect, optimizing the remaining contiguous blocks and allowing the theater to successfully sell out at maximum capacity.

### 2. Dynamic Yield Management (Capacity Pricing)
The application behaves identically to modern airline and hotel yield management economies. The system continuously evaluates real-time theater capacity by scanning the booked and locked seats in the persistence layer.
- **Capacity Thresholds:** When total theater capacity crosses 80%, a global "High Demand" Boolean flag triggers across the application stack.
- **Profit Scaling:** Under High Demand conditions, the highest-tier seats (Platinum tier, Rows H-J) programmatically inflate in price by 15% at checkout. Simultaneously, the lowest-tier seats (Gold tier, front rows) predictably discount by 10%. This inverse scaling secures maximum profit on premium inventory while guaranteeing a 100% sell-out on less desirable inventory.

### 3. Americans with Disabilities Act (ADA) Compliance
Production-tier applications require rigid adherence to legal accessibility guidelines. CinTic features a dedicated accessibility override.
- **Algorithmic Bypass:** When the ADA checkbox is activated in the UI, the engine suspends all Arc Calculus and Persona physics.
- **Dedicated Seating:** The algorithm strictly locks onto pre-designated wheelchair-accessible zones (specifically the spacious corner seats of Rows D and J). Included in this logic is the automatic guarantee that any accompanying companions are seamlessly seated in contiguous standard seats directly adjacent to the designated wheelchair space.

### 4. Persona-Driven Selection Matrices
The engine applies distinct modifier weights based on a user's selected viewing preference prior to running the physics calculations:
- **Cinephile:** Strongly weighted toward the mathematical global center; applies a massive score bonus for x-axis proximity to the center line.
- **Couple:** Disregards center alignment entirely in favor of isolated blocks; seeks out deeply embedded corner seats on the Platinum tier to maximize privacy.
- **Introvert:** Inverts standard proximity logic; aggressively calculates global distance to other booked blocks to maximize empty buffer seats.
- **Family / Friends:** Enforces absolute contiguous grouping; heavily penalizes any situation that triggers a Cluster IQ split unless absolutely mathematically necessary.

### 5. Secure Admin Analytics Dashboard
A dedicated dashboard interface is exclusively exposed to theater administrators.
- **Authentication Check:** The dashboard requires the active JWT session token to contain the `isAdmin` boolean flag.
- **Live Aggregation:** A dedicated backend endpoint performs real-time Map-Reduce operations on the NoSQL bookings collection to calculate live Total Gross Revenue, Total Aggregate Tickets Sold, and generates a dynamic leaderboard representing the Highest-Grossing Movies in the database.

---

## Detailed Technology Stack

### Frontend Architecture
- **Rendering:** Vanilla HTML5, advanced CSS3. Specifically built with zero heavy frameworks (No React, Vue, or Angular) to achieve instantaneous DOM rendering, zero bundle-size overhead, and the absolute lowest Time-to-Interactive (TTI).
- **Styling:** CSS Variables (Custom Properties) drive dynamic theming, including the prominent dark mode and algorithmic color palette extraction derived from movie posters.
- **JavaScript:** ES6 Vanilla JavaScript utilizing Modules, Async/Await patterns for API handling, and the Intersection Observer API for viewport animations.

### Backend Architecture
- **Environment:** Node.js API Controllers designed for a Serverless Architecture environment (e.g., Vercel Functions or AWS Lambda).
- **Communication:** Standardized RESTful endpoints handling JSON payloads.
- **State Handling:** Fully stateless backend relying entirely on external database persistence to handle highly concurrent requests without memory leaks.

### Database Layer
- **System:** MongoDB (NoSQL).
- **Design Philosophy:** Optimized for rapid document mutability and atomic operations, enabling the real-time locking matrix required for concurrent seat reservations.

### Security Protocols
- **Authentication:** Secure JSON Web Tokens (JWT) stored in HTTP-Only, Secure cookies to prevent cross-site scripting (XSS) tampering.
- **Authorization:** Granular roles mapping (Standard User, Administrator) validated server-side on every restricted endpoint.
- **Attack Prevention:** Integrated Cross-Site Request Forgery (CSRF) handshake protection on all mutation endpoints and BCrypt password salting algorithms.

---

## Installation & Deployment

1. **Clone the repository:**
```bash
git clone https://github.com/your-username/cintic.git
cd cintic
```

2. **Install backend dependencies:**
```bash
npm install
```

3. **Configure Environment Variables:**
Create a `.env` file in the root directory housing your secure connection strings:
```env
MONGODB_URI=your_mongodb_cluster_connection_string
JWT_SECRET=your_hyper_secure_jwt_secret_key
GOOGLE_CLIENT_ID=your_google_oauth_client_id
```

4. **Initialize the Server:**
This script will concurrently boot the Node API layer and serve the frontend static files on port 3000.
```bash
npm run dev
```

5. **Access Application:**
Navigate your browser to `http://localhost:3000`.
