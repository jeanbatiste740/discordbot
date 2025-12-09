require("dotenv").config();
const { Client, GatewayIntentBits, Events, EmbedBuilder } = require("discord.js");
const OpenAI = require("openai");

// 🔧 Configuration du client Discord
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

// 🔧 Configuration OpenAI
const openai = new OpenAI({
    apiKey: process.env.OPENAI_KEY
});

// 🟢 Bot prêt
client.once(Events.ClientReady, () => {
    console.log(`🤖 Bot connecté en tant que ${client.user.tag}`);
});

// 💬 Réponse IA
client.on(Events.MessageCreate, async (message) => {
    if (message.author.bot) return;
    if (message.channel.name !== "『🤖』sacha-ai") return;

    const userText = message.content?.trim();
    if (!userText) return;

    try {
        await message.channel.sendTyping();

        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: "Tu es un assistant utile et gentil sur un serveur Discord. Tu parles en français." },
                { role: "user", content: userText }
            ]
        });

        const reply = completion.choices[0]?.message?.content || "Je ne sais pas quoi répondre.";
        await message.reply(reply);

    } catch (err) {
        console.error(err);
        message.reply("Erreur IA.");
    }
});

// 👋 Bienvenue + Rôle + EMBED
client.on(Events.GuildMemberAdd, async (member) => {

    console.log(`➕ Nouveau membre : ${member.user.tag}`);

    // 👉 Rôle
    const roleName = "🦸Communauté";
    const role = member.guild.roles.cache.find(r => r.name === roleName);

    if (role) {
        await member.roles.add(role).catch(console.error);
    } else {
        console.log("❌ Rôle introuvable", roleName);
    }

    // 👉 Salon de bienvenue
    const welcomeChannelName = "『👋』𝗖𝗢𝗨𝗖𝗢𝗨";
    const channel = member.guild.channels.cache.find(c => c.name === welcomeChannelName);

    if (!channel) {
        console.log("❌ Salon introuvable :", welcomeChannelName);
        return;
    }

    // ⭐ EMBED
    const embed = new EmbedBuilder()
        .setColor("#5865F2")
        .setTitle("🎉 Nouveau membre !")
        .setDescription(`Bienvenue à toi ${member.user} ! Nous sommes super contents de t'accueillir 😄`)
        .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
        .setTimestamp()
        .setFooter({ text: "Bienvenue dans la communauté 🦸" });

    try {
        await channel.send({ embeds: [embed] });
        console.log("📨 Embed envoyé !");
    } catch (err) {
        console.error("❌ ERREUR EMBED :", err);
    }
});

// 🚀 Connexion
client.login(process.env.DISCORD_TOKEN);
