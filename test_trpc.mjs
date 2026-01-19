// 测试tRPC generate.titles接口
const url = 'http://localhost:3000/api/trpc/generate.titles';

const payload = {
  scenario: 'fail',
  emotion: 'help',
  personaType: 'senior_sister',
  schoolRegion: 'uk',
  schoolName: '伦敦大学学院 UCL',
  customInput: '我在UCL读计算机科学，因为疫情期间在家上网课，有一门课程挂科了，想要申诉补考机会。'
};

console.log('Testing tRPC generate.titles endpoint...');
console.log('URL:', url);
console.log('Payload:', JSON.stringify(payload, null, 2));
console.log('');

async function testTRPC() {
  try {
    // tRPC需要特殊的请求格式
    const batchPayload = {
      "0": {
        "json": payload
      }
    };
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(batchPayload)
    });
    
    console.log('Response status:', response.status, response.statusText);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    const text = await response.text();
    console.log('');
    console.log('Response body (raw):', text);
    
    try {
      const data = JSON.parse(text);
      console.log('');
      console.log('Response body (parsed):', JSON.stringify(data, null, 2));
    } catch (e) {
      console.log('Failed to parse JSON');
    }
  } catch (error) {
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

testTRPC();
