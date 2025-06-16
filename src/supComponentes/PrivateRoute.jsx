import { Navigate } from "react-router-dom";
import { useAuth } from './AuthContext'

const PrivateRoute = ({ children }) => {
  const { session, loading } = useAuth()

  if(loading) return <div></div>

  if(!session && !loading) return <Navigate to="/iniciar-sesion" replace />
  return session ? children : <Navigate to="/iniciar-sesion" replace />

}

export default PrivateRoute