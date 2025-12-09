require("dotenv").config();
const { Client, GatewayIntentBits, Events } = require("discord.js");
const OpenAI = require("openai");

// 🔧 Configuration du client Discord
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers // 👈 nécessaire pour guildMemberAdd
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

    // 👉 Le bot répond uniquement dans le salon avec emoji dans le nom
    if (message.channel.name !== "『🤖』sacha-ai") return;

    const userText = message.content?.trim();
    if (!userText) return;
    if (userText.length < 2) return;

    console.log(`💬 ${message.author.tag} : ${userText}`);

    try {
        // ✍️ Le bot montre qu'il est en train d'écrire
        await message.channel.sendTyping();

        // Envoi à ChatGPT
        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content: "Tu es un assistant utile et gentil sur un serveur Discord. Tu parles en français."
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
        await message.reply("😅 Oups, j'ai eu une erreur technique. Réessaie !");
    }
});

// 👋 Quand un nouveau membre rejoint le serveur
client.on(Events.GuildMemberAdd, async (member) => {
    console.log(`➕ Nouveau membre : ${member.user.tag}`);

    // 🏷️ ID du rôle à donner automatiquement
    const roleId = "1445640835998810172"; // 🔁 remplace par l'ID du rôle (ex: rôle Membre)
    const role = member.guild.roles.cache.get(roleId);

    if (role) {
        try {
            await member.roles.add(role);
            console.log(`✅ Rôle donné à ${member.user.tag}`);
        } catch (err) {
            console.error("Erreur en donnant le rôle :", err);
        }
    } else {
        console.log("⚠️ Rôle introuvable, vérifie l'ID !");
    }

    // 📢 ID du salon où envoyer le message de bienvenue
    const welcomeChannelId = "1445634572904693780"; // 🔁 remplace par l'ID du salon de bienvenue
    const channel = member.guild.channels.cache.get(welcomeChannelId);

    if (channel) {
        channel.send({
            content: `👋 Bienvenue **${member.user.username}** sur le serveur ! 🎉\nRavi de t'avoir parmi nous 😎`
        }).catch(console.error);
    } else {
        console.log("⚠️ Salon de bienvenue introuvable, vérifie l'ID !");
    }
});

// 🚀 Connexion
client.login(process.env.DISCORD_TOKEN);
