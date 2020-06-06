const canvas = <HTMLCanvasElement> document.getElementById('canvas');
const ctx = <CanvasRenderingContext2D> canvas.getContext('2d');

const MIN_BLOCK_LENGTH = 25;
const LIGHT_GREEN = `rgb(145, 242, 138)`;
const LIGHT_RED = `rgb(242, 138, 145)`;

interface Point {
  x: number,
  y: number
}

interface Size {
  width: number,
  height: number
}

interface DeployPayload {
  type: string,
  info: any
}

interface RepositionPayload {
  id: number,
  pos: Point
}

class SoundBlock {
  id: number; // to be referenced when editing or removing this block after deploying
  pos: Point;
  size: Size;
  color: string;

  constructor(id: number, pos: Point, size: Size, color: string) {
    this.id = id;
    this.pos = pos;
    this.size = size;
    this.color = color;
  }

  draw = (): void => {
    ctx.beginPath();
    ctx.globalAlpha = 0.7;
    ctx.fillStyle = this.color;
    ctx.fillRect(this.pos.x, this.pos.y, this.size.width, this.size.height);
  }

  equals = (o: SoundBlock): boolean => {
    return (
      this.pos.x === o.pos.x
      && this.pos.y === o.pos.y
      && this.size.width === o.size.width
      && this.size.height === o.size.height
      && this.color === o.color
    )
  }
}

class SoundBlockHandler {
  socket: SocketIOClient.Socket;

  blocks: SoundBlock[];
  curID: number;

  mousedown: boolean;
  dragMode: boolean;

  normPoint: Point;
  normSize: Size;
  holdPoint: Point;
  holdColor: string;

  dragBlock: SoundBlock;
  dragPoint: Point;
  dragColor: string;
  originalPoint: Point;
  dragSize: Size;

  constructor() {
    this.socket = window.io();
    this.socket.on('deploy', this.onDeploy);
    this.socket.on('reposition', this.onReposition);

    this.blocks = [];
    this.curID = 0;

    this.mousedown = false;
    this.dragMode = false;

    this.normPoint = null;
    this.normSize = {width: 0, height: 0};
    this.holdPoint = null;
    this.holdColor = null;

    this.dragBlock = null;
    this.dragPoint = null;
    this.dragColor = null;
    this.originalPoint = null;
    this.dragSize = {width: 0, height: 0};
  }

  onMouseDown = (e: MouseEvent): void => {
    this.mousedown = true;
    const cursor = this.getCursorPosition(canvas, e);
    const mousedOverBlock = this.getMousedOverBlock(cursor);

    // in the situation where a user redrags a block, moves it to an illegal space, then mouseups,
    // the block will not release but the user can still move the block around. the block will then
    // try deploy on the next mousedown, instead of a mouseup.
    if (this.dragBlock !== null) {
      if (this.dragBlock.color !== LIGHT_RED) {
        const payload: RepositionPayload = {
          id: this.dragBlock.id,
          pos: this.dragBlock.pos
        }
        this.socket.emit('reposition', payload)

        this.dragBlock = null;
        this.dragPoint = null;
        this.originalPoint = null;
        this.dragSize = {width: 0, height: 0};
      }
      return;
    }

    if (!this.dragMode) {
      // a block cannot be drawn on top of another block
      if (mousedOverBlock === null) {
        this.holdColor = LIGHT_RED;
        this.holdPoint = cursor;
        this.normPoint = cursor;
      }
    }
    else if (mousedOverBlock !== null) {
      // start dragging the currently moused over block
      this.dragBlock = mousedOverBlock;
      this.dragPoint = cursor;
      this.originalPoint = this.dragBlock.pos;
      this.dragColor = this.dragBlock.color;
    }
  }

  onMouseMove = (e: MouseEvent): void => {
    const cursor = this.getCursorPosition(canvas, e);
    if (!this.mousedown && this.dragBlock === null) return;

    // check if the hold block is able to be released
    if (this.dragBlock === null && this.holdPoint !== null) {
      [this.normPoint, this.normSize] = this.normalizeRectangle(this.holdPoint, cursor)

      // a block must have a minimum size
      this.holdColor = ((this.normSize.width <= MIN_BLOCK_LENGTH)
        || (this.normSize.height <= MIN_BLOCK_LENGTH))
        ? LIGHT_RED : LIGHT_GREEN;

      // a block cannot overlap another block
      for (const block of this.blocks) {
        if (this.rectanglesOverlap(this.normPoint, this.normSize, block.pos, block.size)) {
          this.holdColor = LIGHT_RED;
          break;
        }
      }
    }
    else if (this.dragBlock !== null) {
      // reposition the drag block to go with the mouse
      this.dragSize = {
        width: cursor.x - this.dragPoint.x,
        height: cursor.y - this.dragPoint.y
      };
      this.dragBlock.pos = {
        x: this.originalPoint.x + this.dragSize.width,
        y: this.originalPoint.y + this.dragSize.height
      };

      // check if the drag block is able to be released
      let overlap = false;
      for (const block of this.blocks) {
        if (this.dragBlock.equals(block)) continue;
        if (this.rectanglesOverlap(this.dragBlock.pos, this.dragBlock.size, block.pos, block.size)) {
          overlap = true;
          break;
        }
      }
      this.dragBlock.color = overlap ? LIGHT_RED : this.dragColor;
    }
  }

  onMouseUp = (): void => {
    if (!this.mousedown) return;

    if (this.dragBlock === null && this.holdPoint !== null) {
      if (this.holdColor === LIGHT_GREEN) {
        this.holdColor = `rgb(
          ${Math.floor(Math.random() * 255)},
          ${Math.floor(Math.random() * 255)},
          ${Math.floor(Math.random() * 255)}
        )`;

        this.blocks.push(new SoundBlock(this.curID, this.normPoint, this.normSize, this.holdColor));

        // tell all other clients to add the block along with its id
        const payload: DeployPayload = {
          type: 'soundBlock',
          info: {
            id: this.curID,
            pos: this.normPoint,
            size: this.normSize,
            color: this.holdColor
          }
        }
        this.socket.emit('deploy', payload)
        this.curID++;
      }

      this.holdPoint = null;
      this.normSize = {width: 0, height: 0};
      this.holdColor = null;
    }
    // release the drag block if allowed to
    else if (this.dragBlock !== null && this.dragBlock.color !== LIGHT_RED) {
      // tell all other clients to reposition the block
      const payload: RepositionPayload = {
        id: this.dragBlock.id,
        pos: this.dragBlock.pos
      }
      this.socket.emit('reposition', payload)

      this.dragBlock = null;
      this.dragPoint = null;
      this.originalPoint = null;
      this.dragSize = {width: 0, height: 0};
    }

    this.mousedown = false;
  }

  onKeyDown = (e: KeyboardEvent): void => {
    if (e.keyCode === 32) this.dragMode = true;
  }

  onKeyUp = (e: KeyboardEvent): void => {
    if (e.keyCode === 32) this.dragMode = false;
  }

  /* Adds a block that another user has deployed. */
  onDeploy = (data: DeployPayload): void => {
    let id = data.info.id;
    const { pos, size, color } = data.info;
    this.blocks.push(new SoundBlock(id, pos, size, color));
    this.curID = ++id;
  }

  /* Repositions a block that another user has moved. */
  onReposition = (data: RepositionPayload): void => {
    const { id, pos } = data;
    console.log(`id: ${id}`);
    const block = this.getBlockByID(id);
    if (block !== null) {
      block.pos = pos;
    } else {
      console.log('could not find block by id!');
    }
  }

  /* Draw the hold shape of the block before it's deployed. */
  drawHold = (): void => {
    ctx.beginPath();
    ctx.fillStyle = this.holdColor;
    ctx.globalAlpha = 0.7;
    ctx.fillRect(
      this.normPoint.x, this.normPoint.y, this.normSize.width, this.normSize.height
    );
  }

  /* Draw a frame containing all blocks and the hold block. */
  draw = (): void => {
    ctx.globalAlpha = 1.0;
    for (const block of this.blocks) {
      block.draw();
    }
    if (this.holdPoint !== null) this.drawHold();
  }

  /********************/
  /* HELPER FUNCTIONS */
  /********************/

  /* Gets the cursor position on the given canvas. */
  getCursorPosition = (canvas: HTMLCanvasElement, e: MouseEvent): Point => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    return {x: x, y: y};
  }

  /* Returns the earliest deployed SoundBlock that the mouse is currently over, otherwise returns
   * null. */
  getMousedOverBlock = (cursor: Point): SoundBlock => {
    for (const block of this.blocks) {
      const dx = cursor.x - block.pos.x;
      const dy = cursor.y - block.pos.y;
      if ((0 < dx && dx < block.size.width) && (0 < dy && dy < block.size.height)) {
        return block;
      }
    }
    return null;
  }

  /* Finds a block by its ID. If not found, returns null. */
  getBlockByID = (id: number): SoundBlock => {
    for (const block of this.blocks) {
      if (block.id === id) return block;
    }
    return null;
  }

  /* Given a start and end points that uniquely determine a rectangle, returns the top-left corner
   * and size of the rectangle. */
  normalizeRectangle = (start: Point, end: Point): [Point, Size] => {
    const dx = end.x - start.x;
    const dy = end.y - start.y;

    if      (dx >= 0 && dy >= 0) return [start, {width: dx, height: dy}];
    else if (dx >= 0 && dy < 0)  return [{x: start.x, y: end.y}, {width: dx, height: -dy}];
    else if (dx < 0  && dy >= 0) return [{x: end.x, y: start.y}, {width: -dx, height: dy}];
    else if (dx < 0  && dy < 0)  return [end, {width: -dx, height: -dy}];
  }

  /* Determine if two rectangles overlap. */
  rectanglesOverlap = (p1: Point, s1: Size, p2: Point, s2: Size): boolean => {
    if (p1.x >= p2.x + s2.width || p2.x >= p1.x + s1.width) return false;
    if (p1.y >= p2.y + s2.height || p2.y >= p1.y + s1.height) return false;
    return true;
  }
}

const soundBlockHandler = new SoundBlockHandler();

export { soundBlockHandler }
