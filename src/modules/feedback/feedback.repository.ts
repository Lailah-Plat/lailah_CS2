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
    return Review.findAll({ order: [['id', 'DESC']] });
  }

  async createReview(data: any): Promise<Review> {
    return Review.create({
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

  async findReviewByCriteria(criteria: any): Promise<Review | null> {
    return Review.findOne({ where: criteria });
  }

  async deleteReview(id: string | number): Promise<boolean> {
    const deletedCount = await Review.destroy({ where: { id } });
    return deletedCount > 0;
  }

  // Chats
  async findAllChats(): Promise<ServiceChat[]> {
    return ServiceChat.findAll({ order: [['id', 'DESC']] });
  }

  async findChatById(id: number): Promise<ServiceChat | null> {
    return ServiceChat.findByPk(id);
  }

  async createChat(data: any): Promise<ServiceChat> {
    return ServiceChat.create({
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
    return ServiceChatMessage.findAll({
      where: { chatId: Number(chatId) },
      order: [['id', 'ASC']]
    });
  }

  async createChatMessage(data: any): Promise<ServiceChatMessage> {
    return ServiceChatMessage.create({
      chatId: Number(data.chatId),
      text: data.text,
      senderType: data.senderType,
      senderName: data.senderName,
      time: data.time || new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })
    });
  }

  async findChatMessageByCriteria(criteria: any): Promise<ServiceChatMessage | null> {
    return ServiceChatMessage.findOne({ where: criteria });
  }
}
