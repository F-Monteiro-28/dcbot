const { EmbedBuilder, Client, Interaction } = require("discord.js");
const { embedColor } = require("../config");

const embed = new EmbedBuilder().setColor(embedColor);

/**
 *
 * @param {Client} client
 * @param {Interaction} i
 */
const buildHelpEmbed = async (i, client) => {
  embed
    .setAuthor({
      iconURL: `${client.user.displayAvatarURL()}`,
      name: `${client.user.username}' Comandos de ticket`,
    })
    .setFooter({
      iconURL: `${i.user.displayAvatarURL()}`,
      text: `A pedido de: ${i.user.globalName}`,
    })
    .setTimestamp()
    .setTitle("Comandos de ticket.")
    .setDescription(
      "Veja uma lista de todos os meus comandos abaixo - \n> `/ticket setup` ~ Configurar o sistema de tickets no seu servidor!\n> `/ticket disbale` ~ Remover o sistema de tickets do seu servidor.\n> `/ticket send` ~ Enviar o embed do ticket para um canal\n> `/ticket config role` ~ Alterar o cargo de gestor de tickets.\n> `/ticket config channel` ~ Alterar o canal de transcrições de tickets\n> `/ticket config category` ~ Alterar a categoria na qual os tickets serão criados."
    );

  return await i.reply({ embeds: [embed], ephemeral: true });
};

module.exports = buildHelpEmbed;
