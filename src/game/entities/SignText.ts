import Phaser from 'phaser';

export class SignText {
  readonly container: Phaser.GameObjects.Container;
  readonly label: Phaser.GameObjects.Text;
  readonly panel: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene, x: number, y: number, text: string, width = 116) {
    this.container = scene.add.container(x, y);
    this.panel = scene.add.graphics();
    this.label = scene.add
      .text(0, 0, text, {
        fontFamily: '"Arial Black", Impact, Inter, Arial, sans-serif',
        fontSize: '15px',
        color: '#fee2e2',
        fontStyle: '800',
        align: 'center',
        wordWrap: { width: width - 16 },
      })
      .setOrigin(0.5);

    const height = Math.max(34, this.label.height + 14);
    this.panel.fillStyle(0x000000, 0.32);
    this.panel.fillRoundedRect(-width / 2 + 3, -height / 2 + 4, width, height, 4);
    this.panel.fillStyle(0x1f070b, 0.98);
    this.panel.fillRoundedRect(-width / 2, -height / 2, width, height, 4);
    this.panel.lineStyle(3, 0x050104, 0.95);
    this.panel.strokeRoundedRect(-width / 2, -height / 2, width, height, 4);
    this.panel.lineStyle(1, 0xff3b3b, 0.72);
    this.panel.strokeRoundedRect(-width / 2 + 4, -height / 2 + 4, width - 8, height - 8, 2);

    this.container.add([this.panel, this.label]);
    this.container.setDepth(20);
  }

  destroy(): void {
    this.container.destroy(true);
  }
}
