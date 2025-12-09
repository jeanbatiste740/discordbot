require("dotenv").config();
const { Client, GatewayIntentBits, Events, EmbedBuilder } = require("discord.js");
const OpenAI = require("openai");

// 🧑‍💻 ID DU PROPRIÉTAIRE (TOI)
const ownerId = "420265433367838721";

// 🔢 NOM DE BASE DU SALON COMPTEUR DE MEMBRES
// ➜ Crée un salon (texte OU vocal) nommé au départ : 👥│membres
const memberCounterChannelBaseName = "👥│membres";

// 🔧 Client Discord
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

// 🔧 Client OpenAI
// 👉 OPTION 1 : via variable d'environnement OPENAI_API_KEY (Render)
// 👉 OPTION 2 : tu peux mettre ta clé directement à la place de "" si ton repo est PRIVÉ
const apiKey =
    process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.trim() !== ""
        ? process.env.OPENAI_API_KEY
        : ""; // <-- tu peux mettre "sk-...." ici si tu veux

let openai = null;

if (!apiKey) {
    console.warn("⚠️ Aucune clé OpenAI configurée (OPENAI_API_KEY vide). L'IA ne répondra pas.");
} else {
    openai = new OpenAI({ apiKey });
    console.log("✅ Client OpenAI initialisé.");
}

// 🔁 Met à jour le compteur de membres
async function updateMemberCount(guild, feedbackChannel = null) {
    try {
        if (!guild) {
            if (feedbackChannel) await feedbackChannel.send("⚠️ Impossible de trouver le serveur.");
            return;
        }

        const count = guild.memberCount;
        const newName = `👥│membres : ${count}`;

        // On cherche un salon qui commence par "👥│membres"
        let counterChannel = guild.channels.cache.find(
            c => c.name.startsWith("👥│membres")
        );

        // Sinon on cherche le nom de base exact
        if (!counterChannel) {
            counterChannel = guild.channels.cache.find(
                c => c.name === memberCounterChannelBaseName
            );
        }

        if (!counterChannel) {
            console.log(`⚠️ Aucun salon compteur trouvé dans ${guild.name}.`);
            if (feedbackChannel) {
                await feedbackChannel.send(
                    `⚠️ Aucun salon compteur trouvé.\n` +
                    `Crée un salon **texte ou vocal** appelé **${memberCounterChannelBaseName}**.`
                );
            }
            return;
        }

        if (counterChannel.name === newName) {
            console.log(`ℹ️ Compteur déjà à jour dans ${guild.name}.`);
            if (feedbackChannel) {
                await feedbackChannel.send(`ℹ️ Compteur déjà à jour : **${count} membres**.`);
            }
            return;
        }

        await counterChannel.setName(newName);
        console.log(`✅ Compteur de membres mis à jour dans ${guild.name} : ${newName}`);
        if (feedbackChannel) {
            await feedbackChannel.send(`✅ Compteur mis à jour : **${count} membres**.`);
        }
    } catch (err) {
        console.error("❌ Erreur updateMemberCount :", err);
        if (feedbackChannel) {
            await feedbackChannel.send(
                "❌ Erreur lors de la mise à jour du compteur.\n" +
                "Vérifie que le bot a la permission **Gérer les salons (Manage Channels)**."
            );
        }
    }
}

// 🟢 Quand le bot est prêt
client.once(Events.ClientReady, () => {
    console.log(`🤖 Bot connecté en tant que ${client.user.tag}`);

    // Met à jour le compteur pour tous les serveurs où est le bot
    client.guilds.cache.forEach(guild => {
        updateMemberCount(guild);
    });
});

// 💬 Messages
client.on(Events.MessageCreate, async (message) => {
    if (message.author.bot) return;

    console.log(`📩 #${message.channel.name} | ${message.author.tag} : ${message.content}`);

    const lowered = message.content.trim().toLowerCase();

    // 🔁 COMMANDE DEBUG COMPTEUR : !membersupdate
    if (lowered === "!membersupdate") {
        if (!message.guild) {
            await message.reply("❌ Cette commande doit être utilisée dans un serveur.");
            return;
        }
        await message.reply("🔁 Mise à jour du compteur de membres en cours...");
        await updateMemberCount(message.guild, message.channel);
        return;
    }

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

    // 💬 IA seulement dans 『🤖』sacha-ai
    if (message.channel.name !== "『🤖』sacha-ai") return;

    const userText = message.content?.trim();
    if (!userText || userText.length < 2) return;

    // 👉 Si OpenAI n'est pas configuré, on évite le crash et on répond proprement
    if (!openai) {
        await message.reply("⚠️ L'IA n'est pas configurée (clé OpenAI manquante). Parle à Sacha pour configurer ça 😉");
        return;
    }

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

    // 🔁 Met à jour le compteur de membres
    updateMemberCount(member.guild);

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

// ➖ Quand quelqu'un quitte, on met aussi à jour le compteur
client.on(Events.GuildMemberRemove, async (member) => {
    console.log(`➖ Membre parti : ${member.user.tag}`);
    updateMemberCount(member.guild);
});

// 🚀 Connexion
client.login(process.env.DISCORD_TOKEN);
