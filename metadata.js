import crypto from 'crypto';

export default class Metadata {

  constructor(options = {}) {
    this.messages = [];
    this.delimeter = options.delimeter ?? ' - ';
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

  setStatus (status) {
    this.status = status;
  }

  setListeners (listeners) {
    this.previousListeners = this.listeners;
    this.listeners = listeners;
  }

  setSongInfo (text) {
    this.previousText = this.text;
    this.text = text;

    if (this.isMetadataChanged()) {
      let splitedText = text.split(this.delimeter);

      if (splitedText.length > 1) {
        this.artist = splitedText.pop();
        this.title = splitedText.join(this.delimeter);
      } else {
        this.artist = '';
        this.title = text;
      }

      this.playedAt = new Date();

      this.query = encodeURIComponent(this.text.substring(0, 128)).replace(/\(/g,'%28').replace(/\)/g,'%29');

      this.id = crypto.createHash('md5').update(text).digest('hex');
    }
  }

  getJSON () {
    return {
      is_stream_offline: this.isStreamOffline(),
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