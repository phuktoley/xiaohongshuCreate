const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_BASE_URL = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';

async function testAPI() {
  try {
    console.log('Testing API connection...');
    console.log('API Key:', OPENAI_API_KEY ? OPENAI_API_KEY.substring(0, 15) + '...' : 'NOT SET');
    console.log('Base URL:', OPENAI_BASE_URL);
    
    const response = await fetch(`${OPENAI_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gemini-2.5-flash',
        messages: [
          { role: 'user', content: 'Say hello in 5 words' }
        ],
        max_tokens: 50
      })
    });
    
    const data = await response.json();
    console.log('Response status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

testAPI();
