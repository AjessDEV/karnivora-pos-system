import "./App.css";
import { Link, Routes, Route, useLocation } from "react-router-dom";
import PrivateRoute from "./supComponentes/PrivateRoute";
import PublicRoute from "./supComponentes/PublicRoute";

import Login from "./supComponentes/Login";
import Ventas from "./Componentes/Ventas";
import Inventario from "./Componentes/Inventario";
import Registro from "./Componentes/Registro";
import Loader from "./Componentes/Loader";
import Opciones from "./Componentes/Opciones";
import SingUp from "./supComponentes/SingUp";
import Sucursales from "./Componentes/Sucursales";
import ResetPass from "./Componentes/ResetPass";
import ResetPassword from "./Componentes/ChangePass";
import {
  IconArchiveFilled,
  IconBuildingStore,
  IconChartDonutFilled,
  IconMenu2,
  IconGridDots,
} from "@tabler/icons-react";
import { useEffect, useState } from "react";

// * Priorizar items faltantes (amarillo falta pero no urgente, rojo falta con urgencia)
// * Pedidos con pago pendiente y poder agregar mas productos (pedido abierto)
// * Anulacion de pedido (eliminar pedido)
// * Guardar por cada venta la cantidad que se vendio de cada producto.
// TODO: Filtrar ganancias por sucursal y por fecha

function App() {
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const hiddenRoutes = ['/iniciar-sesion', '/cambiar-contrasena', '/recuperar-contrasena'];
  const isloginRoute = hiddenRoutes.includes(location.pathname);

  useEffect(() => {
    setLoading(true);
    const timeout = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timeout);
  }, [location.pathname]);

  const [route, setRoute] = useState("");

  return (
    <>
      {loading && <Loader />}
      <Routes>


        <Route path="/ventas" element={
          <PrivateRoute>
            <Ventas />
          </PrivateRoute>
        } />
        <Route path="/inventario" element={
          <PrivateRoute>
            <Inventario />
          </PrivateRoute>
        } />
        <Route path="/registro" element={
          <PrivateRoute>
            <Registro />
          </PrivateRoute>
        } />
        <Route path="/mas-opciones" element={
          <PrivateRoute>
            <Opciones />
          </PrivateRoute>
        } />
        <Route path="/opciones-usuarios" element={
          <PrivateRoute>
            <SingUp />
          </PrivateRoute>
        } />
        <Route path="/opciones-sucursales" element={
          <PrivateRoute>
            <Sucursales />
          </PrivateRoute>
        } />
        <Route path="/recuperar-contrasena" element={<ResetPass />}/>
        <Route path="/cambiar-contrasena" element={<ResetPassword />}/>


        <Route path="/iniciar-sesion" element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        } />


        <Route path="*" element={
          <PrivateRoute>
            <Opciones />
          </PrivateRoute>
        } />
      </Routes>

      {!isloginRoute && (
        <div
          className="z-100 p-2 fixed bottom-0 w-full bg-[#eeeeee] shadow-[0_-5px_40px_#00000010] flex justify-between items-center h-[100px] md:left-0 md:top-0 md:h-full md:w-[270px] md:flex-col md:justify-start md:items-start md:gap-5 md:pt-9"
        >
          <Link
            to="/ventas"
            onClick={() => setRoute("ventas")}
            className={`flex flex-col items-center justify-center gap-[5px] rounded-[10px] w-[90px] h-[60px] transition-all ease-in-out duration-300 hover:bg-[#ffa60020] md:flex-row md:gap-5 md:w-full md:justify-start md:h-auto md:pl-4 md:py-3 md:text-[20px]  ${
              route === "ventas"
                ? "text-[#ffa600] bg-[#ffa60020] font-bold"
                : "text-[#000000]"
            }`}
          >
            <IconBuildingStore stroke={route === "ventas" ? 3 : 2} />
            Ventas
          </Link>
          <Link
            to="/inventario"
            onClick={() => setRoute("inventario")}
            className={`flex flex-col items-center justify-center gap-[5px] rounded-[10px] w-[90px] h-[60px] transition-all ease-in-out duration-300 hover:bg-[#ffa60020] md:flex-row md:gap-5 md:w-full md:justify-start md:h-auto md:pl-4 md:py-3 md:text-[20px]  ${
              route === "inventario"
                ? "text-[#ffa600] bg-[#ffa60020] rounded-[10px] font-bold"
                : "text-[#000000]"
            }`}
          >
            <IconArchiveFilled />
            Inventario
          </Link>
          <Link
            to="/registro"
            onClick={() => setRoute("registro")}
            className={`flex flex-col items-center justify-center gap-[5px] rounded-[10px] w-[90px] h-[60px] transition-all ease-in-out duration-300 hover:bg-[#ffa60020] md:flex-row md:gap-5 md:w-full md:justify-start md:h-auto md:pl-4 md:py-3 md:text-[20px]  ${
              route === "registro"
                ? "text-[#ffa600] bg-[#ffa60020] rounded-[10px] font-bold"
                : "text-[#000000]"
            }`}
          >
            <IconChartDonutFilled />
            Registro
          </Link>
          <Link
            className={`flex flex-col items-center justify-center gap-[5px] rounded-[10px] w-[90px] h-[60px] transition-all ease-in-out duration-300 hover:bg-[#ffa60020] md:flex-row md:gap-5 md:w-full md:justify-start md:h-auto md:pl-4 md:py-3 md:text-[20px]  ${
              route === "opciones"
                ? "text-[#ffa600] bg-[#ffa60020] rounded-[10px] font-bold"
                : "text-[#000000]"
            }`}
            to="/mas-opciones"
            onClick={() => setRoute("opciones")}
          >
            <IconGridDots />
            Más
          </Link>
        </div>
      )}
    </>
  );
}

export default App;
