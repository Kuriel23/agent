const { SlashCommandBuilder, PermissionsBitField, SlashCommandStringOption, EmbedBuilder } = require('discord.js');
const Command = require('../structures/command.js');

class StaffCommand extends Command{
    constructor(){
        super({
            active: true,
            data: new SlashCommandBuilder()
                .setName('staff')
                .setDescription('Mostra todos os membros da staff desse servidor presentes')
                .setDMPermission(false)
                .setDefaultMemberPermissions(PermissionsBitField.Flags.ViewChannel)
                .addStringOption(
                    new SlashCommandStringOption()
                        .setName('server')
                        .setNameLocalization('pt-BR', 'servidor')
                        .setDescription('O servidor que deseja consultar a staff')
                        .setAutocomplete(true)
                        .setRequired(true),
                ),
        });
    }

    async execute(interaction, client){
        const memberModel = require('../models/member.js');
        const guildId = interaction.options.getString('server');
        const memberDocs = await memberModel.find({guild: guildId});
        if(!memberDocs.length) return await interaction.reply({
            content: 'Nenhum membro desse servidor cadastrado',
            ephemeral: true,
        });
        const guildModel = require('../models/guild.js');
        const guildDoc = await guildModel.findById(guildId);
        const invite = await client.fetchInvite(guildDoc.invite).catch(() => null);
        const embed = new EmbedBuilder()
            .setColor(0x2f3136)
            .setAuthor({
                name: `Staff de ${guildDoc.name}`,
                iconURL: invite?.guild.iconURL({dynamic: true}),
            })
            .setDescription(
                `Representante: <@${guildDoc.representative}>` +
                `${guildDoc.owner ? `\nDono: <@${guildDoc.owner}>` : ''}`
            );
        const adminDocs = memberDocs.filter(doc => doc.admin);
        if(adminDocs.length) embed.addFields({
            name: 'Administradores',
            value: adminDocs.map(doc => `<@${doc.user}>`).join('\n'),
        });
        const modDocs = memberDocs.filter(doc => !doc.admin);
        if(modDocs.length) embed.addFields({
            name: 'Moderadores',
            value: modDocs.map(doc => `<@${doc.user}>`).join('\n'),
        });
        await interaction.reply({
            embeds: [embed],
            ephemeral: true,
        });
    }

    async autocomplete$server(_, value){
        const guildModel = require('../models/guild.js');
        const guildDocs = await guildModel
            .find({name: {$regex: new RegExp(value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')}})
            .sort({name: 1})
            .limit(25);
        return guildDocs.map(doc => ({
            name: doc.name,
            value: doc._id,
        }));
    }
}

module.exports = new StaffCommand();