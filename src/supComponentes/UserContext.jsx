import { supabase } from "../../supabaseClient";
import { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthContext";

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const { session, loading: authLoading } = useAuth();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (session?.user) {
        const { data, error } = await supabase
          .from('perfiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (error) {
          console.error('Error al obtener perfil:', error);
        } else {
          setUserData(data);
        }
      }
      setLoading(false);
    };

    if (!authLoading) {
      fetchUserProfile();
    }
  }, [session, authLoading]);

  return (
    <UserContext.Provider value={{ userData, loading }}>
      {children}
    </UserContext.Provider>
  )
}

export const useUser = () => useContext(UserContext)