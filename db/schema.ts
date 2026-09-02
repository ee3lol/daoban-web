import { pgTable, text, timestamp, boolean, integer, AnyPgColumn } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ===== Better Auth Core Tables =====

export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').notNull().default(false),
  image: text('image'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  // Username plugin fields
  username: text('username').unique(),
  displayUsername: text('display_username'),
  hasSetUsername: boolean('has_set_username').default(false).notNull(),
  // Admin plugin fields
  role: text('role').default('user'),
  banned: boolean('banned').default(false),
  banReason: text('ban_reason'),
  banExpires: timestamp('ban_expires'),
});

export const session = pgTable('session', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expires_at').notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  impersonatedBy: text('impersonated_by'),
});

export const account = pgTable('account', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at'),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  issuer: text('issuer'),
});

export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// ===== App-specific Tables =====

export const watchLater = pgTable('watch_later', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  mediaId: integer('media_id').notNull(),
  mediaType: text('media_type').notNull(),
  title: text('title').notNull(),
  posterPath: text('poster_path'),
  addedAt: timestamp('added_at').defaultNow().notNull(),
});

export const favorites = pgTable('favorites', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  mediaId: integer('media_id').notNull(),
  mediaType: text('media_type').notNull(),
  title: text('title').notNull(),
  posterPath: text('poster_path'),
  addedAt: timestamp('added_at').defaultNow().notNull(),
});

export const friends = pgTable('friends', {
  id: text('id').primaryKey(),
  senderId: text('sender_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  receiverId: text('receiver_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  status: text('status').notNull().default('pending'), // 'pending', 'accepted', 'declined', 'blocked'
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const userPreferences = pgTable('user_preferences', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().unique().references(() => user.id, { onDelete: 'cascade' }),
  accentColor: text('accent_color').notNull().default('#fc535a'),
  themeStyle: text('theme_style').notNull().default('dark'), // 'dark', 'pitch_black'
  cardRadius: text('card_radius').notNull().default('rounded-xl'), // 'rounded-none', 'rounded-md', 'rounded-xl', 'rounded-full'
  filmGrain: boolean('film_grain').notNull().default(true),
  mentionPrivacy: text('mention_privacy').notNull().default('anyone'), // 'anyone', 'friends', 'nobody'
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const comments = pgTable('comments', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  mediaId: integer('media_id').notNull(),
  mediaType: text('media_type').notNull(),
  season: integer('season'),
  episode: integer('episode'),
  content: text('content').notNull(),
  parentId: text('parent_id').references((): AnyPgColumn => comments.id, { onDelete: 'cascade' }),
  validMentions: text('valid_mentions').array().default([]).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const commentLikes = pgTable('comment_likes', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  commentId: text('comment_id').notNull().references(() => comments.id, { onDelete: 'cascade' }),
  isLike: boolean('is_like').notNull(), // true = like, false = dislike
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const commentsRelations = relations(comments, ({ one, many }) => ({
  user: one(user, {
    fields: [comments.userId],
    references: [user.id],
  }),
  parent: one(comments, {
    fields: [comments.parentId],
    references: [comments.id],
    relationName: 'comment_replies',
  }),
  replies: many(comments, {
    relationName: 'comment_replies',
  }),
  likes: many(commentLikes),
}));

export const commentLikesRelations = relations(commentLikes, ({ one }) => ({
  user: one(user, {
    fields: [commentLikes.userId],
    references: [user.id],
  }),
  comment: one(comments, {
    fields: [commentLikes.commentId],
    references: [comments.id],
  }),
}));

export const watchHistory = pgTable('watch_history', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  mediaId: integer('media_id').notNull(),
  mediaType: text('media_type').notNull(),
  season: integer('season'),
  episode: integer('episode'),
  progress: integer('progress').notNull().default(0), // Progress in seconds
  duration: integer('duration').notNull().default(0), // Total duration in seconds
  title: text('title').notNull(),
  posterPath: text('poster_path'),
  backdropPath: text('backdrop_path'),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const watchHistoryRelations = relations(watchHistory, ({ one }) => ({
  user: one(user, {
    fields: [watchHistory.userId],
    references: [user.id],
  }),
}));

// ===== Social App Tables =====

export const conversations = pgTable('conversations', {
  id: text('id').primaryKey(),
  isGroup: boolean('is_group').notNull().default(false),
  name: text('name'),
  lastMessageAt: timestamp('last_message_at').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const conversationParticipants = pgTable('conversation_participants', {
  id: text('id').primaryKey(),
  conversationId: text('conversation_id').notNull().references(() => conversations.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  hasUnread: boolean('has_unread').notNull().default(false),
  joinedAt: timestamp('joined_at').defaultNow().notNull(),
});

export const messages = pgTable('messages', {
  id: text('id').primaryKey(),
  conversationId: text('conversation_id').notNull().references(() => conversations.id, { onDelete: 'cascade' }),
  senderId: text('sender_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const messageReactions = pgTable('message_reactions', {
  id: text('id').primaryKey(),
  messageId: text('message_id').notNull().references(() => messages.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  emoji: text('emoji').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const socialRelations = relations(conversations, ({ many }) => ({
  participants: many(conversationParticipants),
  messages: many(messages),
}));

export const messageRelations = relations(messages, ({ one, many }) => ({
  conversation: one(conversations, {
    fields: [messages.conversationId],
    references: [conversations.id],
  }),
  sender: one(user, {
    fields: [messages.senderId],
    references: [user.id],
  }),
  reactions: many(messageReactions),
}));

export const messageReactionsRelations = relations(messageReactions, ({ one }) => ({
  message: one(messages, {
    fields: [messageReactions.messageId],
    references: [messages.id],
  }),
  user: one(user, {
    fields: [messageReactions.userId],
    references: [user.id],
  }),
}));

export const notifications = pgTable('notifications', {
  id: text('id').primaryKey(),
  recipientId: text('recipient_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  senderId: text('sender_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  type: text('type').notNull(), // 'reply', 'mention', 'like'
  mediaId: integer('media_id'),
  mediaType: text('media_type'),
  season: integer('season'),
  episode: integer('episode'),
  commentId: text('comment_id').references(() => comments.id, { onDelete: 'cascade' }),
  isRead: boolean('is_read').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const notificationsRelations = relations(notifications, ({ one }) => ({
  recipient: one(user, {
    fields: [notifications.recipientId],
    references: [user.id],
    relationName: 'recipient_notifications',
  }),
  sender: one(user, {
    fields: [notifications.senderId],
    references: [user.id],
    relationName: 'sender_notifications',
  }),
  comment: one(comments, {
    fields: [notifications.commentId],
    references: [comments.id],
  }),
}));

// ===== Admin Expansion Tables =====

export const announcements = pgTable('announcements', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  message: text('message').notNull(),
  type: text('type').notNull().default('info'), // 'info', 'warning', 'error', 'success'
  isActive: boolean('is_active').notNull().default(true),
  createdBy: text('created_by').notNull().references(() => user.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const auditLogs = pgTable('audit_logs', {
  id: text('id').primaryKey(),
  adminId: text('admin_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  action: text('action').notNull(), // e.g. 'delete_comment', 'ban_user', 'blacklist_media'
  details: text('details'), // JSON stringified or raw text
  targetId: text('target_id'), // ID of the user/comment/media affected
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const blacklistedMedia = pgTable('blacklisted_media', {
  id: text('id').primaryKey(), // Usually `${mediaType}_${mediaId}` or `${mediaType}_${mediaId}_s${season}` or `${mediaType}_${mediaId}_s${season}e${episode}`
  mediaId: integer('media_id').notNull(),
  mediaType: text('media_type').notNull(),
  season: integer('season'),
  episode: integer('episode'),
  reason: text('reason'),
  adminId: text('admin_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const adminRelations = relations(auditLogs, ({ one }) => ({
  admin: one(user, {
    fields: [auditLogs.adminId],
    references: [user.id],
  }),
}));
