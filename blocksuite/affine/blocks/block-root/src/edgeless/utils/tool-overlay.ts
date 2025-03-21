import {
  type Options,
  Overlay,
  type RoughCanvas,
  type SurfaceBlockComponent,
} from '@blocksuite/affine-block-surface';
import {
  type Color,
  DefaultTheme,
  shapeMethods,
  type ShapeStyle,
} from '@blocksuite/affine-model';
import { ThemeProvider } from '@blocksuite/affine-shared/services';
import type { GfxController, GfxToolsMap } from '@blocksuite/block-std/gfx';
import { DisposableGroup } from '@blocksuite/global/disposable';
import type { XYWH } from '@blocksuite/global/gfx';
import { Bound } from '@blocksuite/global/gfx';
import { assertType, noop } from '@blocksuite/global/utils';
import { effect } from '@preact/signals-core';
import { Subject } from 'rxjs';

import type { ShapeTool } from '../gfx-tool/shape-tool.js';
import {
  NOTE_OVERLAY_CORNER_RADIUS,
  NOTE_OVERLAY_HEIGHT,
  NOTE_OVERLAY_OFFSET_X,
  NOTE_OVERLAY_OFFSET_Y,
  NOTE_OVERLAY_STOKE_COLOR,
  NOTE_OVERLAY_TEXT_COLOR,
  NOTE_OVERLAY_WIDTH,
  SHAPE_OVERLAY_HEIGHT,
  SHAPE_OVERLAY_OFFSET_X,
  SHAPE_OVERLAY_OFFSET_Y,
  SHAPE_OVERLAY_WIDTH,
} from '../utils/consts.js';

const drawRoundedRect = (ctx: CanvasRenderingContext2D, xywh: XYWH) => {
  const [x, y, w, h] = xywh;
  const width = w;
  const height = h;
  const radius = 0.1;
  const cornerRadius = Math.min(width * radius, height * radius);
  ctx.moveTo(x + cornerRadius, y);
  ctx.arcTo(x + width, y, x + width, y + height, cornerRadius);
  ctx.arcTo(x + width, y + height, x, y + height, cornerRadius);
  ctx.arcTo(x, y + height, x, y, cornerRadius);
  ctx.arcTo(x, y, x + width, y, cornerRadius);
};

const drawGeneralShape = (
  ctx: CanvasRenderingContext2D,
  type: string,
  xywh: XYWH,
  options: Options
) => {
  ctx.setLineDash(options.strokeLineDash ?? []);
  ctx.strokeStyle = options.stroke ?? 'transparent';
  ctx.lineWidth = options.strokeWidth ?? 2;
  ctx.fillStyle = options.fill ?? 'transparent';

  ctx.beginPath();

  const bound = Bound.fromXYWH(xywh);
  switch (type) {
    case 'rect':
      shapeMethods.rect.draw(ctx, bound);
      break;
    case 'triangle':
      shapeMethods.triangle.draw(ctx, bound);
      break;
    case 'diamond':
      shapeMethods.diamond.draw(ctx, bound);
      break;
    case 'ellipse':
      shapeMethods.ellipse.draw(ctx, bound);
      break;
    case 'roundedRect':
      drawRoundedRect(ctx, xywh);
      break;
    default:
      throw new Error(`Unknown shape type: ${type}`);
  }

  ctx.closePath();

  ctx.fill();
  ctx.stroke();
};

export abstract class Shape {
  options: Options;

  shapeStyle: ShapeStyle;

  type: string;

  xywh: XYWH;

  constructor(
    xywh: XYWH,
    type: string,
    options: Options,
    shapeStyle: ShapeStyle
  ) {
    this.xywh = xywh;
    this.type = type;
    this.options = options;
    this.shapeStyle = shapeStyle;
  }

  abstract draw(ctx: CanvasRenderingContext2D, rc: RoughCanvas): void;
}

export class RectShape extends Shape {
  draw(ctx: CanvasRenderingContext2D, rc: RoughCanvas): void {
    if (this.shapeStyle === 'Scribbled') {
      const [x, y, w, h] = this.xywh;
      rc.rectangle(x, y, w, h, this.options);
    } else {
      drawGeneralShape(ctx, 'rect', this.xywh, this.options);
    }
  }
}

export class TriangleShape extends Shape {
  draw(ctx: CanvasRenderingContext2D, rc: RoughCanvas): void {
    if (this.shapeStyle === 'Scribbled') {
      const [x, y, w, h] = this.xywh;
      rc.polygon(
        [
          [x + w / 2, y],
          [x, y + h],
          [x + w, y + h],
        ],
        this.options
      );
    } else {
      drawGeneralShape(ctx, 'triangle', this.xywh, this.options);
    }
  }
}

export class DiamondShape extends Shape {
  draw(ctx: CanvasRenderingContext2D, rc: RoughCanvas): void {
    if (this.shapeStyle === 'Scribbled') {
      const [x, y, w, h] = this.xywh;
      rc.polygon(
        [
          [x + w / 2, y],
          [x + w, y + h / 2],
          [x + w / 2, y + h],
          [x, y + h / 2],
        ],
        this.options
      );
    } else {
      drawGeneralShape(ctx, 'diamond', this.xywh, this.options);
    }
  }
}

export class EllipseShape extends Shape {
  draw(ctx: CanvasRenderingContext2D, rc: RoughCanvas): void {
    if (this.shapeStyle === 'Scribbled') {
      const [x, y, w, h] = this.xywh;
      rc.ellipse(x + w / 2, y + h / 2, w, h, this.options);
    } else {
      drawGeneralShape(ctx, 'ellipse', this.xywh, this.options);
    }
  }
}

export class RoundedRectShape extends Shape {
  draw(ctx: CanvasRenderingContext2D, rc: RoughCanvas): void {
    if (this.shapeStyle === 'Scribbled') {
      const [x, y, w, h] = this.xywh;
      const radius = 0.1;
      const r = Math.min(w * radius, h * radius);
      const x0 = x + r;
      const x1 = x + w - r;
      const y0 = y + r;
      const y1 = y + h - r;
      const path = `
          M${x0},${y} L${x1},${y}
          A${r},${r} 0 0 1 ${x1},${y0}
          L${x1},${y1}
          A${r},${r} 0 0 1 ${x1 - r},${y1}
          L${x0 + r},${y1}
          A${r},${r} 0 0 1 ${x0},${y1 - r}
          L${x0},${y0}
          A${r},${r} 0 0 1 ${x0 + r},${y}
        `;

      rc.path(path, this.options);
    } else {
      drawGeneralShape(ctx, 'roundedRect', this.xywh, this.options);
    }
  }
}

export class ShapeFactory {
  static createShape(
    xywh: XYWH,
    type: string,
    options: Options,
    shapeStyle: ShapeStyle
  ): Shape {
    switch (type) {
      case 'rect':
        return new RectShape(xywh, type, options, shapeStyle);
      case 'triangle':
        return new TriangleShape(xywh, type, options, shapeStyle);
      case 'diamond':
        return new DiamondShape(xywh, type, options, shapeStyle);
      case 'ellipse':
        return new EllipseShape(xywh, type, options, shapeStyle);
      case 'roundedRect':
        return new RoundedRectShape(xywh, type, options, shapeStyle);
      default:
        throw new Error(`Unknown shape type: ${type}`);
    }
  }
}

class ToolOverlay extends Overlay {
  protected disposables = new DisposableGroup();

  globalAlpha: number;

  x: number;

  y: number;

  constructor(gfx: GfxController) {
    super(gfx);
    this.x = 0;
    this.y = 0;
    this.globalAlpha = 0;
    this.gfx = gfx;
    this.disposables.add(
      this.gfx.viewport.viewportUpdated.subscribe(() => {
        // when viewport is updated, we should keep the overlay in the same position
        // to get last mouse position and convert it to model coordinates
        const pos = this.gfx.tool.lastMousePos$.value;
        const [x, y] = this.gfx.viewport.toModelCoord(pos.x, pos.y);
        this.x = x;
        this.y = y;
      })
    );
  }

  override dispose(): void {
    this.disposables.dispose();
  }

  render(_ctx: CanvasRenderingContext2D, _rc: RoughCanvas): void {
    noop();
  }
}

export class ShapeOverlay extends ToolOverlay {
  shape: Shape;

  constructor(
    gfx: GfxController,
    type: string,
    options: Options,
    style: {
      shapeStyle: ShapeStyle;
      fillColor: Color;
      strokeColor: Color;
    }
  ) {
    super(gfx);
    const xywh = [
      this.x,
      this.y,
      SHAPE_OVERLAY_WIDTH,
      SHAPE_OVERLAY_HEIGHT,
    ] as XYWH;
    const { shapeStyle, fillColor, strokeColor } = style;
    const fill = this.gfx.std
      .get(ThemeProvider)
      .getColorValue(fillColor, DefaultTheme.shapeFillColor, true);
    const stroke = this.gfx.std
      .get(ThemeProvider)
      .getColorValue(strokeColor, DefaultTheme.shapeStrokeColor, true);

    options.fill = fill;
    options.stroke = stroke;

    this.shape = ShapeFactory.createShape(xywh, type, options, shapeStyle);
    this.disposables.add(
      effect(() => {
        const currentTool = this.gfx.tool.currentTool$.value;

        if (currentTool?.toolName !== 'shape') return;

        assertType<ShapeTool>(currentTool);

        const { shapeName } = currentTool.activatedOption;
        const newOptions = {
          ...options,
        };

        let { x, y } = this;
        if (shapeName === 'roundedRect' || shapeName === 'rect') {
          x += SHAPE_OVERLAY_OFFSET_X;
          y += SHAPE_OVERLAY_OFFSET_Y;
        }
        const w =
          shapeName === 'roundedRect'
            ? SHAPE_OVERLAY_WIDTH + 40
            : SHAPE_OVERLAY_WIDTH;
        const xywh = [x, y, w, SHAPE_OVERLAY_HEIGHT] as XYWH;
        this.shape = ShapeFactory.createShape(
          xywh,
          shapeName,
          newOptions,
          shapeStyle
        );

        (this.gfx.surfaceComponent as SurfaceBlockComponent).refresh();
      })
    );
  }

  override render(ctx: CanvasRenderingContext2D, rc: RoughCanvas): void {
    ctx.globalAlpha = this.globalAlpha;
    let { x, y } = this;
    const { type } = this.shape;
    if (type === 'roundedRect' || type === 'rect') {
      x += SHAPE_OVERLAY_OFFSET_X;
      y += SHAPE_OVERLAY_OFFSET_Y;
    }
    const w =
      type === 'roundedRect' ? SHAPE_OVERLAY_WIDTH + 40 : SHAPE_OVERLAY_WIDTH;
    const xywh = [x, y, w, SHAPE_OVERLAY_HEIGHT] as XYWH;
    this.shape.xywh = xywh;
    this.shape.draw(ctx, rc);
  }
}

export class NoteOverlay extends ToolOverlay {
  backgroundColor = 'transparent';

  text = '';

  constructor(gfx: GfxController, background: Color) {
    super(gfx);
    this.globalAlpha = 0;
    this.backgroundColor = gfx.std
      .get(ThemeProvider)
      .getColorValue(background, DefaultTheme.noteBackgrounColor, true);
    this.disposables.add(
      effect(() => {
        // when change note child type, update overlay text
        if (this.gfx.tool.currentToolName$.value !== 'affine:note') return;
        const tool =
          this.gfx.tool.currentTool$.peek() as GfxToolsMap['affine:note'];
        this.text = this._getOverlayText(tool.activatedOption.tip);
        (this.gfx.surfaceComponent as SurfaceBlockComponent).refresh();
      })
    );
  }

  private _getOverlayText(text: string): string {
    return text[0].toUpperCase() + text.slice(1);
  }

  override render(ctx: CanvasRenderingContext2D): void {
    ctx.globalAlpha = this.globalAlpha;
    const overlayX = this.x + NOTE_OVERLAY_OFFSET_X;
    const overlayY = this.y + NOTE_OVERLAY_OFFSET_Y;
    ctx.strokeStyle = this.gfx.std
      .get(ThemeProvider)
      .getCssVariableColor(NOTE_OVERLAY_STOKE_COLOR);
    // Draw the overlay rectangle
    ctx.fillStyle = this.backgroundColor;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(overlayX + NOTE_OVERLAY_CORNER_RADIUS, overlayY);
    ctx.lineTo(
      overlayX + NOTE_OVERLAY_WIDTH - NOTE_OVERLAY_CORNER_RADIUS,
      overlayY
    );
    ctx.quadraticCurveTo(
      overlayX + NOTE_OVERLAY_WIDTH,
      overlayY,
      overlayX + NOTE_OVERLAY_WIDTH,
      overlayY + NOTE_OVERLAY_CORNER_RADIUS
    );
    ctx.lineTo(
      overlayX + NOTE_OVERLAY_WIDTH,
      overlayY + NOTE_OVERLAY_HEIGHT - NOTE_OVERLAY_CORNER_RADIUS
    );
    ctx.quadraticCurveTo(
      overlayX + NOTE_OVERLAY_WIDTH,
      overlayY + NOTE_OVERLAY_HEIGHT,
      overlayX + NOTE_OVERLAY_WIDTH - NOTE_OVERLAY_CORNER_RADIUS,
      overlayY + NOTE_OVERLAY_HEIGHT
    );
    ctx.lineTo(
      overlayX + NOTE_OVERLAY_CORNER_RADIUS,
      overlayY + NOTE_OVERLAY_HEIGHT
    );
    ctx.quadraticCurveTo(
      overlayX,
      overlayY + NOTE_OVERLAY_HEIGHT,
      overlayX,
      overlayY + NOTE_OVERLAY_HEIGHT - NOTE_OVERLAY_CORNER_RADIUS
    );
    ctx.lineTo(overlayX, overlayY + NOTE_OVERLAY_CORNER_RADIUS);
    ctx.quadraticCurveTo(
      overlayX,
      overlayY,
      overlayX + NOTE_OVERLAY_CORNER_RADIUS,
      overlayY
    );
    ctx.closePath();
    ctx.stroke();
    ctx.fill();

    // Draw the overlay text
    ctx.fillStyle = this.gfx.std
      .get(ThemeProvider)
      .getCssVariableColor(NOTE_OVERLAY_TEXT_COLOR);
    let fontSize = 16;
    ctx.font = `${fontSize}px Arial`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';

    // measure the width of the text
    // if the text is wider than the rectangle, reduce the maximum width of the text
    while (ctx.measureText(this.text).width > NOTE_OVERLAY_WIDTH - 20) {
      fontSize -= 1;
      ctx.font = `${fontSize}px Arial`;
    }

    ctx.fillText(this.text, overlayX + 10, overlayY + NOTE_OVERLAY_HEIGHT / 2);
  }
}

export class DraggingNoteOverlay extends NoteOverlay {
  height: number;

  slots: {
    draggingNoteUpdated: Subject<{ xywh: XYWH }>;
  };

  width: number;

  constructor(gfx: GfxController, background: Color) {
    super(gfx, background);
    this.slots = {
      draggingNoteUpdated: new Subject<{
        xywh: XYWH;
      }>(),
    };
    this.width = 0;
    this.height = 0;
    this.disposables.add(
      this.slots.draggingNoteUpdated.subscribe(({ xywh }) => {
        [this.x, this.y, this.width, this.height] = xywh;
        (this.gfx.surfaceComponent as SurfaceBlockComponent).refresh();
      })
    );
  }

  override render(ctx: CanvasRenderingContext2D): void {
    // draw a rounded rectangle with provided background color and xywh
    ctx.globalAlpha = 0.8;
    ctx.fillStyle = this.backgroundColor;
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.10)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(this.x, this.y, this.width, this.height, 4);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
}
