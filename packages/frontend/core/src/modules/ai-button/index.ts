export { AIButtonProvider } from './provider/ai-button';
export { AIButtonService } from './services/ai-button';
export { AIDraftService } from './services/ai-draft';

import type { Framework } from '@toeverything/infra';

import { FeatureFlagService } from '../feature-flag';
import { CacheStorage, GlobalStateService } from '../storage';
import { WorkspaceScope } from '../workspace';
import { AIButtonProvider } from './provider/ai-button';
import { AIButtonService } from './services/ai-button';
import { AIDraftService } from './services/ai-draft';
import { AINetworkSearchService } from './services/network-search';
import { AIPlaygroundService } from './services/playground';
import { AIReasoningService } from './services/reasoning';

export const configureAIButtonModule = (framework: Framework) => {
  framework.service(AIButtonService, container => {
    return new AIButtonService(container.getOptional(AIButtonProvider));
  });
};

export function configureAINetworkSearchModule(framework: Framework) {
  framework.service(AINetworkSearchService, [
    GlobalStateService,
    FeatureFlagService,
  ]);
}

export function configureAIReasoningModule(framework: Framework) {
  framework.service(AIReasoningService, [GlobalStateService]);
}

export function configureAIPlaygroundModule(framework: Framework) {
  framework.service(AIPlaygroundService, [FeatureFlagService]);
}

export function configureAIDraftModule(framework: Framework) {
  framework
    .scope(WorkspaceScope)
    .service(AIDraftService, [GlobalStateService, CacheStorage]);
}
