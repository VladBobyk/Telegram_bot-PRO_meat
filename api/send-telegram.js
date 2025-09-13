// api/send-telegram.js (для Vercel)
export default async function handler(req, res) {
  // CORS заголовки для дозволу запитів з вашого Webflow сайту
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Обробка preflight запиту
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Дозволяємо тільки POST запити
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message } = req.body;

    // Отримуємо токен і chatId із змінних середовища (безпечно!)
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    // Перевірка наявності необхідних даних
    if (!message) {
      return res.status(400).json({ 
        error: 'Missing required field: message' 
      });
    }

    if (!botToken || !chatId) {
      return res.status(500).json({ 
        error: 'Server configuration error: missing bot credentials' 
      });
    }

    // Відправка повідомлення в Telegram
    const telegramUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
    
    const telegramResponse = await fetch(telegramUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML'
      }),
    });

    const telegramResult = await telegramResponse.json();

    if (telegramResult.ok) {
      return res.status(200).json({ 
        success: true, 
        message: 'Message sent successfully' 
      });
    } else {
      console.error('Telegram API Error:', telegramResult);
      return res.status(400).json({ 
        error: 'Failed to send message to Telegram',
        details: telegramResult
      });
    }

  } catch (error) {
    console.error('Server Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
}
