function exportTicketsToCSV(tickets) {
  const headers = [
    'Ticket Number',
    'Citizen Name',
    'Citizen Phone',
    'Category',
    'Ward',
    'Area',
    'Status',
    'Assigned Vendor',
    'Complaint Text',
    'Created At'
  ];

  const rows = tickets.map(t => [
    `"${t.ticketNumber || ''}"`,
    `"${t.citizen?.name || ''}"`,
    `"${t.citizen?.phone || ''}"`,
    `"${t.complaint?.category || ''}"`,
    `"${t.wardName || ''}"`,
    `"${t.areaName || ''}"`,
    `"${t.status || ''}"`,
    `"${t.assignedVendor?.name || 'Unassigned'}"`,
    `"${(t.complaint?.text || '').replace(/"/g, '""')}"`,
    `"${new Date(t.createdAt).toISOString()}"`
  ]);

  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}

module.exports = {
  exportTicketsToCSV
};
