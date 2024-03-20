const {
  Client,
  GatewayIntentBits,
  Collection,
  ActivityType,
} = require("discord.js");
const { REST } = require("@discordjs/rest");
const { Routes } = require("discord-api-types/v10");
const fs = require("fs/promises");
const path = require("path");
const dotenv = require("dotenv");
const { readdirSync } = require("fs");

dotenv.config();

const clientId = process.env.CLIENT_ID;
const guildId = process.env.GUILD_ID;
const token = process.env.BOT_TOKEN;

const rest = new REST({ version: "10" }).setToken(token);

const commands = new Collection();
const commandsPath = "./commands";

const loadCommands = async () => {
  const commandFiles = await fs.readdir(commandsPath);

  const commandsPromises = commandFiles
    .filter((file) => file.endsWith(".js"))
    .map(async (file) => {
      const command = require(`./commands/${file}`);
      commands.set(command.data.name, command);
    });

  await Promise.all(commandsPromises);
};

const updateCommands = async () => {
  try {
    console.log("Comandos de atualização do galo (/) iniciados.");

    // Apagar todos os comandos globais
    await rest
      .put(Routes.applicationCommands(clientId), { body: [] })
      .then(() => console.log("Successfully deleted all application commands."))
      .catch(console.error);
    // Carregar comandos
    await loadCommands();

    // Adicionar novos comandos do código
    const commandData = commands.map((command) => command.data.toJSON());
    await rest.put(Routes.applicationCommands(clientId), { body: commandData });

    console.log("Comandos do galo (/) recarregados com sucesso.");
  } catch (error) {
    console.error(error);
  }
};

const client = new Client({
  intents: 32767,
});

client.commands = new Map();
client.buttons = new Map();
client.config = require("./config.js");

const handlerFolder = readdirSync("./handlers").filter((f) =>
  f.endsWith(".js")
);
for (const handler of handlerFolder) {
  const handlerFile = require(`./handlers/${handler}`);
  handlerFile(client);
}

client.once("ready", async () => {
  console.log(`Login com sucesso: ${client.user.tag}!`);

  // Trocar o status a cada 4 segundos
  setInterval(async () => {
    // Atualizar o nome do servidor e o número de membros
    const guildCount = client.guilds.cache.size;
    const guildMemberCount = client.guilds.cache.reduce((acc, guild) => {
      const nonBotMembers = guild.members.cache.filter(
        (member) => !member.user.bot
      );
      return acc + nonBotMembers.size;
    }, 0);

    const statusMessages = [
      {
        name: `Galinheiro com ${guildMemberCount} Membros!`,
        type: ActivityType.Custom,
      },
      { name: "Desenvolvido por: monteirexx", type: ActivityType.Custom },
      {
        name: "Convida galinhas pro galinheiro baixo nengue!🤫",
        type: ActivityType.Custom,
      },
    ];

    const currentStatusIndex = Math.floor(
      Math.random() * statusMessages.length
    );
    const currentStatus = statusMessages[currentStatusIndex];

    await client.user.setPresence({
      activities: [currentStatus],
      status: "dnd",
    });
  }, 4000);

  // Atualizar comandos no servidor
  await updateCommands();
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isCommand()) return;

  const { commandName } = interaction;
  const command = commands.get(commandName);

  if (!command) return;

  try {
    await command.execute(interaction, client);
  } catch (error) {
    console.error("Erro ao executar o comando:", error.message);

    if (interaction.replied) {
      console.log("Erro após resposta:", error);
    } else {
      console.error("Erro antes da resposta. Interagindo:", interaction);
      await interaction.reply({
        content: "Ocorreu um erro ao executar este comando!",
        ephemeral: true,
      });
    }
  }
});

client.login(token);
