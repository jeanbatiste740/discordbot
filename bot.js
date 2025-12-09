require("dotenv").config();
const { Client, GatewayIntentBits, Events, EmbedBuilder } = require("discord.js");
const OpenAI = require("openai");
const axios = require("axios");

// 🧑‍💻 ID DU PROPRIÉTAIRE (TOI)
const ownerId = "420265433367838721";

// 🔢 Salon compteur TikTok (nom de base à chercher)
// ➜ Crée un salon texte qui s'appelle EXACTEMENT : 📱│tiktok-abonnés
const tiktokCounterChannelBaseName = "📱│tiktok-abonnés";

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

// 🔁 Fonction : mettre à jour le salon compteur TikTok
async function updateTikTokCounter(guild, feedbackChannel = null) {
    try {
        if (!guild) {
            console.log("⚠️ Pas de guild pour update TikTok.");
            if (feedbackChannel) {
                await feedbackChannel.send("⚠️ Impossible de trouver le serveur pour mettre à jour TikTok.");
            }
            return;
        }

        const host = process.env.RAPIDAPI_HOST;
        const key = process.env.RAPIDAPI_KEY;
        const secUid = process.env.TIKTOK_SEC_UID;

        if (!host || !key || !secUid) {
            console.log("⚠️ RAPIDAPI_HOST / RAPIDAPI_KEY / TIKTOK_SEC_UID manquants dans .env");
            if (feedbackChannel) {
                await feedbackChannel.send("⚠️ Config API TikTok incomplète (RAPIDAPI_HOST / RAPIDAPI_KEY / TIKTOK_SEC_UID).");
            }
            return;
        }

        // 🔎 On cherche le salon compteur
        let counterChannel = guild.channels.cache.find(
            (c) => c.name.startsWith("📱│TikTok")
        );

        if (!counterChannel) {
            counterChannel = guild.channels.cache.find(
                (c) => c.name === tiktokCounterChannelBaseName
            );
        }

        if (!counterChannel) {
            console.log("⚠️ Salon compteur TikTok introuvable.");
            if (feedbackChannel) {
                await feedbackChannel.send("⚠️ Salon compteur TikTok introuvable. Crée un salon nommé `📱│tiktok-abonnés`.");
            }
            return;
        }

        // 🔗 Appel à l’API TikTok Scraper (endpoint /user/info)
        const url = `https://${host}/user/info?sec_uid=${encodeURIComponent(secUid)}`;

        const response = await axios.get(url, {
            headers: {
                "x-rapidapi-key": key,
                "x-rapidapi-host": host
            }
        });

        const data = response.data;
        console.log("📦 Réponse TikTok (début) :", JSON.stringify(data).slice(0, 400));

        // 🧠 Tentatives pour trouver le nombre d'abonnés
        const followers =
            data?.userInfo?.stats?.followerCount ||
            data?.data?.stats?.followerCount ||
            data?.stats?.followerCount ||
            data?.followerCount ||
            null;

        if (followers === null || followers === undefined) {
            console.log("⚠️ Impossible de lire le nombre d’abonnés TikTok dans la réponse.");
            if (feedbackChannel) {
                await feedbackChannel.send("❌ Impossible de lire le nombre d’abonnés dans la réponse TikTok. Regarde les logs Render pour la structure.");
            }
            return;
        }

        const formatted = Number(followers).toLocaleString("fr-FR");
        const newName = `📱│TikTok : ${formatted} abonnés`;

        if (counterChannel.name !== newName) {
            await counterChannel.setName(newName);
            console.log(`✅ Salon compteur TikTok mis à jour : ${newName}`);
            if (feedbackChannel) {
                await feedbackChannel.send(`✅ Compteur TikTok mis à jour : **${formatted} abonnés**.`);
            }
        } else {
            console.log("ℹ️ Compteur TikTok déjà à jour.");
            if (feedbackChannel) {
                await feedbackChannel.send(`ℹ️ Compteur déjà à jour : **${formatted} abonnés**.`);
            }
        }
    } catch (err) {
        console.error("❌ Erreur updateTikTokCounter :", err?.response?.data || err);
        if (feedbackChannel) {
            await feedbackChannel.send("❌ Erreur lors de la mise à jour TikTok (voir logs Render).");
        }
    }
}

// 🟢 Quand le bot est connecté
client.once(Events.ClientReady, () => {
    console.log(`🤖 Bot connecté en tant que ${client.user.tag}`);

    // On prend la première guilde où se trouve le bot
    const guild = client.guilds.cache.first();

    // Mise à jour immédiate au démarrage
    updateTikTokCounter(guild);

    // Mise à jour toutes les 5 minutes (300 000 ms)
    setInterval(() => {
        updateTikTokCounter(guild);
    }, 300000);
});

// 💬 Messages reçus
client.on(Events.MessageCreate, async (message) => {
    if (message.author.bot) return;

    console.log(`📩 #${message.channel.name} | ${message.author.tag} : ${message.content}`);

    const lowered = message.content.trim().toLowerCase();

    // 🧪 COMMANDE TEST DM : !testdm
    if (lowered === "!testdm") {
        if (ownerId === "TON_ID_ICI") {
            await message.reply("⚠️ Tu dois remplacer TON_ID_ICI par ton vrai ID dans le code.");
            return;
        }

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

    // 🧪 COMMANDE POUR FORCER LA MISE À JOUR TIKTOK : !tiktokauto
    if (lowered === "!tiktokauto") {
        const guild = message.guild;
        if (!guild) {
            await message.reply("❌ Cette commande doit être utilisée dans un serveur.");
            return;
        }

        await message.reply("🔁 Mise à jour du compteur TikTok en cours...");
        await updateTikTokCounter(guild, message.channel);
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
    if (ownerId !== "TON_ID_ICI") {
        try {
            const ownerUser = await client.users.fetch(ownerId);
            await ownerUser.send(
                `🔔 Nouveau membre sur **${member.guild.name}** : **${member.user.tag}** vient de rejoindre le serveur.`
            );
            console.log(`📨 DM envoyé au propriétaire (${ownerUser.tag}) pour ${member.user.tag}`);
        } catch (err) {
            console.error("❌ Impossible d'envoyer le DM au propriétaire :", err);
        }
    }
});

// 🚀 Connexion
client.login(process.env.DISCORD_TOKEN);
