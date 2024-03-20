const { SlashCommandBuilder } = require('@discordjs/builders');
const fs = require('fs').promises;

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setvotetime')
    .setDescription('Define o tempo de votação em segundos.')
    .addIntegerOption(option =>
      option.setName('tempo')
        .setDescription('Tempo de votação em segundos.')
        .setRequired(true)),

  async execute(interaction) {
    try {
      if (!interaction.member.permissions.has('ADMINISTRATOR')) {
        return await interaction.reply('Apenas administradores podem usar este comando.');
      }

      const voteTime = interaction.options.getInteger('tempo');

      if (voteTime <= 0) {
        return await interaction.reply('O tempo de votação deve ser maior que zero.');
      }

      const envContent = await fs.readFile('.env', 'utf-8');

      const updatedEnvContent = envContent.replace(/COLLECTOR_TIME=\d+/, `COLLECTOR_TIME=${voteTime}`);

      await fs.writeFile('.env', updatedEnvContent);

      await interaction.reply(`Tempo de votação atualizado para ${voteTime} milisegundos.`);

    } catch (error) {
      console.error(error);
      await interaction.reply('Ocorreu um erro ao processar o comando. Tente novamente mais tarde.');
    }
  },
};
