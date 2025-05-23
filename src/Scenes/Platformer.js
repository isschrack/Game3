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

        this.heartCount = 0; // Heart counter
        this.hasKey = false; // Track if player has a key
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
        // Add ladder layer
        this.ladderLayer = this.map.createLayer("ladder", this.tileset, 0, 0);

        // Create groups for hearts, keys, and doors/chests
        this.heartsGroup = this.physics.add.group();
        this.keysGroup = this.physics.add.group();
        this.doorsGroup = this.physics.add.staticGroup();
        this.chestsGroup = this.physics.add.staticGroup();

        // Import the object layer "Objects"
        this.objectsLayer = this.map.getObjectLayer("Objects");

        // Example: create sprites for each object
        this.objectsLayer.objects.forEach(obj => {
            switch(obj.name) {
                case "heart":
                    // Add heart to group for collection
                    const heart = this.heartsGroup.create(obj.x, obj.y, 'heart_sprite').setOrigin(0, 1);
                    heart.body.setAllowGravity(false);
                    break;
                case "key_1":
                    // Add key_1 to group for collection
                    const key1 = this.keysGroup.create(obj.x, obj.y, 'key_sprite').setOrigin(0, 1);
                    key1.body.setAllowGravity(false);
                    key1.keyType = "key_1";
                    break;
                case "tree_key":
                    // Add tree_key to group for collection, set depth low so it's behind tiles
                    const treeKey = this.keysGroup.create(obj.x, obj.y, 'key_sprite').setOrigin(0, 1);
                    treeKey.body.setAllowGravity(false);
                    treeKey.keyType = "tree_key";
                    treeKey.setDepth(-1); // Lower depth so it's behind tiles
                    break;
                case "door_1":
                    // Add door to doors group for collision
                    this.doorsGroup.create(obj.x, obj.y, 'door_sprite').setOrigin(0, 1);
                    break;
                case "chest":
                    // Add chest to chests group for collision
                    this.chestsGroup.create(obj.x, obj.y, 'chest_sprite').setOrigin(0, 1);
                    break;
                case "spike":
                    this.add.image(obj.x, obj.y, 'spike_sprite').setOrigin(0, 1);
                    break;
                case "pencil":
                    this.add.image(obj.x, obj.y, 'pencil_sprite').setOrigin(0, 1);
                    break;
                case "special_tree":
                    // Add special tree but make it invisible
                    this.add.image(obj.x, obj.y, 'special_tree_sprite').setOrigin(0, 1).setVisible(false);
                    break;
                // Add more cases as needed for new object names
                default:
                    // Optionally add a placeholder or skip
                    // this.add.image(obj.x, obj.y, 'placeholder_sprite').setOrigin(0, 1);
                    break;
            }
        });

        this.groundLayer.setCollisionByExclusion([-1]);
        
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

        this.smokeGroup = this.add.group();

        // Camera follows the container
        this.cameras.main.startFollow(my.sprite.playerContainer);

        // Optionally set camera bounds to map size
        this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);

        // Set physics world bounds to match the map size exactly
        this.physics.world.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);

        // Player cannot leave the world bounds
        my.sprite.playerContainer.body.setCollideWorldBounds(true);

        this.physics.add.collider(my.sprite.playerContainer, this.groundLayer);

        // Add overlap for collecting hearts
        this.physics.add.overlap(my.sprite.playerContainer, this.heartsGroup, this.collectHeart, null, this);
        // Add overlap for collecting keys
        this.physics.add.overlap(my.sprite.playerContainer, this.keysGroup, this.collectKey, null, this);
        // Add collider for doors
        this.physics.add.collider(my.sprite.playerContainer, this.doorsGroup, this.tryOpenDoor, null, this);
        // Add collider for chests
        this.physics.add.collider(my.sprite.playerContainer, this.chestsGroup, this.tryOpenChest, null, this);

        // Add overlap for water death
        this.physics.add.overlap(my.sprite.playerContainer, this.waterLayer, this.playerHitWater, null, this);

        // Add overlap for spikes death (spike objects)
        this.spikesGroup = this.physics.add.staticGroup();

        this.objectsLayer.objects.forEach(obj => {
            switch(obj.name) {
                case "spike":
                    this.spikesGroup.create(obj.x, obj.y, 'spike_sprite').setOrigin(0, 1);
                    break;
            }
        });
        this.physics.add.overlap(my.sprite.playerContainer, this.spikesGroup, this.playerHitHazard, null, this);

        // Heart icon and counter (replace text with image)
        this.heartIcon = this.add.image(16, 20, 'heart_sprite')
            .setOrigin(0, 0.5)
            .setScrollFactor(0)
            .setScale(0.7);

        this.heartText = this.add.text(48, 16, '0', {
            fontSize: '24px',
            fill: '#fff',
            fontFamily: 'Arial'
        }).setScrollFactor(0);

        // Key icon UI (hidden by default, anchored to top right of screen)
        this.keyIcon = this.add.image(this.scale.width - 16, 16, 'key_sprite')
            .setOrigin(1, 0)
            .setScrollFactor(0)
            .setVisible(false)
            .setScale(0.8);

        cursors = this.input.keyboard.createCursorKeys();

        this.input.keyboard.on('keydown-D', () => {
            this.physics.world.drawDebug = this.physics.world.drawDebug ? false : true
            this.physics.world.debugGraphic.clear()
            // Log the current coordinates of the player sprite
            console.log(`Player position: x=${my.sprite.playerContainer.x}, y=${my.sprite.playerContainer.y}`);
        }, this);
    }

    collectHeart(player, heart) {
        heart.disableBody(true, true);
        this.heartCount += 1;
        this.heartText.setText(this.heartCount);
    }

    collectKey(player, key) {
        if (!this.hasKey) {
            key.disableBody(true, true);
            this.hasKey = true;
            this.keyIcon.setVisible(true);
            this.keyType = key.keyType || "key_1";
        }
    }

    tryOpenDoor(player, door) {
        if (this.hasKey && this.keyType === "key_1") {
            door.disableBody(true, true); // Remove door so player can pass
            this.hasKey = false;
            this.keyIcon.setVisible(false);
            this.keyType = null;
        }
        // If player doesn't have key, door remains solid
    }

    tryOpenChest(player, chest) {
        if (this.hasKey && this.keyType === "tree_key") {
            chest.disableBody(true, true); // Remove chest so player can pass/open
            this.hasKey = false;
            this.keyIcon.setVisible(false);
            this.keyType = null;
            // Increase heart counter by one when chest is opened
            this.heartCount += 1;
            this.heartText.setText(this.heartCount);
        }
        // If player doesn't have tree_key, chest remains solid
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

        if (
            isRunning &&
            my.sprite.playerContainer.body.blocked.down && // Only emit when on ground
            this.time.now % 100 < 16
        ) {
            const smoke = this.smokeGroup.create(
                my.sprite.playerContainer.x,
                my.sprite.playerContainer.y + 10, // slightly below feet
                'smoke'
            );
            smoke.setAlpha(0.7);
            smoke.setScale(0.18 + Math.random() * 0.07); // Much smaller scale
            this.tweens.add({
                targets: smoke,
                alpha: 0,
                y: smoke.y + 10, // Less vertical movement for small puffs
                scale: 0.3,
                duration: 350,
                onComplete: () => smoke.destroy()
            });
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

        // Keep key icon in the top right corner of the screen at all times
        if (this.keyIcon) {
            this.keyIcon.x = this.scale.width - 16;
            this.keyIcon.y = 16;
        }
    }

    playerHitWater(playerContainer) {
        // Reset player to last checkpoint
        if (this.checkpoint && this.checkpoint.x !== null && this.checkpoint.y !== null) {
            playerContainer.x = this.checkpoint.x;
            playerContainer.y = this.checkpoint.y;
            playerContainer.body.setVelocity(0, 0);
        }
    }

    playerHitHazard(playerContainer) {
        // Optional: Play a death animation or sound here

        // Hide the player briefly to simulate "death"
        playerContainer.visible = false;
        playerContainer.body.enable = false;

        // After a short delay, reset position and show player again
        this.time.delayedCall(500, () => {
            // Reset to fixed coordinates (25, 17)
            playerContainer.x = 25;
            playerContainer.y = 17;
            playerContainer.body.setVelocity(0, 0);

            playerContainer.visible = true;
            playerContainer.body.enable = true;
        }, [], this);
    }
}