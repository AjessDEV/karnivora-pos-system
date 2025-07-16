import { IconAdjustmentsHorizontal } from "@tabler/icons-react";
import { IconPlus } from "@tabler/icons-react";
import { IconChevronDown } from "@tabler/icons-react";
import { IconCheck } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";
import { useUser } from "../supComponentes/UserContext";

export default function Inventario() {
  const { userData, loading } = useUser();

  const [storesMenu, setStoresMenu] = useState(false);
  const toggleStoresMenu = () => {
    setStoresMenu((prev) => !prev);
  };
  const [store, setStore] = useState("Todas");
  const [storeId, setStoreId] = useState("");

  const [typeMenu, setTypeMenu] = useState(false);
  const toggleTypeMenu = () => {
    setTypeMenu((prev) => !prev);
  };
  const [type, setType] = useState("Todos");

  const [missingCheckbox, setMissingCheckbox] = useState(false);
  const toggleMissingCheckbox = () => {
    setMissingCheckbox((prev) => !prev);
  };

  const [storesAddMenu, setStoresAddMenu] = useState(false);
  const toggleStoresAddMenu = () => {
    setStoresAddMenu((prev) => !prev);
  };
  const [storeAdd, setStoreAdd] = useState("Todas");
  const [storeAddId, setStoreAddId] = useState("");

  const [typeAddMenu, setTypeAddMenu] = useState(false);
  const toggleTypeAddMenu = () => {
    setTypeAddMenu((prev) => !prev);
  };
  const [typeAdd, setTypeAdd] = useState("Todos");

  const [unitAddMenu, setUnitAddMenu] = useState(false);
  const toggleUnitAddMenu = () => {
    setUnitAddMenu((prev) => !prev);
  };
  const [unit, setUnit] = useState("Unid.");

  const [itemMenu, setItemMenu] = useState(null);

  // add button
  const [addMenu, setAddMenu] = useState(false);
  const toggleAddMenu = () => {
    setAddMenu((prev) => !prev);
  };
  // filter button
  const [filterMenu, setFilterMenu] = useState(false);
  const toggleFilterMenu = () => {
    setFilterMenu((prev) => !prev);
  };

  // supabase

  const [sucursales, setSucursales] = useState([]);

  useEffect(() => {
    fetchSucursales();
  }, []);

  async function fetchSucursales() {
    const { data, error } = await supabase.from("sucursales").select("*");

    if (error) {
      console.log("error al obtener sucursales:", error);
    } else {
      setSucursales(data);
      console.log("exito al obtener las sucursales:", data);
    }
  }

  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState(0);
  const [stockIdeal, setStockIdeal] = useState(0);

  async function addItemToInventory() {
    if (!name || quantity <= 0 || stockIdeal <= 0 || !storeAddId) {
      alert("Por favor, completa todos los campos");
      return;
    }

    const { data, error } = await supabase.from("inventario").insert([
      {
        nombre: name,
        cantidad: quantity,
        stock_ideal: stockIdeal,
        sucursal_id: storeAddId,
        tipo: typeAdd,
        unidad_medida: unit,
        sucursal_nombre: storeAdd,
      },
    ]);

    if (error) {
      console.error("Error al agregar el producto:", error);
    } else {
      fetchInventario();
      setAddMenu(false);
    }
  }

  const [items, setItems] = useState([]);

  useEffect(() => {
    fetchInventario();
  }, []);

  async function fetchInventario() {
    let query = supabase.from("inventario").select("*");

    if (storeId) {
      query = query.eq("sucursal_id", storeId);
    }

    if (type !== "Todos") {
      query = query.eq("tipo", type);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error al Obtener el Inventario:", error);
      setItems([]);
    } else {
      let filteredItems = data || [];

      if (missingCheckbox) {
        filteredItems = filteredItems.filter((item) => {
          const porcentaje = item.cantidad / item.stock_ideal;
          return porcentaje <= 0.2;
        });
      }
      setItems(filteredItems);
    }
  }

  const [increaseMenu, setIncreaseMenu] = useState(false);
  const toggleIncreaseMenu = () => {
    setIncreaseMenu((prev) => !prev);
  };

  const [newQuantity, setNewQuantity] = useState("");

  const updateQuantity = async (item) => {
    const floatQuantity = parseFloat(newQuantity);

    if (isNaN(floatQuantity)) {
      alert("inserta un numero valido");
      return;
    }

    const quantityNew = item.cantidad + floatQuantity;

    const { data, error } = await supabase
      .from("inventario")
      .update({ cantidad: quantityNew })
      .eq("uuid", item.uuid);

    if (error) {
      console.error("hubo un error", error);
    } else {
      console.log("Aumento exitoso", data);

      fetchInventario();
      setIncreaseMenu(null);
      setNewQuantity("");
    }
  };

  //

  const [decreaseMenu, setDecreaseMenu] = useState(false);
  const toggleDecreaseMenu = () => {
    setDecreaseMenu((prev) => !prev);
  };

  const decreaseQuantity = async (item) => {
    const floatQuantity = parseFloat(newQuantity);

    if (isNaN(floatQuantity)) {
      alert("Inserta un número válido");
      return;
    }

    const quantityNew = item.cantidad - floatQuantity;

    if (quantityNew < 0) {
      alert("La cantidad no puede ser menor a 0");
      return;
    }

    const { data, error } = await supabase
      .from("inventario")
      .update({ cantidad: quantityNew })
      .eq("uuid", item.uuid);

    if (error) {
      console.error("Hubo un error", error);
    } else {
      console.log("Descuento exitoso", data);

      fetchInventario();
      setIncreaseMenu(null);
      setNewQuantity("");
    }
  };

  if (!userData) {
    return <div></div>;
  } else {
    return (
      <div className="size-full p-[15px_20px] pb-[150px] md:pl-[300px]">
        <h1 className="text-[40px] font-bold text-center mb-[10px]">
          Inventario
        </h1>

        <div className="flex items-center justify-between">
          <button
            onClick={toggleFilterMenu}
            className="flex items-center p-[8px] gap-[5px] border-3 border-[#ffa600] rounded-[10px] text-[20px] cursor-pointer"
          >
            <IconAdjustmentsHorizontal stroke={2} /> Filtrar
          </button>
          <button
            onClick={toggleAddMenu}
            className={
              userData.rol === "Empleado"
                ? "hidden"
                : "flex items-center p-[8px] gap-[5px] bg-[#ffa600] font-bold text-white rounded-[10px] text-[20px] cursor-pointer"
            }
          >
            <IconPlus stroke={3} /> Agregar
          </button>
        </div>

        {/* filter container */}
        <div
          className={`z-10 fixed max-w-[340px] mx-auto bg-white rounded-[20px] shadow-[0_0_25px_#00000020] max-h-min left-0 right-0 ${
            filterMenu
              ? "bottom-[40%] md:bottom-[30%] opacity-100 pointer-events-auto"
              : "bottom-[60%] opacity-0 pointer-events-none"
          } p-[40px_20px_20px_20px] text-start flex flex-col justify-between transition-all ease-in-out duration-200 md:max-w-[500px]`}
        >
          <p className="absolute top-[-20px] bg-[#ffa600] text-white text-center text-[25px] p-[5px_10px] font-[800] max-w-[240px] mx-auto left-0 right-0 rounded-[30px] truncate">
            Filtrar
          </p>

          <div className="flex gap-[15px] flex-wrap">
            <div className="w-full flex flex-col gap-[10px]">
              <div>
                <p className="font-bold">Sucursales</p>
                <div
                  onClick={toggleStoresMenu}
                  className="w-full overflow-visible flex items-center p-[5px_10px] justify-between truncate border-2 border-[#00000030] rounded-[10px] relative"
                >
                  <p className="truncate">{store}</p>{" "}
                  <IconChevronDown stroke={2} size={20} />
                  <ul
                    className={`z-10 w-full absolute ${
                      storesMenu
                        ? "max-h-[100px] opacity-100"
                        : "max-h-0 opacity-0 pointer-events-none"
                    } overflow-y-auto left-0 top-[40px] bg-white shadow-[0_10px_20px_#00000020] p-[8px_10px] flex flex-col gap-[10px] rounded-[10px] transition-all ease-in-out duration-200 overflow-hidden`}
                  >
                    {sucursales.map((sucursal) => (
                      <li
                        key={sucursal.id}
                        onClick={() => {
                          setStore(`${sucursal.nombre_suc}`);
                          setStoreId(`${sucursal.id}`);
                        }}
                        className="p-[5px_10px] hover:bg-[#ffa60010] rounded-[8px] transition-all ease-in-out duration-200"
                      >
                        {sucursal.nombre_suc}
                      </li>
                    ))}
                    <li
                      onClick={() => {
                        setStore("Todas");
                        setStoreId(null);
                      }}
                      className="p-[5px_10px] hover:bg-[#ffa60010] rounded-[8px] transition-all ease-in-out duration-200"
                    >
                      Todas
                    </li>
                  </ul>
                </div>
              </div>

              <div>
                <p className="font-bold">Tipo</p>
                <div
                  onClick={toggleTypeMenu}
                  className="w-full overflow-visible flex items-center p-[5px_10px] justify-between truncate border-2 border-[#00000030] rounded-[10px] relative"
                >
                  <p className="truncate">{type}</p>{" "}
                  <IconChevronDown stroke={2} size={20} />
                  <ul
                    className={`z-10 w-full absolute ${
                      typeMenu
                        ? "max-h-[100px] opacity-100"
                        : "max-h-0 opacity-0 pointer-events-none"
                    } overflow-y-auto left-0 top-[40px] bg-white shadow-[0_10px_20px_#00000020] p-[8px_10px] flex flex-col gap-[10px] rounded-[10px] transition-all ease-in-out duration-200 overflow-hidden`}
                  >
                    <li
                      onClick={() => setType("Comestibles")}
                      className="p-[5px_10px] hover:bg-[#ffa60010] rounded-[8px] transition-all ease-in-out duration-200"
                    >
                      Comestibles
                    </li>
                    <li
                      onClick={() => setType("Envases")}
                      className="p-[5px_10px] hover:bg-[#ffa60010] rounded-[8px] transition-all ease-in-out duration-200"
                    >
                      Envases
                    </li>

                    <li
                      onClick={() => setType("Gaseosas")}
                      className="p-[5px_10px] hover:bg-[#ffa60010] rounded-[8px] transition-all ease-in-out duration-200"
                    >
                      Gaseosas
                    </li>

                    <li
                      onClick={() => setType("Salsas")}
                      className="p-[5px_10px] hover:bg-[#ffa60010] rounded-[8px] transition-all ease-in-out duration-200"
                    >
                      Salsas
                    </li>
                    
                    <li
                      onClick={() => setType("Papelería")}
                      className="p-[5px_10px] hover:bg-[#ffa60010] rounded-[8px] transition-all ease-in-out duration-200"
                    >
                      Papeleria
                    </li>
                    <li
                      onClick={() => setType("Limpieza")}
                      className="p-[5px_10px] hover:bg-[#ffa60010] rounded-[8px] transition-all ease-in-out duration-200"
                    >
                      Limpieza
                    </li>
                    <li
                      onClick={() => setType("Otros")}
                      className="p-[5px_10px] hover:bg-[#ffa60010] rounded-[8px] transition-all ease-in-out duration-200"
                    >
                      Otros
                    </li>
                    <li
                      onClick={() => setType("Todos")}
                      className="p-[5px_10px] hover:bg-[#ffa60010] rounded-[8px] transition-all ease-in-out duration-200"
                    >
                      Todos
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <button
              onClick={toggleMissingCheckbox}
              className="rounded-[30px] mb-4 flex items-center gap-[10px] font-bold"
            >
              <div
                className={`border-2 rounded-[50%] p-[4px] w-[25px] h-[25px] ${
                  missingCheckbox
                    ? "border-[#ffa600] bg-[#ffa600] text-white"
                    : "border-[#00000050] bg-white text-transparent"
                } transition-all ease-in-out duration-100`}
              >
                <IconCheck stroke={2} size="100%" />
              </div>{" "}
              Faltantes
            </button>
          </div>

          <div className="flex gap-[10px]">
            <button
              onClick={toggleFilterMenu}
              className="border-2 border-[#ffa600] p-2 rounded-[10px] font-bold w-full"
            >
              Cancelar
            </button>
            <button
              onClick={() => {
                toggleFilterMenu();
                fetchInventario();
              }}
              className="border-2 border-[#ffa600] p-2 rounded-[10px] bg-[#ffa600] text-white font-bold w-full"
            >
              Aplicar
            </button>
          </div>
        </div>

        {/* add to inventory container */}
        <div
          className={`z-10 fixed max-w-[340px] mx-auto bg-white rounded-[20px] shadow-[0_0_25px_#00000020] left-0 right-0 ${
            addMenu
              ? "opacity-100 bottom-[20%] pointer-events-auto"
              : "opacity-0 bottom-[60%] pointer-events-none"
          } p-[40px_20px_20px_20px] text-start flex flex-col justify-between transition-all ease-in-out duration-200 md:max-w-[500px]`}
        >
          <p className="absolute top-[-20px] bg-[#ffa600] text-white text-center text-[25px] p-[5px_10px] font-[800] max-w-[240px] md:max-w-max mx-auto left-0 right-0 rounded-[30px] truncate">
            Agregar al Inventario
          </p>

          <div className="flex gap-[15px] flex-wrap">
            <div>
              <p className="font-bold">Sucursal</p>
              <div
                onClick={toggleStoresAddMenu}
                className="w-full overflow-visible flex items-center p-[5px_10px] justify-between truncate w-[100px] border-2 border-[#00000030] rounded-[10px] relative"
              >
                <p className="truncate">{storeAdd}</p>{" "}
                <IconChevronDown stroke={2} size={20} />
                <ul
                  className={`z-10 absolute ${
                    storesAddMenu
                      ? "max-h-[100px] opacity-100"
                      : "max-h-0 opacity-0 pointer-events-none"
                  } overflow-y-auto left-0 top-[40px] bg-white shadow-[0_10px_20px_#00000020] p-[8px_10px] flex flex-col gap-[10px] rounded-[10px] transition-all ease-in-out duration-200 overflow-hidden`}
                >
                  {sucursales.map((sucursal) => (
                    <li
                      key={sucursal.id}
                      onClick={() => {
                        setStoreAdd(`${sucursal.nombre_suc}`);
                        setStoreAddId(`${sucursal.id}`);
                      }}
                      className="p-[5px_10px] hover:bg-[#ffa60010] rounded-[8px] transition-all ease-in-out duration-200"
                    >
                      {sucursal.nombre_suc}
                    </li>
                  ))}
                  <li
                    onClick={() => {
                      setStoreAdd("Todas");
                      setStoreAddId(5);
                    }}
                    className="p-[5px_10px] hover:bg-[#ffa60010] rounded-[8px] transition-all ease-in-out duration-200"
                  >
                    Todas
                  </li>
                </ul>
              </div>
            </div>

            <div>
              <p className="font-bold">Tipo</p>
              <div
                onClick={toggleTypeAddMenu}
                className="w-full overflow-visible flex items-center p-[5px_10px] justify-between truncate w-[100px] border-2 border-[#00000030] rounded-[10px] relative"
              >
                <p className="truncate">{typeAdd}</p>{" "}
                <IconChevronDown stroke={2} size={20} />
                <ul
                  className={`z-10 absolute ${
                    typeAddMenu
                      ? "max-h-[100px] opacity-100"
                      : "max-h-0 opacity-0 pointer-events-none"
                  } overflow-y-auto left-0 top-[40px] bg-white shadow-[0_10px_20px_#00000020] p-[8px_10px] flex flex-col gap-[10px] rounded-[10px] transition-all ease-in-out duration-200 overflow-hidden`}
                >
                  <li
                    onClick={() => setTypeAdd("Comestibles")}
                    className="p-[5px_10px] hover:bg-[#ffa60010] rounded-[8px] transition-all ease-in-out duration-200"
                  >
                    Comestibles
                  </li>
                  <li
                    onClick={() => setTypeAdd("Envases")}
                    className="p-[5px_10px] hover:bg-[#ffa60010] rounded-[8px] transition-all ease-in-out duration-200"
                  >
                    Envases
                  </li>

                  <li
                    onClick={() => setTypeAdd("Gaseosas")}
                    className="p-[5px_10px] hover:bg-[#ffa60010] rounded-[8px] transition-all ease-in-out duration-200"
                  >
                    Gaseosas
                  </li>

                  <li
                    onClick={() => setTypeAdd("Salsas")}
                    className="p-[5px_10px] hover:bg-[#ffa60010] rounded-[8px] transition-all ease-in-out duration-200"
                  >
                    Salsas
                  </li>
                  
                  <li
                    onClick={() => setTypeAdd("Papelería")}
                    className="p-[5px_10px] hover:bg-[#ffa60010] rounded-[8px] transition-all ease-in-out duration-200"
                  >
                    Papelería
                  </li>
                  <li
                    onClick={() => setTypeAdd("Limpieza")}
                    className="p-[5px_10px] hover:bg-[#ffa60010] rounded-[8px] transition-all ease-in-out duration-200"
                  >
                    Limpieza
                  </li>
                  <li
                    onClick={() => setTypeAdd("Otros")}
                    className="p-[5px_10px] hover:bg-[#ffa60010] rounded-[8px] transition-all ease-in-out duration-200"
                  >
                    Otros
                  </li>
                  <li
                    onClick={() => setTypeAdd("Todos")}
                    className="p-[5px_10px] hover:bg-[#ffa60010] rounded-[8px] transition-all ease-in-out duration-200"
                  >
                    Todos
                  </li>
                </ul>
              </div>
            </div>

            <div>
              <p className="font-bold">Unidad de Medida</p>
              <div
                onClick={toggleUnitAddMenu}
                className="overflow-visible flex items-center p-[5px_10px] justify-between truncate w-[100px] border-2 border-[#00000030] rounded-[10px] relative"
              >
                <p className="truncate">{unit}</p>{" "}
                <IconChevronDown stroke={2} size={20} />
                <ul
                  className={`z-10 absolute ${
                    unitAddMenu
                      ? "max-h-[100px] opacity-100"
                      : "max-h-0 opacity-0 pointer-events-none"
                  } overflow-y-auto left-0 top-[40px] bg-white shadow-[0_10px_20px_#00000020] p-[8px_10px] flex flex-col gap-[10px] rounded-[10px] transition-all ease-in-out duration-200 overflow-hidden`}
                >
                  <li
                    onClick={() => setUnit("Unid.")}
                    className="p-[5px_10px] hover:bg-[#ffa60010] rounded-[8px] transition-all ease-in-out duration-200"
                  >
                    Unidades (Unid)
                  </li>
                  <li
                    onClick={() => setUnit("Pcs.")}
                    className="p-[5px_10px] hover:bg-[#ffa60010] rounded-[8px] transition-all ease-in-out duration-200"
                  >
                    porciones (pcs)
                  </li>
                  <li
                    onClick={() => setUnit("Pq.")}
                    className="p-[5px_10px] hover:bg-[#ffa60010] rounded-[8px] transition-all ease-in-out duration-200"
                  >
                    Paquetes (pq)
                  </li>
                  <li
                    onClick={() => setUnit("Tps.")}
                    className="p-[5px_10px] hover:bg-[#ffa60010] rounded-[8px] transition-all ease-in-out duration-200"
                  >
                    Tapers (tps)
                  </li>
                  <li
                    onClick={() => setUnit("Gl.")}
                    className="p-[5px_10px] hover:bg-[#ffa60010] rounded-[8px] transition-all ease-in-out duration-200"
                  >
                    Galones (gl)
                  </li>
                  <li
                    onClick={() => setUnit("Lt.")}
                    className="p-[5px_10px] hover:bg-[#ffa60010] rounded-[8px] transition-all ease-in-out duration-200"
                  >
                    Litros (lt)
                  </li>
                  <li
                    onClick={() => setUnit("Bol.")}
                    className="p-[5px_10px] hover:bg-[#ffa60010] rounded-[8px] transition-all ease-in-out duration-200"
                  >
                    Bolsas (Bol.)
                  </li>
                </ul>
              </div>
            </div>

            <input
              onChange={(e) => setName(e.target.value)}
              value={name}
              className="outline-none focus:border-[#ffa600] border-2 border-[#00000020] p-[5px_10px] rounded-[10px] w-full transition-all ease-in-out"
              type="text"
              placeholder="Nombre"
            />
            <input
              onChange={(e) => setStockIdeal(e.target.value)}
              value={stockIdeal}
              className="outline-none focus:border-[#ffa600] border-2 border-[#00000020] p-[5px_10px] rounded-[10px] w-full transition-all ease-in-out"
              type="number"
              placeholder="Stock ideal"
            />
            <input
              onChange={(e) => setQuantity(e.target.value)}
              value={quantity}
              className="outline-none focus:border-[#ffa600] border-2 border-[#00000020] p-[5px_10px] rounded-[10px] w-full transition-all ease-in-out"
              type="number"
              placeholder="Cantidad Actual"
            />
          </div>

          <div className="flex gap-[10px] mt-[15px]">
            <button
              onClick={toggleAddMenu}
              className="border-2 border-[#ffa600] p-2 rounded-[10px] font-bold w-full"
            >
              Cancelar
            </button>
            <button
              onClick={addItemToInventory}
              className="border-2 border-[#ffa600] p-2 rounded-[10px] bg-[#ffa600] text-white font-bold w-full"
            >
              Agregar
            </button>
          </div>
        </div>

        <br />

        {/* inventory */}
        <div className="w-full overflow-hidden rounded-[15px] bg-[#e0e0e0] transition-all ease-in-out duration-300">
          <div className="grid grid-cols-3 gap-2 bg-white text-sm font-bold uppercase text-center p-2">
            <div>Nombre</div>
            <div>Cantidad</div>
            <div>Tipo</div>
          </div>

          <div className="space-y-2">
            {Array.isArray(items) && items.length === 0 ? (
              <p className="text-center font-bold py-2 text-gray-500">
                No se encontraron resultados
              </p>
            ) : (
              items.map((item) => {
                const porcentaje = item.cantidad / item.stock_ideal;
                const esFaltanteUrgente = porcentaje <= 0;
                const esFaltanteNormal = porcentaje <= 0.3 && porcentaje > 0;

                // Determinar clases según el nivel de faltante
                let bgClass = "bg-[#f7f7f7]"; // Por defecto
                if (esFaltanteUrgente) {
                  bgClass = "bg-[#ff333390] font-bold";
                } else if (esFaltanteNormal) {
                  bgClass = "bg-[#f5f24290] font-bold";
                }

                return (
                  <div
                    onClick={() =>
                      setItemMenu(itemMenu === item.uuid ? null : item.uuid)
                    }
                    key={item.uuid}
                    className={`relative grid grid-cols-3 gap-2 ${bgClass} p-2 text-center m-[8px] rounded-[8px] transition-all ease-in-out duration-300`}
                  >
                    <div className="truncate">{item.nombre}</div>
                    <div>
                      {item.cantidad} {item.unidad_medida}
                    </div>
                    <div>{item.tipo}</div>

                    <div
                      onClick={(e) => e.stopPropagation()}
                      className={`z-20 ${
                        itemMenu === item.uuid
                          ? "opacity-100 bottom-[40%] pointer-events-auto"
                          : "opacity-0 bottom-[50%] pointer-events-none"
                      } fixed max-w-[340px] mx-auto bg-white rounded-[20px] shadow-[0_0_25px_#00000020] h-[280px] left-0 right-0 bottom-[40%] p-[40px_20px_20px_20px] text-start flex flex-col justify-between transition-all ease-in-out duration-200 md:max-w-[500px]`}
                    >
                      <p className="absolute top-[-20px] bg-[#ffa600] text-white text-[25px] text-center p-[5px_10px] font-[800] max-w-[240px] mx-auto left-0 right-0 rounded-[30px] truncate">
                        {item.nombre}
                      </p>
                      <div className="flex gap-[20px] flex-wrap">
                        <div>
                          <p className="font-bold md:text-[20px]">Cantidad:</p>
                          <p
                            className={`${
                              esFaltanteUrgente
                                ? "bg-[#ff333390] px-2 rounded-lg"
                                : "bg-none"
                            } transition-all ease-in-out md:text-[20px]`}
                          >
                            {item.cantidad} {item.unidad_medida}
                          </p>
                        </div>
                        <div>
                          <p className="font-bold md:text-[20px]">
                            Stock ideal:
                          </p>
                          <p className="md:text-[20px]">
                            {item.stock_ideal} {item.unidad_medida}
                          </p>
                        </div>
                        <div>
                          <p className="font-bold md:text-[20px]">Tipo:</p>
                          <p className="md:text-[20px]">{item.tipo}</p>
                        </div>
                        <div>
                          <p className="font-bold md:text-[20px]">Sucursal:</p>
                          <p className="md:text-[20px]">
                            {item.sucursal_nombre}
                          </p>
                        </div>
                      </div>
                      <div
                        className={`w-[230px] absolute left-0 ${
                          increaseMenu
                            ? "bottom-5 opacity-100"
                            : "bottom-20 opacity-0 pointer-events-none"
                        } bg-white rounded-[20px] shadow-[0_0_25px_#00000030] mx-auto left-0 right-0 p-5 flex flex-col gap-[10px] items-center transition-all ease-in-out duration-200`}
                      >
                        <h2 className="font-bold text-[18px]">Aumentar</h2>
                        <input
                          onChange={(e) => setNewQuantity(e.target.value)}
                          value={newQuantity}
                          type="number"
                          placeholder="Ej. 1"
                          className="border-2 border-[#00000030] p-2 w-[100px] rounded-[10px] text-center text-[25px] font-[900]"
                        />

                        <div className="flex gap-[10px] w-full">
                          <button
                            onClick={() => updateQuantity(item)}
                            className="border-2 border-[#ffa600] bg-[#ffa600] text-white p-2 rounded-[10px] font-bold w-full cursor-pointer"
                          >
                            Aceptar
                          </button>
                          <button
                            onClick={toggleIncreaseMenu}
                            className="bg-[#ffa60050] p-2 rounded-[10px] font-bold w-full cursor-pointer"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>

                      <div
                        className={`w-[230px] absolute left-0 ${
                          decreaseMenu
                            ? "bottom-5 opacity-100"
                            : "bottom-20 opacity-0 pointer-events-none"
                        } bg-white rounded-[20px] shadow-[0_0_25px_#00000030] mx-auto left-0 right-0 p-5 flex flex-col gap-[10px] items-center transition-all ease-in-out duration-200`}
                      >
                        <h2 className="font-bold text-[18px]">Restar</h2>
                        <input
                          onChange={(e) => setNewQuantity(e.target.value)}
                          value={newQuantity}
                          type="number"
                          placeholder="Ej. 1"
                          className="border-2 border-[#00000030] p-2 w-[100px] rounded-[10px] text-center text-[25px] font-[900]"
                        />

                        <div className="flex gap-[10px] w-full">
                          <button
                            onClick={() => decreaseQuantity(item)}
                            className="border-2 border-[#ffa600] bg-[#ffa600] text-white p-2 rounded-[10px] font-bold w-full cursor-pointer"
                          >
                            Aceptar
                          </button>
                          <button
                            onClick={toggleDecreaseMenu}
                            className="bg-[#ffa60050] p-2 rounded-[10px] font-bold w-full cursor-pointer"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>

                      <div className="flex gap-[10px]">
                        <button
                          onClick={toggleIncreaseMenu}
                          className="border-2 border-[#ffa600] p-2 rounded-[10px] font-bold w-full cursor-pointer"
                        >
                          Aumentar
                        </button>
                        <button
                          onClick={toggleDecreaseMenu}
                          className="border-2 border-[#ffa600] bg-[#ffa600] text-white p-2 rounded-[10px] font-bold w-full cursor-pointer"
                        >
                          Restar
                        </button>
                        <button
                          onClick={() =>
                            setItemMenu(
                              itemMenu === item.uuid ? null : item.uuid
                            )
                          }
                          className="bg-[#ffa60050] p-2 rounded-[10px] font-bold cursor-pointer"
                        >
                          Salir
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    );
  }
}
