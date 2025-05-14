import express, { type Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import path from "path";
import { 
  insertUserSchema, 
  insertCollectibleSchema, 
  insertTradeSchema, 
  insertPostSchema, 
  insertCommentSchema, 
  insertChatMessageSchema 
} from "@shared/schema";
import { setupAuth, isAuthenticated } from "./auth";
import { registerNotificationRoutes, createTradeRequestNotification, createTradeStatusNotification, createFollowNotification, createLikeNotification, createCommentNotification } from "./notifications";
import { upload, handleMulterError, getFileUrl } from "./upload";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication with database session storage
  setupAuth(app);
  
  // Register notification routes
  registerNotificationRoutes(app);
  
  // Serve static uploads
  app.use('/uploads', express.static('uploads'));
  
  // Add multer error handling middleware
  app.use(handleMulterError);

  // Auth routes are now handled by auth.ts
  // Using the '/api/user' endpoint for user session info
  // Using the '/api/register', '/api/login', and '/api/logout' endpoints for authentication

  // User routes
  app.get("/api/users/search", async (req, res) => {
    try {
      const query = req.query.q as string;
      
      if (!query || query.trim().length < 2) {
        return res.status(400).json({ message: "Search query too short. Minimum 2 characters required." });
      }
      
      const users = await storage.searchUsers(query);
      
      // Return user data without sensitive information
      const safeUsers = users.map(user => ({
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        profileImage: user.profileImage,
        profileBanner: user.profileBanner,
        bio: user.bio
      }));
      
      res.json(safeUsers);
    } catch (error) {
      console.error("Error searching users:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  
  app.get("/api/users/recommended", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      
      const recommendedUsers = await storage.getRecommendedUsers(user.id);
      
      // Return user data without sensitive information
      const safeRecommendedUsers = recommendedUsers.map(user => ({
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        profileImage: user.profileImage,
        profileBanner: user.profileBanner,
        bio: user.bio
      }));
      
      res.json(safeRecommendedUsers);
    } catch (error) {
      console.error("Error getting recommended users:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  
  app.get("/api/users/:idOrUsername", async (req, res) => {
    try {
      const idOrUsername = req.params.idOrUsername;
      let user;
      
      // Check if parameter is a number (id) or string (username)
      const userId = parseInt(idOrUsername, 10);
      
      if (!isNaN(userId)) {
        // If it's a valid number, fetch by ID
        user = await storage.getUser(userId);
      } else {
        // Otherwise, treat it as a username
        user = await storage.getUserByUsername(idOrUsername);
      }
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Return user data without sensitive information
      res.json({
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        profileImage: user.profileImage,
        profileBanner: user.profileBanner,
        bio: user.bio,
        joinedAt: user.joinedAt
      });
    } catch (error) {
      console.error("Error getting user:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Profile image upload endpoint
  app.post("/api/users/:id/profile-image", isAuthenticated, upload.single('image'), async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const currentUser = req.user as any;
      
      if (userId !== currentUser.id) {
        return res.status(403).json({ message: "You can only update your own profile" });
      }
      
      if (!req.file) {
        return res.status(400).json({ message: "No image file uploaded" });
      }
      
      // Get the relative path to the uploaded file
      const profileImagePath = `${req.file.path}`;
      
      // Update the user's profile image in the database
      const updatedUser = await storage.updateUser(userId, { profileImage: profileImagePath });
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json({
        id: updatedUser.id,
        profileImage: updatedUser.profileImage
      });
    } catch (error) {
      console.error("Error uploading profile image:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  
  // Profile banner upload endpoint
  app.post("/api/users/:id/banner", isAuthenticated, upload.single('image'), async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const currentUser = req.user as any;
      
      if (userId !== currentUser.id) {
        return res.status(403).json({ message: "You can only update your own profile banner" });
      }
      
      if (!req.file) {
        return res.status(400).json({ message: "No banner image file uploaded" });
      }
      
      // Get the relative path to the uploaded file
      const bannerPath = `${req.file.path}`;
      
      // Update the user's profile banner in the database
      const updatedUser = await storage.updateUser(userId, { profileBanner: bannerPath });
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json({
        id: updatedUser.id,
        profileBanner: updatedUser.profileBanner
      });
    } catch (error) {
      console.error("Error uploading profile banner:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  app.patch("/api/users/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const currentUser = req.user as any;
      
      if (userId !== currentUser.id) {
        return res.status(403).json({ message: "You can only update your own profile" });
      }
      
      const updateSchema = z.object({
        displayName: z.string().optional(),
        bio: z.string().optional(),
        profileImage: z.string().optional(),
        profileBanner: z.string().optional(),
      });
      
      const result = updateSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid update data", errors: result.error.format() });
      }
      
      const updatedUser = await storage.updateUser(userId, result.data);
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json({
        id: updatedUser.id,
        username: updatedUser.username,
        displayName: updatedUser.displayName,
        profileImage: updatedUser.profileImage,
        profileBanner: updatedUser.profileBanner,
        bio: updatedUser.bio
      });
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Collectible routes
  app.get("/api/collectibles", async (req, res) => {
    try {
      const query = req.query.q as string | undefined;
      
      if (query) {
        const collectibles = await storage.searchCollectibles(query);
        return res.json(collectibles);
      }
      
      // If forTrade=true is specified, return collectibles available for trade
      if (req.query.forTrade === 'true') {
        const collectibles = await storage.getCollectiblesForTrade();
        return res.json(collectibles);
      }
      
      // If userId is specified, return collectibles for that user
      if (req.query.userId) {
        const userId = parseInt(req.query.userId as string);
        if (isNaN(userId)) {
          return res.status(400).json({ message: "Invalid user ID" });
        }
        
        const collectibles = await storage.getUserCollectibles(userId);
        return res.json(collectibles);
      }
      
      // Default: return empty array if no filter is specified
      res.json([]);
    } catch (error) {
      console.error("Error getting collectibles:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/collectibles/:id", async (req, res) => {
    try {
      const collectibleId = parseInt(req.params.id);
      if (isNaN(collectibleId)) {
        return res.status(400).json({ message: "Invalid collectible ID" });
      }
      
      const collectible = await storage.getCollectible(collectibleId);
      if (!collectible) {
        return res.status(404).json({ message: "Collectible not found" });
      }
      
      res.json(collectible);
    } catch (error) {
      console.error("Error getting collectible:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Upload collectible image
  app.post("/api/collectibles/upload-image", isAuthenticated, upload.single('image'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No image file uploaded" });
      }
      
      // Return the path to the uploaded file
      const imagePath = `${req.file.path}`;
      res.json({ imagePath });
    } catch (error) {
      console.error("Error uploading collectible image:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/collectibles", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      
      // Add the current user's ID to the collectible data
      const collectibleData = {
        ...req.body,
        userId: user.id,
      };
      
      const result = insertCollectibleSchema.safeParse(collectibleData);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid collectible data", errors: result.error.format() });
      }
      
      const collectible = await storage.createCollectible(result.data);
      res.status(201).json(collectible);
    } catch (error) {
      console.error("Error creating collectible:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  app.patch("/api/collectibles/:id", isAuthenticated, async (req, res) => {
    try {
      const collectibleId = parseInt(req.params.id);
      if (isNaN(collectibleId)) {
        return res.status(400).json({ message: "Invalid collectible ID" });
      }
      
      const user = req.user as any;
      const collectible = await storage.getCollectible(collectibleId);
      
      if (!collectible) {
        return res.status(404).json({ message: "Collectible not found" });
      }
      
      // Check if the collectible belongs to the current user
      if (collectible.userId !== user.id) {
        return res.status(403).json({ message: "You can only update your own collectibles" });
      }
      
      const updateSchema = z.object({
        name: z.string().optional(),
        series: z.string().optional(),
        variant: z.string().optional(),
        rarity: z.string().optional(),
        image: z.string().optional(),
        description: z.string().optional(),
        forTrade: z.boolean().optional(),
      });
      
      const result = updateSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid update data", errors: result.error.format() });
      }
      
      const updatedCollectible = await storage.updateCollectible(collectibleId, result.data);
      if (!updatedCollectible) {
        return res.status(404).json({ message: "Collectible not found" });
      }
      
      res.json(updatedCollectible);
    } catch (error) {
      console.error("Error updating collectible:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  app.delete("/api/collectibles/:id", isAuthenticated, async (req, res) => {
    try {
      const collectibleId = parseInt(req.params.id);
      if (isNaN(collectibleId)) {
        return res.status(400).json({ message: "Invalid collectible ID" });
      }
      
      const user = req.user as any;
      const collectible = await storage.getCollectible(collectibleId);
      
      if (!collectible) {
        return res.status(404).json({ message: "Collectible not found" });
      }
      
      // Check if the collectible belongs to the current user
      if (collectible.userId !== user.id) {
        return res.status(403).json({ message: "You can only delete your own collectibles" });
      }
      
      const success = await storage.deleteCollectible(collectibleId);
      if (!success) {
        return res.status(500).json({ message: "Failed to delete collectible" });
      }
      
      res.json({ message: "Collectible deleted successfully" });
    } catch (error) {
      console.error("Error deleting collectible:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Trade routes
  app.get("/api/trades", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const trades = await storage.getUserTradesWithDetails(user.id);
      res.json(trades);
    } catch (error) {
      console.error("Error getting trades:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/trades/:id", isAuthenticated, async (req, res) => {
    try {
      const tradeId = parseInt(req.params.id);
      if (isNaN(tradeId)) {
        return res.status(400).json({ message: "Invalid trade ID" });
      }
      
      const user = req.user as any;
      const trade = await storage.getTradeWithDetails(tradeId);
      
      if (!trade) {
        return res.status(404).json({ message: "Trade not found" });
      }
      
      // Check if the user is involved in the trade
      if (trade.proposerId !== user.id && trade.receiverId !== user.id) {
        return res.status(403).json({ message: "You can only view trades you're involved in" });
      }
      
      res.json(trade);
    } catch (error) {
      console.error("Error getting trade:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/trades", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      
      // Add the current user's ID as the proposer
      const tradeData = {
        ...req.body,
        proposerId: user.id,
      };
      
      const result = insertTradeSchema.safeParse(tradeData);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid trade data", errors: result.error.format() });
      }
      
      // Validate that the user owns the proposed collectible
      const proposerCollectible = await storage.getCollectible(result.data.proposerCollectibleId);
      if (!proposerCollectible || proposerCollectible.userId !== user.id) {
        return res.status(403).json({ message: "You can only trade collectibles you own" });
      }
      
      // Validate that the receiver owns the requested collectible
      const receiverCollectible = await storage.getCollectible(result.data.receiverCollectibleId);
      if (!receiverCollectible || receiverCollectible.userId !== result.data.receiverId) {
        return res.status(400).json({ message: "The requested collectible is not owned by the receiver" });
      }
      
      // Create the trade
      const trade = await storage.createTrade(result.data);
      
      // Create a notification for the receiver
      await createTradeRequestNotification(trade.id, user.id, result.data.receiverId);
      
      // Get the full trade with details
      const tradeWithDetails = await storage.getTradeWithDetails(trade.id);
      
      res.status(201).json(tradeWithDetails);
    } catch (error) {
      console.error("Error creating trade:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  app.patch("/api/trades/:id/status", isAuthenticated, async (req, res) => {
    try {
      const tradeId = parseInt(req.params.id);
      if (isNaN(tradeId)) {
        return res.status(400).json({ message: "Invalid trade ID" });
      }
      
      const statusSchema = z.object({
        status: z.enum(["accepted", "rejected", "completed"])
      });
      
      const result = statusSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid status", errors: result.error.format() });
      }
      
      const user = req.user as any;
      const trade = await storage.getTrade(tradeId);
      
      if (!trade) {
        return res.status(404).json({ message: "Trade not found" });
      }
      
      // Only the receiver can accept/reject a trade
      if (trade.receiverId !== user.id) {
        return res.status(403).json({ message: "Only the trade receiver can update the trade status" });
      }
      
      // Cannot update completed or rejected trades
      if (trade.status === "completed" || trade.status === "rejected") {
        return res.status(400).json({ message: `Cannot update a ${trade.status} trade` });
      }
      
      const updatedTrade = await storage.updateTradeStatus(tradeId, result.data.status);
      if (!updatedTrade) {
        return res.status(500).json({ message: "Failed to update trade status" });
      }
      
      // Create a notification based on the status change
      if (result.data.status === "accepted" || result.data.status === "rejected" || result.data.status === "completed") {
        await createTradeStatusNotification(
          tradeId, 
          result.data.status as 'accepted' | 'rejected' | 'completed', 
          trade.proposerId, 
          trade.receiverId
        );
      }
      
      // Get the full trade with details
      const tradeWithDetails = await storage.getTradeWithDetails(updatedTrade.id);
      
      // If the trade was accepted, automatically create a pinned message with trade details
      if (result.data.status === "accepted" && tradeWithDetails) {
        try {
          const proposerCollectible = tradeWithDetails.proposerCollectible;
          const receiverCollectible = tradeWithDetails.receiverCollectible;
          
          // Create a pinned message with trade details
          const tradeDetailsMessage = `Trade Accepted!\n\n${tradeWithDetails.proposer.displayName} is trading: ${proposerCollectible.name} (${proposerCollectible.series}, ${proposerCollectible.variant})\n\nFor ${tradeWithDetails.receiver.displayName}'s: ${receiverCollectible.name} (${receiverCollectible.series}, ${receiverCollectible.variant})\n\nPlease discuss shipping details and next steps here.`;
          
          await storage.createChatMessage({
            tradeId: tradeId,
            senderId: user.id, // Receiver creates the initial message
            message: tradeDetailsMessage,
            isPinned: true
          });
        } catch (chatError) {
          console.error("Error creating trade chat:", chatError);
          // We don't want to fail the trade update if chat creation fails
        }
      }
      
      res.json(tradeWithDetails);
    } catch (error) {
      console.error("Error updating trade status:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  
  // Chat message routes
  app.get("/api/trades/:id/messages", isAuthenticated, async (req, res) => {
    try {
      const tradeId = parseInt(req.params.id);
      if (isNaN(tradeId)) {
        return res.status(400).json({ message: "Invalid trade ID" });
      }
      
      const user = req.user as any;
      const trade = await storage.getTrade(tradeId);
      
      if (!trade) {
        return res.status(404).json({ message: "Trade not found" });
      }
      
      // Check if the user is involved in the trade
      if (trade.proposerId !== user.id && trade.receiverId !== user.id) {
        return res.status(403).json({ message: "You can only view messages for trades you're involved in" });
      }
      
      // Get all messages for this trade
      const messages = await storage.getTradeMessages(tradeId);
      res.json(messages);
    } catch (error) {
      console.error("Error getting trade messages:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  
  app.post("/api/trades/:id/messages", isAuthenticated, async (req, res) => {
    try {
      const tradeId = parseInt(req.params.id);
      if (isNaN(tradeId)) {
        return res.status(400).json({ message: "Invalid trade ID" });
      }
      
      const user = req.user as any;
      const trade = await storage.getTrade(tradeId);
      
      if (!trade) {
        return res.status(404).json({ message: "Trade not found" });
      }
      
      // Check if the user is involved in the trade
      if (trade.proposerId !== user.id && trade.receiverId !== user.id) {
        return res.status(403).json({ message: "You can only send messages for trades you're involved in" });
      }
      
      // Check if trade is accepted (chat is only available for accepted trades)
      if (trade.status !== "accepted" && trade.status !== "completed") {
        return res.status(400).json({ message: "Chat is only available for accepted or completed trades" });
      }
      
      // Validate and create message
      const messageData = {
        tradeId: tradeId,
        senderId: user.id,
        message: req.body.message,
        isPinned: false
      };
      
      const result = insertChatMessageSchema.safeParse(messageData);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid message data", errors: result.error.format() });
      }
      
      const chatMessage = await storage.createChatMessage(result.data);
      
      // Get the sender details to return a complete message
      const sender = await storage.getUser(user.id);
      
      if (sender) {
        res.status(201).json({
          ...chatMessage,
          sender: {
            id: sender.id,
            username: sender.username,
            displayName: sender.displayName,
            profileImage: sender.profileImage
          }
        });
      } else {
        res.status(201).json(chatMessage);
      }
    } catch (error) {
      console.error("Error creating chat message:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  
  app.patch("/api/trades/:tradeId/messages/:messageId/pin", isAuthenticated, async (req, res) => {
    try {
      const tradeId = parseInt(req.params.tradeId);
      const messageId = parseInt(req.params.messageId);
      
      if (isNaN(tradeId) || isNaN(messageId)) {
        return res.status(400).json({ message: "Invalid trade or message ID" });
      }
      
      const user = req.user as any;
      const trade = await storage.getTrade(tradeId);
      
      if (!trade) {
        return res.status(404).json({ message: "Trade not found" });
      }
      
      // Check if the user is involved in the trade
      if (trade.proposerId !== user.id && trade.receiverId !== user.id) {
        return res.status(403).json({ message: "You can only pin messages for trades you're involved in" });
      }
      
      const success = await storage.pinChatMessage(messageId);
      if (!success) {
        return res.status(404).json({ message: "Message not found" });
      }
      
      res.json({ message: "Message pinned successfully" });
    } catch (error) {
      console.error("Error pinning message:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  
  app.patch("/api/trades/:tradeId/messages/:messageId/unpin", isAuthenticated, async (req, res) => {
    try {
      const tradeId = parseInt(req.params.tradeId);
      const messageId = parseInt(req.params.messageId);
      
      if (isNaN(tradeId) || isNaN(messageId)) {
        return res.status(400).json({ message: "Invalid trade or message ID" });
      }
      
      const user = req.user as any;
      const trade = await storage.getTrade(tradeId);
      
      if (!trade) {
        return res.status(404).json({ message: "Trade not found" });
      }
      
      // Check if the user is involved in the trade
      if (trade.proposerId !== user.id && trade.receiverId !== user.id) {
        return res.status(403).json({ message: "You can only unpin messages for trades you're involved in" });
      }
      
      const success = await storage.unpinChatMessage(messageId);
      if (!success) {
        return res.status(404).json({ message: "Message not found" });
      }
      
      res.json({ message: "Message unpinned successfully" });
    } catch (error) {
      console.error("Error unpinning message:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Post routes
  app.get("/api/posts", async (req, res) => {
    try {
      const userId = req.query.userId ? parseInt(req.query.userId as string) : undefined;
      
      // If userId is specified, return posts for that user
      if (userId && !isNaN(userId)) {
        const posts = await storage.getUserPosts(userId);
        return res.json(posts);
      }
      
      // Otherwise return feed posts
      const currentUser = req.user as any;
      const currentUserId = currentUser?.id;
      
      const posts = await storage.getFeedPosts(currentUserId);
      res.json(posts);
    } catch (error) {
      console.error("Error getting posts:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/posts", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      
      // Add the current user's ID to the post data
      const postData = {
        ...req.body,
        userId: user.id,
      };
      
      const result = insertPostSchema.safeParse(postData);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid post data", errors: result.error.format() });
      }
      
      const post = await storage.createPost(result.data);
      
      // Get the user to include in the response
      const postUser = await storage.getUser(user.id);
      
      res.status(201).json({
        ...post,
        user: postUser,
        likesCount: 0,
        commentsCount: 0,
        liked: false
      });
    } catch (error) {
      console.error("Error creating post:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  app.delete("/api/posts/:id", isAuthenticated, async (req, res) => {
    try {
      const postId = parseInt(req.params.id);
      if (isNaN(postId)) {
        return res.status(400).json({ message: "Invalid post ID" });
      }
      
      const user = req.user as any;
      const post = await storage.getPost(postId);
      
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
      
      // Check if the post belongs to the current user
      if (post.userId !== user.id) {
        return res.status(403).json({ message: "You can only delete your own posts" });
      }
      
      const success = await storage.deletePost(postId);
      if (!success) {
        return res.status(500).json({ message: "Failed to delete post" });
      }
      
      res.json({ message: "Post deleted successfully" });
    } catch (error) {
      console.error("Error deleting post:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Like routes
  app.post("/api/posts/:id/like", isAuthenticated, async (req, res) => {
    try {
      const postId = parseInt(req.params.id);
      if (isNaN(postId)) {
        return res.status(400).json({ message: "Invalid post ID" });
      }
      
      const user = req.user as any;
      
      // Check if the post exists
      const post = await storage.getPost(postId);
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
      
      // Check if the user already liked the post
      const existingLike = await storage.getLike(user.id, postId);
      if (existingLike) {
        return res.status(400).json({ message: "You already liked this post" });
      }
      
      const like = await storage.createLike({ userId: user.id, postId });
      
      // Create a notification for the post owner (if not self-like)
      if (post.userId !== user.id) {
        await createLikeNotification(user.id, postId, post.userId);
      }
      
      // Count likes for the post
      const likes = await storage.getPostLikes(postId);
      
      res.status(201).json({ 
        message: "Post liked successfully",
        likesCount: likes.length
      });
    } catch (error) {
      console.error("Error liking post:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  app.delete("/api/posts/:id/like", isAuthenticated, async (req, res) => {
    try {
      const postId = parseInt(req.params.id);
      if (isNaN(postId)) {
        return res.status(400).json({ message: "Invalid post ID" });
      }
      
      const user = req.user as any;
      
      // Check if the post exists
      const post = await storage.getPost(postId);
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
      
      // Check if the user liked the post
      const existingLike = await storage.getLike(user.id, postId);
      if (!existingLike) {
        return res.status(400).json({ message: "You haven't liked this post" });
      }
      
      const success = await storage.deleteLike(user.id, postId);
      if (!success) {
        return res.status(500).json({ message: "Failed to unlike post" });
      }
      
      // Count likes for the post
      const likes = await storage.getPostLikes(postId);
      
      res.json({ 
        message: "Post unliked successfully",
        likesCount: likes.length
      });
    } catch (error) {
      console.error("Error unliking post:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Comment routes
  app.get("/api/posts/:id/comments", async (req, res) => {
    try {
      const postId = parseInt(req.params.id);
      if (isNaN(postId)) {
        return res.status(400).json({ message: "Invalid post ID" });
      }
      
      // Check if the post exists
      const post = await storage.getPost(postId);
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
      
      const comments = await storage.getPostComments(postId);
      
      // Get user data for each comment
      const commentsWithUser = await Promise.all(comments.map(async (comment) => {
        const user = await storage.getUser(comment.userId);
        return {
          ...comment,
          user: user ? {
            id: user.id,
            username: user.username,
            displayName: user.displayName,
            profileImage: user.profileImage
          } : null
        };
      }));
      
      res.json(commentsWithUser);
    } catch (error) {
      console.error("Error getting comments:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/posts/:id/comments", isAuthenticated, async (req, res) => {
    try {
      const postId = parseInt(req.params.id);
      if (isNaN(postId)) {
        return res.status(400).json({ message: "Invalid post ID" });
      }
      
      const user = req.user as any;
      
      // Check if the post exists
      const post = await storage.getPost(postId);
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
      
      // Add the current user's ID and post ID to the comment data
      const commentData = {
        userId: user.id,
        postId,
        content: req.body.content
      };
      
      const result = insertCommentSchema.safeParse(commentData);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid comment data", errors: result.error.format() });
      }
      
      const comment = await storage.createComment(result.data);
      
      // Create a notification for the post owner (if not self-comment)
      if (post.userId !== user.id) {
        await createCommentNotification(user.id, postId, post.userId);
      }
      
      // Include user data in the response
      const userData = {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        profileImage: user.profileImage
      };
      
      res.status(201).json({
        ...comment,
        user: userData
      });
    } catch (error) {
      console.error("Error creating comment:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  app.delete("/api/comments/:id", isAuthenticated, async (req, res) => {
    try {
      const commentId = parseInt(req.params.id);
      if (isNaN(commentId)) {
        return res.status(400).json({ message: "Invalid comment ID" });
      }
      
      const user = req.user as any;
      const comment = await storage.getComment(commentId);
      
      if (!comment) {
        return res.status(404).json({ message: "Comment not found" });
      }
      
      // Check if the comment belongs to the current user
      if (comment.userId !== user.id) {
        return res.status(403).json({ message: "You can only delete your own comments" });
      }
      
      const success = await storage.deleteComment(commentId);
      if (!success) {
        return res.status(500).json({ message: "Failed to delete comment" });
      }
      
      res.json({ message: "Comment deleted successfully" });
    } catch (error) {
      console.error("Error deleting comment:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Follow routes
  app.post("/api/users/:idOrUsername/follow", isAuthenticated, async (req, res) => {
    try {
      const idOrUsername = req.params.idOrUsername;
      let followingId;
      
      // Check if parameter is a number (id) or string (username)
      const parsedId = parseInt(idOrUsername, 10);
      
      if (!isNaN(parsedId)) {
        // If it's a valid number, use it directly
        followingId = parsedId;
        
        // Check if the user to follow exists
        const userToFollow = await storage.getUser(followingId);
        if (!userToFollow) {
          return res.status(404).json({ message: "User not found" });
        }
      } else {
        // Otherwise, find the user by username first
        const userToFollow = await storage.getUserByUsername(idOrUsername);
        if (!userToFollow) {
          return res.status(404).json({ message: "User not found" });
        }
        followingId = userToFollow.id;
      }
      
      const user = req.user as any;
      
      // Cannot follow yourself
      if (followingId === user.id) {
        return res.status(400).json({ message: "You cannot follow yourself" });
      }
      
      // Check if already following
      const existingFollow = await storage.getFollow(user.id, followingId);
      if (existingFollow) {
        return res.status(400).json({ message: "You are already following this user" });
      }
      
      const follow = await storage.createFollow({ 
        followerId: user.id, 
        followingId
      });
      
      // Create a notification for the user being followed
      await createFollowNotification(user.id, followingId);
      
      res.status(201).json({ message: "User followed successfully" });
    } catch (error) {
      console.error("Error following user:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  app.delete("/api/users/:idOrUsername/follow", isAuthenticated, async (req, res) => {
    try {
      const idOrUsername = req.params.idOrUsername;
      let followingId;
      
      // Check if parameter is a number (id) or string (username)
      const parsedId = parseInt(idOrUsername, 10);
      
      if (!isNaN(parsedId)) {
        // If it's a valid number, use it directly
        followingId = parsedId;
      } else {
        // Otherwise, find the user by username first
        const userToUnfollow = await storage.getUserByUsername(idOrUsername);
        if (!userToUnfollow) {
          return res.status(404).json({ message: "User not found" });
        }
        followingId = userToUnfollow.id;
      }
      
      const user = req.user as any;
      
      // Check if the follow relationship exists
      const existingFollow = await storage.getFollow(user.id, followingId);
      if (!existingFollow) {
        return res.status(400).json({ message: "You are not following this user" });
      }
      
      const success = await storage.deleteFollow(user.id, followingId);
      if (!success) {
        return res.status(500).json({ message: "Failed to unfollow user" });
      }
      
      res.json({ message: "User unfollowed successfully" });
    } catch (error) {
      console.error("Error unfollowing user:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/users/:idOrUsername/followers", async (req, res) => {
    try {
      const idOrUsername = req.params.idOrUsername;
      let userId;
      
      // Check if parameter is a number (id) or string (username)
      const parsedId = parseInt(idOrUsername, 10);
      
      if (!isNaN(parsedId)) {
        // If it's a valid number, use it directly
        userId = parsedId;
      } else {
        // Otherwise, find the user by username first
        const user = await storage.getUserByUsername(idOrUsername);
        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }
        userId = user.id;
      }
      
      const followers = await storage.getUserFollowers(userId);
      
      // Return user data without sensitive information
      const safeFollowers = followers.map(user => ({
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        profileImage: user.profileImage
      }));
      
      res.json(safeFollowers);
    } catch (error) {
      console.error("Error getting followers:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/users/:idOrUsername/following", async (req, res) => {
    try {
      const idOrUsername = req.params.idOrUsername;
      let userId;
      
      // Check if parameter is a number (id) or string (username)
      const parsedId = parseInt(idOrUsername, 10);
      
      if (!isNaN(parsedId)) {
        // If it's a valid number, use it directly
        userId = parsedId;
      } else {
        // Otherwise, find the user by username first
        const user = await storage.getUserByUsername(idOrUsername);
        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }
        userId = user.id;
      }
      
      const following = await storage.getUserFollowing(userId);
      
      // Return user data without sensitive information
      const safeFollowing = following.map(user => ({
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        profileImage: user.profileImage
      }));
      
      res.json(safeFollowing);
    } catch (error) {
      console.error("Error getting following:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Create HTTP server
  const httpServer = createServer(app);

  return httpServer;
}
