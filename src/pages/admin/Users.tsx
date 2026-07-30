import { UserManagement } from "@/components/UserManagement"
import { useAdminProps } from "@/hooks/useAuth"

export default function Users() {
  const props = useAdminProps()
  return <UserManagement token={props.token} currentAdmin={props.currentAdmin} />
}