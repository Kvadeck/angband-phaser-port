import Phaser from 'phaser'
import { AsciiBootstrapScene } from '@/render/phaser/AsciiBootstrapScene'

export const createDungeonGame = (parent: HTMLElement): Phaser.Game => {
  return new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    backgroundColor: '#000000',
    scale: {
      mode: Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: parent.clientWidth || 800,
      height: parent.clientHeight || 600,
    },
    scene: [AsciiBootstrapScene],
    banner: false,
  })
}
