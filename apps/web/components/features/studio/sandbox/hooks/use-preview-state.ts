import { create } from 'zustand'

// Annotated so the mixed number / "100%" literals keep their union type
// instead of widening to `string | number`, which the store's
// previewWidth/previewHeight (number | "100%") then rejected.
export const PREVIEW_DEVICES: {
  name: string
  width: number | "100%"
  height: number | "100%"
}[] = [
  { name: "Responsive", width: "100%", height: "100%" },
  { name: "Tablet", width: 517, height: "100%" },
  { name: "Mobile", width: 375, height: "100%" },
  { name: "iPhone SE", width: 375, height: 667 },
  { name: "iPhone XR", width: 414, height: 896 },
  { name: "iPhone 12 Pro", width: 390, height: 844 },
  { name: "iPhone 14 Pro Max", width: 430, height: 932 },
  { name: "Pixel 7", width: 412, height: 912 },
  { name: "Samsung Galaxy S8+", width: 360, height: 740 },
  { name: "Samsung Galaxy S20 Ultra", width: 412, height: 915 },
  { name: "iPad Mini", width: 768, height: 1024 },
  { name: "iPad Air", width: 820, height: 1180 },
  { name: "iPad Pro", width: 1024, height: 1366 },
  { name: "Surface Pro 7", width: 912, height: 1368 },
  { name: "Surface Duo", width: 540, height: 720 },
  { name: "Galaxy Z Fold 5", width: 344, height: 904 },
  { name: "Asus Zenbook Fold", width: 853, height: 1280 },
  { name: "Samsung Galaxy A51/71", width: 412, height: 914 },
  { name: "Nest Hub", width: 1024, height: 600 },
  { name: "Nest Hub Max", width: 1280, height: 800 },
]

interface PreviewState {
  selectedDevice: string;
  isRotated: boolean;
  previewWidth: number | "100%";
  previewHeight: number | "100%";
  setSelectedDevice: (device: string) => void;
  setIsRotated: (rotated: boolean) => void;
  setPreviewWidth: (width: number | "100%") => void;
  setPreviewHeight: (height: number | "100%") => void;
  handleDeviceChange: (deviceName: string) => void;
  handleRotate: () => void;
}

export const usePreviewState = create<PreviewState>((set, get) => ({
  selectedDevice: "Responsive",
  isRotated: false,
  previewWidth: "100%",
  previewHeight: "100%",
  setSelectedDevice: (d) => set({ selectedDevice: d }),
  setIsRotated: (r) => set({ isRotated: r }),
  setPreviewWidth: (w) => set({ previewWidth: w }),
  setPreviewHeight: (h) => set({ previewHeight: h }),
  handleDeviceChange: (deviceName: string) => {
    const device = PREVIEW_DEVICES.find((d) => d.name === deviceName)
    if (device) {
      set({
        selectedDevice: device.name,
        previewWidth: device.width,
        previewHeight: device.height,
        isRotated: false,
      })
    }
  },
  handleRotate: () => {
    const { previewWidth, previewHeight, isRotated } = get()
    if (previewWidth !== "100%" || previewHeight !== "100%") {
      set({
        previewWidth: previewHeight,
        previewHeight: previewWidth,
        isRotated: !isRotated,
      })
    }
  }
}))
