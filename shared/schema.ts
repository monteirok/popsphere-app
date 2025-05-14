import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  displayName: text("display_name").notNull(),
  bio: text("bio"),
  profileImage: text("profile_image"),
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  joinedAt: true,
});

// Collectible items schema
export const collectibles = pgTable("collectibles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  series: text("series").notNull(),
  variant: text("variant").notNull(),
  rarity: text("rarity").notNull(), // "common", "rare", "ultra-rare", "limited"
  image: text("image").notNull(),
  description: text("description"),
  addedAt: timestamp("added_at").defaultNow().notNull(),
  forTrade: boolean("for_trade").default(false).notNull(),
});

export const insertCollectibleSchema = createInsertSchema(collectibles).omit({
  id: true,
  addedAt: true,
});

// Trades schema
export const trades = pgTable("trades", {
  id: serial("id").primaryKey(),
  proposerId: integer("proposer_id").notNull().references(() => users.id),
  receiverId: integer("receiver_id").notNull().references(() => users.id),
  proposerCollectibleId: integer("proposer_collectible_id").notNull().references(() => collectibles.id),
  receiverCollectibleId: integer("receiver_collectible_id").notNull().references(() => collectibles.id),
  message: text("message"),
  status: text("status").notNull().default("pending"), // "pending", "accepted", "rejected", "completed"
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertTradeSchema = createInsertSchema(trades).omit({
  id: true,
  status: true,
  createdAt: true,
  updatedAt: true,
});

// Posts schema for community feed
export const posts = pgTable("posts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  images: text("images").array(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertPostSchema = createInsertSchema(posts).omit({
  id: true,
  createdAt: true,
});

// Likes schema
export const likes = pgTable("likes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  postId: integer("post_id").notNull().references(() => posts.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertLikeSchema = createInsertSchema(likes).omit({
  id: true,
  createdAt: true,
});

// Comments schema
export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  postId: integer("post_id").notNull().references(() => posts.id),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertCommentSchema = createInsertSchema(comments).omit({
  id: true,
  createdAt: true,
});

// Follows schema
export const follows = pgTable("follows", {
  id: serial("id").primaryKey(),
  followerId: integer("follower_id").notNull().references(() => users.id),
  followingId: integer("following_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertFollowSchema = createInsertSchema(follows).omit({
  id: true,
  createdAt: true,
});

// Trade chat messages schema
export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  tradeId: integer("trade_id").notNull().references(() => trades.id, { onDelete: "cascade" }),
  senderId: integer("sender_id").notNull().references(() => users.id),
  message: text("message").notNull(),
  isPinned: boolean("is_pinned").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({
  id: true,
  createdAt: true,
});

// Types for frontend usage
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Collectible = typeof collectibles.$inferSelect;
export type InsertCollectible = z.infer<typeof insertCollectibleSchema>;

export type Trade = typeof trades.$inferSelect;
export type InsertTrade = z.infer<typeof insertTradeSchema>;

export type Post = typeof posts.$inferSelect;
export type InsertPost = z.infer<typeof insertPostSchema>;

export type Like = typeof likes.$inferSelect;
export type InsertLike = z.infer<typeof insertLikeSchema>;

export type Comment = typeof comments.$inferSelect;
export type InsertComment = z.infer<typeof insertCommentSchema>;

export type Follow = typeof follows.$inferSelect;
export type InsertFollow = z.infer<typeof insertFollowSchema>;

export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;

// Notifications schema
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // trade_request, trade_accepted, trade_rejected, trade_completed, follow, like, comment
  content: text("content").notNull(),
  sourceId: integer("source_id"), // ID of the related trade, post, comment, etc.
  sourceType: text("source_type"), // trade, post, comment, follow, etc.
  actorId: integer("actor_id").references(() => users.id), // User who triggered the notification
  read: boolean("read").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;

// Extended types with joined data
export type CollectibleWithUser = Collectible & {
  user: User;
};

export type TradeWithDetails = Trade & {
  proposer: User;
  receiver: User;
  proposerCollectible: Collectible;
  receiverCollectible: Collectible;
};

export type PostWithDetails = Post & {
  user: User;
  likesCount: number;
  commentsCount: number;
  liked?: boolean;
};

export type NotificationWithActor = Notification & {
  actor?: User;
};

export type ChatMessageWithSender = ChatMessage & {
  sender: User;
};
