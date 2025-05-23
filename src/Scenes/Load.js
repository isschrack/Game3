class Load extends Phaser.Scene {
    constructor() {
        super("loadScene");
    }

    preload() {
        this.load.setPath("./assets/");

        // Load characters spritesheet
        this.load.atlas("platformer_characters", "tilemap-characters-packed.png", "tilemap-characters-packed.json");

        // Load tilemap information
        this.load.image("tilemap_tiles", "kenney_scribble-platformer/Spritesheet/spritesheet_default.png"); // Correct relative path
        this.load.tilemapTiledJSON("game3_map", "game3_level.json"); // Correct map file
        
        // Load object sprites
        this.load.image('heart_sprite', 'kenney_scribble-platformer/PNG/Default/tile_heart.png');
        this.load.image('key_sprite', 'kenney_scribble-platformer/PNG/Default/tile_key.png');
        this.load.image('door_sprite', 'kenney_scribble-platformer/PNG/Default/tile_blockDoor.png');
        this.load.image('spike_sprite', 'kenney_scribble-platformer/PNG/Default/tile_spikes.png');
        this.load.image('pencil_sprite', 'kenney_scribble-platformer/PNG/Default/item_pencil.png');
        this.load.image('chest_sprite', 'kenney_scribble-platformer/PNG/Default/tile_chest.png');

        // Particle and Background effects
        this.load.image('smoke', '/PNG (Transparent)/smoke_03.png');
        this.load.image('cloud_sprite1', '/kenney_scribble-platformer/PNG/Default/background_cloudB.png');
        this.load.image('cloud_sprite2', '/kenney_scribble-platformer/PNG/Default/background_cloudA.png');
        this.load.image('key_particle', '/Particles white/particleWhite_4.png');

        // Load player body and hand images
        this.load.image('character_roundYellow', 'kenney_scribble-platformer/PNG/Default/character_roundYellow.png');
        this.load.image('hand_sprite', 'kenney_scribble-platformer/PNG/Default/character_handYellow.png');

        // Sound effects
        this.load.setPath("./assets/Audio/");
        this.load.audio('walk', 'footstep_wood_003.ogg');
        this.load.audio('walk_other', 'footstep_wood_004.ogg');
        this.load.audio('door', 'door-1-open.wav');
        this.load.audio('heart', 'yippee.mp3');
        this.load.audio('key', 'key_jangle.mp3'); 
        this.load.audio('chest', 'chest-open.mp3');
        this.load.audio('spike', 'oof.mp3');
        this.load.audio('water', 'water-splash.mp3');
    }

    create() {
         this.scene.start("platformerScene");
    }

    // Never get here since a new scene is started in create()
    update() {
    }
}