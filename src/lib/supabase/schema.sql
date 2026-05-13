-- =====================================================
-- OMNI CHAT SYSTEM - COMPLETE DATABASE SCHEMA
-- Production-Ready Real-Time Chat Infrastructure
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "http";

-- =====================================================
-- 1. USER PROFILES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username VARCHAR(24) UNIQUE NOT NULL,
  display_name VARCHAR(40) NOT NULL,
  avatar_url TEXT,
  avatar_color VARCHAR(20),
  bio TEXT,
  status VARCHAR(20) DEFAULT 'offline',
  last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_online BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT valid_username CHECK (username ~ '^[a-z0-9_]+$'),
  CONSTRAINT valid_status CHECK (status IN ('online', 'idle', 'offline', 'dnd'))
);

-- Create index for faster lookups
CREATE INDEX idx_user_profiles_username ON user_profiles(username);
CREATE INDEX idx_user_profiles_is_online ON user_profiles(is_online);
CREATE INDEX idx_user_profiles_last_seen ON user_profiles(last_seen_at);

-- =====================================================
-- 2. CONVERSATIONS TABLE (1-to-1 Direct Messages)
-- =====================================================
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_a_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_b_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT different_users CHECK (user_a_id != user_b_id),
  CONSTRAINT ordered_users CHECK (user_a_id < user_b_id)
);

-- Create composite index for quick conversation lookup
CREATE UNIQUE INDEX idx_conversations_users ON conversations(user_a_id, user_b_id);
CREATE INDEX idx_conversations_updated ON conversations(updated_at DESC);
CREATE INDEX idx_conversations_user_a ON conversations(user_a_id);
CREATE INDEX idx_conversations_user_b ON conversations(user_b_id);

-- =====================================================
-- 3. MESSAGES TABLE (Core Chat Messages)
-- =====================================================
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  message_type VARCHAR(20) DEFAULT 'text',
  read_by UUID[] DEFAULT ARRAY[]::UUID[],
  is_read BOOLEAN DEFAULT FALSE,
  edited_at TIMESTAMP WITH TIME ZONE,
  deleted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT valid_message_type CHECK (message_type IN ('text', 'image', 'file', 'system')),
  CONSTRAINT content_not_empty CHECK (LENGTH(TRIM(content)) > 0)
);

-- Create indexes for message queries
CREATE INDEX idx_messages_conversation ON messages(conversation_id, created_at DESC);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_read ON messages(is_read);
CREATE INDEX idx_messages_created ON messages(created_at DESC);

-- =====================================================
-- 4. MESSAGE RECEIPTS TABLE (Delivery & Read Status)
-- =====================================================
CREATE TABLE IF NOT EXISTS message_receipts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'sent',
  read_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT valid_receipt_status CHECK (status IN ('sent', 'delivered', 'read')),
  CONSTRAINT unique_message_user UNIQUE(message_id, user_id)
);

CREATE INDEX idx_message_receipts_message ON message_receipts(message_id);
CREATE INDEX idx_message_receipts_user ON message_receipts(user_id);
CREATE INDEX idx_message_receipts_status ON message_receipts(status);

-- =====================================================
-- 5. TYPING INDICATORS TABLE (Real-Time Presence)
-- =====================================================
CREATE TABLE IF NOT EXISTS typing_indicators (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT unique_typing UNIQUE(conversation_id, user_id)
);

CREATE INDEX idx_typing_conversation ON typing_indicators(conversation_id);
CREATE INDEX idx_typing_user ON typing_indicators(user_id);

-- =====================================================
-- 6. USER PRESENCE TABLE (Online Status Tracking)
-- =====================================================
CREATE TABLE IF NOT EXISTS user_presence (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'online',
  device_type VARCHAR(50),
  last_heartbeat TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  connected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT valid_presence_status CHECK (status IN ('online', 'idle', 'offline', 'dnd'))
);

CREATE INDEX idx_user_presence_status ON user_presence(status);
CREATE INDEX idx_user_presence_heartbeat ON user_presence(last_heartbeat);

-- =====================================================
-- 7. BLOCKED USERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS blocked_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  blocker_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  blocked_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT different_block_users CHECK (blocker_id != blocked_id),
  CONSTRAINT unique_block UNIQUE(blocker_id, blocked_id)
);

CREATE INDEX idx_blocked_users_blocker ON blocked_users(blocker_id);
CREATE INDEX idx_blocked_users_blocked ON blocked_users(blocked_id);

-- =====================================================
-- 8. CONVERSATION PARTICIPANTS (Unread Counts)
-- =====================================================
CREATE TABLE IF NOT EXISTS conversation_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  unread_count INT DEFAULT 0,
  muted BOOLEAN DEFAULT FALSE,
  pinned BOOLEAN DEFAULT FALSE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT unique_participant UNIQUE(conversation_id, user_id)
);

CREATE INDEX idx_conversation_participants_user ON conversation_participants(user_id);
CREATE INDEX idx_conversation_participants_unread ON conversation_participants(unread_count);

-- =====================================================
-- MATERIALIZED VIEWS FOR PERFORMANCE
-- =====================================================

-- Active users view (cached online status)
CREATE MATERIALIZED VIEW active_users AS
SELECT 
  p.id,
  p.username,
  p.display_name,
  p.avatar_color,
  p.avatar_url,
  p.bio,
  up.status,
  up.last_heartbeat,
  CASE WHEN (NOW() - up.last_heartbeat) < INTERVAL '5 minutes' THEN TRUE ELSE FALSE END as is_online
FROM user_profiles p
LEFT JOIN user_presence up ON p.id = up.user_id
ORDER BY is_online DESC, up.last_heartbeat DESC;

CREATE INDEX idx_active_users_online ON active_users(is_online);

-- Conversation summary view
CREATE MATERIALIZED VIEW conversation_summaries AS
SELECT 
  c.id,
  c.user_a_id,
  c.user_b_id,
  c.created_at,
  c.updated_at,
  m.id as last_message_id,
  m.content as last_message_content,
  m.sender_id as last_message_sender,
  m.created_at as last_message_at,
  cp_a.unread_count as user_a_unread,
  cp_b.unread_count as user_b_unread
FROM conversations c
LEFT JOIN messages m ON c.id = m.conversation_id AND m.deleted_at IS NULL
LEFT JOIN conversation_participants cp_a ON c.id = cp_a.conversation_id AND cp_a.user_id = c.user_a_id
LEFT JOIN conversation_participants cp_b ON c.id = cp_b.conversation_id AND cp_b.user_id = c.user_b_id
WHERE m.id = (
  SELECT id FROM messages 
  WHERE conversation_id = c.id AND deleted_at IS NULL 
  ORDER BY created_at DESC LIMIT 1
)
OR m.id IS NULL;

-- =====================================================
-- AUDIT LOG TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action VARCHAR(50) NOT NULL,
  resource_type VARCHAR(50),
  resource_id UUID,
  details JSONB,
  ip_address INET,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at DESC);

-- =====================================================
-- FUNCTIONS FOR REAL-TIME OPERATIONS
-- =====================================================

-- Update user last_seen timestamp
CREATE OR REPLACE FUNCTION update_user_last_seen()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE user_profiles 
  SET last_seen_at = NOW()
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Auto-update message read status
CREATE OR REPLACE FUNCTION update_message_read_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'read' THEN
    UPDATE messages
    SET is_read = TRUE, read_by = array_append(read_by, NEW.user_id)
    WHERE id = NEW.message_id;
    
    UPDATE conversation_participants
    SET unread_count = GREATEST(unread_count - 1, 0)
    WHERE conversation_id = (
      SELECT conversation_id FROM messages WHERE id = NEW.message_id
    ) AND user_id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Clean up expired typing indicators
CREATE OR REPLACE FUNCTION cleanup_expired_typing()
RETURNS void AS $$
BEGIN
  DELETE FROM typing_indicators
  WHERE started_at < NOW() - INTERVAL '5 seconds';
END;
$$ LANGUAGE plpgsql;

-- Auto-cleanup user presence (offline if no heartbeat in 5 min)
CREATE OR REPLACE FUNCTION cleanup_offline_presence()
RETURNS void AS $$
BEGIN
  UPDATE user_presence
  SET status = 'offline'
  WHERE status != 'offline' 
  AND last_heartbeat < NOW() - INTERVAL '5 minutes';
END;
$$ LANGUAGE plpgsql;

-- Get or create conversation
CREATE OR REPLACE FUNCTION get_or_create_conversation(user_a UUID, user_b UUID)
RETURNS UUID AS $$
DECLARE
  conv_id UUID;
  ordered_a UUID;
  ordered_b UUID;
BEGIN
  -- Ensure consistent ordering
  IF user_a < user_b THEN
    ordered_a := user_a;
    ordered_b := user_b;
  ELSE
    ordered_a := user_b;
    ordered_b := user_a;
  END IF;
  
  -- Try to get existing conversation
  SELECT id INTO conv_id FROM conversations
  WHERE user_a_id = ordered_a AND user_b_id = ordered_b;
  
  -- Create if not exists
  IF conv_id IS NULL THEN
    INSERT INTO conversations (user_a_id, user_b_id)
    VALUES (ordered_a, ordered_b)
    RETURNING id INTO conv_id;
    
    -- Create participant records
    INSERT INTO conversation_participants (conversation_id, user_id)
    VALUES (conv_id, ordered_a), (conv_id, ordered_b);
  END IF;
  
  RETURN conv_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Trigger for message receipt status updates
CREATE TRIGGER trigger_update_message_read
AFTER UPDATE ON message_receipts
FOR EACH ROW
EXECUTE FUNCTION update_message_read_status();

-- Trigger for user presence updates
CREATE TRIGGER trigger_update_user_last_seen
AFTER UPDATE ON user_presence
FOR EACH ROW
EXECUTE FUNCTION update_user_last_seen();

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE typing_indicators ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_presence ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- User profiles: Anyone can read profiles, users can update own
CREATE POLICY "Profiles are publicly readable"
  ON user_profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = id);

-- Conversations: Users can only see their own conversations
CREATE POLICY "Users can see own conversations"
  ON conversations FOR SELECT
  USING (auth.uid() = user_a_id OR auth.uid() = user_b_id);

CREATE POLICY "Users can create conversations"
  ON conversations FOR INSERT
  WITH CHECK (auth.uid() = user_a_id OR auth.uid() = user_b_id);

-- Messages: Users can see messages in their conversations
CREATE POLICY "Users can read messages in their conversations"
  ON messages FOR SELECT
  USING (
    conversation_id IN (
      SELECT id FROM conversations 
      WHERE auth.uid() = user_a_id OR auth.uid() = user_b_id
    )
  );

CREATE POLICY "Users can insert messages"
  ON messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update own messages"
  ON messages FOR UPDATE
  USING (auth.uid() = sender_id);

-- Message receipts
CREATE POLICY "Users can read own receipts"
  ON message_receipts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own receipts"
  ON message_receipts FOR UPDATE
  USING (auth.uid() = user_id);

-- User presence
CREATE POLICY "Users can read presence"
  ON user_presence FOR SELECT
  USING (true);

CREATE POLICY "Users can update own presence"
  ON user_presence FOR UPDATE
  USING (auth.uid() = user_id);

-- =====================================================
-- SAMPLE DATA (Development only)
-- =====================================================

-- Insert sample users (note: these won't exist without actual auth)
-- Uncomment and modify as needed for testing

/*
INSERT INTO user_profiles (id, username, display_name, avatar_color, bio, is_online)
VALUES 
  ('550e8400-e29b-41d4-a716-446655440000', 'alexchen', 'Alex Chen', '#3B82F6', 'Full-stack developer 🚀', true),
  ('550e8400-e29b-41d4-a716-446655440001', 'sarahkim', 'Sarah Kim', '#A855F7', 'Product designer @ Omni', true),
  ('550e8400-e29b-41d4-a716-446655440002', 'marcuslee', 'Marcus Lee', '#10B981', 'DevOps engineer', false);
*/

-- =====================================================
-- END OF SCHEMA
-- =====================================================
