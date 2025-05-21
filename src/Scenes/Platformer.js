class Platformer extends Phaser.Scene {
    constructor() {
        super("platformerScene");
    }

    init() {
        // variables and settings
        this.ACCELERATION = 700;    // Decreased for smoother acceleration
        this.DRAG = 1800;           // Increased for quicker stops
        this.physics.world.gravity.y = 1700; // Slightly increased gravity for less floaty jumps
        this.JUMP_VELOCITY = -950;  // Less tight: higher jump
    }

    create() {
        // Load the tilemap exported from Tiled (64x64 tiles)
        this.map = this.make.tilemap({ key: "game3_map", tileWidth: 64, tileHeight: 64 });

        // Set the background color from the map's backgroundcolor property
        if(this.map.backgroundColor) {
            this.cameras.main.setBackgroundColor(this.map.backgroundColor);
        }

        // Add the tileset (name must match the name in Tiled)
        this.tileset = this.map.addTilesetImage("tilemap_packed", "tilemap_tiles");

        // Create layers (no scaling needed)
        this.backgroundLayer = this.map.createLayer("background", this.tileset, 0, 0);
        this.groundLayer = this.map.createLayer("ground+platforms", this.tileset, 0, 0);
        this.waterLayer = this.map.createLayer("water", this.tileset, 0, 0);
        this.secretLayer = this.map.createLayer("secret", this.tileset, 0, 0);
        // Add ladder layer
        this.ladderLayer = this.map.createLayer("ladder", this.tileset, 0, 0);

        // Import the object layer "Objects"
        this.objectsLayer = this.map.getObjectLayer("Objects");

        this.secretLayer.setVisible(false);

        this.groundLayer.setCollisionByExclusion([-1]);
        this.secretLayer.setCollisionByExclusion([-1]);
        // No collision for ladder layer

        // set up player avatar
        my.sprite.player = this.physics.add.sprite(game.config.width/4, game.config.height/2, "platformer_characters", "tile_0000.png");
        my.sprite.player.setCollideWorldBounds(true);
        my.sprite.player.setOrigin(0.5, 1);

        // Adjust the physics body based on the trimmed sprite data
        const trimmedWidth = 22;  // From frame.w
        const trimmedHeight = 24; // From frame.h
        const offsetX = 1;       // From spriteSourceSize.x
        const offsetY = 0;       // From spriteSourceSize.y

        my.sprite.player.body.setSize(trimmedWidth, trimmedHeight);
        my.sprite.player.body.setOffset(offsetX, offsetY);

        // Camera follows the player
        this.cameras.main.startFollow(my.sprite.player);

        // Optionally set camera bounds to map size
        this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);

        // Set physics world bounds to match the map size exactly
        this.physics.world.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);

        // Player cannot leave the world bounds
        my.sprite.player.body.setCollideWorldBounds(true);

        this.physics.add.collider(my.sprite.player, this.groundLayer);
        this.physics.add.collider(my.sprite.player, this.secretLayer);

        cursors = this.input.keyboard.createCursorKeys();

        this.input.keyboard.on('keydown-D', () => {
            this.physics.world.drawDebug = this.physics.world.drawDebug ? false : true
            this.physics.world.debugGraphic.clear()
            // Log the current coordinates of the player sprite
            console.log(`Player position: x=${my.sprite.player.x}, y=${my.sprite.player.y}`);
        }, this);
    }

    update() {
        // Left/right movement
        if(cursors.left.isDown) {
            my.sprite.player.setAccelerationX(-this.ACCELERATION);
            my.sprite.player.setDragX(0);
            my.sprite.player.resetFlip();
            my.sprite.player.anims.play('walk', true);
        } else if(cursors.right.isDown) {
            my.sprite.player.setAccelerationX(this.ACCELERATION);
            my.sprite.player.setDragX(0);
            my.sprite.player.setFlip(true, false);
            my.sprite.player.anims.play('walk', true);
        } else {
            my.sprite.player.setAccelerationX(0);
            my.sprite.player.setDragX(this.DRAG);
            my.sprite.player.anims.play('idle');
        }

        // --- Ladder climbing logic ---
        let onLadder = false;
        if (this.ladderLayer) {
            // Check if player is overlapping a ladder tile
            const playerTile = this.ladderLayer.worldToTileXY(my.sprite.player.x, my.sprite.player.y - my.sprite.player.height/2 + 1);
            const tile = this.ladderLayer.getTileAt(playerTile.x, playerTile.y);
            if (tile && tile.index !== -1) {
                onLadder = true;
            }
        }

        if (onLadder) {
            // Disable gravity while on ladder
            my.sprite.player.body.allowGravity = false;
            my.sprite.player.setVelocityY(0);

            if (cursors.up.isDown) {
                my.sprite.player.setVelocityY(-150);
                my.sprite.player.anims.play('idle', true); // Or a climb anim if you have one
            } else if (cursors.down.isDown) {
                my.sprite.player.setVelocityY(150);
                my.sprite.player.anims.play('idle', true); // Or a climb anim if you have one
            }
        } else {
            my.sprite.player.body.allowGravity = true;
        }

        // Only allow jump if not on ladder
        if (!onLadder) {
            // player jump
            // note that we need body.blocked rather than body.touching b/c the former applies to tilemap tiles and the latter to the "ground"
            if(!my.sprite.player.body.blocked.down) {
                my.sprite.player.anims.play('jump');
            }
            if(my.sprite.player.body.blocked.down && Phaser.Input.Keyboard.JustDown(cursors.up)) {
                my.sprite.player.setVelocityY(this.JUMP_VELOCITY);
            }
        }
    }
}