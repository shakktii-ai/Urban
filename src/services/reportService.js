const ticketRepository = require('../repositories/TicketRepository');
const { exportTicketsToCSV } = require('../utils/csvExporter');

class ReportService {
  async generateTicketsCSVReport(status = 'ALL') {
    const filter = {};
    if (status && status !== 'ALL') {
      filter.status = status;
    }

    const tickets = await ticketRepository.find(filter, {
      sort: { createdAt: -1 },
      populate: 'assignedVendor'
    });

    return exportTicketsToCSV(tickets);
  }
}

module.exports = new ReportService();
