import Config from 'config';
import express from 'express';
import * as Http from 'http';
import * as SocketIo from 'socket.io';
import { Client } from 'discord.js';
import axios from 'axios';
import Metadata from './metadata.js'

import * as Sentry from '@sentry/node';
import * as Tracing from "@sentry/tracing";

Sentry.init({
  dsn: Config.Sentry.DSN,
  environment: Config.util.getEnv('NODE_ENV'),
  tracesSampleRate: 1.0,
});

const app = express();
const server = Http.createServer(app);
const io = new SocketIo.Server();
const bot = new Client();

let metadataTimer;
let nowPlaying = new Metadata();

io.attach(server, {
  transports: ['websocket', 'xhr-polling']
});

io.on('connection', function(socket) {
  socket.on('metadata', () => {
    io.emit('metadata', nowPlaying.getJSON());
  });

  socket.on('refreshMetadata', () => {
    Sentry.captureMessage('refresh metadata forced');
    clearTimeout(metadataTimer);
    updateMetadata();
  })
});

server.listen(Config.Port, () => {
  console.log(`Socket IO server listening on ${Config.Port}`);
  updateMetadata();
});

bot
  .on('ready', () => {
    console.log(`Logged in as ${bot.user.tag}!`);

    bot.emit('metadata', nowPlaying.getJSON());
  })
  .on('metadata', (metadata) => {
    // History
    bot.channels.fetch(Config.Discord.MetaChannelId)
      .then((channel) => {
        if (!channel) return;
        
        if (!metadata.is_stream_offline) {
          channel.send({embed: {
            color: 0x33AFFF,
            description: metadata.text,
            timestamp: metadata.played_at,
            footer: { text: 'Played at' },
          }});
        }
      })
      .catch(console.error);

    // Now Playing
    bot.channels.fetch(Config.Discord.ChatChannelId)
      .then((channel) => {
        if (!channel) return;

        if (!metadata.is_stream_offline) {
          channel.send({embed: {
            color: 0x33AFFF,
            title: ':musical_note:  Now Playing',
            description: metadata.text,
            fields: [{
              name: ':mag: Search',
              value: `[Google](https://google.com/search?q=${metadata.query})`,
              inline: true,
            }, {
              name: 'ㅤ',
              value: `[Youtube](https://youtube.com/results?search_query=${metadata.query})`,
              inline: true,
            }, {
              name: ':clipboard: History',
              value: `<#${Config.Discord.MetaChannelId}>`,
              inline: true,
            }, {
              name: ':arrow_forward: Streaming',
              value: `[청취하기](${Config.Homepage})`,
              inline: true,
            }],
            timestamp: metadata.played_at,
            footer: { text: 'Played at' },
          }}).then((message) => refreshMessage(message));
        } else {
          channel.send({embed: {
            color: 0x33AFFF,
            title: ':musical_note:  Now Playing',
            description: '현재 방송중이 아닙니다',
            fields: [{
              name: ':clipboard: History',
              value: `<#${Config.Discord.MetaChannelId}>`,
              inline: true,
            }],
            timestamp: metadata.played_at,
            footer: { text: 'Played at' },
          }}).then((message) => refreshMessage(message));
        }
      })
      .catch(console.error);
  });

bot.login(Config.Discord.Token);

function refreshMessage (message) {
  nowPlaying.messages.unshift(message);

  if (nowPlaying.messages.length > 1) {
    nowPlaying.messages.pop().delete().catch(console.error);
  }
}

function updateMetadata () {
  axios.get(Config.Metadata.API)
    .then(({ data }) => {
      nowPlaying.setId(data.now_playing.sh_id);
      nowPlaying.setListeners(data.listeners.current);
      nowPlaying.setSongInfo(data.now_playing.song.title, data.now_playing.song.artist, data.now_playing.played_at);
      
      if (nowPlaying.isMetadataChanged()) {
        bot.emit('metadata', nowPlaying.getJSON());
      } 

      if (nowPlaying.isMetadataChanged() || nowPlaying.isListenersChanged()) {
        io.emit('metadata', nowPlaying.getJSON());
      }
    })
    .catch((error) => Sentry.captureException(error))
    .finally(() => metadataTimer = setTimeout(updateMetadata, Config.Metadata.Interval))
}