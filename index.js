import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Cliente da OpenAI (Caramelo)
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Usuários "ativos" (por enquanto, só um de teste)
const users = {
  "teste@teste.com": { status: "ATIVO" },
};

// Mensagem base do Caramelo (clínica + cirurgia)
const systemPrompt = `
Você é o Caramelo Vet, assistente virtual para médicos-veterinários e estudantes,
com foco em clínica e cirurgia de pequenos animais.

Regras importantes:
- Responda sempre em português do Brasil.
- Seja objetivo, prático e bem didático.
- Baseie-se em medicina veterinária baseada em evidências e boas práticas.
- Você NÃO substitui o exame clínico presencial, exames complementares
  ou o julgamento do médico-veterinário responsável.
- Sempre que houver risco de gravidade, oriente procurar atendimento presencial imediato.
- Nunca prescreva medicamentos sem considerar: espécie, raça, idade, peso,
  comorbidades, uso de outros fármacos e função renal/hepática.
- Se faltar informação, explique o que precisa ser avaliado e quais são as possibilidades.
`;

app.get("/", (req, res) => {
  res.send("Servidor do Caramelo Vet está rodando 🚀");
});

// Endpoint de webhook da Hotmart (a gente melhora depois)
// Por enquanto só registra o que chegar e responde "ok"
app.post("/hotmart/webhook", (req, res) => {
  console.log("Webhook da Hotmart recebido:", req.body);
  res.send("ok");
});

// Endpoint de chat do Caramelo
app.post("/caramelo/chat", async (req, res) => {
  try {
    const { email, message } = req.body;

    if (!email || !message) {
      return res.status(400).json({ error: "Email e mensagem são obrigatórios." });
    }

    const user = users[email];

    // Simples controle de acesso
    if (!user || user.status !== "ATIVO") {
      return res
        .status(403)
        .json({ error: "Seu acesso ao Caramelo não está ativo." });
    }

    // Chamada à OpenAI
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
    const replyText = textPart ? textPart.text : "Não consegui gerar resposta agora.";

    res.json({ reply: replyText });
  } catch (error) {
    console.error("Erro no /caramelo/chat:", error);
    res.status(500).json({ error: "Erro interno ao falar com o Caramelo." });
  }
});

app.listen(port, () => {
  console.log(`Servidor do Caramelo rodando na porta ${port} 🚀`);
});
