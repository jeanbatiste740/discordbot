require("dotenv").config();
const { Client, GatewayIntentBits, Events } = require("discord.js");
const OpenAI = require("openai");

// 🔧 Configuration du client Discord
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers // nécessaire pour guildMemberAdd
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

// 💬 Réponse IA uniquement dans un salon précis avec EMOJI
client.on(Events.MessageCreate, async (message) => {
    if (message.author.bot) return;

    // 👉 Remplace par TON salon IA
    if (message.channel.name !== "『🤖』sacha-ai") return;

    const userText = message.content?.trim();
    if (!userText) return;
    if (userText.length < 2) return;

    console.log(`💬 ${message.author.tag} : ${userText}`);

    try {
        await message.channel.sendTyping();

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

// 👋 Message de bienvenue + rôle automatique avec CHANNEL.NAME
client.on(Events.GuildMemberAdd, async (member) => {

    console.log(`➕ Nouveau membre : ${member.user.tag}`);

    // 👉 NOM DU ROLE À DONNER (pas l’ID, le NOM)
    const roleName = "🦸Communauté"; // 🔁 Remplace par TON nom de rôle
    const role = member.guild.roles.cache.find(r => r.name === roleName);

    if (role) {
        try {
            await member.roles.add(role);
            console.log(`✅ Rôle '${role.name}' donné à ${member.user.tag}`);
        } catch (err) {
            console.error("Erreur rôle :", err);
        }
    } else {
        console.log("⚠️ Rôle introuvable : vérifie le nom !");
    }

    // 👉 SALON DE BIENVENUE PAR NOM (avec emoji si tu veux)
    const welcomeChannelName = "『👋』𝗖𝗢𝗨𝗖𝗢𝗨"; // 🔁 Remplace par TON salon
    const channel = member.guild.channels.cache.find(c => c.name === welcomeChannelName);

    if (channel) {
        channel.send({
            content: `👋 Bienvenue **${member.user.username}** sur le serveur ! 🎉`
        }).catch(console.error);
    } else {
        console.log("⚠️ Salon de bienvenue introuvable : vérifie le nom !");
    }
});

// 🚀 Connexion
client.login(process.env.DISCORD_TOKEN);
