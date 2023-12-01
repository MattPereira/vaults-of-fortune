export function formatWithCommas(value: number | string): string {
  const stringValue = value.toString();

  // Use a regular expression to format the string with commas
  return stringValue.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
