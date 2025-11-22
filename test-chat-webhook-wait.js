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
    
    // Verificar se é streaming
    if (contentType?.includes('text/event-stream') || response.headers.get('transfer-encoding') === 'chunked') {
      console.log('Resposta pode ser streaming - lendo chunks...\n');
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let chunkCount = 0;
      let timeout = setTimeout(() => {
        console.log('\n--- Timeout após 30 segundos ---');
      }, 30000);
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          clearTimeout(timeout);
          console.log('\n--- Stream finalizado ---');
          break;
        }
        
        chunkCount++;
        clearTimeout(timeout);
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        
        for (const line of lines) {
          if (line.trim()) {
            console.log(`[Chunk ${chunkCount}]`, line);
          }
        }
        
        timeout = setTimeout(() => {
          console.log('\n--- Timeout após 30 segundos sem novos chunks ---');
        }, 30000);
      }
      
      if (buffer.trim()) {
        console.log('Buffer final:', buffer);
      }
    } else {
      const text = await response.text();
      console.log('Response text length:', text.length);
      
      if (text && text.trim()) {
        try {
          const data = JSON.parse(text);
          console.log('JSON Response:');
          console.log(JSON.stringify(data, null, 2));
        } catch {
          console.log('Text Response:');
          console.log(text);
        }
      } else {
        console.log('Resposta vazia - o webhook pode estar processando de forma assíncrona');
        console.log('Aguarde alguns segundos e verifique se há uma resposta em outro endpoint');
      }
    }
  } catch (error) {
    console.error('Erro ao enviar requisição:', error.message);
    console.error(error);
  }
}

testWebhook();

