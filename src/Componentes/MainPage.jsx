import { IconArchiveFilled } from "@tabler/icons-react";
import { IconBuildingStore } from "@tabler/icons-react";
import { IconUserFilled } from "@tabler/icons-react";
import { IconChartDonutFilled } from "@tabler/icons-react";
import Ventas from "./Ventas";
import Inventario from "./Inventario";
import Registro from "./Registro";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  useLocation,
} from "react-router-dom";
import { useEffect, useState } from "react";
import Loader from "./Loader";

import Login from "../supComponentes/Login";

export default function AppContent() {
  const location = useLocation();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    const timeout = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timeout);
  }, [location.pathname]);

  return (
    <>
      {loading && <Loader />}
      <Routes>
        <Route path="/ventas" element={<Ventas />} />
        <Route path="/inventario" element={<Inventario />} />
        <Route path="/registro" element={<Registro />} />
        <Route path="/iniciar-sesion" element={<Login />} />
        <Route path="*" element={<Login />} />
      </Routes>

      <div className="z-100 fixed w-full bg-[#ededed] bottom-0 shadow-[0_-5px_40px_#00000010] flex gap-[10px] items-center p-[10px] justify-between">
        <Link
          to="/ventas"
          className="flex flex-col items-center p-[10px] gap-[5px] rounded-[10px] w-[70px]"
        >
          <IconBuildingStore stroke={2} />
          Ventas
        </Link>
        <Link
          to="/inventario"
          className="flex flex-col items-center p-[10px] gap-[5px] rounded-[10px] w-[70px]"
        >
          <IconArchiveFilled />
          Inventario
        </Link>
        <Link to="/registro" className="flex flex-col items-center p-[10px] gap-[5px] rounded-[10px] w-[70px]">
          <IconChartDonutFilled />
          Registro
        </Link>
        <button className="flex flex-col items-center p-[10px] gap-[5px] rounded-[10px] w-[70px]">
          <IconUserFilled stroke={2} />
          Opciones
        </button>
      </div>
    </>
  );
}