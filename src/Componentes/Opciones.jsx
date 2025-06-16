import { useUser } from "../supComponentes/UserContext";
import {
  IconChevronRight,
  IconUserFilled,
  IconBuildingStore,
  IconArchiveFilled,
  IconLockFilled,
  IconHelp,
  IconLogout
} from "@tabler/icons-react";

import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../supComponentes/AuthContext";

export default function Opciones() {
  const { userData, loading } = useUser();

  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/iniciar-sesion');
  };

  if (loading) {
    return (
      <div></div>
    );
  }

  if (userData) {
    return (
      <div className="p-4 md:pl-[300px]">
        <div className="flex gap-4 items-center mb-4">
          <div className="flex items-center justify-center w-[75px] h-[75px] bg-[#e0e0e0] text-[#707070] rounded-full">
            <IconUserFilled size={40} />
          </div>
          <div>
            <p className="text-[30px] font-bold capitalize">{userData.user_nombre}</p>
            <p className="text-[20px] text-[#666] capitalize">{userData.rol}</p>
          </div>
        </div>

        <br />
        <p className="mb-3 text-[30px] font-bold">Opciones</p>

        <div className="flex flex-col gap-3">
          <Link to='/opciones-usuarios' className={userData.rol === 'Empleado' ? 'hidden' : 'flex items-center justify-between p-3 bg-[#fafafa] rounded-[10px] shadow-[0_10px_30px_#00000010]'}>
            <div className="flex items-center gap-3">
              <IconUserFilled />
              <p className="text-[20px]">Usuarios</p>
            </div>
            <IconChevronRight stroke={3} />
          </Link>

          <Link to='/opciones-sucursales' className={userData.rol === 'Empleado' ? 'hidden' : 'flex items-center justify-between p-3 bg-[#fafafa] rounded-[10px] shadow-[0_10px_30px_#00000010]'}>
            <div className="flex items-center gap-3">
              <IconBuildingStore stroke={2} />
              <p className="text-[20px]">Sucursales</p>
            </div>
            <IconChevronRight stroke={3} />
          </Link>

          <div onClick={handleLogout} className="cursor-pointer flex items-center justify-between p-3 bg-[#fafafa] rounded-[10px] shadow-[0_10px_30px_#00000010]">
            <div className="flex items-center gap-3">
              <IconLogout stroke={2} className="text-[#ff3333]"/>
              <p className="text-[20px] font-bold text-[#ff3333]">Cerrar Sesion</p>
            </div>
          </div>

        </div>
      </div>
    );
  }
}
