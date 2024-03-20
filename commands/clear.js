const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');
const dotenv = require('dotenv');

dotenv.config();

module.exports = {
  data: new SlashCommandBuilder()
    .setName('clear')
    .setDescription('Apaga uma quantidade específica de mensagens.')
    .addIntegerOption(option =>
      option.setName('quantidade')
        .setDescription('Número de mensagens a apagar')
        .setRequired(true)),

  async execute(interaction) {
    try {
      const quantidade = interaction.options.getInteger('quantidade');

      // Verifica se o número está dentro do intervalo aceitável
      if (quantidade < 1 || quantidade > 100) {
        return await interaction.reply({
          content: 'A quantidade deve ser entre 1 e 100.',
          ephemeral: true,
        });
      }

      // Apaga as mensagens
      const messages = await interaction.channel.bulkDelete(quantidade, true);

      // Obtém as cores do .env
      const successColor = process.env.EMBED_CLEAR_COLOR_SUCCESS || '#2ecc71';
      const errorColor = process.env.EMBED_CLEAR_COLOR_ERROR || '#e74c3c';

      // Cria um EmbedBuilder para a resposta
      const embed = new EmbedBuilder()
        .setTitle(`Foram apagadas ${messages.size} mensagens.`)
        .setColor(messages.size > 0 ? successColor : errorColor);

      // Envia o EmbedBuilder como resposta
      const reply = await interaction.reply({ embeds: [embed], ephemeral: true });

      // Remove a mensagem após 3 segundos
      setTimeout(() => {
        reply.delete();
      }, 3000);
    } catch (error) {
      console.error(error);
    }
  },
};
