import {
  Notification,
  SupportRequest,
  User,
  type SupportTopic,
} from "../models";

export interface SupportInput {
  userId?: string;
  name: string;
  email: string;
  topic: SupportTopic;
  message: string;
}

export const createSupportRequest = async (input: SupportInput) => {
  const request = await SupportRequest.create({
    user: input.userId,
    name: input.name,
    email: input.email,
    topic: input.topic,
    message: input.message,
  });
  const adminIds = await User.distinct("_id", {
    role: "admin",
    isActive: true,
  });
  if (adminIds.length) {
    await Notification.insertMany(
      adminIds.map((adminId) => ({
        user: adminId,
        type: "system",
        title: "New support request",
        message: `${input.name} needs help with ${input.topic}.`,
      })),
    );
  }
  return { id: request.id as string, createdAt: request.createdAt };
};
