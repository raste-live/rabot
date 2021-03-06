import crypto from 'crypto';

export default class Metadata {

  constructor(options = {}) {
    this.messages = [];
    this.history = [];
    this.historySize = options.historySize ?? 30;
    this.delimeter = options.delimeter ?? ' - ';
    this.current = {};
  }

  isMetadataChanged () {
    return this.previousText != this.text;
  }

  isListenersChanged () {
    return this.previousListeners != this.listeners;
  }

  isStreamOffline () {
    return this.status == 0;
  }

  setSongInfo (status, text, listeners) {
    this.status = status;

    this.previousText = this.text;
    this.text = text;

    this.previousListeners = this.listeners;
    this.listeners = listeners;

    if (this.isMetadataChanged()) {
      this.updateHistory();
      this.parseText(text);
    }

    this.updateCurrent();
  }

  updateHistory () {
    if (!this.id) return;

    this.history.unshift({
      id: this.id,
      title: this.title,
      artist: this.artist,
      played_at: this.playedAt,
      query: this.query,
    });

    if (this.history.length > this.historySize) {
      this.history.pop();
    }
  }

  parseText (text) {
    let splitedText = text.split(this.delimeter);

    if (splitedText.length > 1) {
      this.artist = splitedText.pop();
      this.title = splitedText.join(this.delimeter);
    } else {
      this.artist = '';
      this.title = text;
    }

    this.playedAt = new Date();

    this.query = encodeURIComponent(text.substring(0, 128)).replace(/\(/g,'%28').replace(/\)/g,'%29');

    this.id = crypto.createHash('md5').update(text).digest('hex');
  }

  updateCurrent () {
    this.current = {
      is_stream_offline: this.isStreamOffline(),
      is_metadata_changed: this.isMetadataChanged(),
      id: this.id,
      title: this.title,
      artist: this.artist,
      text: this.text,
      played_at: this.playedAt,
      query: this.query,
      listeners: this.listeners,
    };
  }
}