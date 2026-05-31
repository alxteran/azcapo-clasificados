const { sql } = require('../../../lib/db');
const { authMiddleware } = require('../../../lib/auth');
const { cors } = require('../../../lib/cors');

module.exports = async function handler(req, res) {
  if (cors(req, res)) return;

  const { adId } = req.query;

  // Special route: /api/chat/conversations — list all conversations for the user
  if (adId === 'conversations') {
    if (req.method === 'GET') return handleListConversations(req, res);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (req.method === 'GET') return handleGetMessages(req, res, adId);
  if (req.method === 'POST') return handleSendMessage(req, res, adId);
  return res.status(405).json({ error: 'Method not allowed' });
};

/**
 * GET /api/chat/conversations
 * Returns all conversations for the authenticated user (as buyer or seller).
 */
async function handleListConversations(req, res) {
  try {
    const user = authMiddleware(req);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Inicia sesión para ver tus conversaciones.' });
    }

    // Conversations where user is buyer
    const buyerConvs = await sql`
      SELECT cc.id AS conversation_id, cc.ad_public_id, cc.last_message_at,
        a.title AS ad_title, 'buyer' AS role, u_seller.email AS other_email
      FROM chat_conversations cc
      JOIN ads a ON a.public_id = cc.ad_public_id AND a.status != 'deleted'
      JOIN users u_seller ON u_seller.id = cc.seller_id
      WHERE cc.buyer_id = ${user.userId}
      ORDER BY cc.last_message_at DESC
    `;

    // Conversations where user is seller
    const sellerConvs = await sql`
      SELECT cc.id AS conversation_id, cc.ad_public_id, cc.last_message_at,
        a.title AS ad_title, 'seller' AS role, u_buyer.email AS other_email
      FROM chat_conversations cc
      JOIN ads a ON a.public_id = cc.ad_public_id AND a.status != 'deleted'
      JOIN users u_buyer ON u_buyer.id = cc.buyer_id
      WHERE cc.seller_id = ${user.userId}
      ORDER BY cc.last_message_at DESC
    `;

    const allConvs = [...buyerConvs, ...sellerConvs];
    const result = [];

    for (const conv of allConvs) {
      const lastMessages = await sql`
        SELECT cm.id, cm.sender_id, cm.text, cm.created_at, cm.read
        FROM chat_messages cm WHERE cm.conversation_id = ${conv.conversation_id}
        ORDER BY cm.created_at DESC LIMIT 1
      `;
      const unreadCount = await sql`
        SELECT COUNT(*) AS count FROM chat_messages cm
        WHERE cm.conversation_id = ${conv.conversation_id}
          AND cm.sender_id != ${user.userId} AND cm.read = false
      `;
      result.push({
        conversationId: conv.conversation_id,
        adPublicId: conv.ad_public_id,
        adTitle: conv.ad_title,
        role: conv.role,
        buyerEmail: conv.role === 'seller' ? conv.other_email : null,
        lastMessage: lastMessages.length > 0 ? {
          id: lastMessages[0].id,
          senderId: lastMessages[0].sender_id,
          text: lastMessages[0].text,
          createdAt: lastMessages[0].created_at,
          read: lastMessages[0].read,
        } : null,
        unreadCount: Number(unreadCount[0].count),
        lastMessageAt: conv.last_message_at,
      });
    }

    result.sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt));
    return res.status(200).json({ success: true, conversations: result });
  } catch (error) {
    console.error('Chat conversations error:', error);
    return res.status(500).json({ success: false, message: 'Error al obtener conversaciones.' });
  }
}

/**
 * GET /api/chat/[adId]
 * Returns the conversation messages for the authenticated user on this ad.
 * - Buyer: sees only their own conversation with the seller
 * - Seller (ad owner): sees ALL conversations with all buyers
 */
async function handleGetMessages(req, res, adId) {
  try {
    const user = authMiddleware(req);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Inicia sesión para ver los mensajes.' });
    }

    // Verify ad exists
    const ads = await sql`
      SELECT id, owner_id, title FROM ads
      WHERE public_id = ${adId} AND status != 'deleted'
    `;
    if (ads.length === 0) {
      return res.status(404).json({ success: false, message: 'Anuncio no encontrado.' });
    }
    const ad = ads[0];
    const isSeller = ad.owner_id === user.userId;

    if (isSeller) {
      // Seller: fetch all conversations for this ad with buyer info and messages
      const conversations = await sql`
        SELECT
          cc.id AS conversation_id,
          cc.buyer_id,
          u.email AS buyer_email,
          cc.created_at,
          cc.last_message_at,
          (
            SELECT COUNT(*) FROM chat_messages cm
            WHERE cm.conversation_id = cc.id AND cm.read = false AND cm.sender_id != ${user.userId}
          ) AS unread_count
        FROM chat_conversations cc
        JOIN users u ON u.id = cc.buyer_id
        WHERE cc.ad_public_id = ${adId}
        ORDER BY cc.last_message_at DESC
      `;

      // For each conversation, load its messages
      const result = [];
      for (const conv of conversations) {
        const messages = await sql`
          SELECT cm.id, cm.sender_id, u.email AS sender_email, cm.text, cm.created_at, cm.read
          FROM chat_messages cm
          JOIN users u ON u.id = cm.sender_id
          WHERE cm.conversation_id = ${conv.conversation_id}
          ORDER BY cm.created_at ASC
        `;
        result.push({
          conversationId: conv.conversation_id,
          buyerId: conv.buyer_id,
          buyerEmail: conv.buyer_email,
          createdAt: conv.created_at,
          lastMessageAt: conv.last_message_at,
          unreadCount: Number(conv.unread_count),
          messages: messages.map(m => ({
            id: m.id,
            senderId: m.sender_id,
            senderEmail: m.sender_email,
            text: m.text,
            createdAt: m.created_at,
            read: m.read,
            role: m.sender_id === ad.owner_id ? 'seller' : 'buyer',
          })),
        });
      }

      return res.status(200).json({ success: true, role: 'seller', conversations: result });
    } else {
      // Buyer: find or note that conversation doesn't exist yet
      const convs = await sql`
        SELECT id, created_at, last_message_at FROM chat_conversations
        WHERE ad_public_id = ${adId} AND buyer_id = ${user.userId}
      `;

      if (convs.length === 0) {
        // No conversation started yet — return empty
        return res.status(200).json({
          success: true,
          role: 'buyer',
          conversationId: null,
          messages: [],
        });
      }

      const conv = convs[0];

      // Mark seller messages as read
      await sql`
        UPDATE chat_messages
        SET read = true
        WHERE conversation_id = ${conv.id} AND sender_id != ${user.userId} AND read = false
      `;

      const messages = await sql`
        SELECT cm.id, cm.sender_id, u.email AS sender_email, cm.text, cm.created_at, cm.read
        FROM chat_messages cm
        JOIN users u ON u.id = cm.sender_id
        WHERE cm.conversation_id = ${conv.id}
        ORDER BY cm.created_at ASC
      `;

      return res.status(200).json({
        success: true,
        role: 'buyer',
        conversationId: conv.id,
        messages: messages.map(m => ({
          id: m.id,
          senderId: m.sender_id,
          senderEmail: m.sender_email,
          text: m.text,
          createdAt: m.created_at,
          read: m.read,
          role: m.sender_id === ad.owner_id ? 'seller' : 'buyer',
        })),
      });
    }
  } catch (error) {
    console.error('Chat GET error:', error);
    return res.status(500).json({ success: false, message: 'Error al cargar mensajes.' });
  }
}

/**
 * POST /api/chat/[adId]
 * Send a message. Body: { text, conversationId? }
 * - Buyer: creates conversation if needed, sends as buyer
 * - Seller (ad owner): replies to an existing conversation (must provide conversationId)
 */
async function handleSendMessage(req, res, adId) {
  try {
    const user = authMiddleware(req);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Inicia sesión para enviar mensajes.' });
    }

    const { text, conversationId } = req.body || {};
    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, message: 'El mensaje no puede estar vacío.' });
    }
    if (text.trim().length > 1000) {
      return res.status(400).json({ success: false, message: 'El mensaje no puede superar 1000 caracteres.' });
    }

    // Verify ad exists and is active
    const ads = await sql`
      SELECT id, owner_id FROM ads
      WHERE public_id = ${adId} AND status = 'active'
    `;
    if (ads.length === 0) {
      return res.status(404).json({ success: false, message: 'Anuncio no encontrado o no activo.' });
    }
    const ad = ads[0];
    const isSeller = ad.owner_id === user.userId;

    let convId = conversationId ? Number(conversationId) : null;

    if (isSeller) {
      // Seller must reply to an existing conversation
      if (!convId) {
        return res.status(400).json({ success: false, message: 'Se requiere conversationId para responder.' });
      }
      // Verify the conversation belongs to this ad
      const convCheck = await sql`
        SELECT id FROM chat_conversations WHERE id = ${convId} AND ad_public_id = ${adId}
      `;
      if (convCheck.length === 0) {
        return res.status(403).json({ success: false, message: 'Conversación no encontrada.' });
      }
    } else {
      // Buyer: find or create conversation
      const convs = await sql`
        SELECT id FROM chat_conversations
        WHERE ad_public_id = ${adId} AND buyer_id = ${user.userId}
      `;
      if (convs.length === 0) {
        // Create new conversation
        const newConv = await sql`
          INSERT INTO chat_conversations (ad_public_id, buyer_id, seller_id)
          VALUES (${adId}, ${user.userId}, ${ad.owner_id})
          RETURNING id
        `;
        convId = newConv[0].id;
      } else {
        convId = convs[0].id;
      }
    }

    // Insert message
    const msgResult = await sql`
      INSERT INTO chat_messages (conversation_id, sender_id, text)
      VALUES (${convId}, ${user.userId}, ${text.trim()})
      RETURNING id, sender_id, text, created_at, read
    `;

    // Update last_message_at on conversation
    await sql`
      UPDATE chat_conversations SET last_message_at = NOW() WHERE id = ${convId}
    `;

    const msg = msgResult[0];

    return res.status(201).json({
      success: true,
      conversationId: convId,
      message: {
        id: msg.id,
        senderId: msg.sender_id,
        text: msg.text,
        createdAt: msg.created_at,
        read: msg.read,
        role: isSeller ? 'seller' : 'buyer',
      },
    });
  } catch (error) {
    console.error('Chat POST error:', error);
    return res.status(500).json({ success: false, message: 'Error al enviar mensaje.' });
  }
}
