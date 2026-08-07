const ticketRepository = require('../repositories/TicketRepository');

/**
 * Generate sequential ticket number (e.g. TKT-202600001)
 */
async function generateNextTicketNumber() {
  const currentYear = new Date().getFullYear();
  const count = await ticketRepository.count({});
  const sequenceNumber = (count + 1).toString().padStart(5, '0');
  return `TKT-${currentYear}${sequenceNumber}`;
}

module.exports = {
  generateNextTicketNumber
};
