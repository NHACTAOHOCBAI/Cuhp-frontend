import { useNavigate } from "react-router-dom"
import { LoginRegister } from "@/components/LoginRegister"
import { useAuth } from "@/hooks/useAuth"

export default function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()

  return (
    <LoginRegister
      onLoginSuccess={(token, user) => {
        login(token, user)
        navigate("/admin", { replace: true })
      }}
    />
  )
}