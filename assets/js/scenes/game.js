import { debugDraw } from '../utils/debug.js';
import { createCharacterAnims } from '../anims/player.js';

export default class Game extends Phaser.Scene {
  constructor() {
    super('game');
  }

  preload() {
    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = {
      up: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      down: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      left: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      right: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };
  }

  create() {
    createCharacterAnims(this.anims);

    this.cameras.main.setBounds(0, -932, 1024, 1532);
    this.physics.world.setBounds(0, -932, 1024, 1532);

    const map = this.make.tilemap({ key: 'map' });
    const tileset = map.addTilesetImage(
      'bless-you-tileset',
      'tiles',
      32,
      32,
      1,
      2
    );

    const background = map
      .createStaticLayer('background', tileset, 0, -932)
      .setCollisionByProperty({ collides: true });

    const ground = map
      .createStaticLayer('ground', tileset, 0, -932)
      .setCollisionByProperty({ collides: true });

    this.spike = map
      .createDynamicLayer('spike', tileset, 0, -932)
      .setCollisionByProperty({ collides: true });

    this.player = this.physics.add.sprite(150, 100, 'sickHero');

    // Create a physics group - useful for colliding the player against all the spikes
    this.spikeGroup = this.physics.add.staticGroup();

    // Loop over each Tile and replace spikes (tile index 77) with custom sprites
    this.spike.forEachTile((tile) => {
      // A sprite has its origin at the center, so place the sprite at the center of the tile
      if (tile.index === 11) {
        const x = tile.getCenterX();
        const y = tile.getCenterY();
        const spikeTile = this.spikeGroup.create(x, y, 'spikeTile');

        // The map has spike tiles that have been rotated in Tiled ("z" key), so parse out that angle
        // to the correct body placement
        spikeTile.rotation = tile.rotation;
        if (spikeTile.angle === 0) spikeTile.body.setSize(32, 10);

        // And lastly, remove the spike tile from the layer
        this.spike.removeTileAt(tile.x, tile.y);
      }
    });

    // Add sound effects
    this.music = this.sound.add('bgm');
    this.jump = this.sound.add('jump');
    this.sneeze = this.sound.add('sneeze');

    this.music.play({
      mute: false,
      volume: 0.1,
      rate: 1,
      detune: 0,
      seek: 0,
      loop: true,
      delay: 0,
    });

    this.hearts = this.add.group({
      key: 'heart',
      repeat: 2,
      setXY: {
        x: 50,
        y: 30,
        stepX: 40,
      },
    });

    this.hearts.children.entries.forEach((heart) => {
      heart.setScrollFactor(0);
    });

    this.sneezeBar = this.add.sprite(250, 30, 'sneezeBar');
    this.sneezeBar.setScrollFactor(0);
    this.sneezeBar.anims.play('sneezeBar', true);

    this.cameras.main.startFollow(this.player, true, 0.09, 0.09);
    this.cameras.main.setZoom(1);

    this.physics.add.collider(this.player, ground);
    this.physics.add.collider(this.player, background);

    this.time.addEvent({
      delay: 2000,
      callback: this.sneezeJump,
      callbackScope: this,
      loop: true,
    });

    this.physics.add.collider(
      this.player,
      this.spikeGroup,
      this.hitSpike,
      null,
      this
    );
  }

  update() {
    const onGround = this.player.body.blocked.down;

    if (this.wasd.left.isDown || this.cursors.left.isDown) {
      this.player.setVelocityX(-100);

      this.player.anims.play('left', true);
    } else if (this.wasd.right.isDown || this.cursors.right.isDown) {
      this.player.setVelocityX(100);

      this.player.anims.play('right', true);
    } else {
      this.player.setVelocityX(0);

      this.player.anims.play('turn');
    }

    if ((this.wasd.up.isDown || this.cursors.up.isDown) && onGround) {
      this.player.setVelocityY(-200);
      this.jump.play({
        mute: false,
        volume: 0.1,
        rate: 1,
        detune: 0,
        seek: 0,
        loop: false,
        delay: 0,
      });
    }

    if (onGround == false && this.player.body.velocity.x >= 0) {
      this.player.anims.play('jumpRight', 10);
    } else if (onGround == false && this.player.body.velocity.x < 0) {
      this.player.anims.play('jumpLeft', 10);
    }
  }

  sneezeJump() {
    const onGround = this.player.body.blocked.down;

    this.player.setVelocityY(-225);
    this.sneeze.play();
    // TODO Add sneezeJump anims
    this.player.anims.play('sneezeJump', 10);
  }

  hitSpike() {
    this.player.setBounce(0.7);
    this.player.setTint(0xff0000);

    this.hearts.destroy();

    // this.hearts.diableBody(true, true);
  }
}
