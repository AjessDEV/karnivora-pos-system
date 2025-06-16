import { useEffect, useState } from "react";
import { IconChevronLeft } from "@tabler/icons-react";
import { IconPlus } from "@tabler/icons-react";
import { supabase } from "../../supabaseClient";
import { IconTrashOff } from "@tabler/icons-react";

import pdfMake from "pdfmake/build/pdfmake";
import "pdfmake/build/vfs_fonts";

export default function Pedidos({ orders, window }) {
  const formatPrice = (value) => {
    if (typeof value !== "number") return "";
    return value.toFixed(2).replace(",", ".");
  };

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

  const [newNote, setNewNote] = useState("");

  const [del, setDel] = useState(false);
  const toggleDelTab = () => {
    setDel((prev) => !prev);
  };

  // TODO: Boton para imprimir la comanda de nuevo

  const updateOrder = (updatedOrder) => {
    setOrders((prevOrders) =>
      prevOrders.map((order) =>
        order.id === updatedOrder.id ? updatedOrder : order
      )
    );
  };

  const onAgregarProductos = (nuevoProducto) => {
    if (!orderSelected) return;

    setOrderSelected((prev) => {
      if (!prev) return prev;

      const listaActual = prev.lista_productos || [];

      return {
        ...prev,
        lista_productos: [...listaActual, nuevoProducto],
      };
    });
  };

  const handleAdd = (prod) => {
    onAgregarProductos(prod);
  };

  return (
    <div
      className={`w-full absolute ${
        window === "Pedidos" ? "top-0 opacity-100" : "top-[100px] opacity-0"
      } left-0 flex flex-col gap-[20px] transition-all ease-in-out duration-200 pb-[100px]`}
    >
      <h2 className="text-[30px] font-bold mb-[10px] text-center">Pedidos</h2>

      <div
        className={`fixed top-0 z-101 ${
          show ? "left-0 md:left-[30%]" : "left-full"
        } size-full bg-white p-4 transition-all ease-in-out duration-300 overflow-y-auto md:h-full md:w-[70%]`}
      >
        {orderSelected && (
          <>
            <div className="w-full flex justify-between items-center mb-4">
              <div className="flex gap-[15px]">
                <button onClick={ocultarDetalles} className="cursor-pointer">
                  <IconChevronLeft size={30} stroke={2} />
                </button>
                <h1 className="text-[28px]">Pedido #{orderSelected.id}</h1>
              </div>

              <button
                onClick={toggleDelTab}
                className={`p-2 rounded-[10px] hidden ${
                  orderSelected.pay_confirm === true
                    ? "bg-[#e0e0e0] text-[#00000050] pointer-events-none"
                    : "bg-[#ff333330] text-[#ff3333]"
                } font-[800]`}
              >
                <IconTrashOff stroke={2} size={30} />
              </button>
            </div>

            <p className="font-bold text-[25px] my-4">Nombre: {`${orderSelected.nombre}`}</p>

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
                className={`flex gap-[10px] font-bold items-center justify-center w-full ${
                  orderSelected.pay_confirm === true ? "hidden" : "flex"
                } bg-[#ffa600] text-white text-[20px] rounded-[10px] py-3 active:bg-[#f59f00] transition-all ease-in-out duration-200 mt-2`}
              >
                <IconPlus stroke={3} /> Agregar Producto
              </button>
              <div className="relative hidden">
                <ul
                  className={`absolute top-0 left-0 w-full overflow-hidden overflow-y-auto bg-white rounded-[10px] shadow-[0_0_20px_#00000010] ${
                    addMenu ? "max-h-[250px]" : "max-h-0 opacity-0"
                  } mt-3 p-3 flex flex-col gap-3 transition-all ease-in-out duration-300`}
                >
                  {prods.map((prod) => {
                    return (
                      <li
                        key={prod.id}
                        onClick={() => {
                          handleAdd(prod);
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
                className={`fixed top-50 mx-auto left-0 right-0 bg-white rounded-[20px] max-w-[350px] shadow-[0_0_30px_#00000020] p-3 transition-all ease-in-out duration-300 ${
                  del ? "scale-100" : "scale-50 opacity-0 pointer-events-none"
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
                <br />
                <p className="text-center font-bold text-[#ff3333] text-[18px]">
                  Los insumos utilizados se deberán reponer en "INVENTARIO"
                </p>
                <div className="flex gap-3 mt-7">
                  <button
                    onClick={toggleDelTab}
                    className="rounded-[10px] w-full bg-[#ff333330] text-[#ff3333] text-[18px] font-bold py-3"
                  >
                    Cancelar
                  </button>
                  <button className="rounded-[10px] w-full bg-[#ff3333] text-white text-[18px] font-bold py-3">
                    Eliminar
                  </button>
                </div>
              </div>

              <textarea
                className="resize-none w-full hidden border-3 border-[#e0e0e0] text-[20px] rounded-[10px] py-2 px-3 mt-5"
                placeholder="Comentarios"
                rows={4}
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
              ></textarea>

              <div className="flex flex-col hidden items-start mt-4">
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
                  onClick={() => {
                    const fecha = new Date();
                    const hora = fecha.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    });
                    const cliente = orderSelected.nombre || "Cliente";

                    const productosFormateados =
                      orderSelected.lista_productos.map((prod, index) => {
                        const detalles = [];

                        if (prod.vegetalesSeleccionados?.length) {
                          detalles.push({
                            text: `• ${prod.vegetalesSeleccionados.join(", ")}`,
                            fontSize: 11,
                            margin: [0, 0, 0, 5],
                          });
                        }

                        if (prod.salsasSeleccionadas?.length) {
                          detalles.push({
                            text: `• Salsas: ${prod.salsasSeleccionadas.join(
                              ", "
                            )}`,
                            fontSize: 11,
                            margin: [0, 0, 0, 5],
                          });
                        }

                        if (prod.extrasSeleccionados?.length) {
                          detalles.push({
                            text: `• Extras: ${prod.extrasSeleccionados.join(
                              ", "
                            )}`,
                            fontSize: 11,
                            margin: [0, 0, 0, 5],
                          });
                        }

                        return {
                          stack: [
                            {
                              text: `${prod.nombre}`,
                              bold: true,
                              fontSize: 13,
                              margin: [0, 0, 0, 3],
                            },
                            ...detalles,
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

                    const docDefinition = {
                      pageSize: {
                        width: 165, // 58 mm
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
                      ],
                    };

                    pdfMake.createPdf(docDefinition).open();
                  }}
                  className="py-4 rounded-[10px] text-[20px] text-white font-bold bg-[#ffa600] cursor-pointer hover:bg-[#ffa60090] active:bg-[#ffa60090] transition-all duration-200"
                >
                  Imprimir Comanda
                </button>
                <button
                  className={`${
                    orderSelected.pay_confirm === true
                      ? "bg-[#e0e0e0] text-white pointer-events-none"
                      : "bg-[#ffa60030]"
                  } py-4 hidden rounded-[10px] text-[20px] text-[#ffa600] font-bold `}
                >
                  Confirmar Pago
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="flex flex-col gap-[25px] md:flex-row md:flex-wrap">
        {orders.slice().reverse().map((order) => {
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
                  <p className="font-bold text-[23px] capitalize">{order.nombre}</p>
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
                      className={`w-[10px] h-[10px] ${
                        order.pay_confirm === true
                          ? "bg-[#26ce6c]"
                          : "bg-[#ff3333]"
                      } rounded-full`}
                    ></div>
                    {order.pay_confirm === true ? "Pagado" : "No Pagado"}
                  </div>
                  <div className="flex gap-[5px] items-center flex-wrap justify-end">
                    <p
                      className={`${
                        order.pay_method_1 === "Efectivo" ? "block" : "hidden"
                      } uppercase text-end font-bold py-1 px-2 bg-[#00000010] rounded-full text-[15px] md:text-[11px] md:px-1 md:py-0.5`}
                    >
                      Efectivo
                    </p>
                    <p
                      className={`${
                        order.pay_method_2 === "Yape/Plin" ? "block" : "hidden"
                      } uppercase text-end font-bold py-1 px-2 bg-[#00000010] rounded-full text-[15px] md:text-[11px] md:px-1 md:py-0.5`}
                    >
                      Yape/Plin
                    </p>
                    <p
                      className={`${
                        order.pay_method_3 === "Tarjeta" ? "block" : "hidden"
                      } uppercase text-end font-bold py-1 px-2 bg-[#00000010] rounded-full text-[15px] md:text-[11px] md:px-1 md:py-0.5`}
                    >
                      Tarjeta
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <div className="font-[700] text-[#707070]">{fechaLegible}</div>
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
