import { ExplorerNavigation } from '@affine/core/components/explorer/header/navigation';
import { PageDisplayMenu } from '@affine/core/components/page-list';
import { Header } from '@affine/core/components/pure/header';

export const TagDetailHeader = () => {
  return (
    <Header
      left={<ExplorerNavigation active={'tags'} />}
      right={<PageDisplayMenu />}
    />
  );
};
