import { db } from './db';
import { 
  users, 
  collectibles, 
  trades, 
  posts, 
  likes, 
  comments, 
  follows,
  User,
  Collectible,
  Trade,
  Post,
  Comment,
  Like,
  Follow,
  InsertUser,
  InsertCollectible,
  InsertTrade,
  InsertPost,
  InsertComment,
  InsertLike,
  InsertFollow,
  CollectibleWithUser,
  TradeWithDetails,
  PostWithDetails 
} from '@shared/schema';
import { eq, and, or, desc, asc, sql, inArray, ne } from 'drizzle-orm';
import connectPg from "connect-pg-simple";
import session from "express-session";
import { alias } from 'drizzle-orm/pg-core';

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // Session store for user authentication
  sessionStore: session.Store;

  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, data: Partial<User>): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  searchUsers(query: string): Promise<User[]>;
  
  // Collectible operations
  getCollectible(id: number): Promise<Collectible | undefined>;
  getUserCollectibles(userId: number): Promise<Collectible[]>;
  createCollectible(collectible: InsertCollectible): Promise<Collectible>;
  updateCollectible(id: number, data: Partial<Collectible>): Promise<Collectible | undefined>;
  deleteCollectible(id: number): Promise<boolean>;
  getCollectiblesForTrade(): Promise<CollectibleWithUser[]>;
  searchCollectibles(query: string): Promise<Collectible[]>;
  
  // Trade operations
  getTrade(id: number): Promise<Trade | undefined>;
  getTradeWithDetails(id: number): Promise<TradeWithDetails | undefined>;
  getUserTrades(userId: number): Promise<Trade[]>;
  getUserTradesWithDetails(userId: number): Promise<TradeWithDetails[]>;
  createTrade(trade: InsertTrade): Promise<Trade>;
  updateTradeStatus(id: number, status: string): Promise<Trade | undefined>;
  
  // Post operations
  getPost(id: number): Promise<Post | undefined>;
  getUserPosts(userId: number): Promise<Post[]>;
  createPost(post: InsertPost): Promise<Post>;
  deletePost(id: number): Promise<boolean>;
  getFeedPosts(currentUserId?: number): Promise<PostWithDetails[]>;
  
  // Like operations
  getLike(userId: number, postId: number): Promise<Like | undefined>;
  createLike(like: InsertLike): Promise<Like>;
  deleteLike(userId: number, postId: number): Promise<boolean>;
  getPostLikes(postId: number): Promise<Like[]>;
  
  // Comment operations
  getComment(id: number): Promise<Comment | undefined>;
  getPostComments(postId: number): Promise<Comment[]>;
  createComment(comment: InsertComment): Promise<Comment>;
  deleteComment(id: number): Promise<boolean>;
  
  // Follow operations
  getFollow(followerId: number, followingId: number): Promise<Follow | undefined>;
  createFollow(follow: InsertFollow): Promise<Follow>;
  deleteFollow(followerId: number, followingId: number): Promise<boolean>;
  getUserFollowers(userId: number): Promise<User[]>;
  getUserFollowing(userId: number): Promise<User[]>;
  getRecommendedUsers(userId: number): Promise<User[]>;
  
  // Notification operations
  getUserNotifications(userId: number, limit?: number, includingRead?: boolean): Promise<NotificationWithActor[]>;
  getNotification(id: number): Promise<Notification | undefined>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(id: number): Promise<boolean>;
  markAllUserNotificationsAsRead(userId: number): Promise<boolean>;
  getUnreadNotificationCount(userId: number): Promise<number>;
  deleteNotification(id: number): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool: db.$client,
      createTableIfMissing: true
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(userData: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  }

  async updateUser(id: number, data: Partial<User>): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set(data)
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  async getAllUsers(): Promise<User[]> {
    return db.select().from(users);
  }

  async searchUsers(query: string): Promise<User[]> {
    return db
      .select()
      .from(users)
      .where(
        or(
          sql`${users.username} ILIKE ${`%${query}%`}`,
          sql`${users.displayName} ILIKE ${`%${query}%`}`
        )
      );
  }

  // Collectible operations
  async getCollectible(id: number): Promise<Collectible | undefined> {
    const [collectible] = await db
      .select()
      .from(collectibles)
      .where(eq(collectibles.id, id));
    return collectible;
  }

  async getUserCollectibles(userId: number): Promise<Collectible[]> {
    return db
      .select()
      .from(collectibles)
      .where(eq(collectibles.userId, userId));
  }

  async createCollectible(collectibleData: InsertCollectible): Promise<Collectible> {
    const [collectible] = await db
      .insert(collectibles)
      .values({
        ...collectibleData,
        description: collectibleData.description || null,
        forTrade: collectibleData.forTrade || false
      })
      .returning();
    return collectible;
  }

  async updateCollectible(id: number, data: Partial<Collectible>): Promise<Collectible | undefined> {
    const [updatedCollectible] = await db
      .update(collectibles)
      .set(data)
      .where(eq(collectibles.id, id))
      .returning();
    return updatedCollectible;
  }

  async deleteCollectible(id: number): Promise<boolean> {
    const result = await db
      .delete(collectibles)
      .where(eq(collectibles.id, id));
    return true;
  }

  async getCollectiblesForTrade(): Promise<CollectibleWithUser[]> {
    const result = await db
      .select({
        collectible: collectibles,
        user: {
          id: users.id,
          username: users.username,
          displayName: users.displayName,
          profileImage: users.profileImage
        }
      })
      .from(collectibles)
      .innerJoin(users, eq(collectibles.userId, users.id))
      .where(eq(collectibles.forTrade, true));

    return result.map(({ collectible, user }) => ({
      ...collectible,
      user: {
        ...user,
        password: '', // Ensure password is never exposed
        email: '',    // Ensure email is never exposed
        bio: null,
        joinedAt: new Date()
      }
    }));
  }

  async searchCollectibles(query: string): Promise<Collectible[]> {
    return db
      .select()
      .from(collectibles)
      .where(
        or(
          sql`${collectibles.name} ILIKE ${`%${query}%`}`,
          sql`${collectibles.variant} ILIKE ${`%${query}%`}`,
          sql`${collectibles.series} ILIKE ${`%${query}%`}`
        )
      );
  }

  // Trade operations
  async getTrade(id: number): Promise<Trade | undefined> {
    const [trade] = await db
      .select()
      .from(trades)
      .where(eq(trades.id, id));
    return trade;
  }

  async getTradeWithDetails(id: number): Promise<TradeWithDetails | undefined> {
    // Create aliases for tables to resolve circular reference issues
    const proposerUserTable = alias(users, 'proposerUser');
    const receiverUserTable = alias(users, 'receiverUser');
    const proposerCollectibleTable = alias(collectibles, 'proposerCollectible');
    const receiverCollectibleTable = alias(collectibles, 'receiverCollectible');

    const result = await db
      .select({
        trade: trades,
        proposer: {
          id: proposerUserTable.id,
          username: proposerUserTable.username,
          displayName: proposerUserTable.displayName,
          profileImage: proposerUserTable.profileImage
        },
        receiver: {
          id: receiverUserTable.id,
          username: receiverUserTable.username,
          displayName: receiverUserTable.displayName,
          profileImage: receiverUserTable.profileImage
        },
        proposerCollectible: proposerCollectibleTable,
        receiverCollectible: receiverCollectibleTable
      })
      .from(trades)
      .innerJoin(proposerUserTable, eq(trades.proposerId, proposerUserTable.id))
      .innerJoin(receiverUserTable, eq(trades.receiverId, receiverUserTable.id))
      .innerJoin(proposerCollectibleTable, eq(trades.proposerCollectibleId, proposerCollectibleTable.id))
      .innerJoin(receiverCollectibleTable, eq(trades.receiverCollectibleId, receiverCollectibleTable.id))
      .where(eq(trades.id, id));

    if (result.length === 0) return undefined;

    const { trade, proposer, receiver, proposerCollectible, receiverCollectible } = result[0];
    return {
      ...trade,
      proposer,
      receiver,
      proposerCollectible,
      receiverCollectible
    };
  }

  async getUserTrades(userId: number): Promise<Trade[]> {
    return db
      .select()
      .from(trades)
      .where(
        or(
          eq(trades.proposerId, userId),
          eq(trades.receiverId, userId)
        )
      );
  }

  async getUserTradesWithDetails(userId: number): Promise<TradeWithDetails[]> {
    // Create aliases for tables
    const proposerUserTable = alias(users, 'proposerUser');
    const receiverUserTable = alias(users, 'receiverUser');
    const proposerCollectibleTable = alias(collectibles, 'proposerCollectible');
    const receiverCollectibleTable = alias(collectibles, 'receiverCollectible');

    const result = await db
      .select({
        trade: trades,
        proposer: {
          id: proposerUserTable.id,
          username: proposerUserTable.username,
          displayName: proposerUserTable.displayName,
          profileImage: proposerUserTable.profileImage
        },
        receiver: {
          id: receiverUserTable.id,
          username: receiverUserTable.username,
          displayName: receiverUserTable.displayName,
          profileImage: receiverUserTable.profileImage
        },
        proposerCollectible: proposerCollectibleTable,
        receiverCollectible: receiverCollectibleTable
      })
      .from(trades)
      .innerJoin(proposerUserTable, eq(trades.proposerId, proposerUserTable.id))
      .innerJoin(receiverUserTable, eq(trades.receiverId, receiverUserTable.id))
      .innerJoin(proposerCollectibleTable, eq(trades.proposerCollectibleId, proposerCollectibleTable.id))
      .innerJoin(receiverCollectibleTable, eq(trades.receiverCollectibleId, receiverCollectibleTable.id))
      .where(
        or(
          eq(trades.proposerId, userId),
          eq(trades.receiverId, userId)
        )
      );

    return result.map(({ trade, proposer, receiver, proposerCollectible, receiverCollectible }) => ({
      ...trade,
      proposer,
      receiver,
      proposerCollectible,
      receiverCollectible
    }));
  }

  async createTrade(tradeData: InsertTrade): Promise<Trade> {
    const [trade] = await db
      .insert(trades)
      .values({
        ...tradeData,
        message: tradeData.message || null,
        status: "pending",
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    return trade;
  }

  async updateTradeStatus(id: number, status: string): Promise<Trade | undefined> {
    const [updatedTrade] = await db
      .update(trades)
      .set({
        status,
        updatedAt: new Date()
      })
      .where(eq(trades.id, id))
      .returning();
    return updatedTrade;
  }

  // Post operations
  async getPost(id: number): Promise<Post | undefined> {
    const [post] = await db
      .select()
      .from(posts)
      .where(eq(posts.id, id));
    return post;
  }

  async getUserPosts(userId: number): Promise<Post[]> {
    return db
      .select()
      .from(posts)
      .where(eq(posts.userId, userId))
      .orderBy(desc(posts.createdAt));
  }

  async createPost(postData: InsertPost): Promise<Post> {
    const [post] = await db
      .insert(posts)
      .values({
        ...postData,
        images: postData.images || null,
        createdAt: new Date()
      })
      .returning();
    return post;
  }

  async deletePost(id: number): Promise<boolean> {
    // Delete associated likes and comments first
    await db.delete(likes).where(eq(likes.postId, id));
    await db.delete(comments).where(eq(comments.postId, id));
    
    // Then delete the post
    await db.delete(posts).where(eq(posts.id, id));
    return true;
  }

  async getFeedPosts(currentUserId?: number): Promise<PostWithDetails[]> {
    const userLikes = currentUserId 
      ? db.select().from(likes).where(eq(likes.userId, currentUserId))
      : [];
      
    const result = await db
      .select({
        post: posts,
        user: {
          id: users.id,
          username: users.username,
          displayName: users.displayName,
          profileImage: users.profileImage
        },
        likesCount: sql`count(distinct ${likes.id})::int`,
        commentsCount: sql`count(distinct ${comments.id})::int`
      })
      .from(posts)
      .leftJoin(likes, eq(posts.id, likes.postId))
      .leftJoin(comments, eq(posts.id, comments.postId))
      .innerJoin(users, eq(posts.userId, users.id))
      .groupBy(posts.id, users.id)
      .orderBy(desc(posts.createdAt));

    const likesMap = new Map();
    if (currentUserId) {
      const userLikes = await db
        .select()
        .from(likes)
        .where(eq(likes.userId, currentUserId));
      
      userLikes.forEach(like => {
        likesMap.set(like.postId, true);
      });
    }

    return result.map(({ post, user, likesCount, commentsCount }) => ({
      ...post,
      user,
      likesCount,
      commentsCount,
      liked: likesMap.has(post.id)
    }));
  }

  // Like operations
  async getLike(userId: number, postId: number): Promise<Like | undefined> {
    const [like] = await db
      .select()
      .from(likes)
      .where(
        and(
          eq(likes.userId, userId),
          eq(likes.postId, postId)
        )
      );
    return like;
  }

  async createLike(likeData: InsertLike): Promise<Like> {
    const [like] = await db
      .insert(likes)
      .values({
        ...likeData,
        createdAt: new Date()
      })
      .returning();
    return like;
  }

  async deleteLike(userId: number, postId: number): Promise<boolean> {
    await db
      .delete(likes)
      .where(
        and(
          eq(likes.userId, userId),
          eq(likes.postId, postId)
        )
      );
    return true;
  }

  async getPostLikes(postId: number): Promise<Like[]> {
    return db
      .select()
      .from(likes)
      .where(eq(likes.postId, postId));
  }

  // Comment operations
  async getComment(id: number): Promise<Comment | undefined> {
    const [comment] = await db
      .select()
      .from(comments)
      .where(eq(comments.id, id));
    return comment;
  }

  async getPostComments(postId: number): Promise<Comment[]> {
    const result = await db
      .select({
        comment: comments,
        user: {
          id: users.id,
          username: users.username,
          displayName: users.displayName,
          profileImage: users.profileImage
        }
      })
      .from(comments)
      .innerJoin(users, eq(comments.userId, users.id))
      .where(eq(comments.postId, postId))
      .orderBy(asc(comments.createdAt));

    return result.map(({ comment, user }) => ({
      ...comment,
      user
    }));
  }

  async createComment(commentData: InsertComment): Promise<Comment> {
    const [comment] = await db
      .insert(comments)
      .values({
        ...commentData,
        createdAt: new Date()
      })
      .returning();
    return comment;
  }

  async deleteComment(id: number): Promise<boolean> {
    await db
      .delete(comments)
      .where(eq(comments.id, id));
    return true;
  }

  // Follow operations
  async getFollow(followerId: number, followingId: number): Promise<Follow | undefined> {
    const [follow] = await db
      .select()
      .from(follows)
      .where(
        and(
          eq(follows.followerId, followerId),
          eq(follows.followingId, followingId)
        )
      );
    return follow;
  }

  async createFollow(followData: InsertFollow): Promise<Follow> {
    const [follow] = await db
      .insert(follows)
      .values({
        ...followData,
        createdAt: new Date()
      })
      .returning();
    return follow;
  }

  async deleteFollow(followerId: number, followingId: number): Promise<boolean> {
    await db
      .delete(follows)
      .where(
        and(
          eq(follows.followerId, followerId),
          eq(follows.followingId, followingId)
        )
      );
    return true;
  }

  async getUserFollowers(userId: number): Promise<User[]> {
    const result = await db
      .select({
        id: users.id,
        username: users.username,
        displayName: users.displayName,
        email: users.email,
        profileImage: users.profileImage,
        bio: users.bio,
        joinedAt: users.joinedAt
      })
      .from(follows)
      .innerJoin(users, eq(follows.followerId, users.id))
      .where(eq(follows.followingId, userId));

    return result;
  }

  async getUserFollowing(userId: number): Promise<User[]> {
    const result = await db
      .select({
        id: users.id,
        username: users.username,
        displayName: users.displayName,
        email: users.email,
        profileImage: users.profileImage,
        bio: users.bio,
        joinedAt: users.joinedAt
      })
      .from(follows)
      .innerJoin(users, eq(follows.followingId, users.id))
      .where(eq(follows.followerId, userId));

    return result;
  }

  async getRecommendedUsers(userId: number): Promise<User[]> {
    // Get users that the current user is not following
    // and that have similar collectible interests (same series)
    const userCollectibles = await this.getUserCollectibles(userId);
    const userSeries = [...new Set(userCollectibles.map(c => c.series))];
    
    if (userSeries.length === 0) {
      // If user has no collectibles, just return some random users
      return db
        .select()
        .from(users)
        .where(sql`${users.id} != ${userId}`)
        .limit(5);
    }

    // Get users who have collectibles in the same series
    const followingUserIds = (await this.getUserFollowing(userId)).map(u => u.id);
    followingUserIds.push(userId); // Add current user to exclusion list
    
    // Find users with similar interests who are not already followed
    const result = await db
      .select({
        id: users.id,
        username: users.username,
        displayName: users.displayName,
        email: users.email,
        profileImage: users.profileImage,
        bio: users.bio,
        joinedAt: users.joinedAt,
        matchCount: sql`count(distinct ${collectibles.id})::int`
      })
      .from(users)
      .innerJoin(collectibles, eq(users.id, collectibles.userId))
      .where(
        and(
          ne(users.id, userId), // Not the current user
          inArray(collectibles.series, userSeries)
        )
      )
      .groupBy(users.id)
      .orderBy(desc(sql`count(distinct ${collectibles.id})`))
      .limit(5);
    
    return result;
  }
}

export const storage = new DatabaseStorage();