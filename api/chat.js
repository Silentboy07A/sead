const { connectToDatabase } = require('./utils/db');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end();

  const { message, userData } = req.body;
  if (!message) return res.status(400).json({ error: "Message is required" });

  const msg = message.toLowerCase();

  // Data Definitions
  const SNACKS = [
    { name: 'Salted Popcorn (R)', price: 180 },
    { name: 'Cheese Popcorn (L)', price: 250 },
    { name: 'Coca Cola (500ml)', price: 120 },
    { name: 'Loaded Nachos', price: 210 },
    { name: 'Chicken Burger', price: 190 },
    { name: 'Couple Combo', price: 450 }
  ];
  const TICKETS = { silver: 180, gold: 250, platinum: 350 };

  // Mood to Genre Mapping
  const MOODS = {
    intense: ["Action", "Thriller", "Horror"],
    thrilling: ["Action", "Thriller"],
    "feel-good": ["Comedy", "Romance"],
    funny: ["Comedy"],
    scary: ["Horror"],
    chill: ["Drama", "Romance"],
    excited: ["Action", "Sci-Fi"],
    sad: ["Drama"]
  };

  try {
    const { db } = await connectToDatabase();
    let response = "";
    let recommendations = null;

    // 1. Rewards & Profile Check
    if (msg.includes('point') || msg.includes('reward') || msg.includes('balance')) {
      if (userData && userData.points !== undefined) {
        response = `You currently have ${userData.points} CinePoints. You can redeem these for discounts on snacks or premium seat upgrades!`;
      } else {
        response = "I couldn't retrieve your membership details. Please ensure you are logged in to check your CinePoints balance.";
      }
    } else if (msg.includes('booking') || msg.includes('my tickets') || msg.includes('history')) {
      if (userData && userData.bookings && userData.bookings.length > 0) {
        const count = userData.bookings.length;
        response = `You have ${count} active or past booking${count > 1 ? 's' : ''}. You can view the full details and download your tickets in the 'My Bookings' section of your profile.`;
      } else {
        response = "It appears you haven't made any bookings yet. Permit me to assist you in finding a movie for this evening?";
      }
    } 
    // 2. Budget Planning
    else if (msg.match(/(\d+)\s*(?:rs|rupees|inr|money)/)) {
      const budget = parseInt(msg.match(/(\d+)/)[1]);
      const ticketType = budget >= TICKETS.platinum ? 'platinum' : (budget >= TICKETS.gold ? 'gold' : 'silver');
      const ticketPrice = TICKETS[ticketType];
      
      if (budget < ticketPrice) {
        response = `Our starting ticket price is INR ${TICKETS.silver}. With INR ${budget}, you require a slight budget adjustment for a Silver admission.`;
      } else {
        const remaining = budget - ticketPrice;
        const affordableSnacks = SNACKS.filter(s => s.price <= remaining && s.name !== 'Couple Combo').sort((a,b) => b.price - a.price);
        response = `For INR ${budget}, I suggest a ${ticketType.charAt(0).toUpperCase() + ticketType.slice(1)} seat (INR ${ticketPrice}). `;
        if (affordableSnacks.length > 0) {
          response += `This leaves you enough for ${affordableSnacks[0].name} (INR ${affordableSnacks[0].price}).`;
        } else if (remaining > 0) {
          response += `You would have INR ${remaining} remaining for any additional a-la-carte snacks.`;
        }
      }
    }
    // 3. Mood & Recommendation Search
    else {
      let searchQuery = null;
      const detectedMood = Object.keys(MOODS).find(m => msg.includes(m));
      
      if (detectedMood) {
        searchQuery = { genre: { $in: MOODS[detectedMood].map(g => new RegExp(g, 'i')) } };
      } else {
        const GENRES = ["Action", "Comedy", "Drama", "Horror", "Thriller", "Sci-Fi", "Romance", "Anime"];
        const detectedGenre = GENRES.find(g => msg.includes(g.toLowerCase()));
        if (detectedGenre) {
          searchQuery = { genre: { $regex: detectedGenre, $options: 'i' } };
        }
      }

      if (searchQuery || msg.includes('recommend') || msg.includes('watch') || msg.includes('suggest')) {
        const movies = await db.collection('movies').find(searchQuery || {}).sort({ rating: -1 }).limit(3).toArray();
        if (movies.length > 0) {
          recommendations = movies.map(m => ({
            id: m._id,
            title: m.title,
            poster: m.poster,
            rating: m.rating,
            genre: m.genre
          }));
          response = detectedMood ? `Since you're feeling ${detectedMood}, I've curated these professional selections for you:` : "I've analyzed our collection and recommend the following premium selections:";
        } else {
          response = "I couldn't find exact matches for your request, but our top-rated Action and Drama titles are always a sophisticated choice.";
        }
      } else if (msg.includes('ticket') || msg.includes('price')) {
        response = `Standard rates: Silver (INR ${TICKETS.silver}), Gold (INR ${TICKETS.gold}), Platinum (INR ${TICKETS.platinum}).`;
      } else if (msg.includes('hi') || msg.includes('hello')) {
        response = "Good evening. I am CinBot. How may I assist you with your cinema experience today?";
      } else {
        response = "I am at your service. You may inquire about movie recommendations, budget planning, or your CinePoints balance.";
      }
    }

    await new Promise(r => setTimeout(r, 1000));
    return res.status(200).json({ response, recommendations });

  } catch (error) {
    console.error('Bot Error:', error);
    return res.status(500).json({ response: "I am experiencing a momentary cognitive delay. Please try again." });
  }
};
