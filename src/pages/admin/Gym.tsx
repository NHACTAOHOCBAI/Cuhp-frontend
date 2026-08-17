/**
 * Re-export the refactored GymPage so the existing route in App.tsx
 * (`/admin/gym` → `GymPage`) keeps working without modification.
 */
export { GymPage as default } from "@/features/gym/GymPage"
