const { connectToDatabase } = require('./utils/db');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end();

  const { message, userData } = req.body;
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
            3. Be helpful, concise, and focused on cinema experiences.
            4. If the user asks for movie recommendations, reference the titles provided in the context.
            5. If the user asks for a plan or budget, calculate it accurately based on the prices provided.
            
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
            - If you want to recommend specific movies from the list, end your message with a JSON-like tag: [RECOMMEND: "Title 1", "Title 2"] using EXACT titles from the database.
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
    
    // Parse the [RECOMMEND: ...] tag if present
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
      
      // Remove the tag from the final response text
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
