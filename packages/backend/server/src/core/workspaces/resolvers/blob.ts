import { Logger, UseGuards } from '@nestjs/common';
import {
  Args,
  Field,
  Int,
  Mutation,
  ObjectType,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import GraphQLUpload from 'graphql-upload/GraphQLUpload.mjs';

import type { FileUpload } from '../../../base';
import { BlobQuotaExceeded, CloudThrottlerGuard } from '../../../base';
import { CurrentUser } from '../../auth';
import { AccessController } from '../../permission';
import { QuotaService } from '../../quota';
import { WorkspaceBlobStorage } from '../../storage';
import { WorkspaceBlobSizes, WorkspaceType } from '../types';

@ObjectType()
class ListedBlob {
  @Field()
  key!: string;

  @Field()
  mime!: string;

  @Field()
  size!: number;

  @Field()
  createdAt!: string;
}

@UseGuards(CloudThrottlerGuard)
@Resolver(() => WorkspaceType)
export class WorkspaceBlobResolver {
  logger = new Logger(WorkspaceBlobResolver.name);
  constructor(
    private readonly ac: AccessController,
    private readonly quota: QuotaService,
    private readonly storage: WorkspaceBlobStorage
  ) {}

  @ResolveField(() => [ListedBlob], {
    description: 'List blobs of workspace',
    complexity: 2,
  })
  async blobs(
    @CurrentUser() user: CurrentUser,
    @Parent() workspace: WorkspaceType
  ) {
    await this.ac
      .user(user.id)
      .workspace(workspace.id)
      .assert('Workspace.Blobs.List');

    return this.storage.list(workspace.id);
  }

  @ResolveField(() => Int, {
    description: 'Blobs size of workspace',
    complexity: 2,
  })
  async blobsSize(@Parent() workspace: WorkspaceType) {
    return this.storage.totalSize(workspace.id);
  }

  @Query(() => WorkspaceBlobSizes, {
    deprecationReason: 'use `user.quotaUsage` instead',
  })
  async collectAllBlobSizes(@CurrentUser() user: CurrentUser) {
    const size = await this.quota.getUserStorageUsage(user.id);
    return { size };
  }

  @Mutation(() => String)
  async setBlob(
    @CurrentUser() user: CurrentUser,
    @Args('workspaceId') workspaceId: string,
    @Args({ name: 'blob', type: () => GraphQLUpload })
    blob: FileUpload
  ) {
    await this.ac
      .user(user.id)
      .workspace(workspaceId)
      .assert('Workspace.Blobs.Write');

    const checkExceeded =
      await this.quota.getWorkspaceQuotaCalculator(workspaceId);

    // TODO(@darksky): need a proper way to separate `BlobQuotaExceeded` and `BlobSizeTooLarge`
    if (checkExceeded(0)) {
      throw new BlobQuotaExceeded();
    }
    const buffer = await new Promise<Buffer>((resolve, reject) => {
      const stream = blob.createReadStream();
      const chunks: Uint8Array[] = [];
      stream.on('data', chunk => {
        chunks.push(chunk);

        // check size after receive each chunk to avoid unnecessary memory usage
        const bufferSize = chunks.reduce((acc, cur) => acc + cur.length, 0);
        if (checkExceeded(bufferSize)) {
          reject(new BlobQuotaExceeded());
        }
      });
      stream.on('error', reject);
      stream.on('end', () => {
        const buffer = Buffer.concat(chunks);

        if (checkExceeded(buffer.length)) {
          reject(new BlobQuotaExceeded());
        } else {
          resolve(buffer);
        }
      });
    });

    await this.storage.put(workspaceId, blob.filename, buffer);
    return blob.filename;
  }

  @Mutation(() => Boolean)
  async deleteBlob(
    @CurrentUser() user: CurrentUser,
    @Args('workspaceId') workspaceId: string,
    @Args('hash', {
      type: () => String,
      deprecationReason: 'use parameter [key]',
      nullable: true,
    })
    hash?: string,
    @Args('key', { type: () => String, nullable: true }) key?: string,
    @Args('permanently', { type: () => Boolean, defaultValue: false })
    permanently = false
  ) {
    key = key ?? hash;
    if (!key) {
      return false;
    }

    await this.ac
      .user(user.id)
      .workspace(workspaceId)
      .assert('Workspace.Blobs.Write');

    await this.storage.delete(workspaceId, key, permanently);

    return true;
  }

  @Mutation(() => Boolean)
  async releaseDeletedBlobs(
    @CurrentUser() user: CurrentUser,
    @Args('workspaceId') workspaceId: string
  ) {
    await this.ac
      .user(user.id)
      .workspace(workspaceId)
      .assert('Workspace.Blobs.Write');

    await this.storage.release(workspaceId);

    return true;
  }
}
