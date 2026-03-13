export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { message } = req.body;
  const msg = (message || '').toLowerCase();

  let response = "";

  if (msg.includes('ticket') || msg.includes('price') || msg.includes('cost')) {
    response = "Our ticket prices are: Gold (₹250), Silver (₹180), and Platinum (₹350). Booking online also includes a small 5% convenience fee.";
  } else if (msg.includes('snack') || msg.includes('popcorn') || msg.includes('coke')) {
    response = "We have delicious snacks! Popcorn starts at ₹180, and we have several value combos (like the Couple Combo for ₹450) to save you money.";
  } else if (msg.includes('ai') || msg.includes('recommend') || msg.includes('seat')) {
    response = "My built-in AI analysis can find you the perfect seat! Just click the 'Recommend Seats' button on the seat selection page, and I'll scan for the prime viewing spots.";
  } else if (msg.includes('location') || msg.includes('theatre') || msg.includes('where')) {
    response = "We have theatres in several major cities including Mumbai, Delhi, Bangalore, and Chennai. You can filter movies by your city directly on the homepage!";
  } else if (msg.includes('hi') || msg.includes('hello') || msg.includes('hey')) {
    response = "Hello! I'm CinBot, your cinema assistant. How can I help you enjoy your movie experience today?";
  } else if (msg.includes('booking') || msg.includes('cancel')) {
    response = "You can view all your bookings in the 'My Bookings' tab. Note that tickets are non-refundable once the transaction is complete.";
  } else {
    response = "I'm here to help! You can ask me about ticket prices, our snack menu, or how my AI Seat Recommendation works.";
  }

  // Simulate a slight delay for realism
  await new Promise(r => setTimeout(r, 800));

  return res.status(200).json({ response });
}
