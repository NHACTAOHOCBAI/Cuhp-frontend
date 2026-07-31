/**
 * Re-export the refactored AudioPage so the existing route in App.tsx
 * (`/admin/audio` → `AudioPage`) keeps working without modification.
 */
export { AudioPage as default } from "@/features/audio/AudioPage"