import { supabase } from './auth.service';

interface Notification {
  userId: string;
  type: 'email' | 'sms' | 'push' | 'in-app';
  title: string;
  message: string;
  data?: Record<string, any>;
  read?: boolean;
}

/**
 * Notification Service
 * Handles multi-channel notifications
 */
export class NotificationService {
  /**
   * Create and send notification
   */
  static async createNotification(payload: Notification) {
    const {
      userId,
      type,
      title,
      message,
      data = {},
      read = false,
    } = payload;

    try {
      const { data: notificationData, error } = await supabase
        .from('notifications')
        .insert([
          {
            user_id: userId,
            type,
            title,
            message,
            data,
            read,
            created_at: new Date().toISOString(),
          },
        ])
        .select();

      if (error) throw error;

      // Route to appropriate channel
      await this.routeNotification(type, payload);

      return notificationData?.[0];
    } catch (error: any) {
      throw new Error(`Failed to create notification: ${error.message}`);
    }
  }

  /**
   * Route notification to appropriate channel
   */
  private static async routeNotification(
    type: string,
    payload: Notification
  ) {
    switch (type) {
      case 'email':
        // Route to email service
        console.log(`📧 Email notification: ${payload.message}`);
        break;
      case 'sms':
        // Route to SMS service (Twilio)
        console.log(`📱 SMS notification: ${payload.message}`);
        break;
      case 'push':
        // Route to push notification service
        console.log(`🔔 Push notification: ${payload.message}`);
        break;
      case 'in-app':
        console.log(`💬 In-app notification: ${payload.message}`);
        break;
    }
  }

  /**
   * Get user notifications
   */
  static async getUserNotifications(userId: string, unreadOnly = false) {
    try {
      let query = supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (unreadOnly) {
        query = query.eq('read', false);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data;
    } catch (error: any) {
      throw new Error(`Failed to get notifications: ${error.message}`);
    }
  }

  /**
   * Mark notification as read
   */
  static async markAsRead(notificationId: string) {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId)
        .select();

      if (error) throw error;
      return data?.[0];
    } catch (error: any) {
      throw new Error(`Failed to mark notification as read: ${error.message}`);
    }
  }

  /**
   * Mark all notifications as read
   */
  static async markAllAsRead(userId: string) {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', userId)
        .eq('read', false);

      if (error) throw error;
      return { success: true };
    } catch (error: any) {
      throw new Error(
        `Failed to mark all notifications as read: ${error.message}`
      );
    }
  }

  /**
   * Delete notification
   */
  static async deleteNotification(notificationId: string) {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;
      return { success: true };
    } catch (error: any) {
      throw new Error(`Failed to delete notification: ${error.message}`);
    }
  }

  /**
   * Send bulk notifications
   */
  static async sendBulkNotifications(userIds: string[], payload: Omit<Notification, 'userId'>) {
    try {
      const notifications = userIds.map((userId) => ({
        user_id: userId,
        type: payload.type,
        title: payload.title,
        message: payload.message,
        data: payload.data || {},
        read: false,
        created_at: new Date().toISOString(),
      }));

      const { data, error } = await supabase
        .from('notifications')
        .insert(notifications)
        .select();

      if (error) throw error;
      return data;
    } catch (error: any) {
      throw new Error(`Failed to send bulk notifications: ${error.message}`);
    }
  }
}
