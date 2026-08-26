import { pgTable, text, timestamp, boolean, integer } from 'drizzle-orm/pg-core';

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
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
