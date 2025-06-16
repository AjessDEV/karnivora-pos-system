import { useState } from "react";
import { supabase } from "../../supabaseClient";
import { useNavigate } from "react-router-dom";

export default function ResetPass() {
  const [email, setEmail] = useState("");
  const navigate = useNavigate();

  const dominiosPermitidos = ["@gmail.com", "@hotmail.com", "@outlook.com"];
  

  const handleReset = async () => {
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/cambiar-contrasena`,
    });
    navigate("/iniciar-sesion");
    alert("Se ha enviado un enlace de recuperación a tu correo electrónico.");
  };

  return (
    <div className="px-4 pt-9 h-full md:max-w-[700px] md:mx-auto">
      <h2 className="font-bold text-[30px]">Recuperar Contraseña</h2>
      <p className="text-[18px] text-[#707070]">
        Ingresa tu correo electrónico para recibir un enlace de recuperación de
        contraseña.
      </p>
      <br />

      <form>
        <input
          className="p-[10px_8px] border-2 border-[#00000030] rounded-[10px] outline-none mb-3 w-full text-[18px]"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          required
          placeholder="Correo Electrónico"
        />
        <button
          type="submit"
          onClick={(e) => {
            e.preventDefault();
            handleReset();
          }}
          className={`w-full py-3 text-[20px] rounded-[10px] ${
            email !== "" && dominiosPermitidos.some((dominio) => email.includes(dominio))
              ? "bg-[#ffa600] text-white"
              : "bg-[#e0e0e0] text-[#70707030] pointer-eventes-none"
          }`}
        >
          Enviar
        </button>
      </form>
    </div>
  );
}
