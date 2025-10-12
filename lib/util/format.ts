import { Unit } from "@/lib/domain/types";

/**
 * Format a value according to its unit specification
 */
export function formatValue(value: number, unit: Unit): string {
  const decimals = unit.decimals ?? 2;

  switch (unit.format) {
    case "percent":
      return `${(value * 100).toFixed(decimals)}%`;
    
    case "integer":
      return Math.round(value).toString();
    
    case "decimal":
      return value.toFixed(decimals);
    
    case "number":
    default:
      return value.toFixed(decimals);
  }
}

/**
 * Format a value with high precision for ticker display
 */
export function formatValueDetailed(value: number, unit: Unit): string {
  const decimals = 6; // Always show 6 decimals for animation visibility
  
  switch (unit.format) {
    case "percent":
      return `${(value * 100).toFixed(decimals)}%`;
    
    case "integer":
      return value.toFixed(decimals);
    
    case "decimal":
    case "number":
    default:
      return value.toFixed(decimals);
  }
}

/**
 * Format a metric with confidence interval
 */
export function formatMetric(key: string, value: number, unit?: Unit, ci?: number): string {
  const formattedValue = unit ? formatValue(value, unit) : value.toFixed(2);
  
  if (ci !== undefined && unit) {
    const formattedCI = formatValue(ci, unit);
    return `${key} = ${formattedValue} ± ${formattedCI}`;
  }
  
  return `${key} = ${formattedValue}`;
}

