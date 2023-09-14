import Config from 'config';
import express from 'express';
import * as Http from 'http';
import * as SocketIo from 'socket.io';
import { Client } from 'discord.js';
import axios from 'axios';
import Metadata from './metadata.js';

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
const metadata = new Metadata();
const messages = [];

let metadataTimer;

io.attach(server, {
  transports: ['websocket', 'xhr-polling']
});

io.on('connection', function(socket) {
  socket.on('metadata', () => {
    io.emit('metadata', metadata.current);
  });

  socket.on('history', () => {
    io.emit('history', metadata.history);
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

    bot.emit('metadata', metadata.current);
  })
  .on('metadata', (data) => {
    // History
    bot.channels.fetch(Config.Discord.MetaChannelId)
      .then((channel) => {
        if (!channel) return;
        
        if (!data.is_stream_offline) {
          channel.send({embed: {
            color: 0x33AFFF,
            description: data.text,
            timestamp: data.played_at,
            footer: { text: 'Played at' },
          }});
        }
      })
      .catch(console.error);

    // Now Playing
    bot.channels.fetch(Config.Discord.ChatChannelId)
      .then((channel) => {
        if (!channel) return;

        if (!data.is_stream_offline) {
          channel.send({embed: {
            color: 0x33AFFF,
            title: ':mag: Search on Google',
            url: `https://google.com/search?q=${data.query}`,
            description: data.text,
            author: {
              name: 'Now Playing',
              url: Config.Homepage,
              icon_url: Config.HomepageIcon,
            },
            fields: [
              {
                name: ':arrow_forward: Streaming',
                value: `[청취하기](${Config.Homepage})`,
                inline: true,
              },
              {
                name: ':clipboard: History',
                value: `<#${Config.Discord.MetaChannelId}>`,
                inline: true,
              }
            ],
            timestamp: data.played_at,
            footer: { text: 'Played at' },
          }}).then((message) => refreshMessage(message));
        } else {
          channel.send({embed: {
            color: 0x33AFFF,
            title: '현재 방송중이 아닙니다',
            author: {
              name: 'Now Playing',
              url: Config.Homepage,
              icon_url: Config.HomepageIcon,
            },
            fields: [{
              name: ':clipboard: History',
              value: `<#${Config.Discord.MetaChannelId}>`,
              inline: true,
            }],
            timestamp: data.played_at,
            footer: { text: 'Played at' },
          }}).then((message) => refreshMessage(message));
        }
      })
      .catch(console.error);
  });

bot.login(Config.Discord.Token);

function refreshMessage (message) {
  messages.unshift(message);

  if (messages.length > 1) {
    messages.pop().delete().catch(console.error);
  }
}

function updateMetadata () {
  axios.get(Config.Metadata.API)
    .then(({ data }) => {
      metadata.setSongInfo(data.streamstatus, data.songtitle, data.currentlisteners);
      
      if (metadata.isMetadataChanged()) {
        bot.emit('metadata', metadata.current);
      } 

      if (metadata.isMetadataChanged() || metadata.isListenersChanged()) {
        io.emit('metadata', metadata.current);
      }
    })
    .catch((error) => Sentry.captureException(error))
    .finally(() => metadataTimer = setTimeout(updateMetadata, Config.Metadata.Interval));
}