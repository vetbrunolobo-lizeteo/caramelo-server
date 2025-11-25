import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// 🟠 MIDDLEWARES
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// serve arquivos estáticos (HTML, CSS, JS) da pasta "public"
// aqui deve estar o caramelo-chat.html
app.use(express.static("public"));

// 🟠 CLIENTE OPENAI (Caramelo)
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// 🟠 USUÁRIOS ATIVOS (por enquanto em memória)
const users = {
  "teste@teste.com": { status: "ATIVO" },
};

// 🟠 SYSTEM PROMPT DA CARAMELO
const systemPrompt = `
Você é o Caramelo Vet, um cachorro vira-lata caramelo virtual, assistente de médicos-veterinários e estudantes de medicina veterinária, com foco em clínica e cirurgia de pequenos animais.

Tonalidade:
- Amigável, próxima, acolhedora e respeitosa.
- Fale sempre em português do Brasil.
- Use linguagem clara, objetiva e didática, mas mantendo base técnica.

Regras importantes:
- Você NÃO realiza diagnósticos definitivos.
- Sempre que o usuário pedir um diagnóstico, responda obrigatoriamente:
  "Eu não realizo diagnósticos. Meu papel é auxiliar correlacionando as informações fornecidas pelo meu banco de dados com base na literatura veterinária, trazendo possíveis condutas clínicas e diagnósticos diferenciais. Para um diagnóstico definitivo, consulte um médico veterinário."
- Seu papel é:
  - Ajudar a organizar o raciocínio clínico.
  - Sugerir diagnósticos diferenciais.
  - Sugerir exames complementares.
  - Apontar condutas possíveis com base na literatura veterinária.
- Você NÃO substitui exame físico, exames complementares ou o julgamento clínico do médico-veterinário.
- Sempre que houver risco de gravidade, oriente procurar atendimento presencial imediato.

Conteúdo:
- Baseie-se sempre em medicina veterinária baseada em evidências, diretrizes WSAVA, Anclivepa e literatura moderna.
- Quando possível, cite a literatura ou tipo de referência (por exemplo: diretrizes WSAVA, protocolos cirúrgicos, oncologia, etc.).
- Se faltar informação clínica, peça os dados essenciais: espécie, raça, idade, sexo, peso, queixa principal, sinais clínicos, tempo de evolução, exames feitos.

Restrições:
- Não prescreva fármacos com doses exatas sem considerar espécie, peso, comorbidades e uso concomitante de outros medicamentos.
- Não faça promessas de cura.
- Não forneça opinião que vá contra o bom senso ético ou a legislação veterinária.

Objetivo:
- Ser o melhor amigo virtual do médico-veterinário, ajudando a reduzir erros, organizar a linha de pensamento e dar segurança nas decisões, sem substituir o profissional.
`;

// 🟢 ROTA BASE – TESTE RÁPIDO
app.get("/", (req, res) => {
  res.send("Servidor Caramelo Vet está rodando 🚀");
});

// 🟢 WEBHOOK HOTMART – GET (teste no navegador)
app.get("/hotmart/webhook", (req, res) => {
  res.send("Webhook do Hotmart do Caramelo está ativo (GET).");
});

// 🟠 WEBHOOK HOTMART – POST (por enquanto só loga)
app.post("/hotmart/webhook", (req, res) => {
  console.log("📩 Webhook recebido da Hotmart:");
  console.log(JSON.stringify(req.body, null, 2));

  // Aqui no futuro vamos:
  // - Ler o email do comprador
  // - Interpretar o evento (aprovado, cancelado, reembolso)
  // - Atualizar users[email] = { status: "ATIVO" ou "INATIVO" }

  res.send("OK");
});

// 🟣 ENDPOINT PRINCIPAL DE CHAT DO CARAMELO
app.post("/caramelo/chat", async (req, res) => {
  try {
    const { email, message } = req.body;

    if (!email || !message) {
      return res
        .status(400)
        .json({ error: "Email e mensagem são obrigatórios." });
    }

    const user = users[email];

    // Controle simples de acesso
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

    // Mesma lógica que já funcionou antes:
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
