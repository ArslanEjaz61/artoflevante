import { prisma } from "./db";

export type NotificationType =
  | "CUSTOMER_REGISTER"
  | "CUSTOMER_LOGIN"
  | "POINTS_EARNED"
  | "POINTS_REDEEMED"
  | "VISIT_CHECKIN"
  | "BIRTHDAY_GIFT"
  | "STAFF_LOGIN"
  | "EMAIL_SENT";

export interface CreateNotificationParams {
  type: NotificationType;
  title: string;
  message: string;
  metadata?: Record<string, any>;
}

/**
 * Creates a real-time admin notification
 */
export async function createNotification(params: CreateNotificationParams) {
  try {
    const notification = await prisma.adminNotification.create({
      data: {
        type: params.type,
        title: params.title,
        message: params.message,
        metadata: params.metadata ?? {},
        isRead: false,
      },
    });
    return notification;
  } catch (err) {
    console.error("Failed to create admin notification:", err);
    return null;
  }
}

/**
 * Gets recent notifications and unread count
 */
export async function getAdminNotifications(limit = 40) {
  try {
    const [notifications, unreadCount] = await Promise.all([
      prisma.adminNotification.findMany({
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.adminNotification.count({
        where: { isRead: false },
      }),
    ]);

    return { notifications, unreadCount };
  } catch (err) {
    console.error("Failed to fetch admin notifications:", err);
    return { notifications: [], unreadCount: 0 };
  }
}

/**
 * Marks notification(s) as read
 */
export async function markNotificationsAsRead(notificationId?: string) {
  try {
    if (notificationId && notificationId !== "ALL") {
      await prisma.adminNotification.update({
        where: { id: notificationId },
        data: { isRead: true },
      });
    } else {
      await prisma.adminNotification.updateMany({
        where: { isRead: false },
        data: { isRead: true },
      });
    }
    return true;
  } catch (err) {
    console.error("Failed to mark notifications as read:", err);
    return false;
  }
}

/**
 * Clears read or all notifications
 */
export async function clearAdminNotifications(onlyRead = true) {
  try {
    if (onlyRead) {
      await prisma.adminNotification.deleteMany({
        where: { isRead: true },
      });
    } else {
      await prisma.adminNotification.deleteMany({});
    }
    return true;
  } catch (err) {
    console.error("Failed to clear notifications:", err);
    return false;
  }
}
