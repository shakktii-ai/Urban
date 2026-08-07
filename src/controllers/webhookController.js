const bagachatService = require('../services/bagachatService');
const ticketService = require('../services/ticketService');
const messageRepository = require('../repositories/MessageRepository');
const conversationRepository = require('../repositories/ConversationRepository');

const CATEGORIES_MENU = {
  '1': 'Water Leakage',
  '2': 'Garbage',
  '3': 'Electricity',
  '4': 'Drainage',
  '5': 'Road Damage',
  '6': 'Street Light',
  '7': 'Other'
};

class WebhookController {
  /**
   * Handle incoming BagAChat Webhook POST requests (/api/webhook/bagachat)
   */
  async handleWebhook(req, res) {
    try {
      // GET Webhook verification challenge from BagAChat / Meta
      if (req.method === 'GET') {
        const mode = req.query['hub.mode'];
        const token = req.query['hub.verify_token'];
        const challenge = req.query['hub.challenge'];
        const verifyToken = process.env.BAGACHAT_VERIFY_TOKEN || '919022557901';

        if (mode === 'subscribe' && token === verifyToken) {
          return res.status(200).send(challenge);
        }
        return res.status(403).send('Verification failed');
      }

      const parsed = bagachatService.parseWebhookPayload(req.body);
      const { phone, fullPhone, message, mediaurl, mediatype, conversation } = parsed;

      if (!phone && !fullPhone) {
        return res.status(200).json({ success: true, message: 'No phone number found' });
      }

      const userPhone = fullPhone || phone;

      // Save inbound raw message via Repository
      await messageRepository.create({
        direction: 'Inbound',
        phone: userPhone,
        message,
        mediaUrl: mediaurl,
        mediaType: mediatype,
        messageId: conversation || `IN_${Date.now()}`,
        timestamp: new Date()
      });

      const lowerMessage = message.toLowerCase().trim();

      // =========================================================
      // VENDOR REPLIES PROCESSING (Features 3 & 4)
      // =========================================================

      // Feature 3: Vendor ACCEPT reply with First-to-Accept Atomic Lock
      if (lowerMessage === 'accept' || lowerMessage.includes('accept_') || lowerMessage === 'job accepted') {
        const ticket = await ticketService.handleVendorAccept(userPhone);
        return res.status(200).json({
          success: true,
          action: 'VENDOR_ACCEPT',
          ticketNumber: ticket?.ticketNumber || null
        });
      }

      // Feature 4: Vendor DECLINE / REJECT reply with Auto-Retry next vendor
      if (['decline', 'reject', 'job declined', 'job rejected'].includes(lowerMessage) || lowerMessage.includes('decline_') || lowerMessage.includes('reject_')) {
        const ticket = await ticketService.handleVendorDecline(userPhone);
        return res.status(200).json({
          success: true,
          action: 'VENDOR_DECLINE',
          ticketNumber: ticket?.ticketNumber || null
        });
      }

      // Vendor COMPLETION reply
      if (lowerMessage === 'completed' || lowerMessage === 'done' || lowerMessage === 'resolved') {
        const ticket = await ticketService.handleVendorCompletion(userPhone, message, mediaurl);
        return res.status(200).json({
          success: true,
          action: 'VENDOR_COMPLETION',
          ticketNumber: ticket?.ticketNumber || null
        });
      }

      // =========================================================
      // FEATURE 1: CITIZEN CONVERSATION FLOW STATE MACHINE
      // =========================================================

      // Reset or Start Conversation if "HI" / "START" / "HELLO"
      if (['hi', 'hello', 'start', 'menu', 'restart'].includes(lowerMessage)) {
        await conversationRepository.createOrResetSession(userPhone);

        const welcomeMenu = `Welcome to Municipal Citizen Complaint Service.\n\n` +
          `Please choose complaint type:\n` +
          `1. Water Leakage\n` +
          `2. Garbage\n` +
          `3. Electricity\n` +
          `4. Drainage\n` +
          `5. Road Damage\n` +
          `6. Street Light\n` +
          `7. Other\n\n` +
          `Reply with number (1-7) or category name.`;

        await bagachatService.sendSessionMessage(userPhone, welcomeMenu);
        return res.status(200).json({ success: true, step: 'CATEGORY' });
      }

      // Get active session
      let session = await conversationRepository.getSession(userPhone);

      // If no active session, prompt citizen to send "HI"
      if (!session) {
        await conversationRepository.createOrResetSession(userPhone);
        const welcomeMenu = `Welcome to Municipal Citizen Complaint Service.\n\n` +
          `Please choose complaint type:\n` +
          `1. Water Leakage\n` +
          `2. Garbage\n` +
          `3. Electricity\n` +
          `4. Drainage\n` +
          `5. Road Damage\n` +
          `6. Street Light\n` +
          `7. Other\n\n` +
          `Reply with number (1-7) or category name.`;

        await bagachatService.sendSessionMessage(userPhone, welcomeMenu);
        return res.status(200).json({ success: true, step: 'CATEGORY' });
      }

      // STEP 1: CATEGORY SELECTION
      if (session.currentStep === 'CATEGORY') {
        const categoryMatch = CATEGORIES_MENU[message] || message;
        await conversationRepository.updateSession(userPhone, {
          complaintCategory: categoryMatch,
          currentStep: 'AREA'
        });

        await bagachatService.sendSessionMessage(userPhone, `Selected Category: ${categoryMatch}.\n\nPlease enter your Area (locality/colony name):`);
        return res.status(200).json({ success: true, step: 'AREA' });
      }

      // STEP 2: AREA SELECTION
      if (session.currentStep === 'AREA') {
        await conversationRepository.updateSession(userPhone, {
          areaName: message,
          currentStep: 'WARD'
        });

        await bagachatService.sendSessionMessage(userPhone, `Area recorded: ${message}.\n\nPlease enter your Ward (e.g. Ward 5):`);
        return res.status(200).json({ success: true, step: 'WARD' });
      }

      // STEP 3: WARD SELECTION
      if (session.currentStep === 'WARD') {
        await conversationRepository.updateSession(userPhone, {
          wardName: message,
          currentStep: 'PHOTO'
        });

        await bagachatService.sendSessionMessage(userPhone, `Ward recorded: ${message}.\n\nPlease describe your complaint and upload a photo (or reply 'skip'):`);
        return res.status(200).json({ success: true, step: 'PHOTO' });
      }

      // STEP 4: PHOTO / DESCRIPTION SELECTION
      if (session.currentStep === 'PHOTO') {
        await conversationRepository.updateSession(userPhone, {
          complaintText: message,
          photoUrl: mediaurl || '',
          currentStep: 'CONFIRM'
        });

        const summaryText = `Do you want to submit this complaint?\n\n` +
          `• Category: ${session.complaintCategory}\n` +
          `• Area: ${session.areaName}\n` +
          `• Ward: ${message}\n` +
          `• Details: ${message}\n\n` +
          `Reply YES to submit or NO to cancel.`;

        await bagachatService.sendSessionMessage(userPhone, summaryText);
        return res.status(200).json({ success: true, step: 'CONFIRM' });
      }

      // STEP 5: CONFIRMATION (YES / NO)
      if (session.currentStep === 'CONFIRM') {
        if (['yes', 'y', 'submit', 'confirm'].includes(lowerMessage)) {
          // Generate Ticket ONLY after YES confirmation
          const result = await ticketService.processIncomingComplaint({
            phone: userPhone,
            name: bodyName(req.body) || 'Citizen',
            messageText: session.complaintText || 'Complaint submitted via WhatsApp',
            mediaUrl: session.photoUrl,
            mediaType: session.photoUrl ? 'image' : 'text',
            areaName: session.areaName,
            wardName: session.wardName,
            category: session.complaintCategory
          });

          await conversationRepository.clearSession(userPhone);

          const confirmNotice = `✅ Service Request Created Successfully!\n\n` +
            `Ticket ID: ${result.ticket.ticketNumber}\n` +
            `Category: ${result.ticket.complaint.category}\n` +
            `Status: NEW\n\n` +
            `We are notifying matching vendors in your area. Thank you!`;

          await bagachatService.sendSessionMessage(userPhone, confirmNotice, result.ticket.ticketNumber);

          return res.status(200).json({
            success: true,
            action: 'CITIZEN_TICKET_CREATED',
            ticketNumber: result.ticket.ticketNumber
          });
        } else {
          await conversationRepository.clearSession(userPhone);
          await bagachatService.sendSessionMessage(userPhone, `Complaint registration cancelled. Reply HI anytime to start again.`);
          return res.status(200).json({ success: true, action: 'CANCELLED' });
        }
      }

      return res.status(200).json({ success: true });

    } catch (error) {
      console.error('BagAChat Webhook Controller Error:', error);
      return res.status(500).json({ success: false, error: error.message });
    }
  }
}

function bodyName(body) {
  return body?.name || body?.contacts?.[0]?.profile?.name || body?.senderName || 'Citizen';
}

module.exports = new WebhookController();
