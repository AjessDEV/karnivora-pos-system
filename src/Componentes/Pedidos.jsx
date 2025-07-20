import { useEffect, useState } from "react";
import {
  IconChevronLeft,
  IconQrcode,
  IconCash,
  IconCreditCardFilled,
} from "@tabler/icons-react";
import { IconPlus } from "@tabler/icons-react";
import { supabase } from "../../supabaseClient";
import { IconTrashOff } from "@tabler/icons-react";

import pdfMake from "pdfmake/build/pdfmake";
import "pdfmake/build/vfs_fonts";

import { useUser } from "../supComponentes/UserContext";

// REGISTRO DE MOVIMIENTO
import { registrarMovimiento } from "../supComponentes/registrarMovimiento";

export default function Pedidos({ window }) {
  const formatPrice = (value) => {
    if (typeof value !== "number") return "";
    return value.toFixed(2).replace(",", ".");
  };

  const { userData, loading } = useUser();

  const [pedidos, setPedidos] = useState([]);

  useEffect(() => {
    const cargarPedidos = () => {
      const ordersData = localStorage.getItem("pedidos");

      if (ordersData) {
        try {
          const parsedArray = JSON.parse(ordersData);

          if (Array.isArray(parsedArray)) {
            setPedidos(parsedArray);
          } else {
            console.warn("no es array");
          }
        } catch (error) {
          console.error("error al parsear los datos", error);
        }
      }
    };

    cargarPedidos();

    // Opción: volver a cargar cada cierto tiempo (ej: 1s)
    const interval = setInterval(() => {
      cargarPedidos();
    }, 1000); // puedes ajustar este tiempo

    return () => clearInterval(interval);
  }, []);

  const [orderSelected, setOrderSelected] = useState(null);
  const showDetails = (order) => {
    setOrderSelected(order);
    setShow(true);
  };

  const [show, setShow] = useState(false);

  const ocultarDetalles = () => {
    setShow(false);
  };

  const [prods, setProds] = useState([]);
  async function fetchProductos() {
    const { data, error } = await supabase.from("productos").select("*");

    if (error) {
      console.error("error al recibir los productos", error);
    } else {
      console.log("exito al recibir los productos", data);
      setProds(data);
    }
  }

  useEffect(() => {
    fetchProductos();
  }, []);

  const [addMenu, setAddMenu] = useState(false);
  const toggleAddMenu = () => {
    setAddMenu((prev) => !prev);
  };

  const [del, setDel] = useState(false);
  const toggleDelTab = () => {
    setDel((prev) => !prev);
  };

  const refrescarPedidos = () => {
    const storedOrders = localStorage.getItem("pedidos");
    if (storedOrders) {
      setPedidos(JSON.parse(storedOrders));
    }
  };

  const agregarProductoAlPedido = async (nuevoProducto) => {
    if (!orderSelected) return;

    const productoConBase = {
      ...nuevoProducto,
      precioBase: nuevoProducto.precioBase ?? nuevoProducto.precio, // ← si no existe, usa el mismo precio
    };

    const nuevaLista = [...orderSelected.lista_productos, productoConBase];
    const delivery = parseFloat(orderSelected.delivery_precio) || 0;
    const nuevoTotal =
      nuevaLista.reduce((acc, p) => acc + p.precio, 0) + delivery;

    const pedidoActualizado = {
      ...orderSelected,
      lista_productos: nuevaLista,
      total_precio: nuevoTotal,
    };

    // ✅ Actualiza el estado del pedido seleccionado
    setOrderSelected(pedidoActualizado);

    const pedidosGuardados = JSON.parse(localStorage.getItem("pedidos")) || [];
    const pedidosActualizados = pedidosGuardados.map((p) =>
      p.id === pedidoActualizado.id ? pedidoActualizado : p
    );
    localStorage.setItem("pedidos", JSON.stringify(pedidosActualizados));

    refrescarPedidos();

    // registrar movimiento
    await guardarRegistro(
      `${userData.user_nombre} agregó "${nuevoProducto.nombre}" al pedido #${orderSelected.id}`,
      'Adición'
    )
  };

  const [confirmPaymentMenu, setConfirmPaymentMenu] = useState(false);

  const [cashMethod, setCashMethod] = useState(false);
  const toggleCashMethod = () => {
    setCashMethod((prev) => !prev);
    setAmmountPayed1("");
  };
  const [cardMethod, setCardMethod] = useState(false);
  const toggleCardMethod = () => {
    setCardMethod((prev) => !prev);
    setAmmountPayed3("");
  };
  const [eWalletMethod, setEWalletMethod] = useState(false);
  const toggleEWalletMethod = () => {
    setEWalletMethod((prev) => !prev);
    setAmmountPayed2("");
  };

  const [ammountPayed1, setAmmountPayed1] = useState("");
  const [ammountPayed2, setAmmountPayed2] = useState("");
  const [ammountPayed3, setAmmountPayed3] = useState("");
  const handleBlurPayment1 = () => {
    const normalized = ammountPayed1
      .replace(",", ".")
      .replace(/[^0-9.]/g, "")
      .replace(/(\..*)\./g, "$1");
    const num = parseFloat(normalized);

    if (!isNaN(num)) {
      const formated = new Intl.NumberFormat("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(num);
      setAmmountPayed1(formated);
    } else {
      setAmmountPayed1("");
    }
  };
  const handleBlurPayment2 = () => {
    const normalized = ammountPayed2.replace(",", ".").replace(/[^0-9.]/g, "");
    const num = parseFloat(normalized);

    if (!isNaN(num)) {
      const formated = new Intl.NumberFormat("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(num);
      setAmmountPayed2(formated);
    } else {
      setAmmountPayed2("");
    }
  };
  const handleBlurPayment3 = () => {
    const normalized = ammountPayed3.replace(",", ".").replace(/[^0-9.]/g, "");
    const num = parseFloat(normalized);

    if (!isNaN(num)) {
      const formated = new Intl.NumberFormat("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(num);
      setAmmountPayed3(formated);
    } else {
      setAmmountPayed3("");
    }
  };

  const totalPagado =
    parseFloat(ammountPayed1 || 0) +
    parseFloat(ammountPayed2 || 0) +
    parseFloat(ammountPayed3 || 0);

  async function descontarInsumosPorProductos(listaProductos) {
    for (const producto of listaProductos) {
      const { id: productoId, cantidad: cantidadVendida } = producto;

      // Obtener insumos relacionados al producto
      const { data: conexiones, error: errorConexiones } = await supabase
        .from("producto_inventario")
        .select("inventario_id, cantidad")
        .eq("producto_id", productoId);

      if (errorConexiones) {
        console.error(
          `Error obteniendo conexiones del producto ${productoId}:`,
          errorConexiones.message
        );
        continue; // ignoramos este producto y seguimos con los demás
      }

      for (const conexion of conexiones) {
        const idInsumo = conexion.inventario_id;
        const cantidadARestar =
          parseFloat(conexion.cantidad) * parseFloat(cantidadVendida);
        console.log("conexion.cantidad", conexion.cantidad);
        console.log("cantidad vendida", cantidadVendida);

        // Obtener el insumo actual del inventario
        const { data: insumoActual, error: errorInsumo } = await supabase
          .from("inventario")
          .select("uuid, cantidad")
          .eq("uuid", idInsumo)
          .single();

        if (errorInsumo || !insumoActual) {
          console.error(`No se pudo obtener el insumo con ID ${idInsumo}`);
          continue;
        }
        console.log("insumoActual.cantidad", insumoActual.cantidad);
        const nuevaCantidad =
          insumoActual.cantidad - parseFloat(cantidadARestar);

        if (isNaN(nuevaCantidad) || nuevaCantidad < 0) {
          console.warn(`Cantidad inválida para insumo ${idInsumo}`);
          console.log(nuevaCantidad);
          continue;
        }

        // Actualizar el insumo en el inventario
        const { error: errorUpdate } = await supabase
          .from("inventario")
          .update({ cantidad: nuevaCantidad })
          .eq("uuid", idInsumo);

        if (errorUpdate) {
          console.error(
            `Error actualizando el insumo ${idInsumo}:`,
            errorUpdate.message
          );
        }
      }
    }

    console.log("Descuento de insumos finalizado.");
  }

  const [efectivo, setEfectivo] = useState(() => {
    const valorGuardado = localStorage.getItem("efectivo");
    return valorGuardado !== null ? Number(JSON.parse(valorGuardado)) : 0;
  });
  const [yapePlin, setYapePlin] = useState(() => {
    const valorGuardado = localStorage.getItem("yape/plin");
    return valorGuardado !== null ? Number(JSON.parse(valorGuardado)) : 0;
  });
  const [tarjeta, setTarjeta] = useState(() => {
    const valorGuardado = localStorage.getItem("tarjeta");
    return valorGuardado !== null ? Number(JSON.parse(valorGuardado)) : 0;
  });

  function updateCaja(efe, yap, tarj, vuelto) {
    const numVuelto = Number(vuelto);

    // Actualizar efectivo
    if (efe > 0) {
      const actual = Number(localStorage.getItem("efectivo")) || 0;
      const nuevo = actual + Number(efe) - numVuelto;
      setEfectivo(nuevo);
      localStorage.setItem("efectivo", JSON.stringify(nuevo));
    }

    // Actualizar Yape/Plin
    if (yap > 0) {
      const actual = Number(localStorage.getItem("yape/plin")) || 0;
      const nuevo = actual + Number(yap) - numVuelto;
      setYapePlin(nuevo);
      localStorage.setItem("yape/plin", JSON.stringify(nuevo));
    }

    // Actualizar tarjeta
    if (tarj > 0) {
      const actual = Number(localStorage.getItem("tarjeta")) || 0;
      const nuevo = actual + Number(tarj) - numVuelto;
      setTarjeta(nuevo);
      localStorage.setItem("tarjeta", JSON.stringify(nuevo));
    }
  }

  function guardarMovimiento(nuevoMovimiento) {
    // Obtener la lista actual desde localStorage
    const stored = localStorage.getItem("movimientos");
    const listaActual = stored ? JSON.parse(stored) : [];

    // Agregar el nuevo movimiento
    const updated = [...listaActual, nuevoMovimiento];

    // Guardar en localStorage
    localStorage.setItem("movimientos", JSON.stringify(updated));
  }

  const actualizarGanancia = async (
    nuevaGanancia,
    sucursalId,
    sucursalNombre
  ) => {
    const { data, error: fetchError } = await supabase
      .from("ganancias")
      .select("total_ganancia")
      .eq("sucursal_id", sucursalId)
      .maybeSingle();

    if (fetchError && fetchError.code !== "PGRST116") {
      console.error("Error al obtener la ganancia actual:", fetchError.message);
      return;
    }

    const gananciaActual = data?.total_ganancia || 0;
    const nuevoTotal = gananciaActual + nuevaGanancia;

    const { error: updateError } = await supabase.from("ganancias").upsert(
      [
        {
          sucursal_id: sucursalId,
          total_ganancia: nuevoTotal,
          nombre_sucursal: sucursalNombre,
        },
      ],
      { onConflict: ["sucursal_id"] }
    );

    if (updateError) {
      console.error("Error al actualizar la ganancia:", updateError.message);
    } else {
      console.log("Ganancia actualizada exitosamente:", nuevoTotal);
    }
  };

  const confirmarPago = () => {
    if (!orderSelected) return;

    const pedidosGuardados = JSON.parse(localStorage.getItem("pedidos")) || [];

    const pedidosActualizados = pedidosGuardados.map((pedido) => {
      if (pedido.id === orderSelected.id) {
        return {
          ...pedido,
          pay_confirm: true,
        };
      }
      return pedido;
    });

    // Actualizar localStorage con los pedidos modificados
    localStorage.setItem("pedidos", JSON.stringify(pedidosActualizados));

    // Actualizar el estado local también (si lo estás usando)
    setOrderSelected((prev) => ({
      ...prev,
      pay_confirm: true,
    }));
  };

  const eliminarPedido = async (idPedido) => {
    const pedidosGuardados = JSON.parse(localStorage.getItem("pedidos")) || [];

    const pedidosActualizados = pedidosGuardados.filter(
      (pedido) => pedido.id !== idPedido
    );

    // Guardar el nuevo array en localStorage
    localStorage.setItem("pedidos", JSON.stringify(pedidosActualizados));

    // (Opcional) actualizar lista en pantalla si usas useState
    setPedidos(pedidosActualizados); // Solo si usas setOrders

    setShow(false);
    toggleDelTab();

    // registrar movimiento
    await guardarRegistro(
      `${userData.user_nombre} Eliminó el pedido #${idPedido}`,
      'Eliminación'
    )
  };

  const refrescarCaja = () => {
    const storedEfectivo = localStorage.getItem("efectivo");
    const storedYape = localStorage.getItem("yape/plin");
    const storedTarjeta = localStorage.getItem("tarjeta");

    setEfectivo(storedEfectivo ? JSON.parse(storedEfectivo) : 0);
    setYapePlin(storedYape ? JSON.parse(storedYape) : 0);
    setTarjeta(storedTarjeta ? JSON.parse(storedTarjeta) : 0);
  };

  async function guardarProductosVendidos(pedido, userDat) {
    const productosAGuardar = [...pedido.lista_productos];

    // Añadir delivery como producto si aplica
    if (pedido.delivery_precio && pedido.delivery_precio > 0) {
      productosAGuardar.push({
        nombre: "Delivery",
        cantidad: 1,
        precio: parseFloat(pedido.delivery_precio),
      });
    }

    const fecha = pedido.fecha;
    const mes = fecha.slice(0, 7);
    const sucursal_id = userDat.sucursal_id;
    const sucursal_nombre = userDat.sucursal_nombre;

    for (const producto of productosAGuardar) {
      const { nombre, cantidad, id_producto, precio } = producto;

      // Buscar si ya existe un registro de este producto vendido
      const { data: existente, error: errorBusqueda } = await supabase
        .from("productos_vendidos")
        .select("*")
        .eq("producto_nombre", nombre)
        .eq("mes", mes)
        .eq("sucursal_id", sucursal_id)
        .single();

      if (errorBusqueda && errorBusqueda.code !== "PGRST116") {
        console.error(
          "Error buscando producto vendido:",
          errorBusqueda.message
        );
        continue;
      }

      if (existente) {
        // Ya existe: actualizamos cantidad y total generado
        const nuevaCantidad = existente.cantidad_vendida + cantidad;
        const nuevoTotal = existente.total_generado + precio;

        const { error: errorUpdate } = await supabase
          .from("productos_vendidos")
          .update({
            cantidad_vendida: nuevaCantidad,
            total_generado: nuevoTotal,
          })
          .eq("id", existente.id);

        if (errorUpdate) {
          console.error(
            "Error actualizando producto vendido:",
            errorUpdate.message
          );
        }
      } else {
        // No existe: insertamos nuevo
        const { error: errorInsert } = await supabase
          .from("productos_vendidos")
          .insert({
            producto_nombre: nombre,
            cantidad_vendida: cantidad,
            id: id_producto,
            total_generado: precio,
            mes,
            sucursal_id,
            sucursal_nombre,
          });

        if (errorInsert) {
          console.error(
            "Error insertando producto vendido:",
            errorInsert.message
          );
        }
      }
    }
  }

  const guardarRegistro = async (detalle, acci) => {

    await registrarMovimiento(
      {
        nombre: userData.user_nombre,
        sucursal: userData.sucursal_nombre,
        accion: acci,
        detalles: detalle,
      }
    )
  }

  return (
    <div
      className={`w-full absolute ${window === "Pedidos" ? "top-0 opacity-100" : "top-[100px] opacity-0"
        } left-0 flex flex-col gap-[20px] transition-all ease-in-out duration-200 pb-[100px]`}
    >
      <h2 className="text-[30px] font-bold mb-[10px] text-center">Pedidos</h2>

      <div
        className={`fixed top-0 z-101 ${show ? "left-0 md:left-[50%]" : "left-full"
          } size-full bg-white p-4 transition-all ease-in-out duration-300 overflow-y-auto md:h-full md:w-[50%] md:shadow-[-20px_0_40px_#00000020]`}
      >
        {orderSelected && (
          <>
            <div
              className={`fixed top-0 z-101 ${confirmPaymentMenu ? "left-0" : "left-full"
                } size-full bg-white p-4 transition-all ease-in-out duration-300 overflow-y-auto md:shadow-[-20px_0_40px_#00000020]`}
            >
              <div className="flex gap-[15px]">
                <button
                  onClick={() => setConfirmPaymentMenu(false)}
                  className="cursor-pointer"
                >
                  <IconChevronLeft size={30} stroke={2} />
                </button>
                <h1 className="text-[28px]">Confirmar Pago</h1>
              </div>

              <div className="w-full py-7 flex justify-center items-center md:py-0 md:pb-3">
                <div className="flex flex-col text-center">
                  <p className="text-[20px] font-bold text-[#ffa600]">
                    Monto a Pagar:
                  </p>
                  <p className="text-[50px] font-[900]">
                    S/.{" "}
                    {(
                      orderSelected.lista_productos?.reduce(
                        (a, b) => a + b.precio,
                        0
                      ) + parseFloat(orderSelected.delivery_precio)
                    ).toFixed(2)}
                  </p>
                </div>
              </div>

              <div className="flex w-full gap-[10px] my-2 md:max-w-[700px] md:mx-auto">
                <button
                  onClick={toggleCashMethod}
                  className={`w-full px-2 py-1 flex flex-col items-center gap-[5px] font-bold text-[20px] border-4 hover:border-[#ffa600] cursor-pointer ${cashMethod
                    ? "border-[#ffa600] bg-[#ffa600] text-white"
                    : "border-[#e0e0e0]"
                    } rounded-[15px] transition-all ease-in-out duration-200 active:scale-[0.9]`}
                >
                  <IconCash size={40} stroke={2} />
                  Efectivo
                </button>
                <button
                  onClick={toggleEWalletMethod}
                  className={`w-full px-2 py-1 flex flex-col items-center gap-[5px] font-bold text-[20px] border-4 hover:border-[#ffa600] cursor-pointer ${eWalletMethod
                    ? "border-[#ffa600] bg-[#ffa600] text-white"
                    : "border-[#e0e0e0]"
                    } rounded-[15px] transition-all ease-in-out duration-200 active:scale-[0.9]`}
                >
                  <IconQrcode size={40} stroke={2} />
                  Yape/Plin
                </button>
                <button
                  onClick={toggleCardMethod}
                  className={`w-full px-2 py-1 flex flex-col items-center gap-[5px] font-bold text-[20px] border-4 hover:border-[#ffa600] cursor-pointer ${cardMethod
                    ? "border-[#ffa600] bg-[#ffa600] text-white"
                    : "border-[#e0e0e0]"
                    } rounded-[15px] transition-all ease-in-out duration-200 active:scale-[0.9]`}
                >
                  <IconCreditCardFilled size={40} />
                  Tarjeta
                </button>
              </div>

              <div className="flex flex-col gap-[20px] my-5 md:max-w-[700px] md:mx-auto">
                <div className={`${cashMethod ? "block" : "hidden"}`}>
                  <p className="text-[25px] font-bold">Efectivo</p>
                  <input
                    value={ammountPayed1}
                    onChange={(e) => setAmmountPayed1(e.target.value)}
                    onBlur={handleBlurPayment1}
                    className="text-[20px] font-bold w-full p-2 border-2 border-[#e0e0e0] rounded-[10px]"
                    type="text"
                    placeholder="Monto Pagado"
                  />
                </div>

                <div className={`${eWalletMethod ? "block" : "hidden"}`}>
                  <p className="text-[25px] font-bold">Yape/Plin</p>
                  <input
                    value={ammountPayed2}
                    onChange={(e) => setAmmountPayed2(e.target.value)}
                    onBlur={handleBlurPayment2}
                    className="text-[20px] font-bold w-full p-2 border-2 border-[#e0e0e0] rounded-[10px]"
                    type="text"
                    placeholder="Monto Pagado"
                  />
                </div>

                <div className={`${cardMethod ? "block" : "hidden"}`}>
                  <p className="text-[25px] font-bold">Tarjeta</p>
                  <input
                    value={ammountPayed3}
                    onChange={(e) => setAmmountPayed3(e.target.value)}
                    onBlur={handleBlurPayment3}
                    className="text-[20px] font-bold w-full p-2 border-2 border-[#e0e0e0] rounded-[10px]"
                    type="text"
                    placeholder="Monto Pagado"
                  />
                </div>

                <div>
                  <p className="text-[25px] font-[800]">Vuelto:</p>
                  <p className="text-[45px] font-[900]">
                    S/.{" "}
                    {totalPagado >
                      orderSelected.lista_productos?.reduce(
                        (a, b) => a + b.precio,
                        0
                      ) +
                      parseFloat(orderSelected.delivery_precio)
                      ? Number(
                        totalPagado -
                        (orderSelected.lista_productos?.reduce(
                          (a, b) => a + b.precio,
                          0
                        ) +
                          parseFloat(orderSelected.delivery_precio))
                      ).toFixed(2)
                      : formatPrice(0)}
                  </p>
                </div>
              </div>

              <div className="md:max-w-[700px] md:mx-auto">
                <button
                  onClick={async () => {
                    const totalProductos =
                      orderSelected.lista_productos?.reduce(
                        (a, b) => a + b.precio,
                        0
                      );
                    const precioDelivery =
                      parseFloat(orderSelected.delivery_precio) || 0;
                    const totalVenta = totalProductos + precioDelivery;
                    const vuelto = totalPagado - totalVenta;

                    function generarTicketVenta(orderSelected) {
                      const fechaHora = new Date(
                        orderSelected.fecha
                      ).toLocaleString("es-PE", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      });

                      const productosFormateados = orderSelected.lista_productos
                        .map((prod) => {
                          const item = [
                            {
                              columns: [
                                {
                                  text: prod.nombre,
                                  fontSize: 10,
                                  width: "*",
                                  bold: true,
                                },
                                {
                                  text: `S/. ${prod.precio.toFixed(2)}`,
                                  fontSize: 10,
                                  alignment: "right",
                                },
                              ],
                              margin: [0, 0, 0, 2],
                            },
                          ];

                          if (
                            prod.extrasSeleccionados &&
                            prod.extrasSeleccionados.length > 0
                          ) {
                            item.push({
                              ul: prod.extrasSeleccionados.map(
                                (extra) => `${extra} extra`
                              ),
                              fontSize: 9,
                              margin: [10, 0, 0, 5],
                            });
                          } else {
                            item.push({ text: "", margin: [0, 0, 0, 5] }); // para mantener el espacio si no hay extras
                          }

                          return item;
                        })
                        .flat();

                      const metodosPago = [];

                      if (ammountPayed1) {
                        metodosPago.push({
                          columns: [
                            { text: "Efectivo:", fontSize: 10 },
                            {
                              text: `S/. ${parseFloat(ammountPayed1).toFixed(
                                2
                              )}`,
                              fontSize: 10,
                              alignment: "right",
                            },
                          ],
                        });
                      }
                      if (ammountPayed2) {
                        metodosPago.push({
                          columns: [
                            { text: "Yape/Plin:", fontSize: 10 },
                            {
                              text: `S/. ${parseFloat(ammountPayed2).toFixed(
                                2
                              )}`,
                              fontSize: 10,
                              alignment: "right",
                            },
                          ],
                        });
                      }
                      if (ammountPayed3) {
                        metodosPago.push({
                          columns: [
                            { text: "Tarjeta:", fontSize: 10 },
                            {
                              text: `S/. ${parseFloat(ammountPayed3).toFixed(
                                2
                              )}`,
                              fontSize: 10,
                              alignment: "right",
                            },
                          ],
                        });
                      }

                      const docDefinition = {
                        pageSize: { width: 165, height: "auto" }, // 58mm ≈ 165pt
                        pageMargins: [10, 10, 10, 10],
                        content: [
                          {
                            text: `PEDIDO #${orderSelected.id}`,
                            style: "header",
                            alignment: "center",
                            margin: [0, 0, 0, 5],
                          },
                          {
                            text: fechaHora,
                            fontSize: 10,
                            alignment: "center",
                            margin: [0, 0, 0, 2],
                          },
                          {
                            text: `Cliente: ${orderSelected.nombre}`,
                            fontSize: 10,
                            alignment: "center",
                            margin: [0, 0, 0, 10],
                          },

                          {
                            text: "Productos:",
                            style: "subheader",
                            margin: [0, 0, 0, 4],
                          },
                          ...productosFormateados,

                          ...(orderSelected.delivery_precio
                            ? [
                              {
                                columns: [
                                  { text: "Delivery", fontSize: 10 },
                                  {
                                    text: `S/. ${parseFloat(
                                      orderSelected.delivery_precio
                                    ).toFixed(2)}`,
                                    fontSize: 10,
                                    alignment: "right",
                                  },
                                ],
                                margin: [0, 0, 0, 5],
                              },
                            ]
                            : []),

                          {
                            text: "Métodos de Pago:",
                            style: "subheader",
                            margin: [0, 5, 0, 5],
                          },
                          ...metodosPago,

                          {
                            text: `Vuelto: S/. ${vuelto.toFixed(2)}`,
                            fontSize: 10,
                            margin: [0, 10, 0, 0],
                          },

                          {
                            text: `TOTAL: S/. ${totalVenta.toFixed(2)}`,
                            style: "total",
                            alignment: "right",
                            margin: [0, 10, 0, 0],
                          },
                          {
                            text: "¡GRACIAS POR SU COMPRA!",
                            alignment: "center",
                            fontSize: 12,
                            margin: [0, 10, 0, 10],
                          },
                        ],
                        styles: {
                          header: { fontSize: 14, bold: true },
                          subheader: { fontSize: 11, bold: true },
                          total: { fontSize: 12, bold: true },
                        },
                      };

                      pdfMake.createPdf(docDefinition).open();
                    }

                    generarTicketVenta(orderSelected);

                    descontarInsumosPorProductos(orderSelected.lista_productos);

                    const move = {
                      fecha: orderSelected.fecha,
                      monto_pagado: totalVenta,
                      numero_pedido: orderSelected.id,
                      tipo_pago: `Pedido #${orderSelected.id}`,
                      m_efectivo: ammountPayed1 ? "Efectivo" : null,
                      m_yape: ammountPayed2 ? "Yape/Plin" : null,
                      m_tarjeta: ammountPayed3 > 0 ? "Tarjeta" : null,
                      q_efe: ammountPayed1
                        ? ammountPayed1 - (vuelto > 0 ? vuelto : 0)
                        : null,
                      q_yape: ammountPayed2
                        ? ammountPayed2 - (vuelto > 0 ? vuelto : 0)
                        : null,
                      q_tar: ammountPayed3
                        ? ammountPayed3 - (vuelto > 0 ? vuelto : 0)
                        : null,
                      ing_eg: true,
                      reason: null,
                      nombre: orderSelected.nombre,
                    };

                    guardarMovimiento(move);

                    updateCaja(
                      ammountPayed1,
                      ammountPayed2,
                      ammountPayed3,
                      vuelto
                    );

                    const venta = parseFloat(orderSelected.total_precio);
                    const sucursalId = userData.sucursal_id;
                    const sucursalNombre = userData.sucursal_nombre;

                    if (sucursalId) {
                      actualizarGanancia(venta, sucursalId, sucursalNombre);
                    }

                    setAmmountPayed1("");
                    setAmmountPayed2("");
                    setAmmountPayed3("");
                    setConfirmPaymentMenu(false);
                    refrescarPedidos();
                    confirmarPago();
                    refrescarCaja();

                    guardarProductosVendidos(orderSelected, userData);

                    // registrar movimiento
                    await guardarRegistro(
                      `${userData.user_nombre} realizó una venta de S/. ${parseFloat(order.total_precio).toFixed(2)}`,
                      'Venta'
                    )
                  }}
                  className={`py-4 rounded-[15px] w-full ${totalPagado >=
                    orderSelected.lista_productos?.reduce(
                      (a, b) => a + b.precio,
                      0
                    ) +
                    parseFloat(orderSelected.delivery_precio)
                    ? "bg-[#ffa600] cursor-pointer"
                    : "bg-[#e0e0e0] pointer-events-none"
                    } text-white font-bold text-[20px] cursor-pointer`}
                >
                  Confirmar Pago
                </button>
              </div>
            </div>

            <div className="w-full flex justify-between items-center mb-4">
              <div className="flex gap-[15px]">
                <button onClick={ocultarDetalles} className="cursor-pointer">
                  <IconChevronLeft size={30} stroke={2} />
                </button>
                <h1 className="text-[28px]">Pedido #{orderSelected.id}</h1>
              </div>

              <button
                onClick={toggleDelTab}
                className={`p-2 rounded-[10px] flex ${orderSelected.pay_confirm === true
                  ? "bg-[#e0e0e0] text-[#00000050] pointer-events-none"
                  : "bg-[#ff333330] text-[#ff3333]"
                  } font-[800] cursor-pointer hover:bg-[#ff333350] transition-all duration-200`}
              >
                <IconTrashOff stroke={2} size={30} />
              </button>
            </div>

            <p className="font-bold text-[25px] my-4">
              Nombre: {`${orderSelected.nombre}`}
            </p>

            <div>
              <p className="font-bold text-[25px] py-2 px-3 bg-[#00000010] rounded-[10px] mb-4">
                Productos del Pedido
              </p>
              {orderSelected.delivery_precio > 0 ? (
                <div className="flex items-center justify-between py-2">
                  <p className="font-bold text-[23px]">Delivery</p>
                  <p className="font-bold text-[23px]">
                    S/. {formatPrice(parseFloat(orderSelected.delivery_precio))}
                  </p>
                </div>
              ) : null}
              {orderSelected?.lista_productos?.map((producto, index) => {
                return (
                  <div
                    key={index}
                    className="flex items-center justify-between py-2"
                  >
                    <p className="font-bold text-[23px]">{producto.nombre}</p>
                    <p className="font-bold text-[23px]">
                      S/. {formatPrice(producto.precio)}
                    </p>
                  </div>
                );
              })}
              <button
                onClick={toggleAddMenu}
                className={`flex gap-[10px] font-bold items-center justify-center w-full cursor-pointer ${orderSelected.pay_confirm === true ? "hidden" : "flex"
                  } bg-[#ffa600] text-white text-[20px] rounded-[10px] py-3 active:bg-[#f59f00] transition-all ease-in-out duration-200 mt-2`}
              >
                <IconPlus stroke={3} /> Agregar Producto
              </button>
              <div className="relative">
                <ul
                  className={`absolute top-0 left-0 w-full overflow-hidden overflow-y-auto bg-white rounded-[10px] shadow-[0_0_20px_#00000010] ${addMenu ? "max-h-[250px]" : "max-h-0 opacity-0"
                    } mt-3 p-3 flex flex-col gap-3 transition-all ease-in-out duration-300`}
                >
                  {prods.map((prod) => {
                    return (
                      <li
                        key={prod.id}
                        onClick={() => {
                          agregarProductoAlPedido(prod);
                          toggleAddMenu();
                        }}
                        className="p-2 text-[20px] font-bold flex items-center justify-between cursor-pointer hover:bg-[#ffa60030] rounded-[10px] transition-all ease-in-out duration-300"
                      >
                        <div className="flex flex-col">
                          <p>{prod.nombre}</p>
                          <p className="font-normal text-[15px] -mt-1">
                            {prod.categoria}
                          </p>
                        </div>
                        <p>S/. {formatPrice(prod.precio)}</p>
                      </li>
                    );
                  })}
                </ul>
              </div>

              <div
                className={`fixed top-50 mx-auto left-0 right-0 bg-white rounded-[20px] max-w-[350px] shadow-[0_0_30px_#00000020] p-3 transition-all ease-in-out duration-300 ${del ? "scale-100" : "scale-50 opacity-0 pointer-events-none"
                  }`}
              >
                <p className="text-center text-[25px] text-[#ff3333] font-[800] mb-7">
                  Eliminar Pedido
                </p>
                <p className="font-bold text-center text-[20px]">
                  ¿Estás Seguro?
                </p>
                <p className="text-center text-[18px]">
                  El pedido se eliminara por completo y no podrás recuperarlo de
                  nuevo.
                </p>
                <div className="flex gap-3 mt-7">
                  <button
                    onClick={toggleDelTab}
                    className="rounded-[10px] w-full bg-[#ff333330] text-[#ff3333] text-[18px] font-bold py-3 cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => eliminarPedido(orderSelected.id)}
                    className="rounded-[10px] w-full bg-[#ff3333] text-white text-[18px] font-bold py-3 cursor-pointer"
                  >
                    Eliminar
                  </button>
                </div>
              </div>

              <div className="flex flex-col items-start mt-4">
                <p className="font-bold text-[30px]">Total:</p>
                <p className="font-[900] text-[40px] -mt-2">
                  {(
                    orderSelected.lista_productos?.reduce(
                      (a, b) => a + b.precio,
                      0
                    ) + parseFloat(orderSelected.delivery_precio)
                  ).toFixed(2)}
                </p>
              </div>

              <div className="flex flex-col gap-3 justify-center mt-6">
                <button
                  onClick={async () => {
                    const precioExtras = {
                      Chorizo: 4.0,
                      Tocino: 2.0,
                      Queso: 2.0,
                      Huevo: 2.0,
                      Piña: 2.0,
                    };

                    const fecha = new Date();
                    const hora = fecha.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    });
                    const cliente = orderSelected.nombre;

                    let total = 0;
                    let sumaExtras = 0;

                    const productosFormateados = orderSelected.lista_productos.map((prod, index) => {
                      const detalles = [];

                      const precioBase = prod.precioBase || 0;
                      let totalExtrasProd = 0;

                      // Mostrar vegetales (sin precio)
                      if (prod.vegetalesSeleccionados?.length) {
                        detalles.push({
                          text: `• ${prod.vegetalesSeleccionados.join(", ")}`,
                          fontSize: 10,
                          margin: [0, 0, 0, 3],
                        });
                      }

                      // Mostrar salsas (sin precio)
                      if (prod.salsasSeleccionadas?.length) {
                        detalles.push({
                          text: `• Salsas: ${prod.salsasSeleccionadas.join(", ")}`,
                          fontSize: 10,
                          margin: [0, 0, 0, 3],
                        });
                      }

                      // Mostrar extras con precio
                      if (prod.extrasSeleccionados?.length) {
                        detalles.push({
                          text: "• Extras:",
                          fontSize: 10,
                          margin: [0, 2, 0, 0],
                        });

                        prod.extrasSeleccionados.forEach((extra) => {
                          const precio = precioExtras[extra] || 0;
                          totalExtrasProd += precio;

                          detalles.push({
                            text: `   - ${extra}: S/ ${precio.toFixed(2)}`,
                            fontSize: 10,
                            margin: [0, 0, 0, 0],
                          });
                        });

                        detalles.push({ text: "", margin: [0, 0, 0, 5] });
                      }

                      const precioTotalProducto = precioBase;
                      total += precioBase;
                      sumaExtras += totalExtrasProd;

                      return {
                        columns: [
                          {
                            stack: [
                              {
                                text: prod.nombre,
                                bold: true,
                                fontSize: 13,
                                margin: [0, 0, 0, 3],
                              },
                              ...detalles,
                            ],
                            width: "*",
                          },
                          {
                            text: `S/ ${precioTotalProducto.toFixed(2)}`,
                            alignment: "right",
                            fontSize: 10,
                            width: "50",
                            bold: true,
                          },
                        ],
                        margin: [0, 0, 0, 10],
                      };
                    });

                    const nota = orderSelected.notas
                      ? [
                        {
                          text: "NOTA:",
                          bold: true,
                          margin: [0, 20, 0, 5],
                          fontSize: 12,
                        },
                        {
                          text: orderSelected.notas,
                          fontSize: 12,
                        },
                      ]
                      : [];

                    const deliveryPrecio = parseFloat(orderSelected.delivery_precio || 0);
                    const totalFinal = total + sumaExtras + deliveryPrecio;

                    const docDefinition = {
                      pageSize: {
                        width: 165,
                        height: "auto",
                      },
                      pageMargins: [10, 10, 10, 10],
                      content: [
                        {
                          text: `PEDIDO #${orderSelected.id}`,
                          alignment: "center",
                          fontSize: 18,
                          bold: true,
                          margin: [0, 0, 0, 10],
                        },
                        { text: `Hora: ${hora}`, fontSize: 10 },
                        {
                          text: `Cliente: ${cliente}`,
                          fontSize: 10,
                          margin: [0, 0, 0, 3],
                        },
                        {
                          text: `${orderSelected.tipo_pedido}`,
                          fontSize: 11,
                          bold: true,
                          margin: [0, 0, 0, 10],
                        },
                        ...productosFormateados,
                        ...nota,
                        ...(deliveryPrecio > 0
                          ? [
                            {
                              text: `Delivery: S/ ${deliveryPrecio.toFixed(2)}`,
                              alignment: "right",
                              fontSize: 11,
                              margin: [0, 10, 0, 0],
                            },
                          ]
                          : []),
                        {
                          text: `TOTAL: S/ ${totalFinal.toFixed(2)}`,
                          bold: true,
                          alignment: "right",
                          fontSize: 14,
                          margin: [0, 10, 0, 0],
                        },
                      ],
                    };

                    pdfMake.createPdf(docDefinition).open();
                  }}


                  className="bg-[#ffa600] active:bg-[ffa60080] py-3 text-white text-[20px] rounded w-full transition"
                >
                  Imprimir Comanda
                </button>
                <button
                  onClick={() => setConfirmPaymentMenu(true)}
                  className={`${orderSelected.pay_confirm === true
                    ? "bg-[#e0e0e0] text-white pointer-events-none"
                    : "bg-[#ffa60030]"
                    } py-4 rounded-[10px] text-[20px] text-[#ffa600] font-bold cursor-pointer hover:bg-[#ffa60050] transition-all duraiton-200`}
                >
                  Confirmar Pago
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="flex flex-col gap-[25px] md:flex-row md:flex-wrap">
        {pedidos
          .slice()
          .reverse()
          .map((order) => {
            const fecha = new Date(order.fecha);

            const fechaLegible = fecha.toLocaleDateString("es-ES", {
              weekday: "long",
              month: "long",
              day: "numeric",
            });

            const horaLegible = fecha
              .toLocaleTimeString("es-ES", {
                hour: "numeric",
                minute: "numeric",
                hour12: true,
              })
              .replace("p. m.", "PM")
              .replace("a. m.", "AM");

            return (
              <div
                key={order.id}
                className="p-6 w-full rounded-[15px] bg-[#fafafa] md:w-[330px] md:flex md:flex-col md:justify-between md:shrink-0"
              >
                <div className="flex justify-between items-center mb-[10px]">
                  <div>
                    <p className="font-bold text-[23px] capitalize">
                      {order.nombre}
                    </p>
                    <p className="font-bold text-[15px] text-[#707070] md:text-[20px]">
                      Pedido #{order.id}
                    </p>
                    <p className="font-[800] text-[18px] text-[#754c00] uppercase md:text-[16px]">
                      {order.tipo_pedido}
                    </p>
                  </div>
                  <div className="flex flex-col gap-[10px]">
                    <div className="flex gap-[10px] items-center justify-end">
                      <div
                        className={`w-[10px] h-[10px] ${order.pay_confirm === true
                          ? "bg-[#26ce6c]"
                          : "bg-[#ff3333]"
                          } rounded-full`}
                      ></div>
                      {order.pay_confirm === true ? "Pagado" : "No Pagado"}
                    </div>
                    <div className="flex gap-[5px] items-center flex-wrap justify-end">
                      <p
                        className={`${order.pay_method_1 === "Efectivo" ? "block" : "hidden"
                          } uppercase text-end font-bold py-1 px-2 bg-[#00000010] rounded-full text-[15px] md:text-[11px] md:px-1 md:py-0.5`}
                      >
                        Efectivo
                      </p>
                      <p
                        className={`${order.pay_method_2 === "Yape/Plin"
                          ? "block"
                          : "hidden"
                          } uppercase text-end font-bold py-1 px-2 bg-[#00000010] rounded-full text-[15px] md:text-[11px] md:px-1 md:py-0.5`}
                      >
                        Yape/Plin
                      </p>
                      <p
                        className={`${order.pay_method_3 === "Tarjeta" ? "block" : "hidden"
                          } uppercase text-end font-bold py-1 px-2 bg-[#00000010] rounded-full text-[15px] md:text-[11px] md:px-1 md:py-0.5`}
                      >
                        Tarjeta
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <div className="font-[700] text-[#707070]">
                    {fechaLegible}
                  </div>
                  <div className="font-[700] text-[#707070]">{horaLegible}</div>
                </div>
                <hr className="text-[#00000040] my-5" />
                <div className="flex justify-between py-2 px-3 bg-[#e0e0e0] items-center rounded-[8px]">
                  <div className="font-bold text-[18px]">Producto</div>
                  <div className="font-bold text-[18px]">Precio</div>
                </div>

                <div className="flex flex-col py-2 px-3 gap-[10px] max-h-[150px] overflow-y-auto">
                  {Array.isArray(order?.lista_productos) &&
                    order.lista_productos.map((producto, index) => (
                      <div key={index} className="flex justify-between py-1">
                        <div className="font-bold text-[20px]">
                          {producto.nombre}
                        </div>
                        <div className="font-bold text-[20px]">
                          S/. {formatPrice(producto.precio)}
                        </div>
                      </div>
                    ))}
                </div>
                <hr className="text-[#00000040] my-5" />
                <div className="flex justify-between mb-3 items-center">
                  <p className="font-bold text-[25px]">Total:</p>
                  <p className="font-[900] text-[35px]">
                    S/.{" "}
                    {(
                      order.lista_productos?.reduce((a, b) => a + b.precio, 0) +
                      parseFloat(order.delivery_precio)
                    ).toFixed(2)}
                  </p>
                </div>

                <div className="flex flex-col w-full gap-[10px]">
                  <button
                    onClick={() => showDetails(order)}
                    className="py-4 rounded-[15px] w-full bg-[#ffa600] text-white font-bold text-[20px] cursor-pointer hover:scale-[0.94] active:scale-[0.9] transition-all duration-300"
                  >
                    Ver Detalles
                  </button>
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}
