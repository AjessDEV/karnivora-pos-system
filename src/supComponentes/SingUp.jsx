import { supabase } from "../../supabaseClient";
import { useState, useEffect } from "react";
import { IconChevronDown, IconChevronLeft, IconUserFilled } from "@tabler/icons-react";
import { Link } from "react-router-dom";
export default function SingUp() {

  const [sucursales, setSucursales] = useState([]);
  const [sucursal, setSucursal] = useState("Seleccionar Sucursal");
  const [sucursalId, setSucursalId] = useState(null);
  const [sucursalesMenu, setSucursalesMenu] = useState(false);
  const fetchSucursales = async () => {
    const { data, error } = await supabase
      .from("sucursales")
      .select("*")

    if (error) {
      console.error("Error al obtener las sucursales:", error);
    } else {
      setSucursales(data);
    }
  }

  useEffect(() => {
    fetchSucursales();
  }, []);

  const toggleSucursalMenu = () => {
    setSucursalesMenu(!sucursalesMenu);
  }

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");

  const roles = [
    "Administrador",
    "Empleado",
  ]
  const toggleRolMenu = () => {
    setRolMenu(!rolMenu);
  }

  const [rol, setRol] = useState("Seleccionar Rol");
  const [rolMenu, setRolMenu] = useState(false);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [message, setMessage] = useState("");

  const handleRegister = async () => {
    if (!username || !email || !sucursal === 'Seleccionar Sucursal' || !rol || !password || !confirmPassword) {
      setMessage("Por favor, completa todos los campos.");
      return;
    }

    if (password !== confirmPassword) {
      setMessage("Las contraseñas no coinciden.");
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: password,
    });

    if (error) {
      console.error("Error al registrar el usuario:", error);
      setMessage("Error al registrar el usuario. Por favor, inténtalo de nuevo.");
      return;
    } else {
      // Aquí puedes guardar el usuario en la base de datos
      const { data: userData, error: userError } = await supabase
        .from("perfiles")
        .insert([
          {
            user_nombre: username,
            sucursal_id: sucursalId === null ? null : sucursalId && rol === 'Administrador' ? null : null,
            sucursal_nombre: sucursal !== 'Seleccionar Sucursal' ? sucursal : null && rol === 'Administrador' ? null : null,
            rol: rol,
            id: data.user.id, // ID del usuario registrado
          },
        ]);

      if (userError) {
        console.error("Error al guardar el usuario en la base de datos:", userError);
        setMessage("Error al guardar el usuario en la base de datos. Por favor, inténtalo de nuevo.");
        return;
      } else {
        setMessage("Usuario registrado exitosamente.");
        console.log("Usuario registrado exitosamente:", userData);
        // Limpiar los campos después del registro
        setUsername("");
        setEmail("");
        setSucursal("Seleccionar Sucursal");
        setSucursalId(null);
        setRol("Seleccionar Rol");
        setPassword("");
        setConfirmPassword("");
        fetchUsuarios(); // Actualizar la lista de usuarios
      }
    }
  }

  const dominiosPermitidos = ["@gmail.com", "@hotmail.com", "@outlook.com"];

  return (
    <>
      <div className="p-4 h-full md:pl-[300px]">
        <div className="flex items-center gap-4 mb-4">
          <Link to='/mas-opciones'className="cursor-pointer">
            <IconChevronLeft stroke={2} size={35}/>
          </Link>
          <h2 className="font-bold text-[30px]">Usuarios</h2>
        </div>

        <div className="flex items-center gap-2 mb-2">
          <IconUserFilled size={20}/>
          <h2 className="font-bold text-[25px]">Registrar Usuario</h2>
        </div>
        <p className={`mb-2 w-full py-2 text-center ${message !== '' ? 'bg-[#e0e0e0]' : ''} rounded-full font-bold transition-all ease-in-out duration-300`}>{message}</p>
        <input className="p-[10px_8px] border-2 border-[#00000030] rounded-[10px] outline-none mb-3 w-full text-[18px]" type="text" placeholder="Nombre" value={username} onChange={(e) => setUsername(e.target.value)}/>
        <input className="p-[10px_8px] border-2 border-[#00000030] rounded-[10px] outline-none mb-3 w-full text-[18px]" type="text" placeholder="Correo Electrónico" value={email} onChange={(e) => setEmail(e.target.value)}/>

        <div className="flex gap-[10px] mb-3">
              <div
                onClick={toggleSucursalMenu}
                className="overflow-visible flex items-center p-[10px_8px] w-full justify-between border-2 border-[#00000030] rounded-[10px] text-[18px] relative"
              >
                {sucursal} <IconChevronDown stroke={2} size={20} />
                <ul
                  className={`z-10 absolute ${
                    sucursalesMenu
                      ? "max-h-[150px] opacity-100"
                      : "max-h-0 opacity-0 pointer-events-none"
                  } w-full overflow-y-auto left-0 top-[50px] bg-[#eeeeee] shadow-[0_10px_20px_#00000020] p-[8px_10px] flex flex-col gap-[10px] rounded-[10px] transition-all ease-in-out duration-200 overflow-hidden`}
                >
                  {sucursales.map((sucursal) => {
                    return (
                      <li
                        key={sucursal.id}
                        onClick={() => {
                          setSucursal(`${sucursal.nombre_suc}`);
                          setSucursalId(`${sucursal.id}`);
                        }}
                        className="p-[5px] hover:bg-[#ffa60010] rounded-[8px] transition-all ease-in-out duration-200"
                      >
                        {sucursal.nombre_suc}
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>

            {/*  */}

            <div className="flex gap-[10px] mb-3">
              <div
                onClick={toggleRolMenu}
                className="overflow-visible flex items-center p-[10px_8px] w-full justify-between border-2 border-[#00000030] rounded-[10px] text-[18px] relative"
              >
                {rol} <IconChevronDown stroke={2} size={20} />
                <ul
                  className={`z-10 absolute ${
                    rolMenu
                      ? "max-h-[150px] opacity-100"
                      : "max-h-0 opacity-0 pointer-events-none"
                  } w-full overflow-y-auto left-0 top-[50px] bg-[#eeeeee] shadow-[0_10px_20px_#00000020] p-[8px_10px] flex flex-col gap-[10px] rounded-[10px] transition-all ease-in-out duration-200 overflow-hidden`}
                >
                  {roles.map((rol) => {
                    return (
                      <li
                        key={rol}
                        onClick={() => {
                          setRol(`${rol}`);
                        }}
                        className="p-[5px] hover:bg-[#ffa60010] rounded-[8px] transition-all ease-in-out duration-200"
                      >
                        {rol}
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
            <br />
            <p className="font-bold text-[20px] mb-1">Contraseña</p>
            <input type="password" placeholder="Contraseña" className="p-[10px_8px] border-2 border-[#00000030] rounded-[10px] outline-none mb-3 w-full text-[18px]" value={password} onChange={(e) => setPassword(e.target.value)}/>
            <input type="password" placeholder="Confirmar contraseña" className="p-[10px_8px] border-2 border-[#00000030] rounded-[10px] outline-none mb-3 w-full text-[18px]" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}/>
            <br />
            <button onClick={handleRegister} className={`font-bold w-full py-4 ${!username || !email || email !== "" && dominiosPermitidos.some((dominio) => email.includes(dominio)) || Sucursal !== 'Seleccionar Sucursal' || rol !== 'Seleccionar Rol' || !password || !confirmPassword ? 'bg-[#e0e0e0] text-[#707070] pointer-events-none' : 'bg-[#ffa600] text-white'} text-[20px] rounded-[10px] transition-all ease-in-out duration-200`}>Registrar</button>
            
      </div>
    </>
  )
}
