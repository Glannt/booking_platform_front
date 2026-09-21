/**
 * Common deposit types and configurations used across Booking modules
 * (Airport Transfers, Intercity, Self-Drive, Tours, etc.)
 */

export type DepositType = "PERCENT" | "FIXED";

export interface DepositOption {
  depositType: DepositType;
  depositRate?: number;
  depositAmount?: number;
}

export interface RouteDepositConfig {
  depositType: DepositType;
  depositRate: number;
  depositAmount?: number;
}
