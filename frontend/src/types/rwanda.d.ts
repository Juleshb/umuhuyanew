declare module "rwanda" {
  export type TProvince = "East" | "Kigali" | "North" | "South" | "West";
  export type TDistrict = string;

  export function Provinces(): TProvince[];
  export function Districts(params?: { provinces: TProvince | TProvince[] }): string[] | undefined;
  export function Sectors(params?: {
    province: TProvince;
    district: TDistrict;
  }): string[] | undefined;
  export function Cells(params?: {
    province: TProvince;
    district: TDistrict;
    sector: string;
  }): string[] | undefined;
  export function Villages(params?: {
    province: TProvince;
    district: TDistrict;
    sector: string;
    cell: string;
  }): string[] | undefined;
}
