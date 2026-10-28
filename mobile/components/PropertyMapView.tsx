import { useEffect, useMemo, useRef } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { WebView, type WebViewMessageEvent } from "react-native-webview";
import type { MappedProperty } from "@/lib/map";
import { KIGALI_REGION } from "@/lib/map";
import { colors } from "@/lib/theme";

type Props = {
  properties: MappedProperty[];
  selectedId?: string | null;
  fitToken?: number;
  onSelect?: (id: string | null) => void;
  style?: StyleProp<ViewStyle>;
};

type BridgeMessage =
  | { type: "ready" }
  | { type: "select"; id: string | null }
  | { type: "fit" };

export function PropertyMapView({
  properties,
  selectedId = null,
  fitToken = 0,
  onSelect,
  style,
}: Props) {
  const webRef = useRef<WebView>(null);
  const readyRef = useRef(false);

  const html = useMemo(() => buildMapHtml(), []);

  function post(payload: Record<string, unknown>) {
    if (!readyRef.current) return;
    webRef.current?.injectJavaScript(
      `window.__umuhuzaMap && window.__umuhuzaMap(${JSON.stringify(payload)}); true;`
    );
  }

  useEffect(() => {
    post({
      type: "setMarkers",
      selectedId,
      markers: properties.map((property) => ({
        id: property.id,
        lat: property.lat,
        lng: property.lng,
        title: property.title,
        listingType: property.listingType,
        price: property.price,
      })),
    });
  }, [properties, selectedId]);

  useEffect(() => {
    if (!fitToken) return;
    post({ type: "fit" });
  }, [fitToken]);

  useEffect(() => {
    post({ type: "select", id: selectedId });
  }, [selectedId]);

  function onMessage(event: WebViewMessageEvent) {
    try {
      const data = JSON.parse(event.nativeEvent.data) as BridgeMessage;
      if (data.type === "ready") {
        readyRef.current = true;
        post({
          type: "setMarkers",
          selectedId,
          markers: properties.map((property) => ({
            id: property.id,
            lat: property.lat,
            lng: property.lng,
            title: property.title,
            listingType: property.listingType,
            price: property.price,
          })),
        });
        return;
      }
      if (data.type === "select") {
        onSelect?.(data.id);
      }
    } catch {
      // ignore malformed bridge messages
    }
  }

  return (
    <View style={[styles.wrap, style]}>
      <WebView
        ref={webRef}
        originWhitelist={["*"]}
        source={{ html }}
        onMessage={onMessage}
        style={styles.web}
        javaScriptEnabled
        domStorageEnabled
        allowsInlineMediaPlayback
        setSupportMultipleWindows={false}
        mixedContentMode="always"
        androidLayerType="hardware"
      />
    </View>
  );
}

function buildMapHtml() {
  const centerLat = KIGALI_REGION.latitude;
  const centerLng = KIGALI_REGION.longitude;
  const teal = colors.teal;
  const orange = colors.orange;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    html, body, #map { margin: 0; padding: 0; width: 100%; height: 100%; background: #e8eef0; }
    .pin {
      width: 28px; height: 28px; border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      border: 2px solid #fff;
      box-shadow: 0 4px 10px rgba(11,28,44,0.28);
    }
    .pin.active { width: 34px; height: 34px; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    const TEAL = ${JSON.stringify(teal)};
    const ORANGE = ${JSON.stringify(orange)};
    const map = L.map('map', { zoomControl: false, attributionControl: true })
      .setView([${centerLat}, ${centerLng}], 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap'
    }).addTo(map);
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    const layer = L.layerGroup().addTo(map);
    let markersById = {};
    let selectedId = null;

    function send(payload) {
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify(payload));
      }
    }

    function iconFor(active) {
      const color = active ? ORANGE : TEAL;
      const size = active ? 34 : 28;
      return L.divIcon({
        className: '',
        html: '<div class="pin' + (active ? ' active' : '') + '" style="background:' + color + ';width:' + size + 'px;height:' + size + 'px"></div>',
        iconSize: [size, size],
        iconAnchor: [size / 2, size],
      });
    }

    function fitAll() {
      const items = Object.values(markersById);
      if (!items.length) {
        map.setView([${centerLat}, ${centerLng}], 12);
        return;
      }
      const group = L.featureGroup(items);
      map.fitBounds(group.getBounds().pad(0.22), { animate: true, maxZoom: 15 });
    }

    function setMarkers(payload) {
      selectedId = payload.selectedId || null;
      layer.clearLayers();
      markersById = {};
      (payload.markers || []).forEach(function (item) {
        const marker = L.marker([item.lat, item.lng], {
          icon: iconFor(item.id === selectedId),
          title: item.title || '',
        });
        marker.on('click', function () {
          selectedId = item.id;
          send({ type: 'select', id: item.id });
          Object.keys(markersById).forEach(function (id) {
            markersById[id].setIcon(iconFor(id === selectedId));
          });
          map.panTo([item.lat, item.lng], { animate: true });
        });
        marker.addTo(layer);
        markersById[item.id] = marker;
      });
      fitAll();
    }

    function selectOnly(id) {
      selectedId = id;
      Object.keys(markersById).forEach(function (key) {
        markersById[key].setIcon(iconFor(key === selectedId));
      });
      if (id && markersById[id]) {
        const latlng = markersById[id].getLatLng();
        map.panTo(latlng, { animate: true });
      }
    }

    map.on('click', function () {
      selectedId = null;
      Object.keys(markersById).forEach(function (key) {
        markersById[key].setIcon(iconFor(false));
      });
      send({ type: 'select', id: null });
    });

    window.__umuhuzaMap = function (payload) {
      if (!payload || !payload.type) return;
      if (payload.type === 'setMarkers') setMarkers(payload);
      if (payload.type === 'select') selectOnly(payload.id || null);
      if (payload.type === 'fit') fitAll();
    };

    send({ type: 'ready' });
  </script>
</body>
</html>`;
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    overflow: "hidden",
    backgroundColor: colors.mist,
  },
  web: {
    flex: 1,
    backgroundColor: "transparent",
  },
});
