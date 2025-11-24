import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// 🟠 MIDDLEWARES COMPLETOS
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public")); // serve caramelo-chat.html

// 🟠 CLIENTE OPENAI (Caramelo)
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// 🟠 CONTROLE DE USUÁRIOS (TEMPORÁRIO)
const users = {
  "teste@teste.com": { status: "ATIVO" },
};

// 🟠 SYSTEM PROMPT COMPLETO
const systemPrompt = `
Você é o Caramelo Vet, assistente virtual para médicos-veterinários e estudantes de veterinária.

Regras principais:
- Responda sempre em português do Brasil.
- Seja didático, objetivo e com base na literatura veterinária.
- Você não substitui exame físico, exames complementares ou o julgamento clínico.
- Sempre que houver risco, recomende atendimento presencial.
- NUNCA dê diagnóstico definitivo. Sempre dê hipóteses e diferenciais.
- Sempre que o usuário pedir diagnóstico, responda:
  "Eu não realizo diagnósticos. Meu papel é auxiliar correlacionando as informações fornecidas pelo meu banco de dados com base na literatura veterinária, trazendo possíveis condutas clínicas e diagnósticos diferenciais. Para um diagnóstico definitivo, consulte um médico veterinário."
- Basear respostas nas diretrizes WSAVA, literatura fornecida e materiais do tutor.
`;

// 🟢 ROTA BASE
app.get("/", (req, res) => {
  res.send("Servidor Caramelo Vet está rodando 🚀");
});

// 🟠 WEBHOOK DA HOTMART (por enquanto só registra)
app.post("/hotmart/webhook", (req, res) => {
  console.log("📩 Webhook recebido da Hotmart:", req.body);

  // Exemplo básico:
  // if (req.body.event === "purchase_approved") {
  //    users[req.body.buyer_email] = { status: "ATIVO" };
  // }

  res.send("OK");
});

// 🟣 ENDPOINT DO CHAT DO CARAMELO
app.post("/caramelo/chat", async (req, res) => {
  try {
    const { email, message } = req.body;

    if (!email || !message) {
      return res.status(400).json({ error: "Email e mensagem são obrigatórios." });
    }

    const user = users[email];

    // SIMPLES CONTROLE DE ACESSO
    if (!user || user.status !== "ATIVO") {
      return res.status(403).json({
        error: "Seu acesso ao Caramelo não está ativo.",
      });
    }

    // CHAMADA À OPENAI
    const response = await client.responses.create({
      model: "gpt-4.1-mini",
      input: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: message,
        },
      ],
    });

    const outputItem = response.output[0];
    const textPart = outputItem.content.find(
      (part) => part.type === "output_text"
    );
    const replyText = textPart
      ? textPart.text
      : "Não consegui gerar resposta agora.";

    res.json({ reply: replyText });
  } catch (error) {
    console.error("❌ Erro no /caramelo/chat:", error);
    res.status(500).json({ error: "Erro interno ao falar com o Caramelo." });
  }
});

// 🟢 INICIALIZA O SERVIDOR
app.listen(port, () => {
  console.log(`🚀 Servidor do Caramelo rodando na porta ${port}`);
});
