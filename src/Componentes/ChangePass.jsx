import { useState, useEffect } from "react";
import { supabase } from "../../supabaseClient";
import { Link } from "react-router-dom";
import { IconChevronRight } from "@tabler/icons-react";

export default function ResetPassword() {
  const [newPassword, setNewPassword] = useState("");
  const [status, setStatus] = useState("waiting");

  useEffect(() => {
    // Comprobar si el usuario está en modo recuperación
    const checkSession = async () => {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (!session) {
        setStatus("no-session");
      }
    };

    checkSession();
  }, []);

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setStatus("loading");

    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      setStatus("error");
      console.error("Error al cambiar contraseña:", error.message);
    } else {
      setStatus("success");
    }
  };

  return (
    <div className="px-4 pt-9 h-full md:max-w-[700px] md:mx-auto">
      <h2 className="text-2xl font-bold mb-4">Cambiar contraseña</h2>

      {status === "success" ? (
        <p className="bg-[#26ce6c20] text-[#26ce6c] p-2 rounded-[10px] font-bold text-[17px]">Contraseña actualizada correctamente. Ya puedes iniciar sesión.</p>
      ) : (
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <input
            type="password"
            placeholder="Nueva contraseña"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="p-[10px_8px] border-2 border-[#00000030] rounded-[10px] outline-none mb-3 w-full text-[18px]"
            required
          />
          <button
            type="submit"
            disabled={status === "loading"}
            className="w-full py-3 text-[20px] rounded-[10px] bg-[#ffa600] text-white transition-all ease-in-out duration-300 active:bg-[#ffa60050]"
          >
            Cambiar contraseña
          </button>
          {status === "error" && (
            <p className="bg-[#ff333320] text-[#ff3333] p-2 rounded-[10px] font-bold text-[17px]">
              Ocurrió un error al cambiar la contraseña.
            </p>
          )}
          {status === "no-session" && (
            <p className="bg-[#ff333320] text-[#ff3333] p-2 rounded-[10px] font-bold text-[17px]">
              Sesión inválida. Abre el link desde el correo nuevamente.
            </p>
          )}
        </form>
      )}

      {status === 'success' && (
        <div className="flex justify-center mt-[15px] p-2 bg-[#ffa60030] rounded-[10px]">
        <Link
          to="/iniciar-sesion"
          className="text-[#ffa600] font-bold flex gap-[5px] items-center text-[20px]"
        >
          Volver a Inicio
          <IconChevronRight stroke={3} />
        </Link>
      </div>
      )}
    </div>
  );
}
