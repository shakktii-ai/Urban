const axios = require('axios');
const bagachatConfig = require('../config/bagachat');
const messageRepository = require('../repositories/MessageRepository');
const deliveryStatusRepository = require('../repositories/DeliveryStatusRepository');

class BagAChatService {
  /**
   * Helper to format phone number to clean E.164 digits without + prefix (91XXXXXXXXXX)
   * Automatically adds India country code 91 for 10-digit numbers
   */
  formatPhoneNumber(phone) {
    if (!phone) return '';
    let digits = String(phone).replace(/[^0-9]/g, '');
    if (digits.length === 10) {
      digits = `91${digits}`;
    }
    return digits;
  }

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
  async sendTemplateMessage(phone, templateName = 'state_vendor_alert1', paramsArray = [], defaultText = 'New Complaint', ticketNumber = '', metaData = {}) {
    const conversationname = this.formatPhoneNumber(phone);

    const payload = {
      conversationname,
      message: defaultText,
      templatename: templateName,
      wanamespace: 'bagachat',
      language: 'en_US',
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

    // Record outbound message in messages repository
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

    // Step 1: Save messageId in deliveryStatus repository with PENDING / SENT status
    await deliveryStatusRepository.upsertStatusRecord({
      messageId,
      ticketId: metaData.ticketId || null,
      ticketNumber: ticketNumber || metaData.ticketNumber || '',
      vendorId: metaData.vendorId || null,
      vendorName: metaData.vendorName || '',
      citizenId: metaData.citizenId || '',
      citizenName: metaData.citizenName || '',
      phone: conversationname,
      messageType: 'TEMPLATE',
      apiUsed: 'API 1.1',
      status: status === 'SENT' ? 'PENDING' : 'FAILED',
      requestPayload: payload,
      rawResponse: responseData
    });

    return { success: status === 'SENT', messageId, data: responseData };
  }

  /**
   * API 1.2: Customer Care Session Message (24-Hour Window)
   */
  async sendSessionMessage(phone, messageText, ticketNumber = '', metaData = {}) {
    const conversationname = this.formatPhoneNumber(phone);

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

    // Record outbound message in messages repository
    await messageRepository.create({
      direction: 'Outbound',
      phone: conversationname,
      message: messageText,
      deliveryStatus: status,
      messageId,
      ticketNumber,
      timestamp: new Date()
    });

    // Step 1: Save messageId in deliveryStatus repository with PENDING / SENT status
    await deliveryStatusRepository.upsertStatusRecord({
      messageId,
      ticketId: metaData.ticketId || null,
      ticketNumber: ticketNumber || metaData.ticketNumber || '',
      vendorId: metaData.vendorId || null,
      vendorName: metaData.vendorName || '',
      citizenId: metaData.citizenId || '',
      citizenName: metaData.citizenName || '',
      phone: conversationname,
      messageType: 'SESSION',
      apiUsed: 'API 1.2',
      status: status === 'SENT' ? 'PENDING' : 'FAILED',
      requestPayload: payload,
      rawResponse: responseData
    });

    return { success: status === 'SENT', messageId, data: responseData };
  }

  /**
   * STEP 2: BagAChat API 2 Delivery Status Check
   * Supports Format A ({ messagestatus: "PENDING", status: "SUCCESS" })
   * AND Format B ({ note: "Provided Message Status", status: "WAAPIERRCODE_131042" })
   */
  async getMessageStatus(messageId, messageType = 'TEMPLATE') {
    const targetUrl = messageType === 'SESSION'
      ? bagachatConfig.BAGACHAT_SESSION_STATUS_API
      : bagachatConfig.BAGACHAT_TEMPLATE_STATUS_API;

    const payload = { messageid: messageId };

    console.log(`🔎 [BagAChat API 2 Status Check] MessageId: ${messageId}, Type: ${messageType}, URL: ${targetUrl}`);

    try {
      const responseData = await this.postWithAuthFallback(targetUrl, payload);
      const { META_WHATSAPP_ERROR_MAP } = require('../config/constants');

      const statusField = String(responseData?.status || responseData?.messagestatus || '').trim();
      const noteField = responseData?.note || responseData?.message || '';

      // Format B: Meta WhatsApp Error Code (WAAPIERRCODE_XXXXXX)
      if (statusField.startsWith('WAAPIERRCODE_') || statusField.includes('ERR')) {
        const rawCode = statusField.replace('WAAPIERRCODE_', '');
        const mappedError = META_WHATSAPP_ERROR_MAP[rawCode];

        const errorCode = statusField;
        const errorMessage = mappedError ? mappedError.description : `Meta WhatsApp API Error ${rawCode}`;
        const resolution = mappedError ? mappedError.resolution : '';
        const fullReason = `${mappedError?.title || 'Meta WhatsApp Error'} (${rawCode}): ${errorMessage} ${resolution ? 'Action Needed: ' + resolution : ''}`;

        return {
          success: true,
          messageStatus: 'FAILED',
          errorCode,
          errorMessage: fullReason,
          reason: fullReason,
          rawResponse: responseData
        };
      }

      // Format A: Standard Delivery Status
      const rawStatus = (responseData?.messagestatus || responseData?.status || 'UNKNOWN').toUpperCase();
      const isFailed = rawStatus.includes('FAIL') || rawStatus.includes('ERR');
      const messageStatus = isFailed ? 'FAILED' : (rawStatus === 'SUCCESS' ? 'PENDING' : rawStatus);

      return {
        success: true,
        messageStatus,
        errorCode: isFailed ? rawStatus : '',
        errorMessage: noteField,
        reason: noteField || `BagAChat Status: ${messageStatus}`,
        rawResponse: responseData
      };
    } catch (error) {
      console.error(`❌ [BagAChat API 2 Error] MessageId (${messageId}):`, error.response?.data || error.message);
      return {
        success: false,
        messageStatus: 'FAILED',
        errorCode: 'HTTP_ERROR',
        errorMessage: error.message,
        reason: error.message,
        rawResponse: error.response?.data || { error: error.message }
      };
    }
  }

  /**
   * API 4: Incoming Message Forwarding Parser
   */
  parseWebhookPayload(body) {
    const rawPhone = body?.phone || body?.sender || body?.conversationname?.replace(/[^0-9]/g, '') || '';
    const countrycode = body?.countrycode || '91';
    const message = body?.message || body?.text || '';
    const mediaurl = body?.mediaurl || body?.image || '';
    const mediatype = body?.mediatype || (mediaurl ? 'image' : 'text');
    const conversation = body?.conversation || body?.bacmsgid || body?.messageid || `CONV_${Date.now()}`;
    const bacmsgid = body?.bacmsgid || body?.messageid || '';
    const repliedbacmsgid = body?.repliedbacmsgid || '';
    const time = body?.time ? new Date(body.time) : new Date();

    const fullPhone = this.formatPhoneNumber(rawPhone);

    return {
      phone: rawPhone,
      fullPhone,
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
