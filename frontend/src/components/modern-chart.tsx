"use client";

import dynamic from "next/dynamic";
import type { ApexOptions } from "apexcharts";

const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

type Props = {
  type: "area" | "bar" | "donut" | "line";
  series: ApexOptions["series"];
  options: ApexOptions;
  height?: number;
};

export function ModernChart({ type, series, options, height = 300 }: Props) {
  return (
    <ReactApexChart
      type={type}
      series={series}
      options={options}
      height={height}
      width="100%"
    />
  );
}
