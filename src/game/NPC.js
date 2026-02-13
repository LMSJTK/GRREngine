import { Entity } from '../ecs/Entity.js';
import { Sprite } from '../sprites/Sprite.js';

/**
 * Basic NPC entity that stands in place and can display dialog.
 * Can be extended with patrol behavior, etc.
 */
export class NPC extends Entity {
  constructor(x, y, spriteSheet, { name = 'NPC', dialog = ['...'] } = {}) {
    super(x, y, 16, 16);
    this.type = 'npc';
    this.npcName = name;
    this.dialog = dialog;
    this.dialogIndex = 0;
    this.direction = 'down';
    this.interactRange = 24;

    // Set up sprite
    this.sprite = new Sprite(spriteSheet, 16, 16);
    this.sprite.defineAnimation('idle_down', 0, 1, 1);
    this.sprite.defineAnimation('idle_left', 1, 1, 1);
    this.sprite.defineAnimation('idle_right', 2, 1, 1);
    this.sprite.defineAnimation('idle_up', 3, 1, 1);
    this.sprite.play('idle_down');
    this.addComponent('sprite', this.sprite);
  }

  /** Face toward a target entity */
  faceToward(target) {
    const dx = target.x - this.x;
    const dy = target.y - this.y;
    if (Math.abs(dx) > Math.abs(dy)) {
      this.direction = dx > 0 ? 'right' : 'left';
    } else {
      this.direction = dy > 0 ? 'down' : 'up';
    }
    this.sprite.play(`idle_${this.direction}`);
  }

  /** Get current dialog line and advance */
  talk() {
    const line = this.dialog[this.dialogIndex];
    this.dialogIndex = (this.dialogIndex + 1) % this.dialog.length;
    return line;
  }

  /** Check if a player is within interaction range */
  isPlayerNear(player) {
    const cx = this.x + this.width / 2;
    const cy = this.y + this.height / 2;
    const px = player.x + player.width / 2;
    const py = player.y + player.height / 2;
    const dist = Math.sqrt((cx - px) ** 2 + (cy - py) ** 2);
    return dist <= this.interactRange;
  }

  render(renderer) {
    this.sprite.render(renderer);
  }

  serialize() {
    return {
      ...super.serialize(),
      npcName: this.npcName,
      dialog: this.dialog,
      direction: this.direction,
    };
  }
}
