import { format, parseISO } from "date-fns";

export const formatDate = (date) => {
  if (!date) return "";
  try {
    return format(parseISO(date), "MMM dd, yyyy");
  } catch {
    return date;
  }
};

export const formatDateTime = (date) => {
  if (!date) return "";
  try {
    return format(parseISO(date), "MMM dd, yyyy hh:mm a");
  } catch {
    return date;
  }
};

export const formatTime = (time) => {
  if (!time) return "";
  try {
    return format(parseISO(`2000-01-01T${time}`), "hh:mm a");
  } catch {
    return time;
  }
};
