import dotenv from 'dotenv';
dotenv.config();

const API_KEY = process.env.OPENAI_API_KEY;
const BASE_URL = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
const MODEL = process.env.LLM_MODEL || 'gemini-2.5-flash';

console.log('=== LLM API Test ===');
console.log('API Key:', API_KEY ? API_KEY.substring(0, 15) + '...' : 'NOT SET');
console.log('Base URL:', BASE_URL);
console.log('Model:', MODEL);
console.log('');

async function testLLM() {
  try {
    const url = `${BASE_URL}/chat/completions`;
    console.log('Request URL:', url);
    
    const payload = {
      model: MODEL,
      messages: [
        { role: 'system', content: '你是一个小红书标题生成专家' },
        { role: 'user', content: '生成一个关于挂科的小红书标题，不超过18个字符' }
      ],
      max_tokens: 100
    };
    
    console.log('Request payload:', JSON.stringify(payload, null, 2));
    console.log('');
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify(payload)
    });
    
    console.log('Response status:', response.status, response.statusText);
    
    const data = await response.json();
    console.log('Response data:', JSON.stringify(data, null, 2));
    
    if (data.choices && data.choices[0]) {
      console.log('');
      console.log('Generated content:', data.choices[0].message.content);
    }
  } catch (error) {
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

testLLM();
