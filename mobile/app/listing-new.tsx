import { useMemo, useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { ChipRow } from "@/components/ChipRow";
import { Button, Input } from "@/components/ui";
import { ApiError, api, uploadImages } from "@/lib/api";
import { DISTRICTS, PROVINCES } from "@/lib/location";
import { colors, radius } from "@/lib/theme";
import type { ListingType, Property, PropertyType } from "@/lib/types";

const MIN_IMAGES = 2;

export default function NewListingScreen() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<PropertyType>("HOUSE");
  const [listingType, setListingType] = useState<ListingType>("SALE");
  const [price, setPrice] = useState("");
  const [bedrooms, setBedrooms] = useState("");
  const [bathrooms, setBathrooms] = useState("");
  const [sizeSqm, setSizeSqm] = useState("");
  const [province, setProvince] = useState("Kigali");
  const [district, setDistrict] = useState("Gasabo");
  const [address, setAddress] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const districts = useMemo(() => DISTRICTS[province] ?? [], [province]);

  async function pickPhotos() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError("Photo library access is required to add listing images.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit: 8,
    });
    if (result.canceled) return;
    setPhotos((prev) => [...prev, ...result.assets.map((asset) => asset.uri)].slice(0, 8));
  }

  async function onSubmit() {
    setError(null);
    if (photos.length < MIN_IMAGES) {
      setError(`Add at least ${MIN_IMAGES} photos (you have ${photos.length}).`);
      return;
    }
    setLoading(true);
    try {
      const created = await api<{ data: Property }>("/properties", {
        method: "POST",
        json: {
          title,
          description,
          type,
          listingType,
          price: Number(price),
          bedrooms: bedrooms ? Number(bedrooms) : null,
          bathrooms: bathrooms ? Number(bathrooms) : null,
          sizeSqm: sizeSqm ? Number(sizeSqm) : null,
          province,
          district,
          address: address || null,
        },
      });
      await uploadImages(created.data.id, photos);
      try {
        await api(`/properties/${created.data.id}/submit`, { method: "POST" });
      } catch (err) {
        if (err instanceof ApiError && err.code === "LISTING_FEE_REQUIRED") {
          setError(
            "Listing saved. Pay the 1,000 RWF listing fee on the website, then submit for approval."
          );
          setLoading(false);
          return;
        }
        if (err instanceof ApiError && err.code === "AGENT_SUBSCRIPTION_REQUIRED") {
          setError(
            "Listing saved as a draft. Activate your agent account on the website to submit."
          );
          setLoading(false);
          return;
        }
        throw err;
      }
      router.replace("/listings");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create listing");
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.lead}>
          Add property details and at least 2 photos, then submit for approval.
        </Text>
        <Input label="Title" value={title} onChangeText={setTitle} />
        <Input
          label="Description"
          value={description}
          onChangeText={setDescription}
          multiline
          style={{ minHeight: 110, textAlignVertical: "top" }}
        />
        <Text style={styles.label}>Type</Text>
        <ChipRow
          value={type}
          onChange={(value) => setType(value as PropertyType)}
          options={[
            { value: "HOUSE", label: "House" },
            { value: "APARTMENT", label: "Apartment" },
            { value: "LAND", label: "Land" },
            { value: "COMMERCIAL", label: "Commercial" },
          ]}
        />
        <Text style={styles.label}>Listing</Text>
        <ChipRow
          value={listingType}
          onChange={(value) => setListingType(value as ListingType)}
          options={[
            { value: "SALE", label: "For sale" },
            { value: "RENT", label: "For rent" },
          ]}
        />
        <Input
          label="Price (RWF)"
          keyboardType="numeric"
          value={price}
          onChangeText={setPrice}
        />
        <Input label="Bedrooms" keyboardType="numeric" value={bedrooms} onChangeText={setBedrooms} />
        <Input
          label="Bathrooms"
          keyboardType="numeric"
          value={bathrooms}
          onChangeText={setBathrooms}
        />
        <Input label="Size (m²)" keyboardType="numeric" value={sizeSqm} onChangeText={setSizeSqm} />
        <Text style={styles.label}>Province</Text>
        <ChipRow value={province} onChange={(value) => {
          setProvince(value);
          setDistrict((DISTRICTS[value] ?? [])[0] ?? "");
        }} options={PROVINCES} />
        <Text style={styles.label}>District</Text>
        <ChipRow
          value={district}
          onChange={setDistrict}
          options={districts.map((item) => ({ value: item, label: item }))}
        />
        <Input label="Address" value={address} onChangeText={setAddress} />

        <Button title="Add photos" variant="secondary" onPress={() => void pickPhotos()} />
        <View style={styles.photos}>
          {photos.map((uri) => (
            <Image key={uri} source={{ uri }} style={styles.photo} />
          ))}
        </View>
        <Text style={styles.meta}>{photos.length} / 8 photos</Text>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Button
          title={loading ? "Saving…" : "Create listing"}
          loading={loading}
          onPress={() => void onSubmit()}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.white },
  content: { padding: 20, gap: 12, paddingBottom: 48 },
  lead: { color: colors.muted, fontSize: 15, lineHeight: 22 },
  label: { fontSize: 14, fontWeight: "600", color: colors.ink },
  photos: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  photo: { width: 84, height: 84, borderRadius: radius.sm, backgroundColor: colors.mist },
  meta: { color: colors.muted, fontSize: 13 },
  error: { color: colors.orange, fontWeight: "600" },
});
