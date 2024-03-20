const {
  Interaction,
  Client,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionFlagsBits,
} = require("discord.js");
const ticketSettings = require("../schemas/ticketSettings");
const ticketData = require("../schemas/ticket");

module.exports = {
  data: { customId: "tickets" },
  /**
   *
   * @param {Interaction} interaction
   * @param {Client} client
   */
  async execute(interaction, client) {
    const { guildId, member, guild, user } = interaction;
    const { config } = client;
    const { embedColor, successColor, emojis, errorColor } = config;

    const data = await ticketSettings.findOne({ GuildID: guildId });
    const openedData = await ticketData.findOne({
      GuildID: guildId,
      UserID: user.id,
    });
    if (!data)
      return await interaction.reply({
        ephemeral: true,
        content:
          "⁉️ Parece que encontraste uma mensagem, mas o sistema de tickets está desativado neste servidor!",
      });

    if (openedData) {
      return await interaction.reply({
        content: `Parece que já tens um ticket aberto em <#${openedData.ChannelID}>!`,
        ephemeral: true,
      });
    }

    const category = await guild.channels.cache.get(data.CategoryID);
    const ticketChannel = await category.children.create({
      name: `${rand(user)}`,
      topic: `Um novo ticket aberto por ${user.globalName}!`,
      permissionOverwrites: [
        { id: guildId, deny: [PermissionFlagsBits.ViewChannel] },
        {
          id: user.id,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
          ],
        },
        {
          id: data.ManagerRole,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
          ],
        },
      ],
    });
    const ts = `<t:${Math.floor(Date.now() / 1000)}>`;
    await ticketData.create({
      GuildID: guildId,
      UserID: user.id,
      ChannelID: ticketChannel.id,
      Closed: false,
      Timestamp: ts,
    });
    const embed = new EmbedBuilder()
      .setColor(embedColor)
      .setTitle("Novo Ticket!")
      .setDescription("Foi aberto um novo ticket!")
      .addFields(
        { name: "Aberto Por: ", value: `> \`${user.username}\``, inline: true },
        { name: "User ID: ", value: `> \`${user.id}\``, inline: true },
        {
          name: "Timestamp : ",
          value: `> ${ts}`,
        }
      );

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("lock-ticket")
        .setStyle(ButtonStyle.Secondary)
        .setEmoji("🔒")
        .setLabel("Trancar")
    );

    const m = await ticketChannel.send({
      content: `<@&${data.ManagerRole}>`,
      embeds: [embed],
      components: [row],
    });
    await interaction.reply({
      ephemeral: true,
      content: `Ticket aberto em - <#${ticketChannel.id}>!`,
    });
    await m.pin();
  },
};

let ticketCounter = 0;

function rand(user) {
  const ticketNumber = ticketCounter++;
  return `ticket-${user.username}-${ticketNumber}`;
}

