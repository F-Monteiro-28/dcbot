const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');
const dotenv = require('dotenv');

dotenv.config();


module.exports = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Verificar se o galo tem lag..'),
  
  async execute(interaction) {
    try {
      const embed = new EmbedBuilder()
        .setTitle('Calculando ping baixo nengue.. 🔄');

      const initialColor = process.env.EMBED_INITIAL_COLOR || '#3498db';
      embed.setColor(initialColor);

      const pingMessage = await interaction.reply({ embeds: [embed] });

      setTimeout(async () => {
        const latency = pingMessage.createdTimestamp - interaction.createdTimestamp;
        const apiLatency = interaction.client.ws.ping;

        const resultEmbed = new EmbedBuilder()
          .setTitle('Ping do Galo');

        const resultColor = process.env.EMBED_RESULT_COLOR || '#2ecc71';
        resultEmbed.setColor(resultColor);

        resultEmbed.addFields(
          { name: 'Ping do Galo:', value: `${latency}ms`, inline: true },
          { name: 'Ping da API:', value: `${apiLatency}ms`, inline: true }
        );

        await pingMessage.edit({ embeds: [resultEmbed] });

        setTimeout(async () => {
          await pingMessage.delete();
        }, 3000);
      }, 1000);
    } catch (error) {
      console.error(error);
    }
  },
};
