require("dotenv").config();
const { Client, GatewayIntentBits, Events } = require("discord.js");
const OpenAI = require("openai");

// 🔧 Configuration du client Discord
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// 🔧 Configuration du client OpenAI (ChatGPT)
const openai = new OpenAI({
    apiKey: process.env.OPENAI_KEY
});

// 🟢 Quand le bot est connecté
client.once(Events.ClientReady, () => {
    console.log(`🤖 Bot connecté en tant que ${client.user.tag}`);
});

// 💬 Quand quelqu'un envoie un message sur le serveur
client.on(Events.MessageCreate, async (message) => {
    // On ignore les messages des bots
    if (message.author.bot) return;

    // 👉 Le bot répond UNIQUEMENT dans CE salon
    // ⚠️ Remplace "assistant-gpt" par le nom exact de TON salon
    if (message.channel.name !== "『🤖』chat-gpt") return;

    // Texte du message
    const userText = message.content?.trim();
    if (!userText) return;

    // Option : tu peux ignorer les messages très courts (genre "ok", "mdr")
    if (userText.length < 2) return;

    // On affiche dans la console ce qui est reçu
    console.log(`💬 ${message.author.tag} : ${userText}`);

    try {
        // On envoie à ChatGPT
        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content: "Tu es un assistant gentil et utile sur un serveur Discord. Tu parles en français, tu restes poli, simple et clair. Tu peux aussi parler de FiveM, RP et jeux vidéo."
                },
                {
                    role: "user",
                    content: userText
                }
            ],
            max_tokens: 300
        });

        const reply = completion.choices[0]?.message?.content || "Je ne sais pas quoi répondre pour le moment.";

        // Réponse dans le même salon
        await message.reply(reply);

    } catch (err) {
        console.error("Erreur OpenAI / bot :", err);
        await message.reply("😅 Oups, j'ai eu une petite erreur technique. Réessaie dans un instant.");
    }
});

// 🚀 Connexion du bot à Discord
client.login(process.env.DISCORD_TOKEN);
