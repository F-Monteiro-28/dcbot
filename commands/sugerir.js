const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');
const dotenv = require('dotenv');
const fs = require('fs').promises;

dotenv.config();

const suggestionsFilePath = 'suggestions.json';

const getCollectorTime = async () => {
  try {
    const envContent = await fs.readFile('.env', 'utf-8');
    const match = envContent.match(/COLLECTOR_TIME=(\d+)/);
    return match ? parseInt(match[1], 10) : null;
  } catch (error) {
    console.error('Erro ao ler COLLECTOR_TIME do .env:', error.message);
    return null;
  }
};

// Função para carregar sugestões do arquivo JSON
const loadSuggestions = async () => {
  try {
    const content = await fs.readFile(suggestionsFilePath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error('Erro ao carregar sugestões:', error.message);
    return [];
  }
};

// Função para salvar sugestão no arquivo JSON
const saveSuggestion = async (suggestion) => {
  try {
    const suggestions = await loadSuggestions();
    suggestions.push(suggestion);
    await fs.writeFile(suggestionsFilePath, JSON.stringify(suggestions, null, 2), 'utf-8');
  } catch (error) {
    console.error('Erro ao salvar sugestão:', error.message);
  }
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('sugerir')
    .setDescription('Sugerir um filme.')
    .addStringOption(option =>
      option.setName('filme')
        .setDescription('Filme a sugerir.')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('imagem')
        .setDescription('Link de uma imagem para acompanhar a sugestão.')
        .setRequired(false)),

  async execute(interaction) {
    try {
      const suggestion = interaction.options.getString('filme');
      const imageLink = interaction.options.getString('imagem');

      const suggestionChannelId = process.env.SUGGESTION_CHANNEL_ID;
      const approvalChannelId = process.env.APPROVAL_CHANNEL_ID;

      if (interaction.channelId !== suggestionChannelId) {
        const replyMessage = await interaction.reply('Este comando só pode ser executado no canal de sugestões.');

        setTimeout(() => {
          replyMessage.delete().catch(console.error);
        }, 3000);

        return;
      }

      const suggestionChannel = interaction.guild.channels.cache.get(suggestionChannelId);
      const approvalChannel = interaction.guild.channels.cache.get(approvalChannelId);

      if (!suggestionChannel || !approvalChannel) {
        console.error('Os canais não foram configurados corretamente.');
        return interaction.reply('Ocorreu um erro ao processar sua sugestão. Tente novamente mais tarde.');
      }

      const footerTitle = process.env.SUGGESTION_FOOTER_TITLE;

      const embed = new EmbedBuilder()
        .setTitle(`**Filme sugerido por:** ${interaction.member.displayName}\n`)
        .setDescription(`# ${suggestion}`)
        .setColor('#3498db')
        .setFooter({ text: footerTitle })
        .setTimestamp()
        .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }));

      if (imageLink) {
        embed.setImage(imageLink);
      }

      const sentMessage = await suggestionChannel.send({ embeds: [embed] });

      // Salvando a sugestão no arquivo JSON
      saveSuggestion({
        suggestion,
        imageLink,
        author: interaction.member.displayName,
        timestamp: sentMessage.createdTimestamp,
        messageId: sentMessage.id,
      });

      await interaction.reply('Agradecemos a tua sugestão!');

      await sentMessage.react('👍');
      await sentMessage.react('👎');

      const filter = (reaction, user) => {
        return ['👍', '👎'].includes(reaction.emoji.name) && !user.bot;
      };

      const updatedCollectorTime = await getCollectorTime();

      if (updatedCollectorTime !== null && updatedCollectorTime !== parseInt(process.env.COLLECTOR_TIME, 10)) {
        console.log(`Atualizando COLLECTOR_TIME para: ${updatedCollectorTime}`);
        process.env.COLLECTOR_TIME = updatedCollectorTime;
      }

      console.log('Collector Time:', process.env.COLLECTOR_TIME);
      const collector = sentMessage.createReactionCollector({
        filter,
        time: parseInt(process.env.COLLECTOR_TIME, 10),
      });

      collector.on('collect', (reaction, user) => {
        console.log(`Reação ${reaction.emoji.name} coletada de ${user.tag}`);
      });

      collector.on('end', async (collected, reason) => {
        console.log(`Coletor encerrado. Razão: ${reason}`);

        const originalEmbed = sentMessage.embeds[0];

        await sentMessage.reactions.removeAll().catch(console.error);

        const approvalCount = collected.filter(r => r.emoji.name === '👍').size;
        const disapprovalCount = collected.filter(r => r.emoji.name === '👎').size;

        console.log(approvalCount, disapprovalCount);

        if (approvalCount > disapprovalCount) {
          const approvalEmbed = new EmbedBuilder(originalEmbed)
            .setTitle('Filme Aprovado!')
            .setDescription(`O filme "${suggestion}" foi aprovado e será terá em breve a data da sua reprodução agendada em algum dos canais de cinema. @everyone`)
            .setColor('#00FF00')
            .setAuthor({
              name: `Sugerido por:  ${interaction.member.displayName}`,
              iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
            })
            .setImage(imageLink)
            .setTimestamp()
            .setFooter({ text: footerTitle });

          await approvalChannel.send({ embeds: [approvalEmbed] });

          const statusEmbed = new EmbedBuilder(originalEmbed)
            .setColor('#00FF00')
            .setDescription(`O filme "${suggestion}" foi aprovado ! clica aqui => <#${approvalChannel.id}> para mais detalhes! @everyone`)
            .setImage(imageLink)
            .setTimestamp()
            .setFooter({ text: footerTitle });
          await sentMessage.edit({ embeds: [statusEmbed] });
        } else {
          const disapprovalEmbed = new EmbedBuilder(originalEmbed)
            .setTitle('Filme com Votação Reprovada!')
            .setDescription(`A votação para o filme "${suggestion}" foi reprovada.`)
            .setColor('#FF0000')
            .setAuthor({
              name: `Sugerido por:  ${interaction.member.displayName}`,
              iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
            })
            .setTimestamp()
            .setFooter({ text: footerTitle });

          await sentMessage.edit({ embeds: [disapprovalEmbed] });
        }
      });
    } catch (error) {
      console.error(error);
      await interaction.reply('Ocorreu um erro ao processar sua sugestão. Tente novamente mais tarde.');
    }
  },
};
