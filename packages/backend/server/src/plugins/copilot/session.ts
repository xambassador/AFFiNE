import { randomUUID } from 'node:crypto';

import { Injectable, Logger } from '@nestjs/common';
import { AiPromptRole, Prisma, PrismaClient } from '@prisma/client';
import { omit } from 'lodash-es';

import {
  CopilotActionTaken,
  CopilotMessageNotFound,
  CopilotPromptNotFound,
  CopilotQuotaExceeded,
  CopilotSessionDeleted,
  CopilotSessionNotFound,
  PrismaTransaction,
} from '../../base';
import { QuotaService } from '../../core/quota';
import { Models } from '../../models';
import { ChatMessageCache } from './message';
import { PromptService } from './prompt';
import { PromptMessage, PromptParams } from './providers';
import {
  ChatHistory,
  ChatMessage,
  ChatMessageSchema,
  ChatSessionForkOptions,
  ChatSessionOptions,
  ChatSessionPromptUpdateOptions,
  ChatSessionState,
  getTokenEncoder,
  ListHistoriesOptions,
  SubmittedMessage,
} from './types';

export class ChatSession implements AsyncDisposable {
  private stashMessageCount = 0;
  constructor(
    private readonly messageCache: ChatMessageCache,
    private readonly state: ChatSessionState,
    private readonly dispose?: (state: ChatSessionState) => Promise<void>,
    private readonly maxTokenSize = state.prompt.config?.maxTokens || 128 * 1024
  ) {}

  get model() {
    return this.state.prompt.model;
  }

  get optionalModels() {
    return this.state.prompt.optionalModels;
  }

  get config() {
    const {
      sessionId,
      userId,
      workspaceId,
      docId,
      prompt: { name: promptName, config: promptConfig },
    } = this.state;

    return { sessionId, userId, workspaceId, docId, promptName, promptConfig };
  }

  get stashMessages() {
    if (!this.stashMessageCount) return [];
    return this.state.messages.slice(-this.stashMessageCount);
  }

  get latestUserMessage() {
    return this.state.messages.findLast(m => m.role === 'user');
  }

  push(message: ChatMessage) {
    if (
      this.state.prompt.action &&
      this.state.messages.length > 0 &&
      message.role === 'user'
    ) {
      throw new CopilotActionTaken();
    }
    this.state.messages.push(message);
    this.stashMessageCount += 1;
  }

  revertLatestMessage(removeLatestUserMessage: boolean) {
    const messages = this.state.messages;
    messages.splice(
      messages.findLastIndex(({ role }) => role === AiPromptRole.user) +
        (removeLatestUserMessage ? 0 : 1)
    );
  }

  async getMessageById(messageId: string) {
    const message = await this.messageCache.get(messageId);
    if (!message || message.sessionId !== this.state.sessionId) {
      throw new CopilotMessageNotFound({ messageId });
    }
    return message;
  }

  async pushByMessageId(messageId: string) {
    const message = await this.messageCache.get(messageId);
    if (!message || message.sessionId !== this.state.sessionId) {
      throw new CopilotMessageNotFound({ messageId });
    }

    this.push({
      role: 'user',
      content: message.content || '',
      attachments: message.attachments,
      params: message.params,
      createdAt: new Date(),
    });
  }

  pop() {
    return this.state.messages.pop();
  }

  private takeMessages(): ChatMessage[] {
    if (this.state.prompt.action) {
      const messages = this.state.messages;
      return messages.slice(messages.length - 1);
    }
    const ret = [];
    const messages = this.state.messages.slice();

    let size = this.state.prompt.tokens;
    while (messages.length) {
      const message = messages.pop();
      if (!message) break;

      size += this.state.prompt.encode(message.content);
      if (size > this.maxTokenSize) {
        break;
      }
      ret.push(message);
    }
    ret.reverse();

    return ret;
  }

  private mergeUserContent(params: PromptParams) {
    const messages = this.takeMessages();
    const lastMessage = messages.pop();
    if (
      this.state.prompt.paramKeys.includes('content') &&
      !messages.some(m => m.role === AiPromptRole.assistant) &&
      lastMessage?.role === AiPromptRole.user
    ) {
      const normalizedParams = {
        ...params,
        ...lastMessage.params,
        content: lastMessage.content,
      };
      const finished = this.state.prompt.finish(
        normalizedParams,
        this.config.sessionId
      );

      // attachments should be combined with the first user message
      const firstUserMessageIndex = finished.findIndex(
        m => m.role === AiPromptRole.user
      );
      // if prompt not contains user message, skip merge content
      if (firstUserMessageIndex < 0) return null;
      const firstUserMessage = finished[firstUserMessageIndex];

      firstUserMessage.attachments = [
        finished[0].attachments || [],
        lastMessage.attachments || [],
      ]
        .flat()
        .filter(v =>
          typeof v === 'string'
            ? !!v.trim()
            : v && v.attachment.trim() && v.mimeType
        );
      //insert all previous user message content before first user message
      finished.splice(firstUserMessageIndex, 0, ...messages);

      return finished;
    }
    return;
  }

  finish(params: PromptParams): PromptMessage[] {
    // if the message in prompt config contains {{content}},
    // we should combine it with the user message in the prompt
    const mergedMessage = this.mergeUserContent(params);
    if (mergedMessage) {
      return mergedMessage;
    }

    const messages = this.takeMessages();
    const lastMessage = messages.at(-1);
    return [
      ...this.state.prompt.finish(
        Object.keys(params).length ? params : lastMessage?.params || {},
        this.config.sessionId
      ),
      ...messages.filter(m => m.content?.trim() || m.attachments?.length),
    ];
  }

  async save() {
    await this.dispose?.({
      ...this.state,
      // only provide new messages
      messages: this.stashMessages,
    });
    this.stashMessageCount = 0;
  }

  async [Symbol.asyncDispose]() {
    await this.save?.();
  }
}

@Injectable()
export class ChatSessionService {
  private readonly logger = new Logger(ChatSessionService.name);

  constructor(
    private readonly db: PrismaClient,
    private readonly quota: QuotaService,
    private readonly messageCache: ChatMessageCache,
    private readonly prompt: PromptService,
    private readonly models: Models
  ) {}

  private async haveSession(
    sessionId: string,
    userId: string,
    tx?: PrismaTransaction,
    params?: Prisma.AiSessionCountArgs['where']
  ) {
    const executor = tx ?? this.db;
    return await executor.aiSession
      .count({
        where: {
          id: sessionId,
          userId,
          ...params,
        },
      })
      .then(c => c > 0);
  }

  private async setSession(state: ChatSessionState): Promise<string> {
    return await this.db.$transaction(async tx => {
      let sessionId = state.sessionId;

      // find existing session if session is chat session
      if (!state.prompt.action) {
        const extraCondition: Record<string, any> = {};
        if (state.parentSessionId) {
          // also check session id if provided session is forked session
          extraCondition.id = state.sessionId;
          extraCondition.parentSessionId = state.parentSessionId;
        }
        const { id, deletedAt } =
          (await tx.aiSession.findFirst({
            where: {
              userId: state.userId,
              workspaceId: state.workspaceId,
              docId: state.docId,
              prompt: { action: { equals: null } },
              parentSessionId: null,
              ...extraCondition,
            },
            select: { id: true, deletedAt: true },
          })) || {};
        if (deletedAt) throw new CopilotSessionDeleted();
        if (id) sessionId = id;
      }

      const haveSession = await this.haveSession(sessionId, state.userId, tx);
      if (haveSession) {
        // message will only exists when setSession call by session.save
        if (state.messages.length) {
          await tx.aiSessionMessage.createMany({
            data: state.messages.map(m => ({
              ...m,
              attachments: m.attachments || undefined,
              params: omit(m.params, ['docs']) || undefined,
              sessionId,
            })),
          });

          // only count message generated by user
          const userMessages = state.messages.filter(m => m.role === 'user');
          await tx.aiSession.update({
            where: { id: sessionId },
            data: {
              messageCost: { increment: userMessages.length },
              tokenCost: {
                increment: this.calculateTokenSize(
                  state.messages,
                  state.prompt.model
                ),
              },
            },
          });
        }
      } else {
        await tx.aiSession.create({
          data: {
            id: sessionId,
            workspaceId: state.workspaceId,
            docId: state.docId,
            // connect
            userId: state.userId,
            promptName: state.prompt.name,
            parentSessionId: state.parentSessionId,
          },
        });
      }

      return sessionId;
    });
  }

  async getSession(sessionId: string): Promise<ChatSessionState | undefined> {
    return await this.db.aiSession
      .findUnique({
        where: { id: sessionId, deletedAt: null },
        select: {
          id: true,
          userId: true,
          workspaceId: true,
          docId: true,
          parentSessionId: true,
          messages: {
            select: {
              id: true,
              role: true,
              content: true,
              attachments: true,
              params: true,
              createdAt: true,
            },
            orderBy: { createdAt: 'asc' },
          },
          promptName: true,
        },
      })
      .then(async session => {
        if (!session) return;
        const prompt = await this.prompt.get(session.promptName);
        if (!prompt)
          throw new CopilotPromptNotFound({ name: session.promptName });

        const messages = ChatMessageSchema.array().safeParse(session.messages);

        return {
          sessionId: session.id,
          userId: session.userId,
          workspaceId: session.workspaceId,
          docId: session.docId,
          parentSessionId: session.parentSessionId,
          prompt,
          messages: messages.success ? messages.data : [],
        };
      });
  }

  // revert the latest messages not generate by user
  // after revert, we can retry the action
  async revertLatestMessage(
    sessionId: string,
    removeLatestUserMessage: boolean
  ) {
    await this.db.$transaction(async tx => {
      const id = await tx.aiSession
        .findUnique({
          where: { id: sessionId, deletedAt: null },
          select: { id: true },
        })
        .then(session => session?.id);
      if (!id) {
        throw new CopilotSessionNotFound();
      }
      const ids = await tx.aiSessionMessage
        .findMany({
          where: { sessionId: id },
          select: { id: true, role: true },
          orderBy: { createdAt: 'asc' },
        })
        .then(roles =>
          roles
            .slice(
              roles.findLastIndex(({ role }) => role === AiPromptRole.user) +
                (removeLatestUserMessage ? 0 : 1)
            )
            .map(({ id }) => id)
        );
      if (ids.length) {
        await tx.aiSessionMessage.deleteMany({ where: { id: { in: ids } } });
      }
    });
  }

  private calculateTokenSize(messages: PromptMessage[], model: string): number {
    const encoder = getTokenEncoder(model);
    return messages
      .map(m => encoder?.count(m.content) ?? 0)
      .reduce((total, length) => total + length, 0);
  }

  private async countUserMessages(userId: string): Promise<number> {
    const sessions = await this.db.aiSession.findMany({
      where: { userId },
      select: { messageCost: true, prompt: { select: { action: true } } },
    });
    return sessions
      .map(({ messageCost, prompt: { action } }) => (action ? 1 : messageCost))
      .reduce((prev, cost) => prev + cost, 0);
  }

  async listSessions(
    userId: string,
    workspaceId: string,
    docId?: string,
    options?: { action?: boolean }
  ): Promise<Omit<ChatSessionState, 'messages'>[]> {
    return await this.db.aiSession
      .findMany({
        where: {
          userId,
          workspaceId,
          docId,
          prompt: {
            action: options?.action ? { not: null } : null,
          },
          deletedAt: null,
        },
        select: {
          id: true,
          userId: true,
          workspaceId: true,
          docId: true,
          parentSessionId: true,
          promptName: true,
        },
      })
      .then(sessions => {
        return Promise.all(
          sessions.map(async session => {
            const prompt = await this.prompt.get(session.promptName);
            if (!prompt)
              throw new CopilotPromptNotFound({ name: session.promptName });

            return {
              sessionId: session.id,
              userId: session.userId,
              workspaceId: session.workspaceId,
              docId: session.docId,
              parentSessionId: session.parentSessionId,
              prompt,
            };
          })
        );
      });
  }

  async listHistories(
    userId: string,
    workspaceId?: string,
    docId?: string,
    options?: ListHistoriesOptions
  ): Promise<ChatHistory[]> {
    const extraCondition = [];

    if (!options?.action && options?.fork) {
      // only query forked session if fork == true and action == false
      extraCondition.push({
        userId: { not: userId },
        workspaceId: workspaceId,
        docId: workspaceId === docId ? undefined : docId,
        id: options?.sessionId ? { equals: options.sessionId } : undefined,
        // should only find forked session
        parentSessionId: { not: null },
        deletedAt: null,
      });
    }

    return await this.db.aiSession
      .findMany({
        where: {
          OR: [
            {
              userId,
              workspaceId: workspaceId,
              docId: workspaceId === docId ? undefined : docId,
              id: options?.sessionId
                ? { equals: options.sessionId }
                : undefined,
              deletedAt: null,
            },
            ...extraCondition,
          ],
        },
        select: {
          id: true,
          userId: true,
          promptName: true,
          tokenCost: true,
          createdAt: true,
          messages: {
            select: {
              id: true,
              role: true,
              content: true,
              attachments: true,
              params: true,
              createdAt: true,
            },
            orderBy: {
              // message order is asc by default
              createdAt: options?.messageOrder === 'desc' ? 'desc' : 'asc',
            },
          },
        },
        take: options?.limit,
        skip: options?.skip,
        orderBy: {
          // session order is desc by default
          createdAt: options?.sessionOrder === 'asc' ? 'asc' : 'desc',
        },
      })
      .then(sessions =>
        Promise.all(
          sessions.map(
            async ({
              id,
              userId: uid,
              promptName,
              tokenCost,
              messages,
              createdAt,
            }) => {
              try {
                const prompt = await this.prompt.get(promptName);
                if (!prompt) {
                  throw new CopilotPromptNotFound({ name: promptName });
                }
                if (
                  // filter out the user's session that not match the action option
                  (uid === userId && !!options?.action !== !!prompt.action) ||
                  // filter out the non chat session from other user
                  (uid !== userId && !!prompt.action)
                ) {
                  return undefined;
                }

                const ret = ChatMessageSchema.array().safeParse(messages);
                if (ret.success) {
                  // render system prompt
                  const preload = (
                    options?.withPrompt
                      ? prompt
                          .finish(ret.data[0]?.params || {}, id)
                          .filter(({ role }) => role !== 'system')
                      : []
                  ) as ChatMessage[];

                  // `createdAt` is required for history sorting in frontend
                  // let's fake the creating time of prompt messages
                  preload.forEach((msg, i) => {
                    msg.createdAt = new Date(
                      createdAt.getTime() - preload.length - i - 1
                    );
                  });

                  return {
                    sessionId: id,
                    action: prompt.action || null,
                    tokens: tokenCost,
                    createdAt,
                    messages: preload.concat(ret.data).map(m => ({
                      ...m,
                      attachments: m.attachments
                        ?.map(a => (typeof a === 'string' ? a : a.attachment))
                        .filter(a => !!a),
                    })),
                  };
                } else {
                  this.logger.error(
                    `Unexpected message schema: ${JSON.stringify(ret.error)}`
                  );
                }
              } catch (e) {
                this.logger.error('Unexpected error in listHistories', e);
              }
              return undefined;
            }
          )
        )
      )
      .then(histories =>
        histories.filter((v): v is NonNullable<typeof v> => !!v)
      );
  }

  async getQuota(userId: string) {
    const isCopilotUser = await this.models.userFeature.has(
      userId,
      'unlimited_copilot'
    );

    let limit: number | undefined;
    if (!isCopilotUser) {
      const quota = await this.quota.getUserQuota(userId);
      limit = quota.copilotActionLimit;
    }

    const used = await this.countUserMessages(userId);

    return { limit, used };
  }

  async checkQuota(userId: string) {
    const { limit, used } = await this.getQuota(userId);
    if (limit && Number.isFinite(limit) && used >= limit) {
      throw new CopilotQuotaExceeded();
    }
  }

  async create(options: ChatSessionOptions): Promise<string> {
    const sessionId = randomUUID();
    const prompt = await this.prompt.get(options.promptName);
    if (!prompt) {
      this.logger.error(`Prompt not found: ${options.promptName}`);
      throw new CopilotPromptNotFound({ name: options.promptName });
    }

    return await this.setSession({
      ...options,
      sessionId,
      prompt,
      messages: [],
      // when client create chat session, we always find root session
      parentSessionId: null,
    });
  }

  async updateSessionPrompt(
    options: ChatSessionPromptUpdateOptions
  ): Promise<string> {
    const prompt = await this.prompt.get(options.promptName);
    if (!prompt) {
      this.logger.error(`Prompt not found: ${options.promptName}`);
      throw new CopilotPromptNotFound({ name: options.promptName });
    }
    return await this.db.$transaction(async tx => {
      let sessionId = options.sessionId;
      const haveSession = await this.haveSession(
        sessionId,
        options.userId,
        tx,
        { prompt: { action: null } }
      );
      if (haveSession) {
        await tx.aiSession.update({
          where: { id: sessionId },
          data: { promptName: prompt.name },
        });
      }
      return sessionId;
    });
  }

  async fork(options: ChatSessionForkOptions): Promise<string> {
    const state = await this.getSession(options.sessionId);
    if (!state) {
      throw new CopilotSessionNotFound();
    }
    let messages = state.messages.map(m => ({ ...m, id: undefined }));
    if (options.latestMessageId) {
      const lastMessageIdx = state.messages.findLastIndex(
        ({ id, role }) =>
          role === AiPromptRole.assistant && id === options.latestMessageId
      );
      if (lastMessageIdx < 0) {
        throw new CopilotMessageNotFound({
          messageId: options.latestMessageId,
        });
      }
      messages = messages.slice(0, lastMessageIdx + 1);
    }

    const forkedState = {
      ...state,
      userId: options.userId,
      sessionId: randomUUID(),
      messages: [],
      parentSessionId: options.sessionId,
    };
    // create session
    await this.setSession(forkedState);
    // save message
    return await this.setSession({ ...forkedState, messages });
  }

  async cleanup(
    options: Omit<ChatSessionOptions, 'promptName'> & { sessionIds: string[] }
  ) {
    return await this.db.$transaction(async tx => {
      const sessions = await tx.aiSession.findMany({
        where: {
          id: { in: options.sessionIds },
          userId: options.userId,
          workspaceId: options.workspaceId,
          docId: options.docId,
          deletedAt: null,
        },
        select: { id: true, promptName: true },
      });
      const sessionIds = sessions.map(({ id }) => id);
      // cleanup all messages
      await tx.aiSessionMessage.deleteMany({
        where: { sessionId: { in: sessionIds } },
      });

      // only mark action session as deleted
      // chat session always can be reuse
      const actionIds = (
        await Promise.all(
          sessions.map(({ id, promptName }) =>
            this.prompt
              .get(promptName)
              .then(prompt => ({ id, action: !!prompt?.action }))
          )
        )
      )
        .filter(({ action }) => action)
        .map(({ id }) => id);

      await tx.aiSession.updateMany({
        where: { id: { in: actionIds } },
        data: { deletedAt: new Date() },
      });

      return [...sessionIds, ...actionIds];
    });
  }

  async createMessage(message: SubmittedMessage): Promise<string> {
    return await this.messageCache.set(message);
  }

  /**
   * usage:
   * ``` typescript
   * {
   *     // allocate a session, can be reused chat in about 12 hours with same session
   *     await using session = await session.get(sessionId);
   *     session.push(message);
   *     copilot.text({ modelId }, session.finish());
   * }
   * // session will be disposed after the block
   * @param sessionId session id
   * @returns
   */
  async get(sessionId: string): Promise<ChatSession | null> {
    const state = await this.getSession(sessionId);
    if (state) {
      return new ChatSession(this.messageCache, state, async state => {
        await this.setSession(state);
      });
    }
    return null;
  }
}
