import {
  type DocPermissionActions,
  GuardService,
  type WorkspacePermissionActions,
} from '@affine/core/modules/permissions';
import { useLiveData, useService } from '@toeverything/infra';
import { useEffect, useMemo } from 'react';

export const useGuard = <
  T extends WorkspacePermissionActions | DocPermissionActions,
>(
  action: T,
  ...args: T extends DocPermissionActions ? [string] : []
) => {
  const guardService = useService(GuardService);
  useEffect(() => {
    guardService.revalidateCan(action, ...args);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [action, guardService, ...args]);

  const livedata$ = useMemo(
    () => guardService.can$(action, ...args),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [action, guardService, ...args]
  );

  const can = useLiveData(livedata$);
  return can;
};
