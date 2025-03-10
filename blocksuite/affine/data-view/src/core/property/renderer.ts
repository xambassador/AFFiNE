import type { UniComponent } from '@blocksuite/affine-shared/types';

import { createUniComponentFromWebComponent } from '../utils/uni-component/index.js';
import type { BaseCellRenderer } from './base-cell.js';
import type { CellRenderer, DataViewCellComponent } from './manager.js';

export interface Renderer<
  Data extends NonNullable<unknown> = NonNullable<unknown>,
  Value = unknown,
> {
  type: string;
  icon?: UniComponent;
  cellRenderer: CellRenderer<Data, Value>;
}

export const createFromBaseCellRenderer = <
  Value,
  Data extends Record<string, unknown> = Record<string, unknown>,
>(
  renderer: new () => BaseCellRenderer<Value, Data>
): DataViewCellComponent => {
  return createUniComponentFromWebComponent(renderer as never) as never;
};
