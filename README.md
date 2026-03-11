# CinTic - Movie Ticket Booking

CinTic is a modern, responsive, single-page application for booking movie tickets. It features a sleek, dark-themed UI inspired by premium cinema experiences.

## Features

- **Authentication**: Email/Password and Google OAuth Sign-in integration (session-based).
- **Movie Browsing**: Dynamic grid of movies fetched from a MongoDB database, featuring TMDB (The Movie Database) posters.
- **Categorization**: Filter movies by genre, language, and city.
- **Theatre Selection**: View available theatres and showtimes for selected movies.
- **Seat Mapping**: Interactive 10x15 seating grid with Gold, Silver, and Platinum categories.
- **Smart Seat Recommendations**: Automatically suggests the best consecutive seats based on group size and movie genre (e.g., center-middle for Dramas, back-middle for Action).
- **Secure Payment Simulation**: In-app Card payment validation (16-digit card number and future expiry date checks).
- **E-Tickets & QR Codes**: Generates a downloadable PDF ticket with an embedded QR code containing the booking details using `jsPDF` and `qrcode-generator`.

## Tech Stack

- **Frontend**: Vanilla HTML5, CSS3, JavaScript (ES6+).
- **Backend (API)**: Serverless Node.js functions hosted on Vercel (`/api/*`).
- **Database**: MongoDB (Mongoose used for schema modeling).
- **Authentication**: Google Identity Services (GIS) / `google-auth-library`.
- **Image Proxying**: Vercel Serverless Function proxy to bypass TMDB CORS restrictions.

## Running Locally

1. Clone the repository:
   ```bash
   git clone https://github.com/Silentboy07A/sead.git
   cd sead
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up Environment Variables:
   Create a `.env` file in the root directory:
   ```env
   MONGODB_URI=your_mongodb_connection_string
   GOOGLE_CLIENT_ID=your_google_oauth_client_id
   GOOGLE_CLIENT_SECRET=your_google_oauth_client_secret
   APP_URL=http://localhost:3000
   ```
4. Start the development server (using Vercel CLI to emulate the serverless environment):
   ```bash
   npx vercel dev
   ```
5. Open `http://localhost:3000` in your browser.

## Deployment

This application is configured for seamless deployment on **Vercel**.

1. Connect your GitHub repository to Vercel.
2. In the Vercel project settings, configure the following Environment Variables:
   - `MONGODB_URI`
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `APP_URL` (Set to your Vercel production URL)
3. The `vercel.json` file handles the routing for API endpoints and the poster proxy. Deployments will trigger automatically on pushes to the `main` branch.

## License
MIT License
