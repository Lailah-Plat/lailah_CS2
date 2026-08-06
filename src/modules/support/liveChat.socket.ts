import { Server, Socket } from "socket.io";

interface Agent {
  id: string; // Socket ID
  status: 'online' | 'busy' | 'offline';
  activeCount: number;
  name: string;
}

interface Customer {
  id: string; // Socket ID
  name: string;
  chatId: string;
}

interface Chat {
  id: string;
  customerId: string;
  customerName: string;
  agentId: string | null;
  agentName: string | null;
  status: 'waiting' | 'active' | 'ended';
  messages: any[];
  topic?: string;
  department?: string;
}

const agents = new Map<string, Agent>();
const customers = new Map<string, Customer>();
const chats = new Map<string, Chat>();
const queue: string[] = []; // Chat IDs

export function initLiveChatSocket(io: Server) {
  // Middleware to authorize live chat websocket connections on the server
  io.use((socket: Socket, next) => {
    const isLiveChat = socket.handshake.query.isLiveChat === 'true';
    if (isLiveChat) {
      const partnerRole = (socket.handshake.query.partnerRole as string || '').toLowerCase();
      const hasSupport = socket.handshake.query.hasSupport === 'true';

      // System admin is allowed
      if (partnerRole.includes('admin') || partnerRole.includes('مدير') || partnerRole.includes('مشرف')) {
        return next();
      }

      // Check if they are a provider/partner
      const isProv = partnerRole.includes('provider') || partnerRole.includes('agency') || partnerRole.includes('partner') || partnerRole.includes('مزود');
      if (!isProv) {
        return next(new Error("unauthorized_customer_chat_banned"));
      }

      // Check if they have direct support in their subscription package
      if (!hasSupport) {
        return next(new Error("unauthorized_tier_no_chat_access"));
      }
    }
    next();
  });

  io.on("connection", (socket: Socket) => {
    
    // Agent
    socket.on("agent_login", (data: { name: string }) => {
      agents.set(socket.id, { id: socket.id, name: data.name, status: 'online', activeCount: 0 });
      broadcastQueue(io);
      broadcastAgents(io);
    });

    socket.on("agent_status", (status: 'online' | 'busy' | 'offline') => {
      const agent = agents.get(socket.id);
      if (agent) {
        agent.status = status;
        assignChats(io);
        broadcastAgents(io);
      }
    });

    socket.on("agent_accept", (chatId: string) => {
        const agent = agents.get(socket.id);
        const chat = chats.get(chatId);
        if (agent && chat && chat.status === 'waiting') {
            chat.status = 'active';
            chat.agentId = agent.id;
            chat.agentName = agent.name;
            agent.activeCount++;
            
            queue.splice(queue.indexOf(chatId), 1);
            
            io.to(chat.customerId).emit("chat_started", { agentName: agent.name });
            io.to(agent.id).emit("chat_assigned", chat);
            
            broadcastQueue(io);
            updateQueuePositions(io);
        }
    });

    // Customer
    socket.on("customer_start", (data: { name: string; topic?: string }) => {
      const chatId = "chat_" + Date.now();
      customers.set(socket.id, { id: socket.id, name: data.name, chatId });
      
      // Automatic Department routing based on topic
      const topic = data.topic || "استفسارات وشكاوى";
      let department = "عام";
      if (topic.includes("تقنية") || topic.includes("دعم فني")) {
         department = "دعم فني";
      } else if (topic.includes("الحجوزات") || topic.includes("دعم إداري")) {
         department = "دعم إداري";
      } else if (topic.includes("المالية") || topic.includes("دعم مالي")) {
         department = "دعم مالي";
      }

      const chat: Chat = {
        id: chatId,
        customerId: socket.id,
        customerName: data.name,
        agentId: null,
        agentName: null,
        status: 'waiting',
        messages: [],
        topic,
        department
      };
      chats.set(chatId, chat);
      queue.push(chatId);

      socket.emit("chat_queued", { chatId, position: queue.length });
      
      assignChats(io);
      broadcastQueue(io);
    });

    socket.on("transfer_chat", (data: { chatId: string; department?: string; agentName?: string }) => {
       const chat = chats.get(data.chatId);
       if (chat) {
          if (data.department) {
             chat.department = data.department;
          }
          if (data.agentName) {
             chat.agentName = data.agentName;
             chat.status = 'active';
             const qIdx = queue.indexOf(chat.id);
             if (qIdx !== -1) {
                queue.splice(qIdx, 1);
             }
          }

          const sysMsg = {
             id: Date.now(),
             text: `🔄 تم تحويل المحادثة بشكل يدوي إلى: ${data.department ? `قسم (${data.department})` : ''} ${data.agentName ? `الموظف (${data.agentName})` : ''}`,
             senderType: 'system',
             senderName: 'نظام المراقبة والتحويل بالمنصة',
             time: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })
          };

          chat.messages.push(sysMsg);
          io.to(chat.customerId).emit("new_message", sysMsg);
          if (chat.agentId) {
             io.to(chat.agentId).emit("new_message", { ...sysMsg, chatId: chat.id });
          }

          assignChats(io);
          broadcastQueue(io);
       }
    });

    // Messaging
    socket.on("send_message", (data: { chatId: string, text: string, senderType: 'customer'|'agent' }) => {
      const chat = chats.get(data.chatId);
      if (chat) {
        const msg = {
          id: Date.now(),
          text: data.text,
          senderType: data.senderType,
          time: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })
        };
        chat.messages.push(msg);
        
        io.to(chat.customerId).emit("new_message", msg);
        if (chat.agentId) {
          io.to(chat.agentId).emit("new_message", { ...msg, chatId: chat.id });
        } else {
          for (const agentId of agents.keys()) {
             io.to(agentId).emit("new_message", { ...msg, chatId: chat.id });
          }
        }
        broadcastQueue(io);
      }
    });
    
    socket.on("typing", (data: { chatId: string, senderType: 'customer'|'agent' }) => {
       const chat = chats.get(data.chatId);
       if(chat) {
           if(data.senderType === 'customer' && chat.agentId) {
               io.to(chat.agentId).emit("typing", { chatId: chat.id });
           } else if (data.senderType === 'agent') {
               io.to(chat.customerId).emit("typing");
           }
       }
    });

    socket.on("end_chat", (chatId: string) => {
      const chat = chats.get(chatId);
      if (chat) {
        chat.status = 'ended';
        io.to(chat.customerId).emit("chat_ended");
        if (chat.agentId) {
          const agent = agents.get(chat.agentId);
          if (agent) {
             agent.activeCount--;
             io.to(agent.id).emit("chat_ended", { chatId });
          }
        }
        assignChats(io);
        broadcastQueue(io);
      }
    });

    socket.on("disconnect", () => {
      const agent = agents.get(socket.id);
      if (agent) {
        agents.delete(socket.id);
        broadcastAgents(io);
      }

      const customer = customers.get(socket.id);
      if (customer) {
        const chat = chats.get(customer.chatId);
        if (chat && chat.status !== 'ended') {
          chat.status = 'ended';
          if (chat.agentId) {
             const ag = agents.get(chat.agentId);
             if (ag) {
                ag.activeCount--;
                io.to(ag.id).emit("chat_ended", { chatId: chat.id });
             }
          }
          const qIdx = queue.indexOf(chat.id);
          if (qIdx !== -1) queue.splice(qIdx, 1);
        }
        customers.delete(socket.id);
        broadcastQueue(io);
        updateQueuePositions(io);
      }
    });
  });

  function assignChats(io: Server) {
    if (queue.length === 0) return;

    for (let [socketId, agent] of agents.entries()) {
      if (agent.status === 'online' && agent.activeCount < 3) {
        const chatId = queue.shift();
        if (!chatId) break;
        
        const chat = chats.get(chatId);
        if (chat) {
            chat.status = 'active';
            chat.agentId = agent.id;
            chat.agentName = agent.name;
            agent.activeCount++;
            
            io.to(chat.customerId).emit("chat_started", { agentName: agent.name });
            io.to(agent.id).emit("chat_assigned", chat);
        }
      }
    }
    updateQueuePositions(io);
    broadcastQueue(io);
  }

  function updateQueuePositions(io: Server) {
    queue.forEach((chatId, index) => {
      const chat = chats.get(chatId);
      if (chat) {
        io.to(chat.customerId).emit("queue_update", { position: index + 1 });
      }
    });
  }

  function broadcastQueue(io: Server) {
    const waitingChats = queue.map(cid => chats.get(cid)).filter(Boolean);
    const activeData = Array.from(chats.values()).filter(c => c.status === 'active');
    const allChats = Array.from(chats.values());
    
    for (const agentId of agents.keys()) {
       io.to(agentId).emit("queue_status", { 
           waiting: waitingChats,
           activeTotal: activeData.length,
           allChats: allChats
       });
    }
  }
  
  function broadcastAgents(io: Server) {
      // no-op
  }
}
