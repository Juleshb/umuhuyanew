"use client";

import { useMemo } from "react";
import {
  cellOptions,
  districtOptions,
  provinceOptions,
  sectorOptions,
  villageOptions,
} from "@/lib/rwanda-location";

export type RwandaLocationValue = {
  province: string;
  district: string;
  sector: string;
  cell: string;
  village: string;
};

type Props = {
  value: RwandaLocationValue;
  onChange: (next: RwandaLocationValue) => void;
  requiredDistrict?: boolean;
  className?: string;
  selectClassName?: string;
  showLabels?: boolean;
  includeEmpty?: boolean;
};

function SelectField({
  label,
  value,
  options,
  required,
  emptyLabel,
  includeEmpty,
  showLabels,
  selectClassName,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  required?: boolean;
  emptyLabel: string;
  includeEmpty: boolean;
  showLabels: boolean;
  selectClassName: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block animate-rise text-sm">
      {showLabels ? label : <span className="sr-only">{label}</span>}
      <select
        className={selectClassName}
        value={value}
        required={required}
        aria-label={label}
        onChange={(e) => onChange(e.target.value)}
      >
        {includeEmpty || !required ? <option value="">{emptyLabel}</option> : null}
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

export function RwandaLocationFields({
  value,
  onChange,
  requiredDistrict = false,
  className = "grid gap-2 sm:grid-cols-2 lg:grid-cols-3",
  selectClassName = "input mt-1 rounded-xl",
  showLabels = true,
  includeEmpty = true,
}: Props) {
  const provinces = useMemo(() => provinceOptions(), []);
  const districts = useMemo(() => districtOptions(value.province), [value.province]);
  const sectors = useMemo(
    () => sectorOptions(value.province, value.district),
    [value.province, value.district]
  );
  const cells = useMemo(
    () => cellOptions(value.province, value.district, value.sector),
    [value.province, value.district, value.sector]
  );
  const villages = useMemo(
    () => villageOptions(value.province, value.district, value.sector, value.cell),
    [value.province, value.district, value.sector, value.cell]
  );

  function setField<K extends keyof RwandaLocationValue>(
    key: K,
    nextValue: RwandaLocationValue[K]
  ) {
    const next: RwandaLocationValue = { ...value, [key]: nextValue };
    if (key === "province") {
      next.district = "";
      next.sector = "";
      next.cell = "";
      next.village = "";
    } else if (key === "district") {
      next.sector = "";
      next.cell = "";
      next.village = "";
    } else if (key === "sector") {
      next.cell = "";
      next.village = "";
    } else if (key === "cell") {
      next.village = "";
    }
    onChange(next);
  }

  return (
    <div className={className}>
      <label className="block text-sm">
        {showLabels ? "Province" : <span className="sr-only">Province</span>}
        <select
          className={selectClassName}
          value={value.province}
          aria-label="Province"
          onChange={(e) => setField("province", e.target.value)}
        >
          {includeEmpty ? <option value="">All provinces</option> : null}
          {provinces.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
      </label>

      {value.province ? (
        <SelectField
          label="District"
          value={value.district}
          options={districts}
          required={requiredDistrict}
          emptyLabel={includeEmpty ? "All districts" : "Choose district"}
          includeEmpty={includeEmpty || !requiredDistrict}
          showLabels={showLabels}
          selectClassName={selectClassName}
          onChange={(v) => setField("district", v)}
        />
      ) : null}

      {value.district ? (
        <SelectField
          label="Sector"
          value={value.sector}
          options={sectors}
          emptyLabel={includeEmpty ? "All sectors" : "Choose sector"}
          includeEmpty={includeEmpty}
          showLabels={showLabels}
          selectClassName={selectClassName}
          onChange={(v) => setField("sector", v)}
        />
      ) : null}

      {value.sector ? (
        <SelectField
          label="Cell"
          value={value.cell}
          options={cells}
          emptyLabel={includeEmpty ? "All cells" : "Choose cell"}
          includeEmpty={includeEmpty}
          showLabels={showLabels}
          selectClassName={selectClassName}
          onChange={(v) => setField("cell", v)}
        />
      ) : null}

      {value.cell ? (
        <SelectField
          label="Village"
          value={value.village}
          options={villages}
          emptyLabel={includeEmpty ? "All villages" : "Choose village"}
          includeEmpty={includeEmpty}
          showLabels={showLabels}
          selectClassName={selectClassName}
          onChange={(v) => setField("village", v)}
        />
      ) : null}
    </div>
  );
}
