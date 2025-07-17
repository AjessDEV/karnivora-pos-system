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
      console.log("ganancia actualizada", data);
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

  const [ventasAnteriores, setVentasAnteriores] = useState([]);

  const fetchVentasAnteriores = async () => {
    const { data, error } = await supabase.from("ventas_diarias").select("*");

    if (error) {
      console.error("error al obtener las ventas anteriores:", error.message);
    } else {
      console.log("ventas anteriores obtenidas:", data);
      setVentasAnteriores(data);
    }
  };

  useEffect(() => {
    fetchVentasAnteriores();
  }, []);

  const [productosVendidosPorMes, setProductosVendidosPorMes] = useState({});

  useEffect(() => {
    async function fetchProductosVendidos() {
      const { data, error } = await supabase
        .from("productos_vendidos")
        .select("*")
        .order("mes", { ascending: false });

      if (error) {
        console.error("Error al obtener productos vendidos:", error);
        return;
      }

      // Agrupar por mes
      const agrupado = data.reduce((acc, item) => {
        if (!acc[item.mes]) acc[item.mes] = [];
        acc[item.mes].push(item);
        return acc;
      }, {});

      setProductosVendidosPorMes(agrupado);
    }

    fetchProductosVendidos();
  }, []);

  //

  if (loading && !userData) {
    return <div></div>;
  }

  if (userData.rol !== "Administrador") {
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
            <p className="text-white font-bold text-[20px] md:text-[30px]">
              Ingreso Total:
            </p>
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

          <p className="text-[20px] text-[#707070] font-bold mb-2">
            Ventas Anteriores
          </p>
          <div className="flex flex-col gap-5 md:max-w-[700px]">
            {ventasAnteriores
              .slice()
              .reverse()
              .map((venta) => {
                return (
                  <div
                    key={venta.id}
                    className="flex justify-between items-center"
                  >
                    <div className="flex flex-col">
                      <p className="font-bold text-[20px]">
                        {venta.sucursal_name}
                      </p>
                      <p className="font-bold text-[#707070]">
                        {venta.fecha.slice(0, 10)}
                      </p>
                    </div>
                    <p className="font-black text-[20px] text-[#26ce6c]">
                      + S/. {venta.total_ganancia.toFixed(2)}
                    </p>
                  </div>
                );
              })}
          </div>
          <br />
          <br />
          <div>
            <p className="text-[20px] text-[#707070] font-bold mb-2">
              Lista de Productos Vendidos
            </p>
            <br />
            <div className="flex flex-col gap-8">
              {Object.entries(productosVendidosPorMes).map(
                ([mes, productos], i) => {
                  const nombreMes = new Date(mes + "-01").toLocaleDateString(
                    "es-PE",
                    {
                      month: "long",
                      year: "numeric",
                    }
                  );

                  // Agrupar productos por sucursal_id
                  const productosPorSucursal = {};
                  for (const prod of productos) {
                    if (!productosPorSucursal[prod.sucursal_id]) {
                      productosPorSucursal[prod.sucursal_id] = {
                        nombre: prod.sucursal_nombre || "Sucursal desconocida",
                        productos: [],
                      };
                    }
                    productosPorSucursal[prod.sucursal_id].productos.push(prod);
                  }

                  return (
                    <div key={mes}>
                      <h2 className="text-2xl font-bold mb-4 capitalize">
                        {i === 0 ? "Mes Actual - " : ""}
                        {nombreMes}
                      </h2>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {Object.entries(productosPorSucursal).map(
                          ([sucursalId, { nombre, productos }]) => {
                            const productosOrdenados = [...productos].sort(
                              (a, b) => b.total_generado - a.total_generado
                            );

                            const totalSucursal = productosOrdenados.reduce(
                              (sum, p) => sum + p.total_generado,
                              0
                            );

                            return (
                              <div
                                key={sucursalId}
                                className="rounded-[10px] py-4 px-6 shadow-[0_0_20px_#00000030] relative max-h-[250px] overflow-y-auto"
                              >
                                <div className="absolute top-2 left-3 text-sm font-bold bg-gray-200 px-2 py-1 rounded">
                                  {nombre}
                                </div>

                                <div className="flex flex-col gap-2 mt-6">
                                  {productosOrdenados.map((prod, index) => (
                                    <div
                                      key={prod.id}
                                      className="flex justify-between items-center border-b border-[#00000020] py-1 text-[15px]"
                                    >
                                      <div className="flex items-center gap-2">
                                        {index === 0 && "🥇"}
                                        {index === 1 && "🥈"}
                                        {index === 2 && "🥉"}
                                        <span className="font-bold">
                                          {prod.producto_nombre}
                                        </span>
                                      </div>
                                      <div className="text-right">
                                        <p className="font-bold">
                                          {prod.cantidad_vendida} Unid.
                                        </p>
                                        <p className="text-[#ffa600] font-black text-[18px]">
                                          S/. {prod.total_generado.toFixed(2)}
                                        </p>
                                      </div>
                                    </div>
                                  ))}
                                </div>

                                <div className="text-right mt-2 font-bold text-[16px]">
                                  Total sucursal:
                                  <span className="text-[#26ce6c] font-black text-[22px] block">
                                    S/. {totalSucursal.toFixed(2)}
                                  </span>
                                </div>
                              </div>
                            );
                          }
                        )}
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          </div>
        </div>
      </>
    );
  }
}
