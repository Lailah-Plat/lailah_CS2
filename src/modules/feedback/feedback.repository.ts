import { Review, ServiceChat, ServiceChatMessage } from '../../models/FeedbackModels.js';

export interface IFeedbackRepository {
  // Reviews
  findAllReviews(): Promise<Review[]>;
  createReview(data: any): Promise<Review>;
  findReviewByCriteria(criteria: any): Promise<Review | null>;
  deleteReview(id: string | number): Promise<boolean>;

  // Chats
  findAllChats(): Promise<ServiceChat[]>;
  findChatById(id: number): Promise<ServiceChat | null>;
  createChat(data: any): Promise<ServiceChat>;
  updateChat(chat: ServiceChat, data: any): Promise<ServiceChat>;

  // Chat Messages
  findMessagesByChatId(chatId: string | number): Promise<ServiceChatMessage[]>;
  createChatMessage(data: any): Promise<ServiceChatMessage>;
  findChatMessageByCriteria(criteria: any): Promise<ServiceChatMessage | null>;
}

export class SequelizeFeedbackRepository implements IFeedbackRepository {
  // Reviews
  async findAllReviews(): Promise<Review[]> {
    try {
      return await Review.findAll({ order: [['id', 'DESC']] });
    } catch (err: any) {
      try {
        await Review.sync();
        return await Review.findAll({ order: [['id', 'DESC']] });
      } catch (innerErr) {
        console.warn('Review table query fallback:', innerErr);
        return [];
      }
    }
  }

  async createReview(data: any): Promise<Review> {
    try {
      return await Review.create({
        targetType: data.targetType,
        targetId: String(data.targetId),
        targetName: data.targetName,
        customerName: data.customerName,
        rating: Number(data.rating),
        comment: data.comment,
        date: data.date || new Date().toISOString().split('T')[0],
        status: data.status || 'published',
        providerName: data.providerName || null,
        agentName: data.agentName || null,
        resolution: data.resolution !== undefined ? data.resolution : null,
        employeeRating: data.employeeRating !== undefined ? Number(data.employeeRating) : null
      });
    } catch (err: any) {
      await Review.sync();
      return await Review.create({
        targetType: data.targetType,
        targetId: String(data.targetId),
        targetName: data.targetName,
        customerName: data.customerName,
        rating: Number(data.rating),
        comment: data.comment,
        date: data.date || new Date().toISOString().split('T')[0],
        status: data.status || 'published',
        providerName: data.providerName || null,
        agentName: data.agentName || null,
        resolution: data.resolution !== undefined ? data.resolution : null,
        employeeRating: data.employeeRating !== undefined ? Number(data.employeeRating) : null
      });
    }
  }

  async findReviewByCriteria(criteria: any): Promise<Review | null> {
    try {
      return await Review.findOne({ where: criteria });
    } catch (err) {
      try {
        await Review.sync();
        return await Review.findOne({ where: criteria });
      } catch {
        return null;
      }
    }
  }

  async deleteReview(id: string | number): Promise<boolean> {
    try {
      const deletedCount = await Review.destroy({ where: { id } });
      return deletedCount > 0;
    } catch (err) {
      return false;
    }
  }

  // Chats
  async findAllChats(): Promise<ServiceChat[]> {
    try {
      return await ServiceChat.findAll({ order: [['id', 'DESC']] });
    } catch (err) {
      try {
        await ServiceChat.sync();
        return await ServiceChat.findAll({ order: [['id', 'DESC']] });
      } catch {
        return [];
      }
    }
  }

  async findChatById(id: number): Promise<ServiceChat | null> {
    try {
      return await ServiceChat.findByPk(id);
    } catch (err) {
      try {
        await ServiceChat.sync();
        return await ServiceChat.findByPk(id);
      } catch {
        return null;
      }
    }
  }

  async createChat(data: any): Promise<ServiceChat> {
    try {
      return await ServiceChat.create({
        id: data.id,
        customerId: data.customerId,
        customerName: data.customerName,
        agentId: data.agentId || null,
        agentName: data.agentName || null,
        status: data.status || 'waiting',
        topic: data.topic || null,
        department: data.department || null
      });
    } catch (err) {
      await ServiceChat.sync();
      return await ServiceChat.create({
        id: data.id,
        customerId: data.customerId,
        customerName: data.customerName,
        agentId: data.agentId || null,
        agentName: data.agentName || null,
        status: data.status || 'waiting',
        topic: data.topic || null,
        department: data.department || null
      });
    }
  }

  async updateChat(chat: ServiceChat, data: any): Promise<ServiceChat> {
    return chat.update({
      agentId: data.agentId || chat.agentId,
      agentName: data.agentName || chat.agentName,
      status: data.status || chat.status,
      topic: data.topic || chat.topic,
      department: data.department || chat.department
    });
  }

  // Chat Messages
  async findMessagesByChatId(chatId: string | number): Promise<ServiceChatMessage[]> {
    try {
      return await ServiceChatMessage.findAll({
        where: { chatId: Number(chatId) },
        order: [['id', 'ASC']]
      });
    } catch (err) {
      try {
        await ServiceChatMessage.sync();
        return await ServiceChatMessage.findAll({
          where: { chatId: Number(chatId) },
          order: [['id', 'ASC']]
        });
      } catch {
        return [];
      }
    }
  }

  async createChatMessage(data: any): Promise<ServiceChatMessage> {
    try {
      return await ServiceChatMessage.create({
        chatId: Number(data.chatId),
        text: data.text,
        senderType: data.senderType,
        senderName: data.senderName,
        time: data.time || new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })
      });
    } catch (err) {
      await ServiceChatMessage.sync();
      return await ServiceChatMessage.create({
        chatId: Number(data.chatId),
        text: data.text,
        senderType: data.senderType,
        senderName: data.senderName,
        time: data.time || new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })
      });
    }
  }

  async findChatMessageByCriteria(criteria: any): Promise<ServiceChatMessage | null> {
    try {
      return await ServiceChatMessage.findOne({ where: criteria });
    } catch (err) {
      try {
        await ServiceChatMessage.sync();
        return await ServiceChatMessage.findOne({ where: criteria });
      } catch {
        return null;
      }
    }
  }
}
