import {
  Args,
  Context,
  Field,
  Mutation,
  ObjectType,
  Parent,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import type { Request } from 'express';
import { SafeIntResolver } from 'graphql-scalars';
import GraphQLUpload, {
  type FileUpload,
} from 'graphql-upload/GraphQLUpload.mjs';

import {
  BlobQuotaExceeded,
  CopilotEmbeddingUnavailable,
  CopilotFailedToAddWorkspaceFileEmbedding,
  Mutex,
  TooManyRequest,
  UserFriendlyError,
} from '../../../base';
import { CurrentUser } from '../../../core/auth';
import { AccessController } from '../../../core/permission';
import { WorkspaceType } from '../../../core/workspaces';
import { CopilotWorkspaceFile, Models } from '../../../models';
import { COPILOT_LOCKER } from '../resolver';
import { MAX_EMBEDDABLE_SIZE } from '../types';
import { CopilotWorkspaceService } from './service';

@ObjectType('CopilotWorkspaceConfig')
export class CopilotWorkspaceConfigType {
  @Field(() => String)
  workspaceId!: string;
}

@ObjectType('CopilotWorkspaceFile')
export class CopilotWorkspaceFileType implements CopilotWorkspaceFile {
  @Field(() => String)
  workspaceId!: string;

  @Field(() => String)
  fileId!: string;

  @Field(() => String)
  fileName!: string;

  @Field(() => String)
  mimeType!: string;

  @Field(() => SafeIntResolver)
  size!: number;

  @Field(() => Date)
  createdAt!: Date;
}

/**
 * Workspace embedding config resolver
 * Public apis rate limit: 10 req/m
 * Other rate limit: 120 req/m
 */
@Resolver(() => WorkspaceType)
export class CopilotWorkspaceEmbeddingResolver {
  constructor(private readonly ac: AccessController) {}

  @ResolveField(() => CopilotWorkspaceConfigType, {
    complexity: 2,
  })
  async embedding(
    @CurrentUser() user: CurrentUser,
    @Parent() workspace: WorkspaceType
  ): Promise<CopilotWorkspaceConfigType> {
    await this.ac
      .user(user.id)
      .workspace(workspace.id)
      .assert('Workspace.Read');

    return { workspaceId: workspace.id };
  }
}

@Resolver(() => CopilotWorkspaceConfigType)
export class CopilotWorkspaceEmbeddingConfigResolver {
  constructor(
    private readonly ac: AccessController,
    private readonly models: Models,
    private readonly mutex: Mutex,
    private readonly copilotWorkspace: CopilotWorkspaceService
  ) {}

  @ResolveField(() => [String], {
    complexity: 2,
  })
  async ignoredDocs(
    @Parent() config: CopilotWorkspaceConfigType
  ): Promise<string[]> {
    return this.models.copilotWorkspace.listIgnoredDocs(config.workspaceId);
  }

  @Mutation(() => Number, {
    name: 'updateWorkspaceEmbeddingIgnoredDocs',
    complexity: 2,
    description: 'Update ignored docs',
  })
  async updateIgnoredDocs(
    @CurrentUser() user: CurrentUser,
    @Args('workspaceId', { type: () => String })
    workspaceId: string,
    @Args('add', { type: () => [String], nullable: true })
    add?: string[],
    @Args('remove', { type: () => [String], nullable: true })
    remove?: string[]
  ): Promise<number> {
    await this.ac
      .user(user.id)
      .workspace(workspaceId)
      .assert('Workspace.Settings.Update');
    return await this.models.copilotWorkspace.updateIgnoredDocs(
      workspaceId,
      add,
      remove
    );
  }

  @ResolveField(() => [CopilotWorkspaceFileType], {
    complexity: 2,
  })
  async files(
    @Parent() config: CopilotWorkspaceConfigType
  ): Promise<CopilotWorkspaceFileType[]> {
    return this.models.copilotWorkspace.listWorkspaceFiles(config.workspaceId);
  }

  @Mutation(() => CopilotWorkspaceFileType, {
    name: 'addWorkspaceEmbeddingFiles',
    complexity: 2,
    description: 'Update workspace embedding files',
  })
  async addFiles(
    @Context() ctx: { req: Request },
    @CurrentUser() user: CurrentUser,
    @Args('workspaceId', { type: () => String })
    workspaceId: string,
    @Args({ name: 'blob', type: () => GraphQLUpload })
    content: FileUpload
  ): Promise<CopilotWorkspaceFileType> {
    await this.ac
      .user(user.id)
      .workspace(workspaceId)
      .assert('Workspace.Settings.Update');

    if (!this.copilotWorkspace.canEmbedding) {
      throw new CopilotEmbeddingUnavailable();
    }

    const lockFlag = `${COPILOT_LOCKER}:workspace:${workspaceId}`;
    await using lock = await this.mutex.acquire(lockFlag);
    if (!lock) {
      throw new TooManyRequest('Server is busy');
    }

    const length = Number(ctx.req.headers['content-length']);
    if (length && length >= MAX_EMBEDDABLE_SIZE) {
      throw new BlobQuotaExceeded();
    }

    try {
      const { blobId, file } = await this.copilotWorkspace.addWorkspaceFile(
        user.id,
        workspaceId,
        content
      );
      await this.copilotWorkspace.addWorkspaceFileEmbeddingQueue({
        userId: user.id,
        workspaceId,
        blobId,
        fileId: file.fileId,
        fileName: file.fileName,
      });

      return file;
    } catch (e: any) {
      // passthrough user friendly error
      if (e instanceof UserFriendlyError) {
        throw e;
      }
      throw new CopilotFailedToAddWorkspaceFileEmbedding({
        message: e.message,
      });
    }
  }

  @Mutation(() => Boolean, {
    name: 'removeWorkspaceEmbeddingFiles',
    complexity: 2,
    description: 'Remove workspace embedding files',
  })
  async removeFiles(
    @CurrentUser() user: CurrentUser,
    @Args('workspaceId', { type: () => String })
    workspaceId: string,
    @Args('fileId', { type: () => String })
    fileId: string
  ): Promise<boolean> {
    await this.ac
      .user(user.id)
      .workspace(workspaceId)
      .assert('Workspace.Settings.Update');

    return await this.models.copilotWorkspace.removeWorkspaceFile(
      workspaceId,
      fileId
    );
  }
}
