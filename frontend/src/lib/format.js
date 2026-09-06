const FIELD_LABELS = {
  name: "Name",
  category: "Category",
  address: "Address",
  phone: "Phone",
  website: "Website",
  rating: "Rating",
  reviewCount: "Reviews",
  status: "Status",
  hours: "Opening hours",
  mapsUrl: "Google Maps URL",
  coordinates: "Coordinates",
  emails: "Emails"
};

export function formatNumber(value = 0) {
  return new Intl.NumberFormat("en-US").format(Number(value) || 0);
}

export function formatDateTime(value) {
  if (!value) {
    return "Just now";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(value));
}

export function formatRelativeTime(value) {
  if (!value) {
    return "Just now";
  }

  const seconds = Math.round((new Date(value).getTime() - Date.now()) / 1000);
  const formatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  const ranges = [
    { limit: 60, unit: "second" },
    { limit: 3600, unit: "minute", divisor: 60 },
    { limit: 86400, unit: "hour", divisor: 3600 },
    { limit: 604800, unit: "day", divisor: 86400 }
  ];

  for (const range of ranges) {
    if (Math.abs(seconds) < range.limit) {
      const valueToFormat = range.divisor ? Math.round(seconds / range.divisor) : seconds;
      return formatter.format(valueToFormat, range.unit);
    }
  }

  return formatDateTime(value);
}

export function formatRequestedField(field) {
  return FIELD_LABELS[field] || field;
}

export function getStatusMeta(status) {
  const normalized = (status || "").toLowerCase();

  if (normalized === "completed") {
    return {
      label: "Completed",
      tone: "success"
    };
  }

  if (normalized === "running") {
    return {
      label: "Running",
      tone: "warning"
    };
  }

  if (normalized === "stopped") {
    return {
      label: "Stopped",
      tone: "destructive"
    };
  }

  if (normalized === "failed") {
    return {
      label: "Failed",
      tone: "destructive"
    };
  }

  return {
    label: "Queued",
    tone: "secondary"
  };
}

export function truncate(value, max = 56) {
  if (!value) {
    return "";
  }

  if (value.length <= max) {
    return value;
  }

  return `${value.slice(0, max - 1)}…`;
}
