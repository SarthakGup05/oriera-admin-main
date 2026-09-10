import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useNavigate } from "react-router-dom"
import { useEffect, useState } from "react"
import axiosInstance from "@/lib/axiosinstaance"
import toast from "react-hot-toast"
import { Eye, EyeOff, Loader2, Mail, Lock } from "lucide-react"

// ✅ Import Zustand store
import useAuthStore from "@/store/useAuthStore"

export function LoginForm({ className, ...props }) {
  const navigate = useNavigate()
  const { login, user, fetchProfile, loading } = useAuthStore()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()

    if (!email || !password) {
      toast.error("Please fill in all fields")
      return
    }

    const res = await login(email, password)
    if (res.success) {
      toast.success("Login successful! Welcome back.")
      setTimeout(() => navigate("/"), 800)
    } else {
      toast.error(res.error)
    }
  }

  // Auto-login (profile fetch)
  useEffect(() => {
    if (!user) {
      fetchProfile()
        .then(() => {
          if (window.location.pathname !== "/login") {
            navigate("/")
          }
        })
        .catch(() => console.log("Auto-login skipped"))
    }
  }, [user, fetchProfile, navigate])

  return (
    <div className={cn("w-[400px] mx-auto", className)} {...props}>
      <Card className="border-0 shadow-2xl bg-white/95 backdrop-blur-sm">
        <CardHeader className="space-y-4 pb-6">
          <div className="text-center">
            <CardTitle className="text-2xl font-bold text-gray-900">
              Admin Login
            </CardTitle>
            <CardDescription className="text-gray-600 mt-2">
              Enter your credentials below to access the dashboard
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <form onSubmit={handleLogin} className="space-y-5">
            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@photostudio.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-12"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 h-12"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Button */}
            <Button
              type="submit"
              className="w-full h-12 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Signing in...</span>
                </div>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
