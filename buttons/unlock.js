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
  data: { customId: "unlock-ticket" },
  /**
   *
   * @param {Interaction} interaction
   * @param {Client} client
   */
  async execute(interaction, client) {
    const { guildId, member, guild, user, channel } = interaction;
    const { config } = client;
    const embed = new EmbedBuilder();
    const { embedColor, successColor, emojis, errorColor } = config;

    const data = await ticketSettings.findOne({ GuildID: guildId });
    if (!member.roles.cache.has(data.ManagerRole))
      return await interaction.reply({
        ephemeral: true,
        content: "🛠️ Não tens permissão para usar este botão...",
      });

    const openedData = await ticketData.findOne({
      GuildID: guildId,
      ChannelID: channel.id,
    });
    if (!openedData)
      return await interaction.reply({
        ephemeral: true,
        content: "🛠️ Algo deu errado...",
      });
    if (!openedData.Closed)
      return await interaction.reply({
        ephemeral: true,
        content: "Este ticket já está aberto!",
      });

    channel.permissionOverwrites.set([
      { id: guildId, deny: [PermissionFlagsBits.ViewChannel] },
      {
        id: openedData.UserID,
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
    ]);
    openedData.Closed = false;
    await openedData.save();
    await interaction.reply({
      embeds: [
        embed
          .setColor(successColor)
          .setDescription("🔓 **Reabriste o ticket!**"),
      ],
    });
  },
};
