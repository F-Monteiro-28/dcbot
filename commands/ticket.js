const {
  SlashCommandBuilder,
  EmbedBuilder,
  ChatInputCommandInteraction,
  Client,
  ChannelType,
  PermissionFlagsBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const ticketSchema = require("../schemas/ticketSettings");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ticket")
    .setDescription("Um sistema tikcet totalmente personalizável!")
    .addSubcommand((sub) =>
      sub
        .setName("setup")
        .setDescription("Configure o sistema de tickets!")
        .addChannelOption((opt) =>
          opt
            .setName("category")
            .setDescription("A categoria na qual os tickets serão criados.")
            .setRequired(true)
            .addChannelTypes(ChannelType.GuildCategory)
        )
        .addChannelOption((opt) =>
          opt
            .setName("logs")
            .setDescription(
              "O canal no qual os tickets serão registrados com transcrição."
            )
            .setRequired(true)
            .addChannelTypes(ChannelType.GuildText)
        )
        .addRoleOption((opt) =>
          opt
            .setName("manager")
            .setDescription("A equipa que pode ver os canais de tickets")
            .setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("send")
        .setDescription("Crie um painel de ticket")
        .addChannelOption((opt) =>
          opt
            .setName("channel")
            .setDescription("O canal para onde será enviado o painel.")
            .setRequired(true)
            .addChannelTypes(
              ChannelType.GuildAnnouncement,
              ChannelType.GuildText
            )
        )
        .addStringOption((str) =>
          str
            .setName("message")
            .setDescription("Assunto do ticket!")
            .setRequired(true)
        )
        .addStringOption((str) =>
          str
            .setName("color")
            .setDescription("A cor da mensagem! (Apenas Hexadecimal)")
            .setMaxLength(6)
            .setMinLength(6)
        )
    )
    .addSubcommand((sub) =>
      sub.setName("disable").setDescription("Desativar o sistema de tickets.")
    )
    .addSubcommandGroup((sg) =>
      sg
        .setName("config")
        .setDescription("Configurar o sistema de tickets.")
        .addSubcommand((sub) =>
          sub
            .setName("category")
            .setDescription("Categoria do ticket")
            .addChannelOption((opt) =>
              opt
                .setName("category")
                .setDescription(
                  "A categoria na qual os tickets serão criados."
                )
                .setRequired(true)
                .addChannelTypes(ChannelType.GuildCategory)
            )
        )
        .addSubcommand((sub) =>
          sub
            .setName("channel")
            .setDescription("Canal de Logs")
            .addChannelOption((opt) =>
              opt
                .setName("channel")
                .setDescription(
                  "A categoria na qual as Logs serão registadas.."
                )
                .setRequired(true)
                .addChannelTypes(ChannelType.GuildText)
            )
        )
        .addSubcommand((sub) =>
          sub
            .setName("role")
            .setDescription("A equipa gestora de tickets.")
            .addRoleOption((opt) =>
              opt
                .setName("manager")
                .setDescription("O cargo que ficará resposável pelos tickets.")
                .setRequired(true)
            )
        )
    ),
  /**
   * @param {ChatInputCommandInteraction} interaction
   * @param {Client} client
   * @returns
   */
  async execute(interaction, client) {
    const embed = new EmbedBuilder();
    const { emojis, embedColor, errorColor, successColor } = client.config;
    const { guildId, options, member, guild } = interaction;
    const subCommand = options.getSubcommand();
    const subCommandGroup = options.getSubcommandGroup();
    const category = options.getChannel("category");
    const logs = options.getChannel("logs");
    const manager = options.getRole("manager");
    const channel = options.getChannel("channel");
    const message = options.getString("message");
    const color = options.getString("color") ?? embedColor;

    if (!member.permissions.has(PermissionFlagsBits.Administrator)) {
      return await interaction.reply({
        embeds: [
          embed
            .setColor(errorColor)
            .setDescription(
              `${emojis.error} **Precisas de ser \`Administrador\` para usar este comando!**`
            ),
        ],
        ephemeral: true,
      });
    }

    await interaction.deferReply({ ephemeral: true });
    const data = await ticketSchema.findOne({ GuildID: guildId });

    if (subCommandGroup) {
      if (!data)
        return await interaction.editReply(
          "O sistema de tickets não está configurado neste servidor!"
        );

      switch (subCommand) {
        case "category":
          await ticketSchema.findOneAndUpdate(
            { GuildID: guildId },
            { CategoryID: category.id }
          );
          await interaction.editReply(
            `Categoria de tickets atualizada com sucesso para - <#${category.id}>`
          );
          break;

        case "channel":
          await ticketSchema.findOneAndUpdate(
            { GuildID: guildId },
            { TranscriptsID: channel.id }
          );
          await interaction.editReply(
            `Canal de Logs de tickets atualizado com sucesso para - <#${channel.id}>`
          );
          break;

        case "role":
          await ticketSchema.findOneAndUpdate(
            { GuildID: guildId },
            { ManagerRole: manager.id }
          );
          await interaction.editReply(
            `Equipa de tickets atualizada com sucesso para <@&${manager.id}>`
          );
          break;
        default:
          break;
      }
    } else {
      switch (subCommand) {
        case "disable":
          if (!data)
            return await interaction.editReply(
              "O sistema de tickets não está configurado neste servidor!"
            );

          await ticketSchema.findOneAndDelete({ GuildID: guildId });
          await interaction.editReply(
            "Sistema de tickets desativado com sucesso neste servidor!"
          );
          break;

        case "send":
          if (!data)
            return await interaction.editReply(
              "O sistema de tickets não está configurado neste servidor!"
            );
          embed.setColor(color).setDescription(`${message}`);

          const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId("tickets")
              .setStyle(ButtonStyle.Primary)
              .setEmoji(emojis.ticket)
              .setLabel("Abre um ticket!")
          );

          await channel.send({ embeds: [embed], components: [row] });
          await interaction.editReply("Mensagem enviada!");
          break;
        case "setup":
          if (data)
            return await interaction.editReply(
              "O sistema de tickets já está configurado neste servidor! Podes usar `/ticket config` para editá-lo!"
            );

          await ticketSchema.create({
            GuildID: guildId,
            CategoryID: category.id,
            TranscriptsID: logs.id,
            ManagerRole: manager.id,
          });
          embed
            .setColor(successColor)
            .setDescription(`${emojis.success} Configura o sistema de tickets!`)
            .addFields(
              {
                name: "Categoria: ",
                value: `> \`${category.name}\``,
                inline: true,
              },
              {
                name: "Canal de Logs: ",
                value: `> \`${logs.name}\``,
                inline: true,
              },
              { name: "Equipa de tickets: ", value: `> \`${manager.name}\`` }
            );

          await interaction.editReply({ embeds: [embed] });
          break;
        default:
          break;
      }
    }
  },
};
