import {
  users, User, InsertUser,
  collectibles, Collectible, InsertCollectible,
  trades, Trade, InsertTrade,
  posts, Post, InsertPost,
  likes, Like, InsertLike,
  comments, Comment, InsertComment,
  follows, Follow, InsertFollow,
  CollectibleWithUser, TradeWithDetails, PostWithDetails
} from "@shared/schema";

// Define the storage interface with CRUD operations
export interface IStorage {
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
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private collectibles: Map<number, Collectible>;
  private trades: Map<number, Trade>;
  private posts: Map<number, Post>;
  private likes: Map<number, Like>;
  private comments: Map<number, Comment>;
  private follows: Map<number, Follow>;
  
  private userId: number;
  private collectibleId: number;
  private tradeId: number;
  private postId: number;
  private likeId: number;
  private commentId: number;
  private followId: number;

  constructor() {
    this.users = new Map();
    this.collectibles = new Map();
    this.trades = new Map();
    this.posts = new Map();
    this.likes = new Map();
    this.comments = new Map();
    this.follows = new Map();
    
    this.userId = 1;
    this.collectibleId = 1;
    this.tradeId = 1;
    this.postId = 1;
    this.likeId = 1;
    this.commentId = 1;
    this.followId = 1;
    
    // Initialize with sample data
    this.initializeData();
  }

  private initializeData() {
    // Create demo users
    const user1 = this.createUser({
      username: 'johndoe',
      password: 'password123',
      email: 'john@example.com',
      displayName: 'John Doe',
      bio: 'PopMart collector since 2020',
      profileImage: 'https://images.unsplash.com/photo-1517841905240-472988babdf9'
    });
    
    const user2 = this.createUser({
      username: 'janedoe',
      password: 'password123',
      email: 'jane@example.com',
      displayName: 'Jane Doe',
      bio: 'Collecting cute figures is my passion',
      profileImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb'
    });
    
    // Add some collectibles
    this.createCollectible({
      userId: user1.id,
      name: 'Dimoo Candy Series',
      series: 'Dimoo',
      variant: 'Strawberry Dream',
      rarity: 'rare',
      image: 'https://pixabay.com/get/ge2e2feeb6d154376f5b096a59f55815948fa2d5589d58f822ce7e9532c6d1a6d78fddd2f01baf36a15d4b3f923041d48291cc569a5eb9a9ec23bf426bb9b6240_1280.jpg',
      description: 'A cute pink Dimoo with strawberry theme',
      forTrade: true
    });
    
    this.createCollectible({
      userId: user1.id,
      name: 'Skullpanda Space',
      series: 'Skullpanda',
      variant: 'Cosmic Explorer',
      rarity: 'common',
      image: 'https://images.unsplash.com/photo-1598541264502-84dc6aa2fb87',
      description: 'Skullpanda with space theme',
      forTrade: true
    });
    
    this.createCollectible({
      userId: user2.id,
      name: 'Molly Ocean Series',
      series: 'Molly',
      variant: 'Coral Guardian',
      rarity: 'ultra-rare',
      image: 'https://images.unsplash.com/photo-1581557991964-125469da3b8a',
      description: 'Molly with ocean theme',
      forTrade: true
    });
    
    // Create some posts
    this.createPost({
      userId: user1.id,
      content: 'Just added the new Molly Ocean Series to my collection! So excited to have completed the set! 🎉',
      images: ['https://images.unsplash.com/photo-1581557991964-125469da3b8a', 'https://pixabay.com/get/g8a02240ad8e3bd3a93c22c79cf6be25064d2e0285442774e722323b316975c059d2541708fdabcc28834b52a2fd85b096f7879c38b9a5bd5dd496a3a3f490c18_1280.jpg']
    });
    
    this.createPost({
      userId: user2.id,
      content: 'Went to the PopMart event today and scored this limited edition Dimoo! Anyone want to trade?',
      images: ['https://pixabay.com/get/gf4e840ac42e9740b2a302024beb929eee0f10ec849670dfcf09a7664157319178e3d8644cc6176599932fb5b28ca8a318b3b16309601e3b6c4e4abf356ccd614_1280.jpg']
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(userData: InsertUser): Promise<User> {
    const id = this.userId++;
    const now = new Date();
    const user: User = { ...userData, id, joinedAt: now };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, data: Partial<User>): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...data };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async searchUsers(query: string): Promise<User[]> {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.users.values()).filter(
      user => 
        user.username.toLowerCase().includes(lowerQuery) || 
        user.displayName.toLowerCase().includes(lowerQuery)
    );
  }

  // Collectible operations
  async getCollectible(id: number): Promise<Collectible | undefined> {
    return this.collectibles.get(id);
  }

  async getUserCollectibles(userId: number): Promise<Collectible[]> {
    return Array.from(this.collectibles.values()).filter(
      collectible => collectible.userId === userId
    );
  }

  async createCollectible(collectibleData: InsertCollectible): Promise<Collectible> {
    const id = this.collectibleId++;
    const now = new Date();
    const collectible: Collectible = { ...collectibleData, id, addedAt: now };
    this.collectibles.set(id, collectible);
    return collectible;
  }

  async updateCollectible(id: number, data: Partial<Collectible>): Promise<Collectible | undefined> {
    const collectible = await this.getCollectible(id);
    if (!collectible) return undefined;
    
    const updatedCollectible = { ...collectible, ...data };
    this.collectibles.set(id, updatedCollectible);
    return updatedCollectible;
  }

  async deleteCollectible(id: number): Promise<boolean> {
    return this.collectibles.delete(id);
  }

  async getCollectiblesForTrade(): Promise<CollectibleWithUser[]> {
    const collectiblesForTrade = Array.from(this.collectibles.values())
      .filter(collectible => collectible.forTrade);
    
    return Promise.all(collectiblesForTrade.map(async collectible => {
      const user = await this.getUser(collectible.userId);
      return {
        ...collectible,
        user: user!
      };
    }));
  }

  async searchCollectibles(query: string): Promise<Collectible[]> {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.collectibles.values()).filter(
      collectible => 
        collectible.name.toLowerCase().includes(lowerQuery) || 
        collectible.series.toLowerCase().includes(lowerQuery) || 
        collectible.variant.toLowerCase().includes(lowerQuery)
    );
  }

  // Trade operations
  async getTrade(id: number): Promise<Trade | undefined> {
    return this.trades.get(id);
  }

  async getTradeWithDetails(id: number): Promise<TradeWithDetails | undefined> {
    const trade = await this.getTrade(id);
    if (!trade) return undefined;
    
    const proposer = await this.getUser(trade.proposerId);
    const receiver = await this.getUser(trade.receiverId);
    const proposerCollectible = await this.getCollectible(trade.proposerCollectibleId);
    const receiverCollectible = await this.getCollectible(trade.receiverCollectibleId);
    
    if (!proposer || !receiver || !proposerCollectible || !receiverCollectible) return undefined;
    
    return {
      ...trade,
      proposer,
      receiver,
      proposerCollectible,
      receiverCollectible
    };
  }

  async getUserTrades(userId: number): Promise<Trade[]> {
    return Array.from(this.trades.values()).filter(
      trade => trade.proposerId === userId || trade.receiverId === userId
    );
  }

  async getUserTradesWithDetails(userId: number): Promise<TradeWithDetails[]> {
    const trades = await this.getUserTrades(userId);
    
    return Promise.all(trades.map(async trade => {
      const proposer = await this.getUser(trade.proposerId);
      const receiver = await this.getUser(trade.receiverId);
      const proposerCollectible = await this.getCollectible(trade.proposerCollectibleId);
      const receiverCollectible = await this.getCollectible(trade.receiverCollectibleId);
      
      if (!proposer || !receiver || !proposerCollectible || !receiverCollectible) {
        throw new Error('Missing related data for trade');
      }
      
      return {
        ...trade,
        proposer,
        receiver,
        proposerCollectible,
        receiverCollectible
      };
    }));
  }

  async createTrade(tradeData: InsertTrade): Promise<Trade> {
    const id = this.tradeId++;
    const now = new Date();
    const trade: Trade = { 
      ...tradeData, 
      id, 
      status: 'pending', 
      createdAt: now,
      updatedAt: now
    };
    this.trades.set(id, trade);
    return trade;
  }

  async updateTradeStatus(id: number, status: string): Promise<Trade | undefined> {
    const trade = await this.getTrade(id);
    if (!trade) return undefined;
    
    const updatedTrade = { 
      ...trade, 
      status, 
      updatedAt: new Date() 
    };
    this.trades.set(id, updatedTrade);
    return updatedTrade;
  }

  // Post operations
  async getPost(id: number): Promise<Post | undefined> {
    return this.posts.get(id);
  }

  async getUserPosts(userId: number): Promise<Post[]> {
    return Array.from(this.posts.values())
      .filter(post => post.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async createPost(postData: InsertPost): Promise<Post> {
    const id = this.postId++;
    const now = new Date();
    const post: Post = { ...postData, id, createdAt: now };
    this.posts.set(id, post);
    return post;
  }

  async deletePost(id: number): Promise<boolean> {
    // Delete all related likes and comments first
    const likes = Array.from(this.likes.values()).filter(like => like.postId === id);
    likes.forEach(like => this.likes.delete(like.id));
    
    const comments = Array.from(this.comments.values()).filter(comment => comment.postId === id);
    comments.forEach(comment => this.comments.delete(comment.id));
    
    return this.posts.delete(id);
  }

  async getFeedPosts(currentUserId?: number): Promise<PostWithDetails[]> {
    const allPosts = Array.from(this.posts.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    
    return Promise.all(allPosts.map(async post => {
      const user = await this.getUser(post.userId);
      if (!user) throw new Error('User not found for post');
      
      const likesCount = Array.from(this.likes.values())
        .filter(like => like.postId === post.id)
        .length;
      
      const commentsCount = Array.from(this.comments.values())
        .filter(comment => comment.postId === post.id)
        .length;
      
      let liked = false;
      if (currentUserId) {
        liked = !!Array.from(this.likes.values()).find(
          like => like.postId === post.id && like.userId === currentUserId
        );
      }
      
      return {
        ...post,
        user,
        likesCount,
        commentsCount,
        liked
      };
    }));
  }

  // Like operations
  async getLike(userId: number, postId: number): Promise<Like | undefined> {
    return Array.from(this.likes.values()).find(
      like => like.userId === userId && like.postId === postId
    );
  }

  async createLike(likeData: InsertLike): Promise<Like> {
    const id = this.likeId++;
    const now = new Date();
    const like: Like = { ...likeData, id, createdAt: now };
    this.likes.set(id, like);
    return like;
  }

  async deleteLike(userId: number, postId: number): Promise<boolean> {
    const like = await this.getLike(userId, postId);
    if (!like) return false;
    return this.likes.delete(like.id);
  }

  async getPostLikes(postId: number): Promise<Like[]> {
    return Array.from(this.likes.values())
      .filter(like => like.postId === postId);
  }

  // Comment operations
  async getComment(id: number): Promise<Comment | undefined> {
    return this.comments.get(id);
  }

  async getPostComments(postId: number): Promise<Comment[]> {
    return Array.from(this.comments.values())
      .filter(comment => comment.postId === postId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  async createComment(commentData: InsertComment): Promise<Comment> {
    const id = this.commentId++;
    const now = new Date();
    const comment: Comment = { ...commentData, id, createdAt: now };
    this.comments.set(id, comment);
    return comment;
  }

  async deleteComment(id: number): Promise<boolean> {
    return this.comments.delete(id);
  }

  // Follow operations
  async getFollow(followerId: number, followingId: number): Promise<Follow | undefined> {
    return Array.from(this.follows.values()).find(
      follow => follow.followerId === followerId && follow.followingId === followingId
    );
  }

  async createFollow(followData: InsertFollow): Promise<Follow> {
    const id = this.followId++;
    const now = new Date();
    const follow: Follow = { ...followData, id, createdAt: now };
    this.follows.set(id, follow);
    return follow;
  }

  async deleteFollow(followerId: number, followingId: number): Promise<boolean> {
    const follow = await this.getFollow(followerId, followingId);
    if (!follow) return false;
    return this.follows.delete(follow.id);
  }

  async getUserFollowers(userId: number): Promise<User[]> {
    const followerIds = Array.from(this.follows.values())
      .filter(follow => follow.followingId === userId)
      .map(follow => follow.followerId);
    
    return Promise.all(followerIds.map(id => this.getUser(id)))
      .then(users => users.filter((user): user is User => user !== undefined));
  }

  async getUserFollowing(userId: number): Promise<User[]> {
    const followingIds = Array.from(this.follows.values())
      .filter(follow => follow.followerId === userId)
      .map(follow => follow.followingId);
    
    return Promise.all(followingIds.map(id => this.getUser(id)))
      .then(users => users.filter((user): user is User => user !== undefined));
  }

  async getRecommendedUsers(userId: number): Promise<User[]> {
    // Simple implementation to return all users except the current user
    // and those the user is already following
    const following = await this.getUserFollowing(userId);
    const followingIds = following.map(user => user.id);
    
    return Array.from(this.users.values())
      .filter(user => user.id !== userId && !followingIds.includes(user.id));
  }
}

export const storage = new MemStorage();
