import { useUser } from "../supComponentes/UserContext";
import { supabase } from "../../supabaseClient";
import { useState, useEffect } from "react";

export default function Registro() {
  const { userData, loading } = useUser();

  const [ganancias, setGanancias] = useState([]);

  const fetchGanancias = async () => {
    const { data, error } = await supabase.from("ganancias").select("*");

    if (error) {
      console.error("Error al obtener las ganancias", error);
      return;
    } else {
      console.log('ganancia actualizada', data)
      setGanancias(data);
    }
  };

  useEffect(() => {
    fetchGanancias();
  }, [userData]);

  const [gananciaTotal, setGananciaTotal] = useState(0);

  useEffect(() => {
    const fetchTotal = async () => {
      const { data, error } = await supabase
        .from("ventas_diarias")
        .select("total_ganancia")
        .limit(1000);

      if (!error && data) {
        const total = data.reduce((acc, fila) => acc + fila.total_ganancia, 0);
        setGananciaTotal(total);
      } else {
        console.error("Error al obtener ganancias:", error?.message);
      }
    };

    fetchTotal();
  }, []);

  const [ventasAnteriores, setVentasAnteriores] = useState([])

  const fetchVentasAnteriores = async () => {
    const { data, error } = await supabase
      .from('ventas_diarias')
      .select('*')

    if(error) {
      console.error('error al obtener las ventas anteriores:', error.message)
    } else {
      console.log('ventas anteriores obtenidas:', data)
      setVentasAnteriores(data)
    }
  }

  useEffect(() => {
    fetchVentasAnteriores()
  }, [])

  if(loading && !userData) {
    return (
      <div></div>
    )
  }

  if (userData.rol !== "administrador") {
    return (
      <div className="h-screen flex flex-col items-center justify-center px-3 md:pl-[300px]">
        <p className="text-[30px] font-bold text-[#707070]">
          Usuario no Autorizado
        </p>
        <p className="text-[20px] text-center text-[#707070]">
          Solo los Administradores tienen acceso a esta sección.
        </p>
      </div>
    );
  }

  if (userData) {
    return (
      <>
        <div className="size-full flex flex-col itmes-center p-4 md:pl-[300px] pb-[200px]">
          <div className="w-full h-[180px] flex flex-col items-center justify-center rounded-[35px] p-3 bg-gradient-to-t from-[#ffc600] to-[#ffa600] md:items-start md:justify-start md:p-5">
            <p className="text-white font-bold text-[20px] md:text-[30px]">Ingreso Total:</p>
            <p className="text-white font-[900] text-[50px] -mt-2 truncate md:text-[70px]">
              S/. {gananciaTotal.toFixed(2)}
            </p>
          </div>
          <br />

          <p className="text-[20px] text-[#707070] font-bold mb-2">
            Ventas de hoy
          </p>
          <div className="flex flex-col gap-4 md:flex-row md:flex-wrap">
            {ganancias.map((ganancia) => {
              return (
                <div
                  key={ganancia.id}
                  className="bg-[#fafafa] rounded-[20px] py-2 px-5"
                >
                  <p className="font-bold text-[30px] text-[#707070] truncate">
                    {ganancia.nombre_sucursal}
                  </p>
                  <p className="font-[800] text-[45px]">
                    S/. {ganancia.total_ganancia.toFixed(2)}
                  </p>
                </div>
              );
            })}
          </div>

          <br />

          <p className="text-[20px] text-[#707070] font-bold mb-2">Ventas Anteriores</p>
          <div className="flex flex-col gap-5 md:max-w-[700px]">
            {ventasAnteriores.slice().reverse().map((venta) => {
              return (
                <div key={venta.id} className="flex justify-between items-center">
                  <div className="flex flex-col">
                    <p className="font-bold text-[20px]">{venta.sucursal_name}</p>
                    <p className="font-bold text-[#707070]">{venta.fecha.slice(0, 10)}</p>
                  </div>
                  <p className="font-black text-[20px] text-[#26ce6c]">+ S/. {venta.total_ganancia.toFixed(2)}</p>
                </div>
              )
            })}
          </div>
        </div>
      </>
    );
  }
}
