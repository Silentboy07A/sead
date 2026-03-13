const { connectToDatabase } = require('./utils/db');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end();

  const { message } = req.body;
  if (!message) return res.status(400).json({ error: "Message is required" });

  const msg = message.toLowerCase();

  // Reference Data (matching app.js)
  const SNACKS = [
    { name: 'Salted Popcorn (R)', price: 180 },
    { name: 'Cheese Popcorn (L)', price: 250 },
    { name: 'Coca Cola (500ml)', price: 120 },
    { name: 'Loaded Nachos', price: 210 },
    { name: 'Chicken Burger', price: 190 },
    { name: 'Couple Combo', price: 450 }
  ];

  const TICKETS = { silver: 180, gold: 250, platinum: 350 };

  try {
    const { db } = await connectToDatabase();
    let response = "";

    // 1. EXTRACT BUDGET
    const budgetMatch = msg.match(/(\d+)\s*(?:rs|rupees|inr|money)/);
    const budget = budgetMatch ? parseInt(budgetMatch[1]) : null;

    // 2. GENRE DETECTION
    const GENRES = ["Action", "Comedy", "Drama", "Horror", "Thriller", "Sci-Fi", "Romance", "Anime"];
    const detectedGenre = GENRES.find(g => msg.includes(g.toLowerCase()));

    if (budget !== null) {
      // Suggest a plan
      const ticketType = budget >= TICKETS.platinum ? 'platinum' : (budget >= TICKETS.gold ? 'gold' : 'silver');
      const ticketPrice = TICKETS[ticketType];
      
      if (budget < ticketPrice) {
        response = `I apologize, but our starting ticket price is INR ${TICKETS.silver}. With INR ${budget}, you would need a small addition to your budget to secure a Silver seat.`;
      } else {
        const remaining = budget - ticketPrice;
        const affordableSnacks = SNACKS.filter(s => s.price <= remaining && s.name !== 'Couple Combo')
                                       .sort((a, b) => b.price - a.price); // Recommend most expensive affordable snack first
        
        let plan = `With a budget of INR ${budget}, I recommend a ${ticketType.charAt(0).toUpperCase() + ticketType.slice(1)} ticket (INR ${ticketPrice}). `;
        
        if (affordableSnacks.length > 0) {
          const topSnack = affordableSnacks[0];
          plan += `This leaves you with enough for a ${topSnack.name} (INR ${topSnack.price}), with a total expenditure of INR ${ticketPrice + topSnack.price}.`;
        } else if (remaining > 0) {
          plan += `You would have INR ${remaining} remaining, which is just shy of our snack starting prices. I recommend increasing your budget slightly to include our Salted Popcorn.`;
        } else {
          plan += `This utilizes your entire budget perfectly for the seat.`;
        }
        response = plan;
      }
    } else if (detectedGenre) {
      // Recommend movies by genre
      const movies = await db.collection('movies').find({ genre: { $regex: detectedGenre, $options: 'i' } }).toArray();
      if (movies.length > 0) {
        const movieNames = movies.slice(0, 3).map(m => `"${m.title}" (${m.rating} Rating)`).join(', ');
        response = `Our collection of ${detectedGenre} cinema is quite extensive. I highly recommend viewing ${movieNames}. Each provides a distinct and premium cinematic experience.`;
      } else {
        response = `While we currently do not have ${detectedGenre} titles scheduled, I invite you to explore our highly-rated Drama or Action selections which offer similar depth.`;
      }
    } else if (msg.includes('ticket') || msg.includes('price') || msg.includes('cost')) {
      response = `Standard admission rates are INR ${TICKETS.silver} for Silver, INR ${TICKETS.gold} for Gold, and INR ${TICKETS.platinum} for our premium Platinum experience. Online reservations are subject to a 5% service fee.`;
    } else if (msg.includes('snack') || msg.includes('food') || msg.includes('eat') || msg.includes('menu')) {
      response = "Our gourmet menu features Salted Popcorn, Loaded Nachos, and Chicken Burgers, with selections starting at INR 120. We also offer curated Value Combos for an enhanced viewing experience.";
    } else if (msg.includes('recommend') || msg.includes('suggest') || msg.includes('what to watch')) {
      const topMovies = await db.collection('movies').find({}).sort({ rating: -1 }).limit(2).toArray();
      const names = topMovies.map(m => `"${m.title}"`).join(' and ');
      response = `For a first-class experience, I suggest the critically acclaimed ${names}. Alternatively, if you mention a preferred genre, I can provide more tailored recommendations.`;
    } else if (msg.includes('location') || msg.includes('where') || msg.includes('city')) {
      response = "CinTic offers premium screenings across Mumbai, Delhi, Bangalore, and Chennai. Please utilize the location selector on our primary interface to view venues in your vicinity.";
    } else if (msg.includes('hi') || msg.includes('hello') || msg.includes('hey')) {
      response = "Good evening. I am CinBot. How may I assist you with your cinema reservations today?";
    } else {
      response = "I am at your service. Whether you require assistance with seat selection, gourmet snack planning, or movie recommendations, please do not hesitate to ask.";
    }

    // Add a slight latency for the AI reflection effect
    await new Promise(r => setTimeout(r, 1000));

    res.status(200).json({ response });
  } catch (error) {
    console.error('Bot Error:', error);
    res.status(500).json({ response: "I apologize, but I am currently experiencing a localized interruption in my cognitive systems. Please try again shortly." });
  }
};
