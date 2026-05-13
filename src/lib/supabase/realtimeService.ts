// =====================================================
// REAL-TIME SERVICE - WEBSOCKET & MESSAGE MANAGEMENT
// =====================================================

import { createClient } from './client';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  status: 'sent' | 'delivered' | 'read';
}

interface ConversationData {
  id: string;
  user_a_id: string;
  user_b_id: string;
  last_message_at: string;
}

class RealtimeService {
  private supabase = createClient();
  private channels: Map<string, RealtimeChannel> = new Map();
  private messageHandlers: Map<string, (msg: Message) => void> = new Map();
  private typingHandlers: Map<string, (data: any) => void> = new Map();
  private presenceHandlers: Map<string, (data: any) => void> = new Map();

  /**
   * SUBSCRIBE TO MESSAGE CHANNEL
   * Real-time message delivery with WebSocket
   */
  subscribeToMessages(conversationId: string, onMessage: (msg: Message) => void) {
    const channelName = `messages:${conversationId}`;
    
    if (this.channels.has(channelName)) {
      return this.channels.get(channelName)!;
    }

    const channel = this.supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const newMessage = payload.new as Message;
          onMessage(newMessage);
          
          // Auto-mark as delivered
          this.markMessageDelivered(newMessage.id);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const updatedMessage = payload.new as Message;
          onMessage(updatedMessage);
        }
      )
      .subscribe((status) => {
        console.log(`[Messages] Subscription status: ${status} for ${channelName}`);
      });

    this.channels.set(channelName, channel);
    this.messageHandlers.set(channelName, onMessage);
    return channel;
  }

  /**
   * SUBSCRIBE TO TYPING INDICATOR
   * Real-time typing status
   */
  subscribeToTyping(conversationId: string, onTyping: (data: any) => void) {
    const channelName = `typing:${conversationId}`;
    
    if (this.channels.has(channelName)) {
      return this.channels.get(channelName)!;
    }

    const channel = this.supabase
      .channel(channelName)
      .on('presence', { event: 'sync' }, (payload) => {
        const typingUsers = Object.keys(payload.presence_state)
          .map(key => payload.presence_state[key])
          .flat();
        onTyping(typingUsers);
      })
      .on('presence', { event: 'join' }, (payload) => {
        onTyping(payload.newPresences);
      })
      .on('presence', { event: 'leave' }, (payload) => {
        onTyping(payload.leftPresences);
      })
      .subscribe(async (status) => {
        console.log(`[Typing] Subscription status: ${status}`);
      });

    this.channels.set(channelName, channel);
    this.typingHandlers.set(channelName, onTyping);
    return channel;
  }

  /**
   * BROADCAST TYPING START
   * Notify other users you're typing
   */
  async broadcastTypingStart(conversationId: string, userId: string) {
    const channel = this.supabase.channel(`typing:${conversationId}`);
    
    await channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({
          user_id: userId,
          typing: true,
          timestamp: new Date().toISOString(),
        });
      }
    });
  }

  /**
   * BROADCAST TYPING STOP
   * Notify other users you stopped typing
   */
  async broadcastTypingStop(conversationId: string, userId: string) {
    const channel = this.supabase.channel(`typing:${conversationId}`);
    await channel.untrack();
  }

  /**
   * SUBSCRIBE TO USER PRESENCE
   * Real-time online/offline status
   */
  subscribeToPresence(onPresenceChange: (data: any) => void) {
    const channelName = 'user-presence';
    
    if (this.channels.has(channelName)) {
      return this.channels.get(channelName)!;
    }

    const channel = this.supabase
      .channel(channelName)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'user_presence',
      }, (payload) => {
        onPresenceChange(payload);
      })
      .subscribe();

    this.channels.set(channelName, channel);
    this.presenceHandlers.set(channelName, onPresenceChange);
    return channel;
  }

  /**
   * SEND MESSAGE WITH REAL-TIME DELIVERY
   */
  async sendMessage(
    conversationId: string,
    senderId: string,
    content: string,
    messageType: 'text' | 'image' | 'file' = 'text'
  ) {
    try {
      // Insert message
      const { data, error } = await this.supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: senderId,
          content,
          message_type: messageType,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      // Create receipt for sender
      await this.supabase.from('message_receipts').insert({
        message_id: data.id,
        user_id: senderId,
        status: 'sent',
        delivered_at: new Date().toISOString(),
      });

      // Update conversation
      await this.supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversationId);

      return data;
    } catch (error) {
      console.error('Failed to send message:', error);
      throw error;
    }
  }

  /**
   * MARK MESSAGE AS DELIVERED
   */
  async markMessageDelivered(messageId: string, userId?: string) {
    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      const recipientId = userId || user?.id;

      if (!recipientId) return;

      const { error } = await this.supabase
        .from('message_receipts')
        .upsert({
          message_id: messageId,
          user_id: recipientId,
          status: 'delivered',
          delivered_at: new Date().toISOString(),
        }, { onConflict: 'message_id,user_id' });

      if (error) throw error;
    } catch (error) {
      console.error('Failed to mark message as delivered:', error);
    }
  }

  /**
   * MARK MESSAGE AS READ
   */
  async markMessageAsRead(messageId: string, conversationId: string, userId?: string) {
    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      const readerId = userId || user?.id;

      if (!readerId) return;

      // Update receipt
      const { error: receiptError } = await this.supabase
        .from('message_receipts')
        .upsert({
          message_id: messageId,
          user_id: readerId,
          status: 'read',
          read_at: new Date().toISOString(),
        }, { onConflict: 'message_id,user_id' });

      if (receiptError) throw receiptError;

      // Update unread count
      await this.supabase
        .from('conversation_participants')
        .update({ unread_count: 0 })
        .match({ conversation_id: conversationId, user_id: readerId });
    } catch (error) {
      console.error('Failed to mark message as read:', error);
    }
  }

  /**
   * UPDATE USER PRESENCE
   */
  async updatePresence(status: 'online' | 'idle' | 'offline' | 'dnd' = 'online', deviceType?: string) {
    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) return;

      const { error } = await this.supabase
        .from('user_presence')
        .upsert({
          user_id: user.id,
          status,
          device_type: deviceType,
          last_heartbeat: new Date().toISOString(),
        }, { onConflict: 'user_id' });

      if (error) throw error;

      // Also update user_profiles
      await this.supabase
        .from('user_profiles')
        .update({
          is_online: status === 'online',
          status,
          last_seen_at: new Date().toISOString(),
        })
        .eq('id', user.id);
    } catch (error) {
      console.error('Failed to update presence:', error);
    }
  }

  /**
   * FETCH CONVERSATIONS WITH PAGINATION
   */
  async fetchConversations(userId: string, limit = 20, offset = 0) {
    try {
      const { data, error } = await this.supabase
        .from('conversation_summaries')
        .select('*')
        .or(`user_a_id.eq.${userId},user_b_id.eq.${userId}`)
        .order('updated_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
      return [];
    }
  }

  /**
   * FETCH MESSAGES WITH PAGINATION
   */
  async fetchMessages(conversationId: string, limit = 50, offset = 0) {
    try {
      const { data, error } = await this.supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;
      return data.reverse(); // Reverse to get chronological order
    } catch (error) {
      console.error('Failed to fetch messages:', error);
      return [];
    }
  }

  /**
   * UNSUBSCRIBE FROM CHANNEL
   */
  unsubscribe(channelName: string) {
    const channel = this.channels.get(channelName);
    if (channel) {
      this.supabase.removeChannel(channel);
      this.channels.delete(channelName);
      this.messageHandlers.delete(channelName);
      this.typingHandlers.delete(channelName);
      this.presenceHandlers.delete(channelName);
    }
  }

  /**
   * UNSUBSCRIBE FROM ALL CHANNELS
   */
  unsubscribeAll() {
    this.channels.forEach((channel, name) => {
      this.supabase.removeChannel(channel);
    });
    this.channels.clear();
    this.messageHandlers.clear();
    this.typingHandlers.clear();
    this.presenceHandlers.clear();
  }
}

export const realtimeService = new RealtimeService();
