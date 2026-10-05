export const colors = {
  canvas: "#f4f7f8",
  ink: "#142022",
  navy: "#0b1c2c",
  teal: "#0f9ea8",
  tealDeep: "#0a6f76",
  tealSoft: "rgba(15, 158, 168, 0.12)",
  orange: "#f26b1d",
  orangeSoft: "rgba(242, 107, 29, 0.12)",
  mist: "#d7e8e9",
  sand: "#efe6dc",
  muted: "#6b7c80",
  line: "rgba(20, 32, 34, 0.08)",
  white: "#ffffff",
  danger: "#dc2626",
};

export const radius = {
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  full: 999,
};

export const space = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 24,
  xl: 32,
};

export const elevation = {
  card: {
    shadowColor: "#142022",
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5,
  },
  soft: {
    shadowColor: "#142022",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
} as const;
