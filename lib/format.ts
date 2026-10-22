export function formatTime(timestamp: number) {
  return new Date(timestamp).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
}

// Accepts "+7 (999) 123-45-67" etc. MAX via GREEN-API supports only RU (7) and BY (375) numbers.
export function normalizePhone(input: string): string | null {
  let digits = input.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("8")) digits = "7" + digits.slice(1);
  if (/^7\d{10}$/.test(digits) || /^375\d{9}$/.test(digits)) return digits;
  return null;
}
