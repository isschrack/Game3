class GameOver extends Phaser.Scene {
    constructor() {
        super("gameOverScene");
    }

    init(data) {
        this.heartCount = data.heartCount || 0;
    }

    create() {
        // Stop walk sound effects if they are playing
        if (this.sound.get('walk')) {
            this.sound.get('walk').stop();
        }
        if (this.sound.get('walk_other')) {
            this.sound.get('walk_other').stop();
        }

        // Play heart sound effect in a loop until leaving the scene
        this.heartLoop = this.sound.add('heart', { loop: true, volume: 0.35 });
        this.heartLoop.play();

        // Centered "YOU DID IT!" text
        this.add.text(this.scale.width / 2, this.scale.height / 2 - 40, "YOU DID IT!", {
            fontSize: '48px',
            fill: '#fff',
            fontFamily: 'Arial',
            stroke: '#000',
            strokeThickness: 6
        }).setOrigin(0.5);

        // Display heart count
        this.add.text(this.scale.width / 2, this.scale.height / 2 + 20, `Hearts Collected: ${this.heartCount}`, {
            fontSize: '32px',
            fill: '#fff',
            fontFamily: 'Arial',
            stroke: '#000',
            strokeThickness: 4
        }).setOrigin(0.5);

        // Optional: Press space to restart
        this.add.text(this.scale.width / 2, this.scale.height / 2 + 80, "Press SPACE to Restart", {
            fontSize: '20px',
            fill: '#fff',
            fontFamily: 'Arial'
        }).setOrigin(0.5);

        this.input.keyboard.once('keydown-SPACE', () => {
            this.scene.start('platformerScene');
        });

        // Stop heart sound when scene is shutdown
        this.events.on('shutdown', this.shutdown, this);
    }

    shutdown() {
        if (this.heartLoop && this.heartLoop.isPlaying) {
            this.heartLoop.stop();
        }
    }
}
