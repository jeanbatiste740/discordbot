require("dotenv").config();
const { Client, GatewayIntentBits, Events, EmbedBuilder } = require("discord.js");
const OpenAI = require("openai");

// 🧑‍💻 ID DU PROPRIÉTAIRE (TOI)
const ownerId = "420265433367838721";

// 🔧 Configuration du client Discord
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
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

    console.log(`📩 #${message.channel.name} | ${message.author.tag} : ${message.content}`);

    const lowered = message.content.trim().toLowerCase();

    // 🧪 COMMANDE TEST DM : !testdm
    if (lowered === "!testdm") {
        try {
            const ownerUser = await client.users.fetch(ownerId);
            await ownerUser.send("👋 Ceci est un message de TEST du bot : si tu vois ça, les DM fonctionnent ✅");
            await message.reply("✅ DM envoyé au propriétaire (vérifie tes messages privés).");
            console.log(`✅ DM de test envoyé à ${ownerUser.tag}`);
        } catch (err) {
            console.error("❌ ERREUR ENVOI DM TEST :", err);
            await message.reply("❌ Impossible d'envoyer le DM. Vérifie ton ID et tes MP.");
        }
        return;
    }

    // 🧪 COMMANDE TEST EMBED : !testwelcome
    if (lowered === "!testwelcome") {
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
        } catch (err) {
            console.error("❌ ERREUR ENVOI EMBED TEST :", err);
            await message.reply("❌ Impossible d'envoyer l'embed. Vérifie les permissions du bot (Envoyer des embeds).");
        }
        return;
    }

    // 💬 Réponse IA uniquement dans 『🤖』sacha-ai
    if (message.channel.name !== "『🤖』sacha-ai") return;

    const userText = message.content?.trim();
    if (!userText || userText.length < 2) return;

    try {
        await message.channel.sendTyping();

        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content: "Tu es un assistant utile et gentil sur un serveur Discord. Tu parles en français."
                },
                { role: "user", content: userText }
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

// 👋 Bienvenue + rôle + DM au proprio
client.on(Events.GuildMemberAdd, async (member) => {
    console.log(`➕ Nouveau membre : ${member.user.tag}`);

    // 👉 Rôle auto
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
        console.log("⚠️ Rôle introuvable :", roleName);
    }

    // 👉 Salon de bienvenue
    const welcomeChannelName = "『👋』𝗖𝗢𝗨𝗖𝗢𝗨";
    const channel = member.guild.channels.cache.find(c => c.name === welcomeChannelName);

    if (channel) {
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
        }
    } else {
        console.log("⚠️ Salon de bienvenue introuvable :", welcomeChannelName);
    }

    // 💌 DM au propriétaire
    try {
        const ownerUser = await client.users.fetch(ownerId);
        await ownerUser.send(
            `🔔 Nouveau membre sur **${member.guild.name}** : **${member.user.tag}** vient de rejoindre le serveur.`
        );
        console.log(`📨 DM envoyé au propriétaire (${ownerUser.tag}) pour ${member.user.tag}`);
    } catch (err) {
        console.error("❌ Impossible d'envoyer le DM au propriétaire :", err);
    }
});

// 🚀 Connexion
client.login(process.env.DISCORD_TOKEN);
