export default class Metadata {

  constructor() {
    this.messages = []
  }

  isMetadataChanged () {
    return this.previousId != this.id;
  }

  isListenersChanged () {
    return this.previousListeners != this.listeners;
  }

  isStreamOffline () {
    return this.id == 0;
  }

  setId (id) {
    this.previousId = this.id;
    this.id = id;
  }

  setListeners (listeners) {
    this.previousListeners = this.listeners;
    this.listeners = listeners;
  }

  setSongInfo (title, artist, playedAt) {
    this.title = title;
    this.artist = artist;
    this.playedAt = playedAt == 0 ? new Date() : new Date(playedAt * 1000);
    this.text = this.title.concat(' - ', this.artist);
    this.query = encodeURIComponent(this.text.substring(0, 128)).replace(/\(/g,'%28').replace(/\)/g,'%29');
  }

  getJSON () {
    return {
      is_stream_offline: this.isStreamOffline(),
      title: this.title,
      artist: this.artist,
      text: this.text,
      played_at: this.playedAt,
      query: this.query,
      listeners: this.listeners
    };
  }
}