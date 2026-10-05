"use client";

import dynamic from "next/dynamic";

export const PropertyMapPicker = dynamic(
  () => import("./property-map-picker").then((m) => m.PropertyMapPicker),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-72 items-center justify-center rounded-xl border border-black/10 bg-slate-50 text-sm text-ink/55">
        Loading map…
      </div>
    ),
  }
);

export const PropertyMap = dynamic(
  () => import("./property-map").then((m) => m.PropertyMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-80 items-center justify-center rounded-xl border border-black/10 bg-slate-50 text-sm text-ink/55">
        Loading map…
      </div>
    ),
  }
);

/** @deprecated Use PropertyMapPicker */
export const EsriMapPicker = PropertyMapPicker;
/** @deprecated Use PropertyMap */
export const EsriPropertyMap = PropertyMap;
