import { supabase } from "../../supabaseClient";
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

export default function Login() {
  const [message, setMessage] = useState("");

  async function IniciarSesion(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error("Error al iniciar sesión", error.message);
      setMessage("Error al iniciar sesión. Verifica que la contraseña y el correo son correctos.");
      return;
    }

    const user = data.user

    try {
      const perfil = await GetUserProfile(user.id)

      console.log('Rol: ', perfil.rol);
      console.log('Sucursal: ', perfil.sucursal_id);
      
      if(perfil.rol === 'administrador') {
        navigate('/registro');
      } else {
        navigate('/ventas');
      }
    } catch (error) {
      console.error("Error al obtener el perfil del usuario:", error.message);
      setMessage("Error al obtener el perfil del usuario. Por favor, inténtalo de nuevo más tarde.");
    }
  }

  const GetUserProfile = async (userId) => {
    const { data, error } = await supabase
      .from("perfiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) {
      throw new Error("Error al obtener el perfil del usuario: " + error.message);
    }

    return data;
  }

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async () => {
    const newEmail = email;
    const newPass = password;
    await IniciarSesion(newEmail, newPass);
  };


  return (

      <div className="h-screen flex items-center justify-center bg-[#eeeeee]">
        <div className="flex flex-col min-w-[320px] max-w-[320px]">
          <h2 className="text-center text-[30px] font-black mb-2">Iniciar Sesión</h2>

          {message && (
            <p className="my-6 w-full bg-[#ff333330] py-2 px-1 rounded-full text-center text-[#ff3333] font-bold">{message}</p>
          )}

          <div className="flex flex-col gap-3 w-full">
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#e0e0e0] p-3 text-[20px] rounded-[10px] font-bold outline-none"
              type="text"
              placeholder="Correo Electronico"
            />
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#e0e0e0] p-3 text-[20px] rounded-[10px] font-bold outline-none"
              type="password"
              placeholder="Contraseña"
            />
          </div>
          <br />
          <button
            onClick={async () => {
              await handleLogin();
            }}
            className=" cursor-pointer font-bold text-[20px] text-white bg-[#ffa600] rounded-[10px] py-3 w-full active:bg-[#ffa60050]"
          >
            Iniciar Sesión
          </button>
          <br />
          <br />
          <Link to='/recuperar-contrasena' className="py-2 w-full text-[#ffa600] text-[20px] text-center bg-[#ffa60015] rounded-full font-bold">
            ¿olvidaste tu contraseña?
          </Link>
        </div>
      </div>
  );
}
