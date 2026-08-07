const axios = require('axios');
const bagachatConfig = require('../config/bagachat');
const messageRepository = require('../repositories/MessageRepository');
const deliveryStatusRepository = require('../repositories/DeliveryStatusRepository');

class BagAChatService {
  /**
   * Helper to execute BagAChat API call with automatic Auth Fallback and explicit production logging
   */
  async postWithAuthFallback(url, payload) {
    const rawToken = bagachatConfig.BAGACHAT_BASIC_AUTH || 'PUSHKARBOT';

    const authHeaders = [
      rawToken.startsWith('Bearer ') || rawToken.startsWith('Basic ') ? rawToken : `Bearer ${rawToken}`,
      rawToken.startsWith('Basic ') || rawToken.startsWith('Bearer ') ? rawToken : `Basic ${rawToken}`,
      rawToken
    ];

    let lastError = null;

    console.log(`📡 [BagAChat API Outbound] URL: ${url}`);
    console.log(`📦 [BagAChat API Outbound] Payload:`, JSON.stringify(payload, null, 2));

    for (const authHeader of authHeaders) {
      try {
        console.log(`🔑 [BagAChat API Outbound] Trying Authorization Header: "${authHeader}"`);
        const response = await axios.post(url, payload, {
          headers: {
            'Authorization': authHeader,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        });

        console.log(`✅ [BagAChat API Outbound] Success! Status Code: ${response.status}`);
        console.log(`📄 [BagAChat API Outbound] Response Body:`, JSON.stringify(response.data));
        return response.data;
      } catch (error) {
        lastError = error;
        console.error(`⚠️ [BagAChat API Outbound] Attempt Failed. Status Code: ${error.response?.status || 'NETWORK_ERR'}, Body:`, error.response?.data || error.message);
        if (error.response && error.response.status === 401) {
          continue;
        }
        throw error;
      }
    }

    // Fallback: Try with token in body
    try {
      console.log(`🔑 [BagAChat API Outbound] Trying Body Token Fallback...`);
      const response = await axios.post(url, { ...payload, token: rawToken, apitoken: rawToken }, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000
      });
      console.log(`✅ [BagAChat API Outbound] Body Fallback Success! Status Code: ${response.status}`);
      return response.data;
    } catch (err) {
      console.error(`❌ [BagAChat API Outbound] All Authentication Attempts Failed! Final Error:`, err.response?.data || err.message);
      throw lastError || err;
    }
  }

  /**
   * API 1.1: Business Initiated Template Message
   */
  async sendTemplateMessage(phone, templateName = 'state_vendor_alert1', paramsArray = [], defaultText = 'New Complaint', ticketNumber = '') {
    const conversationname = phone.startsWith('+') ? phone : `+${phone.replace(/[^0-9]/g, '')}`;

    const payload = {
      conversationname,
      message: defaultText,
      templatename: templateName,
      wanamespace: 'bagachat',
      language: 'en_us',
      params: paramsArray.map(p => (typeof p === 'object' ? p : { text: String(p) }))
    };

    let responseData = null;
    let messageId = `MSG_TMPL_${Date.now()}`;
    let status = 'SENT';

    try {
      responseData = await this.postWithAuthFallback(bagachatConfig.BAGACHAT_TRANSACTIONAL_API, payload);
      if (responseData?.messageid) messageId = responseData.messageid;
    } catch (error) {
      console.error(`❌ BagAChat API 1.1 Error (${phone}):`, error.response?.data || error.message);
      responseData = { success: false, error: error.message, details: error.response?.data };
      status = 'FAILED';
    }

    // Record outbound message in repository
    await messageRepository.create({
      direction: 'Outbound',
      phone: conversationname,
      message: `Template: ${templateName} | ${defaultText}`,
      templateName,
      deliveryStatus: status,
      messageId,
      ticketNumber,
      timestamp: new Date()
    });

    await deliveryStatusRepository.updateDeliveryStatus(messageId, status, '', conversationname);

    return { success: status === 'SENT', messageId, data: responseData };
  }

  /**
   * API 1.2: Customer Care Session Message (24-Hour Window)
   */
  async sendSessionMessage(phone, messageText, ticketNumber = '') {
    const conversationname = phone.startsWith('+') ? phone : `+${phone.replace(/[^0-9]/g, '')}`;

    const payload = {
      conversationname,
      message: messageText
    };

    let responseData = null;
    let messageId = `MSG_SESS_${Date.now()}`;
    let status = 'SENT';

    try {
      responseData = await this.postWithAuthFallback(bagachatConfig.BAGACHAT_SESSION_API, payload);
      if (responseData?.messageid) messageId = responseData.messageid;
    } catch (error) {
      console.error(`❌ BagAChat API 1.2 Error (${phone}):`, error.response?.data || error.message);
      responseData = { success: false, error: error.message, details: error.response?.data };
      status = 'FAILED';
    }

    // Record outbound message in repository
    await messageRepository.create({
      direction: 'Outbound',
      phone: conversationname,
      message: messageText,
      deliveryStatus: status,
      messageId,
      ticketNumber,
      timestamp: new Date()
    });

    return { success: status === 'SENT', messageId, data: responseData };
  }

  /**
   * API 4: Incoming Message Forwarding Parser
   */
  parseWebhookPayload(body) {
    const phone = body?.phone || body?.sender || body?.conversationname?.replace(/[^0-9]/g, '') || '';
    const countrycode = body?.countrycode || '91';
    const message = body?.message || body?.text || '';
    const mediaurl = body?.mediaurl || body?.image || '';
    const mediatype = body?.mediatype || (mediaurl ? 'image' : 'text');
    const conversation = body?.conversation || body?.bacmsgid || body?.messageid || `CONV_${Date.now()}`;
    const bacmsgid = body?.bacmsgid || body?.messageid || '';
    const repliedbacmsgid = body?.repliedbacmsgid || '';
    const time = body?.time ? new Date(body.time) : new Date();

    return {
      phone,
      fullPhone: phone.startsWith(countrycode) ? phone : `${countrycode}${phone}`,
      countrycode,
      message: String(message).trim(),
      mediaurl,
      mediatype,
      conversation,
      bacmsgid,
      repliedbacmsgid,
      time
    };
  }
}

module.exports = new BagAChatService();
