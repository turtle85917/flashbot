const fs = require('fs')
const path = require('path')

const { Collection } = require('discord.js')
const hangul = require('hangul-js')

const Command = require('../../classes/Command')

class TypingGameCommand extends Command {
  constructor (client) {
    super(client, {
      name: 'typing',
      aliases: ['타자'],
      description: '',
      group: 'game',
      guildAct: true
    })

    this.loaded = false
    this.loading = false
    this.default = 'ko_KR'
    this.data = new Collection()
  }

  async run (client, msg, query, locale) {
    const t = client.locale.t

    if (query.args.length > 0) {
      if (['reload', '리로드'].includes(query.args[0])) {
        this.p = path.join(path.resolve(), 'data', 'typing')
        this.loaded = false
        this.data.forEach((_, lang) => {
          delete require.cache[path.join(this.p, lang + '.json')]
        })

        return this.loadData(msg, locale)
      }
    }

    if (!this.loaded) {
      msg.channel.send(t('commands.typing.loading', locale))
      if (this.loading) return
      this.p = path.join(path.resolve(), 'data', 'typing')
      this.loadData(msg, locale)
    }

    if (!this.data.get(this.default)) return msg.channel.send(t('commands.typing.noDefaultData'))
    const lang = this.data.get(this.default)
    const text = lang[Math.floor(Math.random() * lang.length)]
    const displayText = text.split('').join('\u200b')

    msg.channel.send(t('commands.typing.start', locale, displayText))

    // Timer start
    const startTime = Date.now()

    let correct = false
    const mc = msg.channel.createMessageCollector((m) => !m.author.bot, { time: 60000 })

    mc.on('collect', (m) => {
      if (m.content === displayText) return msg.channel.send('<@' + m.author.id + '>, ' + t('commands.typing.doNotCopyPaste', locale))

      if (m.content !== text) return //msg.channel.send('<@' + m.author.id + '>, ' + t('commands.typing.notMatch', locale))

      const time = (Date.now() - startTime) / 1000
      const ta = Math.round(hangul.d(text).length / time * 60)
      msg.channel.send('<@' + m.author.id + '>, ' + t('commands.typing.correct', locale, time, ta))
      correct = true
      mc.stop()
    })

    mc.on('end', () => {
      if(!correct) return msg.channel.send(t('commands.typing.finish', locale))
    })
  }

  loadData (msg, locale) {
    const t = msg.client.locale.t

    if (!fs.existsSync(this.p)) return msg.channel.send(t('commands.typing.noDataFolder', locale))

    const locales = fs.readdirSync(this.p)
    if (locales.length < 1) return msg.channel.send(t('commands.typing.noDataFile', locale))

    locales.forEach((l) => {
      if (!fs.lstatSync(path.join(this.p, l)).isFile() || !l.endsWith('.json')) return
      this.data.set(l.slice(0, l.length - 5), require(path.join(this.p, l)))
    })

    this.loaded = true
    this.loading = false
    msg.channel.send(t('commands.typing.loaded', locale))
  }
}

module.exports = TypingGameCommand
