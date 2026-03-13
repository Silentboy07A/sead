const { connectToDatabase } = require('./utils/db');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end();

  const { message, userData, context } = req.body;
  if (!message) return res.status(400).json({ error: "Message is required" });

  try {
    const { db } = await connectToDatabase();
    
    // Fetch live context for RAG
    const movies = await db.collection('movies').find({}).toArray();
    const movieContext = movies.map(m => `- ${m.title} (Rating: ${m.rating}, Genre: ${m.genre}, Language: ${m.language})`).join('\n');
    
    const snacks = [
      { name: 'Salted Popcorn (R)', price: 180 },
      { name: 'Cheese Popcorn (L)', price: 250 },
      { name: 'Coca Cola (500ml)', price: 120 },
      { name: 'Loaded Nachos', price: 210 },
      { name: 'Chicken Burger', price: 190 },
      { name: 'Couple Combo', price: 450 }
    ];
    const snackContext = snacks.map(s => `- ${s.name}: INR ${s.price}`).join('\n');
    
    const ticketContext = "Silver: INR 180, Gold: INR 250, Platinum: INR 350";
    const userProfileContext = userData ? `User Balance: ${userData.points} CinePoints. User Bookings: ${userData.bookings.length} reservations.` : "User is not logged in.";
    
    // JOURNEY CONTEXT (V7)
    const journeyContext = context ? `
    USER JOURNEY STATE:
    - Current View: ${context.currentView || 'Home'}
    - Selected Movie: ${context.selectedMovie || 'None'}
    - Selected Theatre: ${context.selectedTheatre || 'None'}
    - Selection State: ${context.selectedSeats?.length > 0 ? `Seats ${context.selectedSeats.join(',')} selected` : 'Choosing seats'}
    ` : "Journey data unavailable.";

    // Call Groq API
    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY || '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'}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content: `You are "CinBot", a premium AI cinema concierge for CineBook (CinTic).
            
            STRICT PERSONALITY RULES:
            1. NEVER use emojis.
            2. Always use professional, formal, and sophisticated language.
            3. Be helpful, concise, and focused EXCLUSIVELY on cinema experiences, movie bookings, and snacks.
            4. Only provide movie recommendations (using the [RECOMMEND: ...] tag) if the user explicitly asks for suggestions, asks what to watch, or mentions a mood/genre looking for a movie. 
            5. If a user asks a question that is unnecessary, off-topic, or unrelated to cinema, politely decline, stating you serve only their premium cinematic journey.
            
            JOURNEY AWARENESS:
            Your responses should adapt to where the user is.
            ${journeyContext}
            
            If the user is picking seats (seatsSection), remind them that middle rows E, F, and G offer the absolute best eye-level viewing.
            
            LIVE MOVIE DATABASE:
            ${movieContext}
            
            GOURMET SNACK MENU:
            ${snackContext}
            
            TICKET PRICING:
            ${ticketContext}
            
            USER PROFILE:
            ${userProfileContext}
            
            RESPONSE FORMAT:
            - Return your main message as the primary response.
            - End with: [RECOMMEND: "Exact Title 1", "Exact Title 2"] only if appropriate for recommendations.
            `
          },
          {
            role: "user",
            content: message
          }
        ],
        temperature: 0.5,
        max_tokens: 500
      })
    });

    const groqData = await groqRes.json();
    let fullResponse = groqData.choices[0].message.content;
    
    // Parse recommendations
    let recommendations = [];
    const recommendMatch = fullResponse.match(/\[RECOMMEND:\s*(.*?)\]/);
    if (recommendMatch) {
      const titles = recommendMatch[1].split(',').map(t => t.trim().replace(/"/g, ''));
      recommendations = movies.filter(m => titles.some(title => m.title.toLowerCase().includes(title.toLowerCase())))
                        .map(m => ({
                          id: m._id,
                          title: m.title,
                          poster: m.poster,
                          rating: m.rating,
                          genre: m.genre
                        }))
                        .slice(0, 3);
      fullResponse = fullResponse.replace(/\[RECOMMEND:.*?\]/, '').trim();
    }

    return res.status(200).json({ 
      response: fullResponse, 
      recommendations: recommendations.length > 0 ? recommendations : null 
    });

  } catch (error) {
    console.error('LLM Error:', error);
    return res.status(500).json({ response: "I apologize, but I am currently experiencing a localized neural interruption. Please permit me a moment to recalibrate." });
  }
};
