import Phaser from 'phaser'
import BootScene from './scenes/BootScene'
import PlayScene from './scenes/PlayScene'
import TavernScene from './scenes/TavernScene'
import PauseScene from './scenes/PauseScene'
import GameOverScene from './scenes/GameOverScene'
import MainManuScene from './scenes/MainManuScene'

function launch() {
    new Phaser.Game({
        type: Phaser.AUTO,
        width: 800,
        height: 600,
        parent: 'game-container',
        physics: {
            default: 'arcade',
            arcade: {
                gravity: {y: 300},
                debug: false
            }
        },
        pixelArt: true,
        scene: [BootScene, PlayScene, TavernScene, PauseScene, GameOverScene, MainManuScene]
    })
}
export default launch
export {launch}
