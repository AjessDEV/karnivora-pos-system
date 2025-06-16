import { Navigate } from "react-router-dom";
import { useAuth } from './AuthContext'

const PublicRoute = ({ children }) => {
  const { session, loading } = useAuth()

  if(loading) return <div></div>

  return !session ? children : <Navigate to='/mas-opciones' replace />
}

export default PublicRoute