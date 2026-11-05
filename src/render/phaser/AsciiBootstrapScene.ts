import Phaser from 'phaser'

/** Temporary ASCII splash until the dungeon renderer lands. */
export class AsciiBootstrapScene extends Phaser.Scene {
  public constructor() {
    super('AsciiBootstrapScene')
  }

  public create(): void {
    const lines = [
      'Angband Remaster',
      '',
      'Phaser 3 + TypeScript bootstrap',
      'ASCII dungeon renderer comes next',
      '',
      '@ = you   # = wall   . = floor',
    ]

    this.add
      .text(16, 16, lines.join('\n'), {
        fontFamily: 'Consolas, "Courier New", monospace',
        fontSize: '18px',
        color: '#c8c2b4',
        lineSpacing: 6,
      })
      .setOrigin(0, 0)
  }
}
