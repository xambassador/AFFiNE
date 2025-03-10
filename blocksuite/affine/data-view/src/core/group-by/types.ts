import type { UniComponent } from '@blocksuite/affine-shared/types';

import type { TypeInstance } from '../logical/type.js';
import type { DVJSON } from '../property/types.js';

export interface GroupRenderProps<
  Data extends NonNullable<unknown> = NonNullable<unknown>,
  Value = DVJSON,
> {
  data: Data;
  updateData?: (data: Data) => void;
  value: Value;
  updateValue?: (value: Value) => void;
  readonly: boolean;
}

export type GroupByConfig = {
  name: string;
  groupName: (type: TypeInstance, value: unknown) => string;
  defaultKeys: (type: TypeInstance) => {
    key: string;
    value: DVJSON;
  }[];
  valuesGroup: (
    value: unknown,
    type: TypeInstance
  ) => {
    key: string;
    value: DVJSON;
  }[];
  addToGroup?: (value: DVJSON, oldValue: DVJSON) => DVJSON;
  removeFromGroup?: (value: DVJSON, oldValue: DVJSON) => DVJSON;
  view: UniComponent<GroupRenderProps>;
};
