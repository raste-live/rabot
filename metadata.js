export default class Metadata {

  constructor(options = {}) {
    this.messages = []
    this.delimeter = options.delimeter ?? ' - '
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
      let delimeterIndex = text.indexOf(this.delimeter);

      if (delimeterIndex >= 0) {
        this.title = text.substr(delimeterIndex + this.delimeter.length);
        this.artist = text.substr(0, delimeterIndex);
        this.query = encodeURIComponent(this.title.concat(this.delimeter, this.artist).substring(0, 128)).replace(/\(/g,'%28').replace(/\)/g,'%29');
      } else {
        this.title = text
        this.artist = ''
        this.query = encodeURIComponent(this.title.substring(0, 128)).replace(/\(/g,'%28').replace(/\)/g,'%29');
      }

      this.playedAt = new Date();
    }
  }

  getJSON () {
    return {
      is_stream_offline: this.isStreamOffline(),
      title: this.title,
      artist: this.artist,
      text: this.text,
      played_at: this.playedAt,
      query: this.query,
      listeners: this.listeners,
    };
  }
}