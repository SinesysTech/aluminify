const WEBHOOK_URL = 'https://webhook.sinesys.app/webhook/013bad97-160b-4f20-9a2b-e9f3fa8bfa52';

const testMessage = {
  input: 'temperatura mede a quantidade de calor de um corpo?',
  ids: {
    sessionId: 'test-session-' + Date.now(),
    userId: 'test-user-123'
  }
};

console.log('Enviando mensagem de teste para o webhook (POST)...');
console.log('URL:', WEBHOOK_URL);
console.log('Payload:', JSON.stringify(testMessage, null, 2));
console.log('\n--- Resposta do Webhook ---\n');

async function testWebhook() {
  try {
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testMessage),
    });
    
    console.log('Status:', response.status);
    console.log('Status Text:', response.statusText);
    console.log('Headers:', Object.fromEntries(response.headers.entries()));
    console.log('\n--- Conteúdo da Resposta ---\n');
    
    const contentType = response.headers.get('content-type');
    console.log('Content-Type:', contentType);
    
    if (contentType?.includes('application/json')) {
      try {
        const text = await response.text();
        console.log('Response text length:', text.length);
        
        if (text && text.trim()) {
          const data = JSON.parse(text);
          console.log('JSON Response:');
          console.log(JSON.stringify(data, null, 2));
        } else {
          console.log('Resposta JSON vazia');
        }
      } catch (parseError) {
        console.error('Erro ao parsear JSON:', parseError.message);
        const text = await response.text();
        console.log('Texto recebido:', text);
      }
    } else if (contentType?.includes('text/event-stream')) {
      console.log('Resposta é Server-Sent Events (SSE):');
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let chunkCount = 0;
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          console.log('\n--- Stream finalizado ---');
          break;
        }
        
        chunkCount++;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        
        for (const line of lines) {
          if (line.trim()) {
            console.log(`[Chunk ${chunkCount}]`, line);
          }
        }
      }
      
      if (buffer.trim()) {
        console.log('Buffer final:', buffer);
      }
    } else {
      const text = await response.text();
      console.log('Text Response:');
      if (text) {
        console.log(text);
      } else {
        console.log('(Resposta vazia)');
      }
    }
  } catch (error) {
    console.error('Erro ao enviar requisição:', error.message);
    console.error(error);
  }
}

testWebhook();
