const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const Car = require('../models/Car');
const fs = require('fs');

function logToFile(msg) {
  fs.appendFileSync('ai_debug.log', msg + '\n');
  console.log(msg);
}

router.post('/chat', async (req, res) => {
  try {
    const { message, chatHistory } = req.body;
    logToFile('[AI] Received chat request: ' + message.substring(0, 50));

    if (!process.env.GEMINI_API_KEY) {
      logToFile('[AI] Missing API KEY');
      return res.status(500).json({ error: 'API key chưa được cấu hình cho backend.' });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    logToFile('[AI] Fetching cars from DB...');
    // Fetch comprehensive fleet context from database
    const cars = await Car.find({}).select('name brand model type pricePerDay seats description location availability imageUrl rating');
    logToFile(`[AI] Loaded ${cars.length} cars.`);
    
    // Inject all cars directly into the prompt to "simulate" API access securely without function-calling loops
    const fleetData = JSON.stringify(cars.map(c => ({
      id: c._id,
      name: c.name,
      brand: c.brand,
      price: c.pricePerDay,
      type: c.type,
      seats: c.seats,
      location: c.location,
      available: c.availability,
      imageUrl: c.imageUrl,
      rating: c.rating
    })));

    const systemPrompt = `You are an AI assistant embedded inside a luxury car rental platform.
Role: 1. Car recommendation expert 2. Booking assistant 3. Customer support agent 4. Sales optimizer.
You have access to the real-time database of cars right here in this JSON array: ${fleetData}

SALES STRATEGY (CRITICAL):
1. UPSELLING: If a user shows interest in a luxury brand or high-end features, suggest the most prestigious cars in that category.
2. DOWNSELLING: If the budget is clearly limited, suggest our best value-for-money alternatives without compromising the 'Elite' feel.
3. SCARCITY & URGENCY: Highlight "high demand" for specific models. If a user is hesitant, mention that specific cars might not be available later (e.g. "Only 2 left in this hub").
4. DIFFERENTIATION: Explain WHY a car is recommended (e.g. "Perfect for executive presence" or "Unmatched electric performance").

USER INTENT HANDLING:
1. Suggest 3-5 cars based on criteria.
2. BOOKING: Always guide them towards the 'Book Now' step.
3. CONVERSATION: Speak ONLY VIETNAMESE. Keep it professional, premium, and concise.

OUTPUT FORMAT:
Return response as a valid JSON object:
{
  "replyText": "Full response in Vietnamese. Include sales nudges like 'Only 2 left'.",
  "suggestedCars": [
    {
      "id": "Car ID here",
      "carName": "String",
      "image": "String",
      "price": 100,
      "rating": 5.0,
      "location": "String",
      "reason": "Concise reason why this fits user intent"
    }
  ]
}`;

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const safeHistory = [
      { role: 'user', parts: [{ text: systemPrompt }] },
      { role: 'model', parts: [{ text: '{"replyText": "Xin chào! Tôi là Trợ lý Elite...", "suggestedCars": []}' }] },
    ];

    const rawPrev = (chatHistory || []).filter(m => m.role === 'user' || m.role === 'assistant');
    
    // Ensure strict alternation
    for (const msg of rawPrev) {
      if (msg.role === 'assistant' && msg.content.includes('Xin chào! Tôi là Trợ lý Elite')) continue;
      
      const role = msg.role === 'user' ? 'user' : 'model';
      const textRaw = msg.role === 'assistant' 
        ? JSON.stringify({ replyText: msg.content, suggestedCars: msg.suggestedCars || [] })
        : msg.content;
      
      // If we don't have this role next, or if it's the same role, combine them or skip
      if (safeHistory.length > 0 && safeHistory[safeHistory.length - 1].role === role) {
        safeHistory[safeHistory.length - 1].parts[0].text += '\n' + textRaw;
      } else {
        safeHistory.push({
          role: role,
          parts: [{ text: textRaw }],
        });
      }
    }

    if (safeHistory.length > 0 && safeHistory[safeHistory.length - 1].role === 'user') {
      safeHistory.pop(); 
    }

    logToFile('[AI] Starting chat with history length: ' + safeHistory.length);
    const chat = model.startChat({
      history: safeHistory,
      generationConfig: { 
        maxOutputTokens: 4096,
        responseMimeType: "application/json",
      },
    });

    logToFile('[AI] Sending message to model...');
    const result = await chat.sendMessage(message);
    const textRaw = result.response.text();
    logToFile('[AI] Received raw response length: ' + textRaw.length);
    
    let resultJson;
    try {
      logToFile('[AI] Parsing JSON...');
      resultJson = JSON.parse(textRaw);
      logToFile('[AI] Parsed JSON successfully (first try).');
    } catch (parseErr) {
      logToFile('[AI] JSON Parse failed. Trying to clean markdown...');
      // Strip markdown code block if present
      const cleaned = textRaw.replace(/^```[a-z]*\n/, '').replace(/\n```$/, '').trim();
      logToFile('[AI] Cleaned text: ' + cleaned);
      try {
        resultJson = JSON.parse(cleaned);
        logToFile('[AI] Parsed JSON successfully (second try).');
      } catch (secondParseErr) {
        logToFile('[AI] Second parse failed. Returning fallback.');
        resultJson = {
          replyText: "Xin lỗi, tôi đang gặp chút khó khăn khi tổng hợp thông tin. Bạn có thể hỏi lại hoặc thay đổi yêu cầu một chút được không?",
          suggestedCars: []
        };
      }
    }

    logToFile('[AI] Sending response to client...');
    res.json(resultJson);
    logToFile('[AI] Response sent completely.');

  } catch (error) {
    logToFile('AI Chat Error (Caught): ' + error.message);
    res.json({ 
      replyText: "Hệ thống AI hiện đang quá tải (High Demand). Spikes in demand are usually temporary. Vui lòng đợi trong giây lát và thử lại nhé! 🚘", 
      suggestedCars: [] 
    });
  }
});

module.exports = router;
