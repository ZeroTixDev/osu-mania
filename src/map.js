const { loadImage, loadSound } = require('./loadAsset');

module.exports = class Map { // I can use the name Map because Im not using Maps anywhere in my code xD
    constructor(map) {
        this._map = map;
        this._name = this._map.name;
        this._loaded = { background: false, data: true, song: false };

        this._data = this._map.data;
        this._offset = this._map?.offset;

        this._song = loadSound(String(this._map.song));
        this._song.addEventListener('canplaythrough', () => {
            this._loaded.song = true;
        });

        this._background = loadImage(String(this._map.background)); 
        this._background.addEventListener('load', () => {
            this._loaded.background = true;
        });
    }
    // async _readJson(path) {
    //     return new Promise((resolve, reject) => {
    //         readFile(require.resolve(path), (err, data) => {
    //             if (err) return reject(err);
    //             return resolve(JSON.parse(data));
    //         })
    //     });
    // }
    get background() {
        return this._background;
    }
    get offset() {
        return this._offset;
    }
    get song() {
        return this._song;
    }
    get name() {
        return this._name;
    }
    get data() {
        return this._data;
    }
    get loaded() {
        return this._loaded.background 
           && this._loaded.data 
           && this._loaded.song
    }
}
/* sample format
    {
        background: loadImage('insight.png'),
        data: require('./maps/insight.json'),
        song: loadSound('insight.mp3'),
        name: 'Insight',
    }
*/