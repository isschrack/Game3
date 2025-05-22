class Platformer extends Phaser.Scene {
    constructor() {
        super("platformerScene");
    }

    init() {
        // variables and settings
        this.ACCELERATION = 500;
        this.DRAG = 700;    // DRAG < ACCELERATION = icy slide
        this.physics.world.gravity.y = 1500;
        this.JUMP_VELOCITY = -900;
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

        // Example: create sprites for each object
        this.objectsLayer.objects.forEach(obj => {
            switch(obj.name) {
                case "heart":
                    this.add.image(obj.x, obj.y, 'heart_sprite').setOrigin(0, 1);
                    break;
                case "key_1":
                case "tree_key":
                    this.add.image(obj.x, obj.y, 'key_sprite').setOrigin(0, 1);
                    break;
                case "door_1":
                    this.add.image(obj.x, obj.y, 'door_sprite').setOrigin(0, 1);
                    break;
                case "spike":
                    this.add.image(obj.x, obj.y, 'spike_sprite').setOrigin(0, 1);
                    break;
                case "pencil":
                    this.add.image(obj.x, obj.y, 'pencil_sprite').setOrigin(0, 1);
                    break;
                case "special_tree":
                    this.add.image(obj.x, obj.y, 'special_tree_sprite').setOrigin(0, 1);
                    break;
                case "chest":
                    this.add.image(obj.x, obj.y, 'chest_sprite').setOrigin(0, 1);
                    break;
                // Add more cases as needed for new object names
                default:
                    // Optionally add a placeholder or skip
                    // this.add.image(obj.x, obj.y, 'placeholder_sprite').setOrigin(0, 1);
                    break;
            }
        });

        this.secretLayer.setVisible(false);

        this.groundLayer.setCollisionByExclusion([-1]);
        this.secretLayer.setCollisionByExclusion([-1]);
        // No collision for ladder layer

        // set up player avatar using a container
        my.sprite.playerContainer = this.add.container(game.config.width/4, game.config.height/2);

        // Add body sprite
        my.sprite.playerBody = this.add.image(0, 0, 'character_roundYellow');
        my.sprite.playerBody.setOrigin(0.5, 1);

        // Add hand sprites (adjust offsets as needed)
        my.sprite.leftHand = this.add.image(-10, -30, 'hand_sprite');
        my.sprite.rightHand = this.add.image(10, -30, 'hand_sprite');

        // Add body and hands to the container
        my.sprite.playerContainer.add([my.sprite.playerBody, my.sprite.leftHand, my.sprite.rightHand]);

        // Enable physics on the container
        this.physics.world.enable(my.sprite.playerContainer);

        // Set the body size to match your player sprite (adjust as needed)
        my.sprite.playerContainer.body.setSize(
            my.sprite.playerBody.width,    // width of the body sprite
            my.sprite.playerBody.height    // height of the body sprite
        );

        // Optionally, offset the body so the feet align with the bottom of the container
        my.sprite.playerContainer.body.setOffset(
            -my.sprite.playerBody.width / 2,   // center the body horizontally
            -my.sprite.playerBody.height       // align the bottom
        );

        // Camera follows the container
        this.cameras.main.startFollow(my.sprite.playerContainer);

        // Optionally set camera bounds to map size
        this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);

        // Set physics world bounds to match the map size exactly
        this.physics.world.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);

        // Player cannot leave the world bounds
        my.sprite.playerContainer.body.setCollideWorldBounds(true);

        this.physics.add.collider(my.sprite.playerContainer, this.groundLayer);
        this.physics.add.collider(my.sprite.playerContainer, this.secretLayer);

        cursors = this.input.keyboard.createCursorKeys();

        this.input.keyboard.on('keydown-D', () => {
            this.physics.world.drawDebug = this.physics.world.drawDebug ? false : true
            this.physics.world.debugGraphic.clear()
            // Log the current coordinates of the player sprite
            console.log(`Player position: x=${my.sprite.playerContainer.x}, y=${my.sprite.playerContainer.y}`);
        }, this);
    }

    update() {
        // Left/right movement
        let isRunning = false;
        if(cursors.left.isDown) {
            my.sprite.playerContainer.body.setVelocityX(-500);
            my.sprite.playerBody.setFlipX(true);
            my.sprite.playerBody.setRotation(-0.2);
            isRunning = true;

            const swing = Math.sin(this.time.now * 0.02) * 8;
            my.sprite.leftHand.x = -8 + swing;
            my.sprite.leftHand.y = -20 - Math.abs(swing);
            my.sprite.rightHand.x = -8 - swing;
            my.sprite.rightHand.y = -25 - Math.abs(swing * 0.5);

            // Put left hand behind body
            my.sprite.playerContainer.moveTo(my.sprite.leftHand, 0); // index 0 = back
            my.sprite.playerContainer.moveTo(my.sprite.playerBody, 1); // index 1 = middle
            my.sprite.playerContainer.moveTo(my.sprite.rightHand, 2);   // index 2 = front

            my.sprite.rightHand.setAlpha(1);
            my.sprite.leftHand.setAlpha(1);
        } else if (cursors.right.isDown) {
            my.sprite.playerContainer.body.setVelocityX(500);
            my.sprite.playerBody.setFlipX(false);
            my.sprite.playerBody.setRotation(0.2);
            isRunning = true;

            const swing = Math.sin(this.time.now * 0.02) * 8;
            my.sprite.rightHand.x = 8 - swing;
            my.sprite.rightHand.y = -20 - Math.abs(swing);
            my.sprite.leftHand.x = 8 + swing;
            my.sprite.leftHand.y = -25 - Math.abs(swing * 0.5);

            // Put right hand behind body
            my.sprite.playerContainer.moveTo(my.sprite.rightHand, 0);   // index 0 = back
            my.sprite.playerContainer.moveTo(my.sprite.playerBody, 1); // index 1 = middle
            my.sprite.playerContainer.moveTo(my.sprite.leftHand, 2);  // index 2 = front

            my.sprite.leftHand.setAlpha(1);
            my.sprite.rightHand.setAlpha(1);
        } else {
            my.sprite.playerContainer.body.setVelocityX(0);
            my.sprite.playerBody.setRotation(0);
            // Reset hand positions (hands farther apart when idle)
            my.sprite.leftHand.x = -20;
            my.sprite.leftHand.y = -20;
            my.sprite.rightHand.x = 20;
            my.sprite.rightHand.y = -20;
            my.sprite.leftHand.setDepth(1);
            my.sprite.rightHand.setDepth(1);
            my.sprite.leftHand.setAlpha(1);
            my.sprite.rightHand.setAlpha(1);
        }

        // --- Ladder climbing logic ---
        let onLadder = false;
        if (this.ladderLayer) {
            // Check if player is overlapping a ladder tile
            const playerTile = this.ladderLayer.worldToTileXY(
                my.sprite.playerContainer.x,
                my.sprite.playerContainer.y - my.sprite.playerBody.height / 2 + 1
            );
            const tile = this.ladderLayer.getTileAt(playerTile.x, playerTile.y);
            if (tile && tile.index !== -1) {
                onLadder = true;
            }
        }

        if (onLadder) {
            my.sprite.playerContainer.body.allowGravity = false;
            my.sprite.playerContainer.body.setVelocityY(0);

            if (cursors.up.isDown) {
                my.sprite.playerContainer.body.setVelocityY(-150);
            } else if (cursors.down.isDown) {
                my.sprite.playerContainer.body.setVelocityY(150);
            }
        } else {
            my.sprite.playerContainer.body.allowGravity = true;
        }

        // Only allow jump if not on ladder
        if (!onLadder) {
            if(my.sprite.playerContainer.body.blocked.down && Phaser.Input.Keyboard.JustDown(cursors.up)) {
                my.sprite.playerContainer.body.setVelocityY(this.JUMP_VELOCITY);
            }
        }
    }
}