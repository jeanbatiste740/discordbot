require("dotenv").config();
const { Client, GatewayIntentBits, Events, EmbedBuilder } = require("discord.js");
const OpenAI = require("openai");

// 🧑‍💻 NOM DU PROPRIÉTAIRE (TOI)
const ownerUsername = "king_dev20";

// 🔧 Configuration du client Discord
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers // nécessaire pour guildMemberAdd + fetch des membres
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

    const lowered = message.content.trim().toLowerCase();

    // 🧪 COMMANDE DE TEST POUR TE DM : !testdm
    if (lowered === "!testdm") {
        console.log("🧪 Commande !testdm reçue");

        try {
            const guild = message.guild;
            if (!guild) {
                await message.reply("❌ Cette commande doit être utilisée dans un serveur.");
                return;
            }

            // On récupère tous les membres du serveur et on cherche ton pseudo
            const members = await guild.members.fetch();
            const ownerMember = members.find(m => m.user.username === ownerUsername);

            if (!ownerMember) {
                await message.reply(`❌ Impossible de trouver l'utilisateur **${ownerUsername}** dans ce serveur.`);
                console.log("❌ Proprio introuvable par username");
                return;
            }

            await ownerMember.send("👋 Ceci est un message de TEST du bot : le DM fonctionne bien !");
            await message.reply("✅ DM envoyé au propriétaire (vérifie tes messages privés).");
            console.log(`✅ DM de test envoyé à ${ownerMember.user.tag}`);
        } catch (err) {
            console.error("❌ ERREUR ENVOI DM TEST :", err);
            await message.reply("❌ Impossible d'envoyer le DM. Vérifie tes paramètres de messages privés pour ce serveur.");
        }

        return;
    }

    // 🧪 COMMANDE DE TEST POUR L'EMBED DE BIENVENUE
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

        return;
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

// 👋 Message de bienvenue + rôle automatique + DM au proprio
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
    } else {
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
        }
    }

    // 💌 DM AU PROPRIÉTAIRE (TOI) PAR USERNAME
    try {
        const guild = member.guild;
        const members = await guild.members.fetch();
        const ownerMember = members.find(m => m.user.username === ownerUsername);

        if (!ownerMember) {
            console.log("⚠️ Propriétaire introuvable par username :", ownerUsername);
            return;
        }

        await ownerMember.send(
            `🔔 Nouveau membre sur **${member.guild.name}** : **${member.user.tag}** a rejoint le serveur.`
        );
        console.log(`📨 DM envoyé au propriétaire (${ownerMember.user.tag}) pour ${member.user.tag}`);
    } catch (err) {
        console.error("❌ Impossible d'envoyer le DM au propriétaire :", err);
    }
});

// 🚀 Connexion
client.login(process.env.DISCORD_TOKEN);
