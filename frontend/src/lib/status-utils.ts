// Helper function to format status names
export const formatStatusName = (status: string) => {
  return status.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
};

// Helper function to get status color
export const getStatusColor = (status: string) => {
  const colors: { [key: string]: string } = {
    'APPLIED': '#3B82F6',
    'PHONE_SCREEN': '#F59E0B', 
    'FINAL_INTERVIEW': '#8B5CF6',
    'TECHNICAL_TEST': '#06B6D4',
    'OFFER': '#10B981',
    'NEGOTIATION': '#F97316',
    'ACCEPTED': '#22C55E',
    'REJECTED': '#EF4444',
    'ON_HOLD': '#6B7280'
  };
  return colors[status] || '#6B7280';
};

// Helper function to get priority info
export const getPriorityInfo = (priority: number) => {
  switch (priority) {
    case 1: return { label: "High", color: "destructive" as const };
    case 2: return { label: "Medium", color: "default" as const };
    case 3: return { label: "Low", color: "secondary" as const };
    default: return { label: "Medium", color: "default" as const };
  }
};

// Helper function to format salary
export const formatSalary = (min: number, max: number, currency: string) => {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  
  if (min && max) {
    return `${formatter.format(min)} - ${formatter.format(max)}`;
  } else if (min) {
    return `${formatter.format(min)}+`;
  }
  return 'Not specified';
}; 