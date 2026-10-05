import { useEffect, useState, type ReactNode } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ChipRow } from "@/components/ChipRow";
import { Button, Input } from "@/components/ui";
import {
  BEDROOM_OPTIONS,
  EMPTY_FILTERS,
  STATUS_OPTIONS,
  countSheetFilters,
  districtsFor,
  type PropertyFilters,
} from "@/lib/filters";
import { LISTING_TYPES, PROPERTY_TYPES, PROVINCES } from "@/lib/location";
import { colors, radius } from "@/lib/theme";

export function FilterSheet({
  visible,
  value,
  onClose,
  onApply,
}: {
  visible: boolean;
  value: PropertyFilters;
  onClose: () => void;
  onApply: (next: PropertyFilters) => void;
}) {
  const insets = useSafeAreaInsets();
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    if (visible) setDraft(value);
  }, [visible, value]);

  function update<K extends keyof PropertyFilters>(key: K, next: PropertyFilters[K]) {
    setDraft((prev) => {
      const merged = { ...prev, [key]: next };
      if (key === "province") merged.district = "";
      return merged;
    });
  }

  const districts = districtsFor(draft.province);
  const active = countSheetFilters(draft);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.screen}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={[styles.handleWrap, { paddingTop: insets.top || 12 }]}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <Text style={styles.title}>Filters</Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <Text style={styles.close}>Close</Text>
            </Pressable>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.body}
          keyboardShouldPersistTaps="handled"
        >
          <Field label="Listing">
            <ChipRow
              variant="segment"
              value={draft.listingType}
              onChange={(listingType) => update("listingType", listingType)}
              options={LISTING_TYPES}
            />
          </Field>

          <Field label="Availability">
            <ChipRow
              value={draft.status}
              onChange={(status) => update("status", status)}
              options={STATUS_OPTIONS}
            />
          </Field>

          <Field label="Property type">
            <ChipRow
              value={draft.type}
              onChange={(type) => update("type", type)}
              options={PROPERTY_TYPES}
            />
          </Field>

          <Field label="Bedrooms">
            <ChipRow
              value={draft.bedrooms}
              onChange={(bedrooms) => update("bedrooms", bedrooms)}
              options={BEDROOM_OPTIONS}
            />
          </Field>

          <Field label="Province">
            <ChipRow
              value={draft.province}
              onChange={(province) => update("province", province)}
              options={[{ value: "", label: "All of Rwanda" }, ...PROVINCES]}
            />
          </Field>

          {draft.province ? (
            <Field label="District">
              <ChipRow
                value={draft.district}
                onChange={(district) => update("district", district)}
                options={[
                  { value: "", label: "All districts" },
                  ...districts.map((item) => ({ value: item, label: item })),
                ]}
              />
            </Field>
          ) : null}

          <Field label="Price (RWF)">
            <View style={styles.priceRow}>
              <View style={{ flex: 1 }}>
                <Input
                  placeholder="Min"
                  keyboardType="numeric"
                  value={draft.minPrice}
                  onChangeText={(minPrice) => update("minPrice", minPrice.replace(/[^\d]/g, ""))}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Input
                  placeholder="Max"
                  keyboardType="numeric"
                  value={draft.maxPrice}
                  onChangeText={(maxPrice) => update("maxPrice", maxPrice.replace(/[^\d]/g, ""))}
                />
              </View>
            </View>
          </Field>
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <Button
            title="Reset"
            variant="secondary"
            onPress={() => setDraft({ ...EMPTY_FILTERS, q: value.q })}
            style={{ flex: 1 }}
          />
          <Button
            title={active ? `Apply ${active} filter${active === 1 ? "" : "s"}` : "Show all homes"}
            onPress={() => onApply(draft)}
            style={{ flex: 1.4 }}
          />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.white,
  },
  handleWrap: {
    paddingHorizontal: 20,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  handle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.mist,
    marginBottom: 12,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.navy,
  },
  close: {
    color: colors.teal,
    fontWeight: "700",
    fontSize: 16,
  },
  body: {
    padding: 20,
    gap: 18,
    paddingBottom: 32,
  },
  field: {
    gap: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.ink,
  },
  priceRow: {
    flexDirection: "row",
    gap: 10,
  },
  footer: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    backgroundColor: colors.white,
  },
});
