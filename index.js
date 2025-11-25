// ===============================
//  SERVIDOR CARAMELO VET - INDEX
//  Versão ES Module (type: "module")
// ===============================

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import axios from 'axios';

const app = express();

// A porta vem do Render (PORT) ou cai na 10000 em ambiente local
const PORT = process.env.PORT || 10000;

// ========================
// MIDDLEWARES BÁSICOS
// ========================
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ========================
// ROTA RAIZ (TESTE RÁPIDO)
// ========================
app.get('/', (req, res) => {
  res.send('Servidor Caramelo Vet online 🐶🧡');
});

// ========================
// ROTA WEBHOOK HOTMART
// ========================
app.post('/hotmart/webhook', (req, res) => {
  console.log('🔥 Webhook recebido da Hotmart!');
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
  console.log('Body:', JSON.stringify(req.body, null, 2));

  try {
    const event =
      req.body.event ||
      req.body.status ||
      req.body.event_name ||
      req.body?.data?.status;

    const buyerEmail =
      req.body?.data?.buyer?.email ||
      req.body?.data?.checkout_email ||
      req.body?.buyer?.email;

    console.log('Evento detectado:', event);
    console.log('E-mail do comprador:', buyerEmail);
  } catch (err) {
    console.log('Erro ao interpretar dados do webhook:', err.message);
  }

  // Sempre responde 200 para a Hotmart não repetir o envio
  return res.status(200).json({ ok: true });
});

// ========================
// ROTA DO CHAT DO CARAMELO
// ========================
app.post('/caramelo/chat', async (req, res) => {
  try {
    const { message, history } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Mensagem é obrigatória.' });
    }

    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      console.error('❌ ERRO: OPENAI_API_KEY não configurada nas variáveis de ambiente.');
      return res.status(500).json({
        error: 'OPENAI_API_KEY não configurada no servidor.',
      });
    }

    // Monta o contexto da conversa
    const messages = [
      {
        role: 'system',
        content:
          'Você é o Caramelo Vet, o melhor amigo virtual do médico veterinário. Especializado em cirurgia de tecidos moles, ortopedia e rotina de clínica médica de cães e gatos. Responda com base em literatura atual, de forma prática, objetiva, sempre lembrando riscos, limitações do atendimento à distância e a necessidade de exame físico completo.',
      },
    ];

    if (Array.isArray(history)) {
      messages.push(...history);
    }

    messages.push({ role: 'user', content: message });

    // Chamada para a API da OpenAI (chat)
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4.1-mini',
        messages,
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const answer =
      response.data?.choices?.[0]?.message?.content ||
      'Não consegui gerar uma resposta agora. Tente novamente em alguns instantes.';

    return res.json({ answer });
  } catch (error) {
    console.error('❌ Erro na rota /caramelo/chat:');
    console.error(error.response?.data || error.message);
    return res.status(500).json({
      error: 'Erro ao processar a resposta do Caramelo.',
    });
  }
});

// ========================
// INICIA O SERVIDOR
// ========================
app.listen(PORT, () => {
  console.log(`🚀 Servidor do Caramelo rodando na porta ${PORT}`);
});


