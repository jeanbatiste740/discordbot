require("dotenv").config();
const { Client, GatewayIntentBits, Events, EmbedBuilder } = require("discord.js");
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

// 💬 Messages reçus
client.on(Events.MessageCreate, async (message) => {
    if (message.author.bot) return;

    console.log(`📩 Message reçu dans #${message.channel.name} par ${message.author.tag} : ${message.content}`);

    // 🧪 COMMANDE DE TEST POUR L'EMBED DE BIENVENUE
    const lowered = message.content.trim().toLowerCase();
    if (lowered === "!testwelcome") {
        console.log("🧪 Commande !testwelcome reçue");

        const embed = new EmbedBuilder()
            .setColor("#5865F2")
            .setTitle("🎉 Nouveau membre (TEST) !")
            .setDescription(`Bienvenue à toi ${message.author} (test) ! Si tu vois cet embed, tout fonctionne ✅`)
            .setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
            .setTimestamp()
            .setFooter({ text: "Bienvenue dans la communauté 🦸" });

        try {
            await message.channel.send({ embeds: [embed] });
            await message.reply("✅ Embed de bienvenue (TEST) envoyé dans ce salon.");
            console.log("✅ Embed de test envoyé");
        } catch (err) {
            console.error("❌ ERREUR ENVOI EMBED TEST :", err);
            await message.reply("❌ Impossible d'envoyer l'embed (test). Vérifie les permissions du bot dans ce salon (Envoyer des embeds).");
        }

        return; // on ne continue pas plus loin pour cette commande
    }

    // 💬 Réponse IA uniquement dans un salon précis avec EMOJI
    if (message.channel.name !== "『🤖』sacha-ai") return;

    const userText = message.content?.trim();
    if (!userText) return;
    if (userText.length < 2) return;

    console.log(`💬 ${message.author.tag} (IA) : ${userText}`);

    try {
        // Effet "est en train d'écrire..."
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

    // 👉 NOM DU ROLE À DONNER
    const roleName = "🦸Communauté";
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

    // 👉 SALON DE BIENVENUE PAR NOM
    const welcomeChannelName = "『👋』𝗖𝗢𝗨𝗖𝗢𝗨";
    const channel = member.guild.channels.cache.find(c => c.name === welcomeChannelName);

    if (!channel) {
        console.log("⚠️ Salon de bienvenue introuvable : vérifie le nom !");
        return;
    }

    // ⭐ EMBED DE BIENVENUE
    const welcomeEmbed = new EmbedBuilder()
        .setColor("#5865F2")
        .setTitle("✨ Nouveau membre dans la communauté !")
        .setDescription(
            `👋 Bienvenue à toi ${member.user} !\n\n` +
            `Tu viens d'arriver sur **${member.guild.name}**.\n` +
            `Installe-toi, découvre les salons et n'hésite pas à dire coucou 😄`
        )
        .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
        .setFooter({ text: "Merci de rejoindre la communauté 🦸" })
        .setTimestamp();

    try {
        await channel.send({ embeds: [welcomeEmbed] });
        console.log("✅ Embed de bienvenue envoyé");
    } catch (err) {
        console.error("❌ ERREUR ENVOI EMBED BIENVENUE :", err);
        try {
            await channel.send(`👋 Bienvenue **${member.user.username}** sur le serveur ! (message texte de secours)`);
        } catch (e2) {
            console.error("❌ Impossible d'envoyer même un message texte :", e2);
        }
    }
});

// 🚀 Connexion
client.login(process.env.DISCORD_TOKEN);
