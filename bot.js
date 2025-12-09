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

// 💬 Quand quelqu'un envoie un message
client.on(Events.MessageCreate, async (message) => {
    if (message.author.bot) return;

    // 👉 ON VÉRIFIE LE SALON PAR ID (fiable à 100%)
    if (message.channel.id !== "1447838699172663338") return;

    const userText = message.content?.trim();
    if (!userText) return;
    if (userText.length < 2) return;

    console.log(`💬 ${message.author.tag} : ${userText}`);

    try {
        // ✍️ Le bot affiche "est en train d'écrire..."
        await message.channel.sendTyping();

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

        await message.reply(reply);

    } catch (err) {
        console.error("Erreur OpenAI / bot :", err);
        await message.reply("😅 Oups, j'ai eu une petite erreur technique. Réessaie dans un instant.");
    }
});

// 🚀 Connexion
client.login(process.env.DISCORD_TOKEN);
