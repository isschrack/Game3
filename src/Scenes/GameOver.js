class GameOver extends Phaser.Scene {
    constructor() {
        super("gameOverScene");
    }

    init(data) {
        this.heartCount = data.heartCount || 0;
    }

    create() {
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
    }
}
