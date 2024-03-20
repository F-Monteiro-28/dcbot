const { SlashCommandBuilder } = require("@discordjs/builders");
const { EmbedBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("custommessage")
    .setDescription("Cria uma mensagem personalizada")
    .addStringOption((option) =>
      option
        .setName("title")
        .setDescription("Título da mensagem")
        .setRequired(false)
    )
    .addStringOption((option) =>
      option
        .setName("description")
        .setDescription("Descrição da mensagem")
        .setRequired(false)
    )
    .addStringOption((option) =>
      option
        .setName("color")
        .setDescription("Cor da mensagem (hexadecimal)")
        .setRequired(false)
    )
    .addStringOption((option) =>
      option.setName("image").setDescription("URL da imagem").setRequired(false)
    ),
  async execute(interaction) {
    // Obtendo as opções fornecidas pelos usuários
    const title = interaction.options.getString("title");
    const description = interaction.options.getString("description");
    const color = interaction.options.getString("color");
    const imageUrl = interaction.options.getString("image");

    // Criando a mensagem personalizada com EmbedBuilder
    const customEmbed = new EmbedBuilder()
      .setTitle(title || "Mensagem Personalizada")
      .setDescription(description || "Esta é uma mensagem personalizada.")
      .setColor(color || "#3498db")
      .setImage(imageUrl)
      .setTimestamp();

    // Enviando a mensagem personalizada
    await interaction.reply({ embeds: [customEmbed] });
  },
};
