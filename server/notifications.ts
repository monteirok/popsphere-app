import { db } from './db';
import { 
  notifications, 
  users,
  Notification,
  InsertNotification,
  NotificationWithActor
} from '@shared/schema';
import { eq, and, desc, count } from 'drizzle-orm';
import { storage } from './storage';
import { Express } from 'express';
import { isAuthenticated } from './auth';
import { z } from 'zod';

// Helper functions for notifications
export async function getUserNotifications(userId: number, limit = 20, includingRead = false): Promise<NotificationWithActor[]> {
  let baseQuery = db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, userId));
  
  // Create a new query conditionally
  const query = !includingRead 
    ? baseQuery.where(eq(notifications.read, false))
    : baseQuery;
  
  const userNotifications = await query
    .orderBy(desc(notifications.createdAt))
    .limit(limit);
  
  // Get the actor details for each notification
  const notificationsWithActor: NotificationWithActor[] = [];
  
  for (const notification of userNotifications) {
    const notificationWithActor: NotificationWithActor = { ...notification, actor: undefined };
    
    if (notification.actorId) {
      const actor = await storage.getUser(notification.actorId);
      if (actor) {
        // Only include necessary user fields for the actor
        notificationWithActor.actor = {
          id: actor.id,
          username: actor.username,
          displayName: actor.displayName,
          profileImage: actor.profileImage,
          bio: actor.bio,
          email: actor.email,
          password: actor.password,
          joinedAt: actor.joinedAt,
        };
      }
    }
    
    notificationsWithActor.push(notificationWithActor);
  }
  
  return notificationsWithActor;
}

export async function getNotification(id: number): Promise<Notification | undefined> {
  const [notification] = await db
    .select()
    .from(notifications)
    .where(eq(notifications.id, id));
  
  return notification;
}

export async function createNotification(notificationData: InsertNotification): Promise<Notification> {
  const [notification] = await db
    .insert(notifications)
    .values(notificationData)
    .returning();
  
  return notification;
}

export async function markNotificationAsRead(id: number): Promise<boolean> {
  const result = await db
    .update(notifications)
    .set({ read: true })
    .where(eq(notifications.id, id))
    .returning();
  
  return result.length > 0;
}

export async function markAllUserNotificationsAsRead(userId: number): Promise<boolean> {
  const result = await db
    .update(notifications)
    .set({ read: true })
    .where(eq(notifications.userId, userId))
    .returning();
  
  return result.length > 0;
}

export async function getUnreadNotificationCount(userId: number): Promise<number> {
  const result = await db
    .select({ count: count() })
    .from(notifications)
    .where(and(
      eq(notifications.userId, userId),
      eq(notifications.read, false)
    ));
  
  return Number(result[0]?.count) || 0;
}

export async function deleteNotification(id: number): Promise<boolean> {
  const result = await db
    .delete(notifications)
    .where(eq(notifications.id, id))
    .returning();
  
  return result.length > 0;
}

// Helper functions for integrating with other parts of the app
export async function createTradeRequestNotification(tradeId: number, proposerId: number, receiverId: number): Promise<void> {
  const proposer = await storage.getUser(proposerId);
  if (!proposer) return;
  
  await createNotification({
    userId: receiverId,
    type: 'trade_request',
    content: `${proposer.displayName} has requested a trade with you.`,
    sourceId: tradeId,
    sourceType: 'trade',
    actorId: proposerId,
    read: false
  });
}

export async function createTradeStatusNotification(
  tradeId: number, 
  status: 'accepted' | 'rejected' | 'completed',
  proposerId: number, 
  receiverId: number
): Promise<void> {
  const receiver = await storage.getUser(receiverId);
  if (!receiver) return;
  
  let content = '';
  
  switch (status) {
    case 'accepted':
      content = `${receiver.displayName} has accepted your trade request.`;
      break;
    case 'rejected':
      content = `${receiver.displayName} has rejected your trade request.`;
      break;
    case 'completed':
      content = `Your trade with ${receiver.displayName} has been completed.`;
      break;
  }
  
  await createNotification({
    userId: proposerId,
    type: `trade_${status}`,
    content,
    sourceId: tradeId,
    sourceType: 'trade',
    actorId: receiverId,
    read: false
  });
}

export async function createFollowNotification(followerId: number, followingId: number): Promise<void> {
  const follower = await storage.getUser(followerId);
  if (!follower) return;
  
  await createNotification({
    userId: followingId,
    type: 'follow',
    content: `${follower.displayName} started following you.`,
    sourceId: followerId,
    sourceType: 'user',
    actorId: followerId,
    read: false
  });
}

export async function createLikeNotification(likerId: number, postId: number, postUserId: number): Promise<void> {
  // Don't create notification if user liked their own post
  if (likerId === postUserId) return;
  
  const liker = await storage.getUser(likerId);
  if (!liker) return;
  
  await createNotification({
    userId: postUserId,
    type: 'like',
    content: `${liker.displayName} liked your post.`,
    sourceId: postId,
    sourceType: 'post',
    actorId: likerId,
    read: false
  });
}

export async function createCommentNotification(commenterId: number, postId: number, postUserId: number): Promise<void> {
  // Don't create notification if user commented on their own post
  if (commenterId === postUserId) return;
  
  const commenter = await storage.getUser(commenterId);
  if (!commenter) return;
  
  await createNotification({
    userId: postUserId,
    type: 'comment',
    content: `${commenter.displayName} commented on your post.`,
    sourceId: postId,
    sourceType: 'post',
    actorId: commenterId,
    read: false
  });
}

// API route registration for notifications
export function registerNotificationRoutes(app: Express): void {
  // Get all notifications for the current user
  app.get("/api/notifications", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      
      const includeReadSchema = z.object({
        includeRead: z.enum(['true', 'false']).optional().default('false')
      });
      
      const limitSchema = z.object({
        limit: z.string().optional().default('20').transform((val) => parseInt(val, 10))
      });
      
      const includeReadResult = includeReadSchema.safeParse(req.query);
      const limitResult = limitSchema.safeParse(req.query);
      
      if (!includeReadResult.success || !limitResult.success) {
        return res.status(400).json({ message: "Invalid query parameters" });
      }
      
      const includeRead = includeReadResult.data.includeRead === 'true';
      const limit = limitResult.data.limit;
      
      const notifications = await getUserNotifications(user.id, limit, includeRead);
      
      res.json(notifications);
    } catch (error) {
      console.error("Error getting notifications:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  
  // Get unread notification count for the current user
  app.get("/api/notifications/unread-count", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const count = await getUnreadNotificationCount(user.id);
      
      res.json(count);
    } catch (error) {
      console.error("Error getting unread notification count:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  
  // Mark a single notification as read
  app.post("/api/notifications/:id/read", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const notificationId = parseInt(req.params.id);
      
      if (isNaN(notificationId)) {
        return res.status(400).json({ message: "Invalid notification ID" });
      }
      
      const notification = await getNotification(notificationId);
      
      if (!notification) {
        return res.status(404).json({ message: "Notification not found" });
      }
      
      if (notification.userId !== user.id) {
        return res.status(403).json({ message: "You can only mark your own notifications as read" });
      }
      
      const success = await markNotificationAsRead(notificationId);
      
      if (!success) {
        return res.status(500).json({ message: "Failed to mark notification as read" });
      }
      
      res.json({ message: "Notification marked as read" });
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  
  // Mark all notifications as read for the current user
  app.post("/api/notifications/mark-all-read", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const success = await markAllUserNotificationsAsRead(user.id);
      
      if (!success) {
        return res.status(500).json({ message: "Failed to mark notifications as read" });
      }
      
      res.json({ message: "All notifications marked as read" });
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
}