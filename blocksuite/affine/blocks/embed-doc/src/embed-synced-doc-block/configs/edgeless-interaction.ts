import {
  EmbedSyncedDocBlockSchema,
  SYNCED_MIN_HEIGHT,
  SYNCED_MIN_WIDTH,
} from '@blocksuite/affine-model';
import { clamp } from '@blocksuite/global/gfx';
import { GfxViewInteractionExtension } from '@blocksuite/std/gfx';

import type { EmbedEdgelessSyncedDocBlockComponent } from '../embed-edgeless-synced-doc-block';
import { calcSyncedDocFullHeight } from '../utils';

export const EmbedSyncedDocInteraction =
  GfxViewInteractionExtension<EmbedEdgelessSyncedDocBlockComponent>(
    EmbedSyncedDocBlockSchema.model.flavour,
    {
      resizeConstraint: {
        minWidth: SYNCED_MIN_WIDTH,
        minHeight: SYNCED_MIN_HEIGHT,
      },

      handleRotate: () => {
        return {
          beforeRotate(context) {
            context.set({
              rotatable: false,
            });
          },
        };
      },

      handleResize: ({ view, model }) => {
        const initialScale = model.props.scale ?? 1;
        const initHeight = model.elementBound.h;
        const maxHeight = calcSyncedDocFullHeight(view);

        return {
          beforeResize: context => {
            context.set({ maxHeight });
          },
          onResizeStart: context => {
            context.default(context);
            model.stash('scale');
            model.stash('preFoldHeight');
          },
          onResizeMove: context => {
            const { lockRatio, originalBound, constraint, newBound } = context;

            let scale = initialScale;
            const realWidth = originalBound.w / initialScale;

            if (lockRatio) {
              scale = newBound.w / realWidth;
            }

            const newWidth = newBound.w / scale;

            newBound.w =
              clamp(newWidth, constraint.minWidth, constraint.maxWidth) * scale;
            newBound.h =
              clamp(newBound.h, constraint.minHeight, constraint.maxHeight) *
              scale;

            const newHeight = newBound.h / scale;

            // only adjust height check the fold state
            if (originalBound.w === newBound.w) {
              let preFoldHeight = 0;
              if (newHeight === constraint.minHeight) {
                preFoldHeight = initHeight;
              }
              model.props.preFoldHeight = preFoldHeight;
            }

            model.props.scale = scale;
            model.xywh = newBound.serialize();
          },
          onResizeEnd: context => {
            context.default(context);
            model.pop('scale');
            model.pop('preFoldHeight');
          },
        };
      },
    }
  );
