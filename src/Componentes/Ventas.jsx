import { IconSearch } from "@tabler/icons-react";
import { IconPlus } from "@tabler/icons-react";
import { IconChevronDown } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { IconQuestionMark } from "@tabler/icons-react";
import { IconX } from "@tabler/icons-react";
import { supabase } from "../../supabaseClient";
import { AnimatePresence, motion } from "framer-motion";
import { IconChevronLeft } from "@tabler/icons-react";
import { IconTrash } from "@tabler/icons-react";
import { IconCash } from "@tabler/icons-react";
import { IconQrcode } from "@tabler/icons-react";
import { IconCreditCardFilled } from "@tabler/icons-react";
import Pedidos from "./Pedidos";
import Caja from "./Caja";
import { useUser } from "../supComponentes/UserContext";

export default function Ventas() {
  const { userData, loading } = useUser();

  useEffect(() => {
  const run = async () => {
    if (!userData?.sucursal_id || !userData?.sucursal_nombre) return;

    const today = new Date().toLocaleDateString('en-CA');
    const lastLoginDate = localStorage.getItem("lastLoginDate");

    if (lastLoginDate && lastLoginDate !== today) {
      const efectivo = parseFloat(localStorage.getItem("efectivo") || "0");
      const yapePlin = parseFloat(localStorage.getItem("yape/plin") || "0");
      const tarjeta = parseFloat(localStorage.getItem("tarjeta") || "0");
      const total = efectivo + yapePlin + tarjeta;

      await guardarVentasAntriores({
        fecha: lastLoginDate,
        sucursal_id: userData.sucursal_id,
        total,
        sucursal_nombre: userData.sucursal_nombre
      });

      localStorage.setItem("efectivo", "0");
      localStorage.setItem("yape/plin", "0");
      localStorage.setItem("tarjeta", "0");
      localStorage.setItem("pedidos", JSON.stringify([]));
      localStorage.setItem("movimientos", JSON.stringify([]));
      localStorage.setItem("gastos", JSON.stringify([]));
      const sucId = userData?.sucursal_id

      await resetGanancias(sucId);
    }

    localStorage.setItem("lastLoginDate", today);

  };

  run();
}, [userData]);

const resetGanancias = async (sucursalId) => {
  const { error } = await supabase
    .from('ganancias')
    .update({ total_ganancia: 0 })
    .eq('sucursal_id', sucursalId)

  if (error) {
    console.error('error al resetear ganancias', error.message);
  }
};


  async function guardarVentasAntriores({ fecha, sucursal_id, total, sucursal_nombre }) {
    const { error } = await supabase.from("ventas_diarias").insert({
      fecha,
      sucursal_id,
      total_ganancia: total,
      sucursal_name: sucursal_nombre,
    });

    if (error) {
      console.error("Error al Guardar Ventas", error.message);
    } else {
      console.log("ventas anteriores guardadas correctamente");
      alert("ventas anteriores guardadas correctamente");
    }
  }

  const [currencyMenu, setCurrencyMenu] = useState(false);
  const toggleCurrencyMenu = () => {
    setCurrencyMenu((prev) => !prev);
  };
  const [categoryMenu, setCategoryMenu] = useState(false);
  const toggleCategoryMenu = () => {
    setCategoryMenu((prev) => !prev);
  };

  const [tooltip, setTooltip] = useState(false);
  const toggleTooltip = () => {
    setTooltip((prev) => !prev);
  };

  const [price, setPrice] = useState("");

  const handleBlur = () => {
    const normalized = price.replace(",", ".").replace(/[^0-9.]/g, "");
    const num = parseFloat(normalized);

    if (!isNaN(num)) {
      const formated = new Intl.NumberFormat("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(num);
      setPrice(formated);
    } else {
      setPrice("");
    }
  };

  const [currency, setCurrency] = useState("S/.");
  const [category, setCategory] = useState("Elige una Categoría");
  const [ammount, setAmmount] = useState(1);
  // const [connection, setConnection] = useState('')
  const [connectionMenu, setConnectionMenu] = useState("");
  const [addProductMenu, setAddProductMenu] = useState(false);
  const toggleAddProductMenu = () => {
    setAddProductMenu((prev) => !prev);
  };

  function handleConnectionMenu(e) {
    setConnectionMenu(e.target.value);
  }

  // Data fetch

  const [items, setItems] = useState([]);

  async function fetchInventario() {
    const { data, error } = await supabase.from("inventario").select("*");

    if (error) {
      console.error("error al obtener el inventario", error);
    } else {
      console.log("Inventario obtenido exitosamente", data);
      setItems(data);
    }
  }

  const [selectedItems, setSelectedItems] = useState([]);

  const handleItemClick = (item) => {
    const parsedAmount = Number(ammount) || 1;

    setSelectedItems((prevItems) => {
      const existingItemIndex = prevItems.findIndex(
        (i) => i.uuid === item.uuid
      );

      if (existingItemIndex !== -1) {
        const updatedItems = [...prevItems];
        updatedItems[existingItemIndex] = {
          ...updatedItems[existingItemIndex],
          cantidad: updatedItems[existingItemIndex].cantidad + parsedAmount,
        };
        return updatedItems;
      } else {
        return [...prevItems, { ...item, cantidad: parsedAmount }];
      }
    });

    setConnectionMenu("");
  };

  const handleRemoveItem = (uuid) => {
    setSelectedItems((prevItems) =>
      prevItems.filter((item) => item.uuid !== uuid)
    );
  };

  useEffect(() => {
    fetchInventario();
  }, []);

  // add functionality

  const [productName, setProductName] = useState("");

  async function createProduct() {
    if (!productName || !price || category === "Elige una Categoría") {
      alert("Faltan campos obligatorios.");
      return;
    }

    const { data: producto, error: productoError } = await supabase
      .from("productos")
      .insert([
        {
          nombre: productName,
          precio: parseFloat(price.replace(".", ",").replace(",", ".")),
          moneda: currency,
          categoria: category,
          sucursal_id: userData.sucursal_id,
          sucursal_nombre: userData.sucursal_nombre,
          cantidad: 1,
        },
      ])
      .select()
      .single();

    if (productoError) {
      console.error("error al crear producto", productoError);
      return;
    }

    if (selectedItems.length > 0) {
      const relaciones = selectedItems.map((item) => ({
        producto_id: producto.id,
        inventario_id: item.uuid,
        cantidad: item.cantidad,
      }));

      const { error: relacionError } = await supabase
        .from("producto_inventario")
        .insert(relaciones);

      if (relacionError) {
        console.error(
          "error al conectar producto al inventario",
          relacionError
        );
      }
    }

    alert("producto creado con exito");
    resetFormulario();
    fetchProductos(userData.sucursal_id);
  }

  function resetFormulario() {
    setProductName("");
    setPrice("");
    setCategory("Elige una Categoría");
    setCurrency("S/.");
    setSelectedItems([]);
    setConnectionMenu("");
    setAmmount(1);
    toggleAddProductMenu();
    setSucursal("Elige una Sucursal");
  }

  const formatPrice = (value) => {
    if (typeof value !== "number") return "";
    return value.toFixed(2).replace(",", ".");
  };

  const [products, setProducts] = useState([]);

  async function fetchProductos(sucursal_id) {
    const { data, error } = await supabase
      .from("productos")
      .select("*")
      .eq("sucursal_id", sucursal_id);

    if (error) {
      console.error("error al mostrar productos", error);
    } else {
      console.log("exito al mostrar productos", data);
      setProducts(data);
    }
  }

  useEffect(() => {
    if (userData?.sucursal_id) {
      fetchProductos(userData.sucursal_id);
    }
  }, [userData]);

  //

  const [nameFilter, setNameFilter] = useState("");
  const [selectedCategories, setSelectedCategories] = useState([]);
  const toggleCategory = (category) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };
  const filteredProducts = products.filter((product) => {
    const matchesName = product.nombre
      .toLowerCase()
      .includes(nameFilter.toLowerCase());
    const matchesCategory =
      selectedCategories.length === 0 ||
      selectedCategories.includes(product.categoria);

    return matchesCategory && matchesName;
  });

  //

  const precioExtras = {
    Chorizo: 4.0,
    Tocino: 2.0,
    Queso: 2.0,
    Huevo: 2.0,
    Piña: 2.0,
  };

  const [selectedProducts, setSelectedProducts] = useState([]);

  const selectProducts = (product) => {
    const productWithSelections = {
      ...product,
      precioBase: product.precio,
      precio: product.precio,
      vegetalesSeleccionados: [],
      salsasSeleccionadas: [],
      extrasSeleccionados: [],
      isPromotion: false,
    };
    setSelectedProducts((prev) => [...prev, productWithSelections]);
  };

  const toggleItem = (productoIndex, tipo, valor) => {
    setSelectedProducts((prev) =>
      prev.map((producto, index) => {
        if (index !== productoIndex) return producto;

        const listaActual = producto[tipo] || [];
        const nuevaLista = listaActual.includes(valor)
          ? listaActual.filter((item) => item !== valor)
          : [...listaActual, valor];

        const extrasSeleccionados =
          tipo === "extrasSeleccionados"
            ? nuevaLista
            : producto.extrasSeleccionados || [];

        const sumaExtras = extrasSeleccionados.reduce(
          (acc, item) => acc + (precioExtras[item] || 0),
          0
        );

        const nuevoPrecio = producto.isPromotion
          ? sumaExtras
          : producto.precioBase + sumaExtras;

        return {
          ...producto,
          [tipo]: nuevaLista,
          precio: nuevoPrecio,
        };
      })
    );
  };

  const togglePromotion = (productoIndex) => {
    setSelectedProducts((prev) =>
      prev.map((producto, index) => {
        if (index !== productoIndex) return producto;

        const nuevaPromocion = !producto.isPromotion;
        const extrasSeleccionados = producto.extrasSeleccionados || [];
        const sumaExtras = extrasSeleccionados.reduce(
          (acc, item) => acc + (precioExtras[item] || 0),
          0
        );
        const nuevoPrecio = nuevaPromocion
          ? sumaExtras
          : producto.precioBase + sumaExtras;

        return {
          ...producto,
          isPromotion: nuevaPromocion,
          precio: nuevoPrecio,
        };
      })
    );
  };

  const subtotal = selectedProducts.reduce(
    (total, product) => total + parseFloat(product.precio),
    0
  );

  const deleteSelectedProduct = (index) => {
    setSelectedProducts((prev) => prev.filter((_, i) => i !== index));
  };

  //

  const [orderSummary, setOrderSummary] = useState(false);
  const toggleOrderMenu = () => {
    setOrderSummary((prev) => !prev);
  };

  const [orderItem, setOrderItem] = useState([]);
  const deployOrderItemMenu = (index) => {
    setOrderItem((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  const [orderType, setOrderType] = useState("Para llevar");

  const [deliveryPrice, setDeliveryPrice] = useState("");

  const handleBlurDelivery = () => {
    const normalized = deliveryPrice.replace(",", ".").replace(/[^0-9.]/g, "");
    const num = parseFloat(normalized);

    if (!isNaN(num)) {
      const formated = new Intl.NumberFormat("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(num);
      setDeliveryPrice(formated);
    } else {
      setDeliveryPrice("");
    }
  };

  const totalProductos = selectedProducts.reduce((acc, p) => acc + p.precio, 0);

  const delivery = parseFloat(deliveryPrice.replace(",", "."));

  const totalConDelivery = totalProductos + (isNaN(delivery) ? 0 : delivery);

  const [notes, setNotes] = useState("");
  const [clientName, setClientName] = useState("");

  const [paymentMenu, setPaymentMenu] = useState(false);
  const togglePaymentMenu = () => {
    if (selectedProducts.length > 0) {
      setPaymentMenu((prev) => !prev);
    }
  };

  const categorias = [
    "Hamburguesas",
    "Salchipapas",
    "Sandwiches",
    "Bebidas",
    "Empanadas",
  ];

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
  const vuelto = Number(totalPagado - totalConDelivery);

  //

  const [sellWindow, setSellWindow] = useState("Productos");

  //

  const [pedidos, setPedidos] = useState([]);

  useEffect(() => {
    const data = localStorage.getItem("pedidos");
    if (data) {
      setPedidos(JSON.parse(data));
    }
  }, []);

  const saveOrder = (newOrder) => {
    const updated = [...pedidos, newOrder];

    setPedidos(updated);
    localStorage.setItem("pedidos", JSON.stringify(updated));
  };

  const numeroRandom = Math.floor(Math.random() * 1000);
  const idUnico = numeroRandom.toString().padStart(3, "0");

  const handleOrder = () => {
    const pedido = {
      id: idUnico,
      nombre: clientName !== "" ? clientName : "Sin Nombre",
      fecha: new Date().toISOString(),
      total_precio: totalConDelivery,
      pay_confirm: true,
      pay_method_1: ammountPayed1 ? "Efectivo" : "",
      pay_method_2: ammountPayed2 ? "Yape/Plin" : "",
      pay_method_3: ammountPayed3 ? "Tarjeta" : "",
      lista_productos: selectedProducts,
      delivery_precio: deliveryPrice === "" ? 0 : deliveryPrice,
      tipo_pedido: orderType,
      efectivo: ammountPayed1 > 0 ? parseFloat(ammountPayed1) - vuelto : 0,
      yape: ammountPayed2 > 0 ? parseFloat(ammountPayed2) - vuelto : 0,
      tarjeta: ammountPayed3 > 0 ? parseFloat(ammountPayed3) - vuelto : 0,
      notas: notes,
    };

    saveOrder(pedido);

    descontarInsumosPorProductos(pedido.lista_productos);

    setOrderType("Para llevar");
    setPaymentMenu(false);
    setOrderSummary(false);
    setSelectedProducts([]);
    setDeliveryPrice("");
    setClientName("");
    setNotes("");
    setAmmountPayed1("");
    setAmmountPayed2("");
    setAmmountPayed3("");
    setPaymentMenu("");
    setCashMethod(false);
    setEWalletMethod(false);
    setCardMethod(false);

    updateCaja(pedido.efectivo, pedido.yape, pedido.tarjeta);

    const move = {
      fecha: pedido.fecha,
      monto_pagado: pedido.efectivo + pedido.yape + pedido.tarjeta - vuelto,
      numero_pedido: pedido.id,
      tipo_pago: `Pedido #${pedido.id}`,
      m_efectivo: pedido.efectivo > 0 ? "Efectivo" : null,
      m_yape: pedido.yape > 0 ? "Yape/Plin" : null,
      m_tarjeta: pedido.tarjeta > 0 ? "Tarjeta" : null,
      q_efe: pedido.efectivo,
      q_yape: pedido.yape,
      q_tar: pedido.tarjeta,
      ing_eg: true,
      reason: null,
      nombre: pedido.nombre,
    };

    guardarMovimiento(move);

    const gananciaVenta = parseFloat(
      pedido.efectivo + pedido.yape + pedido.tarjeta - vuelto
    );
    const sucursalId = userData.sucursal_id;
    const sucursalNombre = userData.sucursal_nombre;

    if (sucursalId) {
      actualizarGanancia(gananciaVenta, sucursalId, sucursalNombre);
    }

    // IMPRIMIR TICKET DE VENTA

    function generarTicketVenta(pedido) {
      const fechaHora = new Date(pedido.fecha).toLocaleString("es-PE", {
        dateStyle: "medium",
        timeStyle: "short",
      });

      const productosFormateados = pedido.lista_productos
        .map((prod) => {
          const item = [
            {
              columns: [
                { text: prod.nombre, fontSize: 10, width: "*", bold: true },
                {
                  text: `S/. ${prod.precio.toFixed(2)}`,
                  fontSize: 10,
                  alignment: "right",
                },
              ],
              margin: [0, 0, 0, 2],
            },
          ];

          if (prod.extrasSeleccionados && prod.extrasSeleccionados.length > 0) {
            item.push({
              ul: prod.extrasSeleccionados.map((extra) => `${extra} extra`),
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

      if (pedido.pay_method_1) {
        metodosPago.push({
          columns: [
            { text: pedido.pay_method_1, fontSize: 10 },
            {
              text: `S/. ${pedido.efectivo?.toFixed(2) || "0.00"}`,
              fontSize: 10,
              alignment: "right",
            },
          ],
        });
      }
      if (pedido.pay_method_2) {
        metodosPago.push({
          columns: [
            { text: pedido.pay_method_2, fontSize: 10 },
            {
              text: `S/. ${pedido.yape?.toFixed(2) || "0.00"}`,
              fontSize: 10,
              alignment: "right",
            },
          ],
        });
      }
      if (pedido.pay_method_3) {
        metodosPago.push({
          columns: [
            { text: pedido.pay_method_3, fontSize: 10 },
            {
              text: `S/. ${pedido.tarjeta?.toFixed(2) || "0.00"}`,
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
            text: `PEDIDO #${pedido.id}`,
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
            text: `Cliente: ${pedido.nombre}`,
            fontSize: 10,
            alignment: "center",
            margin: [0, 0, 0, 10],
          },

          { text: "Productos:", style: "subheader", margin: [0, 0, 0, 4] },
          ...productosFormateados,

          ...(pedido.delivery_precio
            ? [
                {
                  columns: [
                    { text: "Delivery", fontSize: 10 },
                    {
                      text: `S/. ${parseFloat(pedido.delivery_precio).toFixed(
                        2
                      )}`,
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
            text: `TOTAL: S/. ${pedido.total_precio.toFixed(2)}`,
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

    generarTicketVenta(pedido);
  };

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

  const handleOrderWithoutPay = () => {
    const pedido = {
      id: idUnico,
      nombre: clientName !== "" ? clientName : "Sin Nombre",
      fecha: new Date().toISOString(),
      total_precio: totalConDelivery,
      pay_confirm: false,
      pay_method_1: ammountPayed1 ? "Efectivo" : "",
      pay_method_2: ammountPayed2 ? "Yape/Plin" : "",
      pay_method_3: ammountPayed3 ? "Tarjeta" : "",
      lista_productos: selectedProducts,
      delivery_precio: deliveryPrice === "" ? 0 : deliveryPrice,
      tipo_pedido: orderType,
      efectivo: ammountPayed1 > 0 ? parseFloat(ammountPayed1) : 0,
      yape: ammountPayed2 > 0 ? parseFloat(ammountPayed2) : 0,
      tarjeta: ammountPayed3 > 0 ? parseFloat(ammountPayed3) : 0,
    };

    saveOrder(pedido);

    descontarInsumosPorProductos(pedido.lista_productos);

    setOrderType("Para llevar");
    setPaymentMenu(false);
    setOrderSummary(false);
    setSelectedProducts([]);
    setDeliveryPrice("");
    setClientName("");
    setNotes("");
    setAmmountPayed1("");
    setAmmountPayed2("");
    setAmmountPayed3("");
    setPaymentMenu("");
    setCashMethod(false);
    setEWalletMethod(false);
    setCardMethod(false);

    updateCaja(pedido.efectivo, pedido.yape, pedido.tarjeta);

    const move = {
      fecha: pedido.fecha,
      monto_pagado: pedido.efectivo + pedido.yape + pedido.tarjeta - vuelto,
      numero_pedido: pedido.id,
      tipo_pago: `Pago Pendiente #${pedido.id}`,
      m_efectivo: pedido.efectivo > 0 ? "Efectivo" : null,
      m_yape: pedido.yape > 0 ? "Yape/Plin" : null,
      m_tarjeta: pedido.tarjeta > 0 ? "Tarjeta" : null,
      q_efe: pedido.efectivo - vuelto,
      q_yape: pedido.yape - vuelto,
      q_tar: pedido.tarjeta,
      ing_eg: true,
      reason: "",
    };

    guardarMovimiento(move);
  };

  //

  const [efectivo, setEfectivo] = useState(() => {
    const valorGuardado = localStorage.getItem("efectivo");
    return valorGuardado !== null ? JSON.parse(valorGuardado) : 0;
  });
  const [yapePlin, setYapePlin] = useState(() => {
    const valorGuardado = localStorage.getItem("yape/plin");
    return valorGuardado !== null ? JSON.parse(valorGuardado) : 0;
  });
  const [tarjeta, setTarjeta] = useState(() => {
    const valorGuardado = localStorage.getItem("tarjeta");
    return valorGuardado !== null ? JSON.parse(valorGuardado) : 0;
  });

  function updateCaja(efe, yap, tarj) {
    efe > 0 ? setEfectivo(efectivo + efe - vuelto) : null;
    yap > 0 ? setYapePlin(yapePlin + yap - vuelto) : null;
    tarj > 0 ? setTarjeta(tarjeta + tarj - vuelto) : null;
  }

  //

  const [movimientos, setMovimientos] = useState([]);

  useEffect(() => {
    const data = localStorage.getItem("movimientos");
    if (data) {
      setMovimientos(JSON.parse(data));
    }
  }, []);

  function guardarMovimiento(nuevoMovimiento) {
    const updated = [...movimientos, nuevoMovimiento];

    setMovimientos(updated);
    localStorage.setItem("movimientos", JSON.stringify(updated));
  }

  //

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

  //

  const [sucursales, setSucursales] = useState([]);
  const [sucursal, setSucursal] = useState("Elige una Sucursal");
  const [sucursalId, setSucursalId] = useState();
  const [sucursalesMenu, setSucursalesMenu] = useState(false);
  const toggleSucursalMenu = () => {
    setSucursalesMenu((prev) => !prev);
  };

  async function fetchSucursales() {
    const { error, data } = await supabase.from("sucursales").select("*");

    if (error) {
      console.error("error al obtener sucursales", error);
    } else {
      console.log("sucursales obtenidas exitosamente", data);
      setSucursales(data);
    }
  }

  useEffect(() => {
    fetchSucursales();
  }, []);

  if (loading || !userData) {
    return (
      <div className="h-screen flex flex-col items-center justify-center px-3"></div>
    );
  }

  if (userData.rol === "administrador" || userData.rol === "Administrador") {
    return (
      <div className="h-screen flex flex-col items-center justify-center px-3 md:pl-[300px]">
        <p className="text-[30px] font-bold text-[#707070]">
          Usuario no Autorizado
        </p>
        <p className="text-[20px] text-center text-[#707070]">
          Solo los Empleados tienen acceso a esta sección.
        </p>
      </div>
    );
  }

  if (userData.rol === "Empleado") {
    return (
      <div className="size-full p-[15px_20px] relative flex flex-col itmes-center md:py-[15px] md:pl-[300px] md:pr-[20px]">
        <div className="flex gap-[10px] items-center mt-2 mb-10 w-full">
          <button
            onClick={() => setSellWindow("Productos")}
            className={`w-full border-3 ${
              sellWindow === "Productos"
                ? "border-[#ffa600] bg-[#ffa600] text-white"
                : "border-[#e0e0e0] bg-[#eeeeee]"
            } py-2 rounded-[10px] text-[20px] font-bold transition-all ease-in-out duration-200 cursor-pointer hover:border-[#ffa600]`}
          >
            Productos
          </button>
          <button
            onClick={() => setSellWindow("Pedidos")}
            className={`w-full border-3 ${
              sellWindow === "Pedidos"
                ? "border-[#ffa600] bg-[#ffa600] text-white"
                : "border-[#e0e0e0] bg-[#eeeeee]"
            } py-2 rounded-[10px] text-[20px] font-bold transition-all ease-in-out duration-200 cursor-pointer hover:border-[#ffa600]`}
          >
            Pedidos
          </button>
          <button
            onClick={() => setSellWindow("Caja")}
            className={`w-full border-3 ${
              sellWindow === "Caja"
                ? "border-[#ffa600] bg-[#ffa600] text-white"
                : "border-[#e0e0e0] bg-[#eeeeee]"
            } py-2 rounded-[10px] text-[20px] font-bold transition-all ease-in-out duration-200 cursor-pointer hover:border-[#ffa600]`}
          >
            Caja
          </button>
        </div>

        <div
          className={`z-101 p-[50px_20px_15px_20px] w-full max-h-[85%] ${
            addProductMenu
              ? "bottom-0 opacity-100"
              : "bottom-[-100%] opacity-0 pointer-events-none"
          } rounded-t-[50px] fixed bottom-0 left-0 md:max-w-[700px] md:right-0 md:mx-auto bg-white flex flex-col justify-between items-center transition-all ease-in-out duration-500`}
        >
          <h2 className="text-center absolute top-[-20px] bg-[#ffa600] text-white text-[30px] font-[800] p-[5px_10px] rounded-[20px] shadow-[0_20px_30px_#ffa60025]">
            Nuevo Producto
          </h2>

          <div className="w-full flex flex-col gap-[10px]">
            <div>
              <p className="font-bold text-[23px]">Nombre del Producto</p>
              <input
                type="text"
                placeholder="Nombre"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                className="p-[10px_20px] border-2 border-[#00000030] rounded-[10px] w-full"
              />
            </div>

            <div>
              <p className="font-bold text-[23px]">Precio</p>
              <div className="flex gap-[10px]">
                <div
                  onClick={toggleCurrencyMenu}
                  className="overflow-visible flex items-center p-[10px_8px] w-[80px] justify-between border-2 border-[#00000030] rounded-[10px] relative"
                >
                  {currency} <IconChevronDown stroke={2} size={20} />
                  <ul
                    className={`z-10 absolute ${
                      currencyMenu
                        ? "max-h-[100px] opacity-100"
                        : "max-h-0 opacity-0 pointer-events-none"
                    } w-full overflow-y-auto left-0 top-[50px] bg-white shadow-[0_10px_20px_#00000020] p-[8px_10px] flex flex-col gap-[10px] rounded-[10px] transition-all ease-in-out duration-200 overflow-hidden`}
                  >
                    <li
                      onClick={() => setCurrency("S/.")}
                      className="p-[5px] text-center hover:bg-[#ffa60010] rounded-[8px] transition-all ease-in-out duration-200"
                    >
                      S/
                    </li>
                  </ul>
                </div>

                <input
                  type="text"
                  placeholder="Precio"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  onBlur={handleBlur}
                  className="p-[10px_20px] border-2 border-[#00000030] rounded-[10px] w-full"
                />
              </div>
            </div>

            <div>
              <p className="font-bold text-[23px]">Categoría</p>
              <div className="flex gap-[10px]">
                <div
                  onClick={toggleCategoryMenu}
                  className="overflow-visible flex items-center p-[10px_8px] w-full justify-between border-2 border-[#00000030] rounded-[10px] relative"
                >
                  {category} <IconChevronDown stroke={2} size={20} />
                  <ul
                    className={`z-10 absolute ${
                      categoryMenu
                        ? "max-h-[150px] opacity-100"
                        : "max-h-0 opacity-0 pointer-events-none"
                    } w-full overflow-y-auto left-0 top-[50px] bg-white shadow-[0_10px_20px_#00000020] p-[8px_10px] flex flex-col gap-[10px] rounded-[10px] transition-all ease-in-out duration-200 overflow-hidden`}
                  >
                    <li
                      onClick={() => setCategory("Hamburguesas")}
                      className="p-[5px] hover:bg-[#ffa60010] rounded-[8px] transition-all ease-in-out duration-200"
                    >
                      Hamburguesas
                    </li>
                    <li
                      onClick={() => setCategory("Salchipapas")}
                      className="p-[5px] hover:bg-[#ffa60010] rounded-[8px] transition-all ease-in-out duration-200"
                    >
                      Salchipapas
                    </li>
                    <li
                      onClick={() => setCategory("Sandwiches")}
                      className="p-[5px] hover:bg-[#ffa60010] rounded-[8px] transition-all ease-in-out duration-200"
                    >
                      Sandwiches
                    </li>
                    <li
                      onClick={() => setCategory("Empanadas")}
                      className="p-[5px] hover:bg-[#ffa60010] rounded-[8px] transition-all ease-in-out duration-200"
                    >
                      Empanadas
                    </li>
                    <li
                      onClick={() => setCategory("Bebidas")}
                      className="p-[5px] hover:bg-[#ffa60010] rounded-[8px] transition-all ease-in-out duration-200"
                    >
                      Bebidas
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div>
              <p className="font-bold text-[23px] flex gap-[8px]">
                Conectar al Inventario{" "}
                <IconQuestionMark
                  stroke={2}
                  size={15}
                  className="bg-[#00000020] rounded-[5px]"
                  onClick={toggleTooltip}
                />
              </p>
              <div
                onClick={toggleTooltip}
                className={`z-10 fixed max-w-[340px] mx-auto bg-[#eeeeee] border-4 border-[#ffa600] rounded-[20px] shadow-[0_0_30px_#00000060] left-0 right-0 ${
                  tooltip
                    ? "bottom-[50%] opacity-100 pointer-events-all"
                    : "bottom-[60%] opacity-0 pointer-events-none"
                } p-[20px] text-center transition-all ease-in-out duration-200`}
              >
                <h2 className="font-[800] text-[25px] mb-[10px]">
                  Conectar al Inventario
                </h2>
                <p className="font-bold text-[#1b1b1b90]">
                  Funciona para que un producto reste ciertos elementos del
                  inventario automaticamente. Si no es necesario, solo salte
                  este paso.
                </p>
                <br />
                <p className="font-bold text-[#1b1b1b90]">
                  Por Ejemplo, una hamburguesa restaría: Carne, Pan, Lechuga,
                  etc..
                </p>
              </div>

              <div className="relative">
                <div className="flex gap-[10px] flex-nowrap w-full">
                  <input
                    type="text"
                    onChange={handleConnectionMenu}
                    value={connectionMenu}
                    placeholder="Ej. Carne, Pan, Bolsa de Papel...."
                    className="w-full border-2 border-[#00000030] p-[10px_8px] rounded-[10px]"
                  />{" "}
                  <input
                    type="number"
                    value={ammount}
                    onChange={(e) => setAmmount(Number(e.target.value))}
                    min="1"
                    className="border-2 border-[#00000030] p-[10px_8px] rounded-[10px] text-center w-[50px]"
                  />
                </div>
                <ul
                  className={`z-10 absolute ${
                    connectionMenu.trim() !== ""
                      ? "max-h-[120px] opacity-100"
                      : "max-h-0 opacity-0 pointer-events-none"
                  } w-full overflow-y-auto left-0 top-[50px] bg-white shadow-[0_10px_20px_#00000020] p-[8px_10px] flex flex-col gap-[10px] rounded-[10px] transition-all ease-in-out duration-200 overflow-hidden`}
                >
                  {Array.isArray(items) &&
                  items.filter((item) =>
                    item.nombre
                      .toLowerCase()
                      .includes(connectionMenu.toLowerCase())
                  ).length > 0 ? (
                    items
                      .filter((item) =>
                        item.nombre
                          .toLowerCase()
                          .includes(connectionMenu.toLowerCase())
                      )
                      .map((item) => (
                        <li
                          onClick={() => handleItemClick(item)}
                          key={`${item.id}-${item.nombre}`}
                          className="p-[5px] hover:bg-[#ffa60010] rounded-[8px] transition-all ease-in-out duration-200 flex justify-between items-center px-2"
                        >
                          {item.nombre}
                          <p className="bg-[#ffa600] font-bold p-1 rounded-full text-[12px]">
                            {item.sucursal_nombre}
                          </p>
                        </li>
                      ))
                  ) : (
                    <li className="text-center text-gray-500 text-sm py-2">
                      No se encontraron resultados
                    </li>
                  )}
                </ul>
              </div>

              <div className="flex gap-[15px] flex-wrap w-full mt-[20px] overflow-y-auto max-h-[100px]">
                <AnimatePresence>
                  {selectedItems.map((item, index) => (
                    <motion.div
                      onClick={() => handleRemoveItem(item.uuid)}
                      key={index}
                      className="flex items-center bg-[#ffa600] p-[5px_10px] rounded-[20px] text-white font-bold transition-all ease-in-out duration-200"
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <IconX stroke={2} /> {item.nombre} x{item.cantidad}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          </div>

          <div className="flex gap-[15px] w-full p-[20px_0]">
            <button
              onClick={toggleAddProductMenu}
              className="p-[10px] w-full bg-gray-100 rounded-[10px] cursor-pointer"
            >
              Cancelar
            </button>
            <button
              onClick={createProduct}
              className="p-[10px] w-full bg-[#ffa600] font-[800] cursor-pointer text-white shadow-[0_20px_30px_#ffa60025] rounded-[10px]"
            >
              Crear Producto
            </button>
          </div>
        </div>

        {/* product container */}
        <div className="relative">
          <Pedidos window={sellWindow} orders={pedidos} />
          <Caja
            window={sellWindow}
            efectivo={efectivo}
            yapeplin={yapePlin}
            tarjeta={tarjeta}
            movimientos={movimientos}
          />

          <div
            className={`w-full absolute ${
              sellWindow === "Productos"
                ? "opacity-100 top-0"
                : "opacity-0 top-[100px] pointer-events-none"
            } left-0 flex gap-[20px] flex-wrap pb-[120px] justify-center transition-all ease-in-out duration-200 md:flex-col`}
          >
            <h2 className="text-[30px] font-bold text-center">Productos</h2>

            <div className="flex gap-[10px] items-center w-full">
              <IconSearch stroke={2} />
              <input
                type="text"
                placeholder="Buscar Procucto"
                value={nameFilter}
                onChange={(e) => setNameFilter(e.target.value)}
                className="outline-none border-2 border-[#00000020] w-full p-[8px] rounded-[20px] md:text-[18px]"
              />
            </div>

            <div className="flex gap-[10px] overflow-x-auto md:w-full">
              {categorias.map((categoria) => (
                <button
                  key={categoria}
                  onClick={() => toggleCategory(categoria)}
                  className={`font-bold text-[18px] px-2 py-1 border-[#ffa600] border-3 cursor-pointer hover:scale-[0.9] ${
                    selectedCategories.includes(categoria)
                      ? "bg-[#ffa600] text-white font-bold"
                      : "bg-none"
                  } rounded-full transition-all ease-in-out duration-200`}
                >
                  {categoria}
                </button>
              ))}
            </div>
            <div className="md:flex md:flex-wrap md:gap-[20px] md:w-full md:justify-start flex gap-[20px] flex-wrap justify-center w-full">
              {filteredProducts.map((prod) => (
                <div
                  key={prod.id}
                  className="overflow-hidden relative bg-[#ffa60090] p-[15px] w-[160px] h-[145px] rounded-[20px] active:scale-[0.9] transition-all ease-in-out duration-200 select-none cursor-pointer hover:scale-[0.94]"
                  onClick={() => {
                    selectProducts(prod);
                    setAddProductMenu(false);
                  }}
                >
                  <div className="absolute w-full h-[80px] bg-[#00000050] left-0 bottom-0 p-[10px]">
                    <p className="font-bold text-[15px] text-[#eeeeee]">
                      {prod.categoria}
                    </p>
                    <p className="font-[900] text-[#eeeeee] text-[27px] truncate">
                      {prod.moneda} {formatPrice(prod.precio)}
                    </p>
                  </div>
                  <h2 className="text-[25px] font-[900] text-center truncate capitalize">
                    {prod.nombre}
                  </h2>
                </div>
              ))}
              {/* add new product container */}
              <div
                onClick={toggleAddProductMenu}
                className="bg-[#e0e0e070] border-4 border-[#e0e0e0] flex flex-col items-center justify-center p-[15px] w-[160px] h-[145px] text-center font-bold rounded-[20px] active:scale-[0.9] transition-all ease-in-out duration-200 select-none cursor-pointer hover:scale-[0.94]"
              >
                <IconPlus stroke={2} size={60} className="text-[#26ce6c]" />
                Nuevo producto
              </div>
            </div>


            <div
              className={`z-10 fixed ${
                selectedProducts.length > 0
                  ? "bottom-[120px] md:bottom-[25px]"
                  : "bottom-0 opacity-0"
              } flex justify-end items-center w-full px-4 transition-all ease-in-out duration-300 md:left-auto md:right-0 md:pl-[300px] md:px-0`}
            >
              <div className="min-w-[400px] mx-auto p-[20px_15px] h-[90px] bg-[#eeeeee] border-3 border-[#00000020] shadow-[0_10px_25px_#00000020] rounded-[20px] flex items-center justify-between md:mx-0 md:mr-5 md:">
                <div>
                  <p className="md:font-bold md:text-[20px]">Subtotal:</p>
                  <p className="text-[30px] font-[800] truncate max-w-[170px] md:font-black">
                    S/.{" "}
                    {formatPrice(
                      selectedProducts.reduce((acc, p) => acc + p.precio, 0)
                    )}
                  </p>
                </div>
                <button
                  onClick={toggleOrderMenu}
                  className="text-black bg-[#ffa60095] font-[800] p-[10px_30px] text-[20px] rounded-[10px] transition-all ease-in-out duration-200 active:scale-[0.9] cursor-pointer hover:scale-[0.94] "
                >
                  Siguiente
                </button>
              </div>
            </div>
          </div>

          {/* select payment screen */}
          <div
            className={`fixed overflow-y-auto pb-[20px] z-102 top-0 ${
              paymentMenu ? "left-0" : "left-full"
            } bg-white size-full p-[10px_20px] transition-all ease-in-out duration-300`}
          >
            <div className="w-full flex gap-[15px] items-center mb-4">
              <button onClick={togglePaymentMenu}>
                <IconChevronLeft size={30} stroke={2} className="cursor-pointer" />
              </button>
              <h1 className="text-[28px]">Pago</h1>
            </div>

            <div className="w-full py-7 flex justify-center items-center md:py-0 md:pb-3">
              <div className="flex flex-col text-center">
                <p className="text-[20px] font-bold text-[#ffa600]">
                  Monto a Pagar:
                </p>
                <p className="text-[50px] font-[900]">
                  S/. {formatPrice(totalConDelivery)}
                </p>
              </div>
            </div>

            <div className="flex w-full gap-[10px] my-2 md:max-w-[700px] md:mx-auto">
              <button
                onClick={toggleCashMethod}
                className={`w-full px-2 py-1 flex flex-col items-center gap-[5px] font-bold text-[20px] border-4 hover:border-[#ffa600] cursor-pointer ${
                  cashMethod
                    ? "border-[#ffa600] bg-[#ffa600] text-white"
                    : "border-[#e0e0e0]"
                } rounded-[15px] transition-all ease-in-out duration-200 active:scale-[0.9]`}
              >
                <IconCash size={40} stroke={2} />
                Efectivo
              </button>
              <button
                onClick={toggleEWalletMethod}
                className={`w-full px-2 py-1 flex flex-col items-center gap-[5px] font-bold text-[20px] border-4 hover:border-[#ffa600] cursor-pointer ${
                  eWalletMethod
                    ? "border-[#ffa600] bg-[#ffa600] text-white"
                    : "border-[#e0e0e0]"
                } rounded-[15px] transition-all ease-in-out duration-200 active:scale-[0.9]`}
              >
                <IconQrcode size={40} stroke={2} />
                Yape/Plin
              </button>
              <button
                onClick={toggleCardMethod}
                className={`w-full px-2 py-1 flex flex-col items-center gap-[5px] font-bold text-[20px] border-4 hover:border-[#ffa600] cursor-pointer ${
                  cardMethod
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
                  S/. {vuelto >= 0 ? formatPrice(vuelto) : formatPrice(0)}
                </p>
              </div>
            </div>

            <div className="md:max-w-[700px] md:mx-auto">
              <button
                onClick={handleOrder}
                className={`py-4 rounded-[15px] w-full ${
                  totalPagado >= totalConDelivery
                    ? "bg-[#ffa600] cursor-pointer"
                    : "bg-[#e0e0e0] pointer-events-none"
                } text-white font-bold text-[20px]`}
              >
                Realizar Pedido
              </button>
            </div>
          </div>
          {/* create order screen */}
          <div
            className={`fixed overflow-y-auto pb-[20px] z-101 top-0 ${
              orderSummary ? "left-0 md:left-[50%]" : "left-full"
            } bg-white size-full p-[10px_20px] transition-all ease-in-out duration-300 md:h-full md:w-[50%]`}
          >
            <div className="w-full flex gap-[15px] items-center mb-4">
              <button onClick={toggleOrderMenu} className="cursor-pointer">
                <IconChevronLeft size={30} stroke={2} />
              </button>
              <h1 className="text-[28px]">Pedido</h1>
            </div>
            <div className="mb-7 flex gap-[10px] justify-between">
              <button
                onClick={() => setOrderType("Mesa")}
                className={`w-full py-2 text-[18px] border-3 cursor-pointer ${
                  orderType === "Mesa"
                    ? "border-[#ffa600] bg-[#ffa600] text-white"
                    : "border-[#e0e0e0]"
                } rounded-[10px] font-bold transition-all ease-in-out duration-200`}
              >
                Mesa
              </button>
              <button
                onClick={() => setOrderType("Para llevar")}
                className={`w-full py-2 text-[18px] border-3 cursor-pointer ${
                  orderType === "Para llevar"
                    ? "border-[#ffa600] bg-[#ffa600] text-white"
                    : "border-[#e0e0e0]"
                } rounded-[10px] font-bold transition-all ease-in-out duration-200`}
              >
                Para Llevar
              </button>
              <button
                onClick={() => setOrderType("delivery")}
                className={`w-full py-2 text-[18px] border-3 cursor-pointer ${
                  orderType === "delivery"
                    ? "border-[#ffa600] bg-[#ffa600] text-white"
                    : "border-[#e0e0e0]"
                } rounded-[10px] font-bold transition-all ease-in-out duration-200`}
              >
                Delivery
              </button>
            </div>
            <div className="flex flex-col gap-[20px] w-full transition-all ease-in-out duration-300">
              {selectedProducts.map((product, index) => (
                <div className="flex gap-[10px] w-full" key={index}>
                  <div className="flex items-center justify-between w-full">
                    <div
                      onClick={() => deployOrderItemMenu(index)}
                      className={`rounded-[10px] shadow-[0_0_20px_#00000015] p-4 w-full cursor-pointer ${
                        orderItem.includes(index)
                          ? "max-h-[730px]"
                          : "max-h-[85px]"
                      } overflow-hidden transition-all duration-300`}
                    >
                      <p className="text-[23px] font-bold">{product.nombre}</p>
                      <p className="text-[15px] text-[#8a8a8a] font-bold">
                        S/. {formatPrice(product.precio)}
                      </p>
                      <br />
                      <p className="mb-[5px] font-bold text-[20px]">
                        Vegetales
                      </p>
                      <ul className="flex flex-wrap gap-[15px]">
                        {[
                          "Sin Tomate",
                          "Sin Cebolla",
                          "Sin Lechuga",
                          "Sin Pickles",
                          "Sin Vegetales",
                          "Con Pickles",
                        ].map((vegetal) => (
                          <li key={vegetal}>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleItem(
                                  index,
                                  "vegetalesSeleccionados",
                                  vegetal
                                );
                              }}
                              className={`${
                                product.vegetalesSeleccionados.includes(vegetal)
                                  ? "border-[#ffa600] bg-[#ffa600] font-bold text-white"
                                  : "border-[#e0e0e0] bg-none"
                              } border-2 border-[#e0e0e0] rounded-[10px] py-1 px-2 transition-all ease-in-out duration-200 cursor-pointer`}
                            >
                              {vegetal}
                            </button>
                          </li>
                        ))}
                      </ul>
                      <br />
                      <p className="mb-[5px] font-bold text-[20px]">Salsas</p>
                      <ul className="flex flex-wrap gap-[15px]">
                        {[
                          "Mayonesa",
                          "Ketchup",
                          "Mostaza",
                          "Aceituna",
                          "Golf",
                          "Cilantro",
                          "Ajo",
                          "Ají",
                          "Chimichurri",
                        ].map((salsa) => (
                          <li key={salsa}>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleItem(index, "salsasSeleccionadas", salsa);
                              }}
                              className={`${
                                product.salsasSeleccionadas.includes(salsa)
                                  ? "border-[#ffa600] bg-[#ffa600] font-bold text-white"
                                  : "border-[#e0e0e0] bg-none"
                              } border-2 border-[#e0e0e0] rounded-[10px] py-1 px-2 transition-all ease-in-out duration-200 cursor-pointer`}
                            >
                              {salsa}
                            </button>
                          </li>
                        ))}
                      </ul>
                      <br />
                      <p className="mb-[5px] font-bold text-[20px]">Extras</p>
                      <ul className="flex flex-wrap gap-[15px]">
                        {["Chorizo", "Tocino", "Huevo", "Queso", "Piña"].map(
                          (extra) => (
                            <li key={extra}>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleItem(
                                    index,
                                    "extrasSeleccionados",
                                    extra
                                  );
                                }}
                                className={`${
                                  product.extrasSeleccionados.includes(extra)
                                    ? "border-[#ffa600] bg-[#ffa600] font-bold text-white"
                                    : "border-[#e0e0e0] bg-none"
                                } border-2 border-[#e0e0e0] rounded-[10px] py-1 px-2 transition-all ease-in-out duration-200 cursor-pointer`}
                              >
                                {extra}
                              </button>
                            </li>
                          )
                        )}
                      </ul>
                      <br />
                      <br />
                      <ul className="flex justify-center flex-wrap gap-[15px]">
                        <li>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              togglePromotion(index);
                            }}
                            className={`${
                              product.isPromotion
                                ? "border-[#ffa600] bg-[#ffa600] font-bold text-white"
                                : "border-[#e0e0e0] bg-none"
                            } border-2 border-[#e0e0e0] rounded-[10px] py-1 px-2 transition-all ease-in-out duration-200 cursor-pointer`}
                          >
                            Es Promocion
                          </button>
                        </li>
                      </ul>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteSelectedProduct(index);
                    }}
                    className="p-3 max-h-max rounded-[10px] bg-[#ff3333] shadow-[0_0_20px_#ff333350] text-white cursor-pointer transition-all duration-200 hover:bg-transparent hover:text-[#ff3333]"
                  >
                    <IconTrash size={30} stroke={2} />
                  </button>
                </div>
              ))}

              <div className="flex flex-col gap-[10px]">
                <p className="font-bold text-[25px]">Delivery</p>
                <input
                  type="text"
                  value={deliveryPrice}
                  onChange={(e) => setDeliveryPrice(e.target.value)}
                  onBlur={handleBlurDelivery}
                  placeholder="Precio del delivery"
                  className="w-full border-3 border-[#e0e0e0] text-[20px] rounded-[10px] py-2 px-3"
                />
                <p className="font-bold text-[25px]">Nombre del Cliente</p>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Nombre"
                  className="w-full border-3 border-[#e0e0e0] mb-[15px] text-[20px] rounded-[10px] py-2 px-3"
                />
                <textarea
                  className="resize-none w-full border-3 border-[#e0e0e0] text-[20px] rounded-[10px] py-2 px-3"
                  placeholder="Comentarios"
                  rows={4}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                ></textarea>
              </div>

              <div>
                <p className="text-[20px] font-bold">Total:</p>
                <p className="text-[40px] font-[900]">
                  S/. {formatPrice(totalConDelivery)}
                </p>
              </div>

              <div className="flex gap-[10px] justify-center w-full">
                <button
                  onClick={togglePaymentMenu}
                  className={`text-[23px] text-white w-full ${
                    selectedProducts.length > 0
                      ? "bg-[#ffa600]"
                      : "bg-[#e0e0e0] pointer-events-none"
                  } font-bold rounded-[15px] py-3 transition-all duration-200`}
                >
                  Continuar al Pago
                </button>
                <button
                  onClick={handleOrderWithoutPay}
                  className="hidden text-[20px] bg-[#ffa600] text-white font-bold rounded-[15px] py-3"
                >
                  Pago Pendiente
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
