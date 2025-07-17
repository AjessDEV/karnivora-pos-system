import { IconEdit } from "@tabler/icons-react";
import { useState, useEffect } from "react";
import { useUser } from "../supComponentes/UserContext";
import { supabase } from "../../supabaseClient";

import pdfMake from "pdfmake/build/pdfmake";
import "pdfmake/build/vfs_fonts";

export default function Caja({
  window,
}) {
  const { userData, loading } = useUser();

  const [openInput, setOpenInput] = useState(false);
  const toggleCashInput = () => {
    setOpenInput((prev) => !prev);
  };
  const [startingCash, setStartingCash] = useState(() => {
    const valorGuardado = localStorage.getItem("inicio_caja");
    return valorGuardado !== null ? JSON.parse(valorGuardado) : 200;
  });

  const [newStartingCash, setNewStartingCash] = useState(0);

  const formatPrice = (value) => {
    if (typeof value !== "number") return "";
    return value.toFixed(2).replace(",", ".");
  };

  const [decreaseInput, setDecreaseInput] = useState(false);
  const toggleDecraseInput = () => {
    setDecreaseInput((prev) => !prev);
  };
  const [decreasedCash, setDecreasedCash] = useState(0);
  const [decreaseReason, setDecreaseReason] = useState("");

  function decreaseCash() {
    setStartingCash(startingCash - parseFloat(decreasedCash));
    setDecreaseReason("");

    const newMove = {
      fecha: new Date().toISOString(),
      monto_pagado: parseFloat(decreasedCash),
      numero_pedido: null,
      tipo_pago: `Gasto de Caja`,
      m_efectivo: 0,
      m_yape: 0,
      m_tarjeta: 0,
      q_efe: 0,
      q_yape: 0,
      q_tar: 0,
      ing_eg: false,
      reason: decreaseReason,
    };

    guardarGasto(newMove);
  }

  const [gasto, setGasto] = useState([]);

  useEffect(() => {
    const data = localStorage.getItem("gastos");
    if (data) {
      setGasto(JSON.parse(data));
    }
  }, []);

  function guardarGasto(nuevoGasto) {
    const updated = [...gasto, nuevoGasto];

    setGasto(updated);
    localStorage.setItem("gastos", JSON.stringify(updated));
  }

  useEffect(() => {
    localStorage.setItem("inicio_caja", JSON.stringify(startingCash));
  }, [startingCash]);

  const [efectivo, setEfectivo] = useState(0);
  const [yapePlin, setYapePlin] = useState(0);
  const [tarjeta, setTarjeta] = useState(0);

  useEffect(() => {
    const storedEfectivo = localStorage.getItem("efectivo");
    const storedYape = localStorage.getItem("yape/plin");
    const storedTarjeta = localStorage.getItem("tarjeta");

    setEfectivo(storedEfectivo ? JSON.parse(storedEfectivo) : 0);
    setYapePlin(storedYape ? JSON.parse(storedYape) : 0);
    setTarjeta(storedTarjeta ? JSON.parse(storedTarjeta) : 0);
  }, [userData]);

  const [movimientos, setMovimientos] = useState([])

  useEffect(() => {
    const movesData = localStorage.getItem("movimientos");

    if (movesData) {
      try {
        const parsedArray = JSON.parse(movesData);

        if (Array.isArray(parsedArray)) {
          setMovimientos(parsedArray);
        } else {
          console.warn("no es array");
        }
      } catch (error) {
        console.error("error al parsear los datos", error);
      }
    }

    console.log('movimientos',movimientos)
  }, [userData])

  function generarReporteVenta(userData) {
    const movimientos = JSON.parse(localStorage.getItem("movimientos") || "[]");
    const gastos = JSON.parse(localStorage.getItem("gastos") || "[]");

    const efectivo = parseFloat(localStorage.getItem("efectivo") || "0");
    const yapePlin = parseFloat(localStorage.getItem("yape/plin") || "0");
    const tarjeta = parseFloat(localStorage.getItem("tarjeta") || "0");
    const inicioCaja = parseFloat(localStorage.getItem("inicio_caja") || "0");
    const total = efectivo + yapePlin + tarjeta;

    const fechaHora = new Date().toLocaleString("es-PE");

    const docDefinition = {
      pageSize: { width: 165, height: "auto" }, // 58 mm en puntos
      pageMargins: [5, 5, 5, 5],
      content: [
        {
          text: "REPORTE DE VENTA",
          alignment: "center",
          bold: true,
          fontSize: 14,
          margin: [0, 0, 0, 5],
        },
        { text: `Fecha y hora: ${fechaHora}`, fontSize: 9, margin: [0, 0, 0, 2] },
        {
          text: `Cajero: ${userData.user_nombre}`,
          fontSize: 9,
          margin: [0, 0, 0, 2]
        },
        {
          text: `Sucursal: ${userData.sucursal_nombre}`,
          fontSize: 9,
          margin: [0, 0, 0, 5]
        },

        {
          text: "Movimientos",
          style: "sectionHeader",
        },
        {
          table: {
            widths: [20, "*", 13, 13, 13, 13], // ajustado
            body: [
              ["#P", "Nomb", "Tot", "Efe", "Yap", "Tjta"], // encabezados más cortos
              ...movimientos.map((item) => [
                item.tipo_pago || "",
                item.nombre?.substring(0, 10) || "", // nombre más corto
                item.monto_pagado?.toFixed(2) || "0.00",
                item.q_efe?.toFixed(2) || "0.00",
                item.q_yape?.toFixed(2) || "0.00",
                item.q_tar?.toFixed(2) || "0.00",
              ]),
            ],
          },
          layout: {
            hLineWidth: () => 0.5,
            vLineWidth: () => 0.5,
            hLineColor: () => "#000",
            vLineColor: () => "#000",
          },
          fontSize: 7,
          margin: [0, 0, 0, 5],
        },
        { text: "Gastos", style: "sectionHeader" },
        {
          table: {
            widths: ["*", "auto"],
            body: [
              ["Razón", "Monto"],
              ...gastos.map((item) => [
                item.reason || "",
                item.monto_pagado?.toFixed(2) || "0.00",
              ]),
            ],
          },
          layout: {
            hLineWidth: () => 0.5,
            vLineWidth: () => 0.5,
            hLineColor: () => "#000",
            vLineColor: () => "#000",
          },
          fontSize: 7,
          margin: [0, 0, 0, 10],
        },

        {
          text: `Caja: S/ ${inicioCaja.toFixed(2)}`,
          fontSize: 11,
          bold: true,
          margin: [0, 0, 0, 7],
        },
        { text: `Efectivo: S/ ${efectivo.toFixed(2)}`, fontSize: 9 },
        { text: `Yape/Plin: S/ ${yapePlin.toFixed(2)}`, fontSize: 9 },
        { text: `Tarjeta: S/ ${tarjeta.toFixed(2)}`, fontSize: 9 },

        {
          text: `\nTOTAL VENTA: S/ ${total.toFixed(2)}`,
          bold: true,
          fontSize: 12,
          margin: [0, 10, 0, 0],
        },
      ],
      styles: {
        sectionHeader: {
          bold: true,
          fontSize: 10,
          margin: [0, 10, 0, 2],
        },
      },
    };

    pdfMake.createPdf(docDefinition).print();
  }

  async function saveGanancias() {
    const today = new Date().toLocaleDateString("en-CA");
      const lastLoginDate = localStorage.getItem("lastLoginDate")
        const efectivo = parseFloat(localStorage.getItem("efectivo") || "0");
        const yapePlin = parseFloat(localStorage.getItem("yape/plin") || "0");
        const tarjeta = parseFloat(localStorage.getItem("tarjeta") || "0");
        const total = efectivo + yapePlin + tarjeta;

        await guardarVentasAntriores({
          fecha: lastLoginDate,
          sucursal_id: userData.sucursal_id,
          total,
          sucursal_nombre: userData.sucursal_nombre,
        });

        localStorage.setItem("efectivo", "0");
        localStorage.setItem("yape/plin", "0");
        localStorage.setItem("tarjeta", "0");
        localStorage.setItem("pedidos", JSON.stringify([]));
        localStorage.setItem("movimientos", JSON.stringify([]));
        localStorage.setItem("gastos", JSON.stringify([]));
        const sucId = userData?.sucursal_id;

        await resetGanancias(sucId);
      

      localStorage.setItem("lastLoginDate", today);
  }


      const resetGanancias = async (sucursalId) => {
        const { error } = await supabase
          .from("ganancias")
          .update({ total_ganancia: 0 })
          .eq("sucursal_id", sucursalId);
    
        if (error) {
          console.error("error al resetear ganancias", error.message);
        }
      };
    
      async function guardarVentasAntriores({
        fecha,
        sucursal_id,
        total,
        sucursal_nombre,
      }) {
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

  return (
    <div
      className={`w-full absolute ${
        window === "Caja"
          ? "top-0 opacity-100"
          : "top-[100px] opacity-0 pointer-events-none"
      } transition-all ease-in-out duration-200 pb-[100px]`}
    >
      <button
        onClick={() => generarReporteVenta(userData)}
        className="font-bold text-[20px] px-3 py-2 bg-[#26ce6c] text-white rounded-full fixed bottom-[120px] right-4 md:bottom-4 md:text-[25px] cursor-pointer border-3 border-[#26ce6c] hover:bg-white hover:text-[#26ce6c] transition-all duration-200"
      >
        Imprimir Reporte
      </button>

      <h2 className="font-bold text-[28px] text-center mb-[30px]">
        Caja Registradora
      </h2>

      <div>
        <p className="font-bold md:text-[30px]">Inicio de Caja</p>
        <div className="flex gap-4 relative max-w-max">
          <p className="font-[900] text-[50px]">
            S/. {formatPrice(startingCash)}
          </p>
          <button
            onClick={toggleCashInput}
            className="cursor-pointer bg-[#00000015] p-2 rounded-[10px] max-h-max active:bg-[#00000030] transition-all ease-in-out duration-100"
          >
            <IconEdit size={30} stroke={2} />
          </button>
          <div
            className={`absolute w-[80%] max-h-max bg-[#eeeeee] top-0 left-0 ${
              openInput ? "scale-100" : "scale-0"
            } rounded-[15px] shadow-[0_0_30px_#00000020] p-2 flex flex-col gap-[10px] transition-all ease-in-out duration-200`}
          >
            <input
              type="text"
              placeholder="Ej. 200"
              value={newStartingCash}
              onChange={(e) => setNewStartingCash(e.target.value)}
              className="font-[900] text-[40px] w-full border-3 border-[#e0e0e0] rounded-[10px] p-2 text-center"
            />
            <button
              onClick={() => {
                setStartingCash(parseFloat(newStartingCash));
                setOpenInput(false);
              }}
              className={`${
                newStartingCash > 0
                  ? "bg-[#ffa600]"
                  : "bg-[#e0e0e0] pointer-events-none"
              } py-3 w-full font-bold text-white text-[20px] rounded-[10px] active:brightness-[0.95] transition-all ease-in-out duration-100`}
            >
              Aceptar
            </button>
          </div>
        </div>

        <div className="flex gap-[10px] w-full">
          <p className="font-bold w-full md:text-[25px]">
            Efectivo: <br /> <b>S/. {formatPrice(efectivo)}</b>
          </p>
          <p className="font-bold w-full md:text-[25px]">
            Yape/Plin: <br /> <b>S/. {formatPrice(yapePlin)}</b>
          </p>
          <p className="font-bold w-full md:text-[25px]">
            Tarjeta: <br /> <b>S/. {formatPrice(tarjeta)}</b>
          </p>
        </div>
        <p className="font-[900] w-full text-[30px] mt-2">Venta Total:</p>
        <p className="font-[900] w-full text-[40px] text-[#26ce6c]">
          S/. {formatPrice(efectivo + yapePlin + tarjeta)}
        </p>

        <button
          onClick={toggleDecraseInput}
          className="bg-[#ff3333] rounded-[10px] w-full py-4 my-3 text-white font-bold uppercase text-[20px] active:brightness-[0.98] transition-all ease-in-out duration-200 active:bg-[#ff333380] cursor-pointer md:max-w-[700px]"
        >
          Registrar Gasto
        </button>
        <div className="relative">
          <div
            className={`absolute w-full max-h-max bg-[#eeeeee] top-0 left-0 md:max-w-[700px] ${
              decreaseInput ? "scale-100" : "scale-0"
            } rounded-[15px] shadow-[0_0_30px_#00000020] p-2 flex flex-col gap-[10px] transition-all ease-in-out duration-200`}
          >
            <input
              type="text"
              placeholder="Gasto"
              value={decreasedCash}
              onChange={(e) => setDecreasedCash(e.target.value)}
              className="font-[900] text-[40px] w-full border-3 border-[#e0e0e0] rounded-[10px] p-2 text-center"
            />
            <input
              type="text"
              placeholder="Motivo"
              value={decreaseReason}
              onChange={(e) => setDecreaseReason(e.target.value)}
              className="font-[900] text-[40px] w-full border-3 border-[#e0e0e0] rounded-[10px] p-2 text-center"
            />
            <button
              onClick={() => {
                decreaseCash();
                setDecreaseInput(false);
              }}
              className={`${
                decreasedCash > 0
                  ? "bg-[#ffa600]"
                  : "bg-[#e0e0e0] pointer-events-none"
              } py-3 w-full font-bold text-white text-[20px] rounded-[10px] active:brightness-[0.95] transition-all ease-in-out duration-100`}
            >
              Aceptar
            </button>
          </div>
        </div>

        <div className="md:max-w-[700px]">
          <h2 className="font-bold text-[28px] my-3">Movimientos</h2>

          <div className="flex flex-col gap-[25px]">
            {movimientos
              .slice()
              .reverse()
              .map((move, index) => {
                const fecha = new Date(move.fecha);

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
                    key={index}
                    className="flex items-center justify-between"
                  >
                    <div className="flex flex-col gap-1">
                      <p className="font-bold text-[20px]">{move.tipo_pago}</p>
                      <div className="flex gap-2 flex-wrap">
                        <p
                          className={`font-bold uppercase px-2 py-1 text-[12px] bg-[#00000010] rounded-full ${
                            move.m_efectivo ? "block" : "hidden"
                          }`}
                        >
                          {move.m_efectivo}: S/. {formatPrice(move.q_efe)}
                        </p>
                        <p
                          className={`font-bold uppercase px-2 py-1 text-[12px] bg-[#00000010] rounded-full ${
                            move.m_yape ? "block" : "hidden"
                          }`}
                        >
                          {move.m_yape}: S/. {formatPrice(move.q_yape)}
                        </p>
                        <p
                          className={`font-bold uppercase px-2 py-1 text-[12px] bg-[#00000010] rounded-full ${
                            move.m_tarjeta ? "block" : "hidden"
                          }`}
                        >
                          {move.m_tarjeta}: S/. {formatPrice(move.q_tar)}
                        </p>
                        <p
                          className={`font-bold uppercase px-2 py-1 text-[12px] bg-[#00000010] rounded-full ${
                            move.nombre !== "Sin Nombre" ? "block" : "hidden"
                          }`}
                        >
                          {move.nombre}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col items-end">
                      <p
                        className={`font-[900] text-[20px] ${
                          move.ing_eg === true
                            ? "text-[#26ce6c]"
                            : "text-[#ff3333]"
                        }`}
                      >
                        {move.ing_eg === true ? "+" : "-"} S/.{" "}
                        {formatPrice(move.monto_pagado)}
                      </p>
                      <p className="font-bold text-[15px] text-[#00000050]">
                        {horaLegible}
                      </p>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
        <div className="md:max-w-[700px]">
          <h2 className="font-bold text-[28px] my-3">Gastos</h2>

          <div className="flex flex-col gap-[25px]">
            {gasto
              .slice()
              .reverse()
              .map((move, index) => {
                const fecha = new Date(move.fecha);

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
                    key={index}
                    className="flex items-center justify-between"
                  >
                    <div className="flex flex-col gap-1">
                      <p className="font-bold text-[20px]">{move.tipo_pago}</p>
                      <div className="flex gap-2 flex-wrap">
                        <p
                          className={`font-bold uppercase px-2 py-1 text-[12px] bg-[#00000010] rounded-full ${
                            move.m_efectivo ? "block" : "hidden"
                          }`}
                        >
                          {move.m_efectivo}: S/. {formatPrice(move.q_efe)}
                        </p>
                        <p
                          className={`font-bold uppercase px-2 py-1 text-[12px] bg-[#00000010] rounded-full ${
                            move.m_yape ? "block" : "hidden"
                          }`}
                        >
                          {move.m_yape}: S/. {formatPrice(move.q_yape)}
                        </p>
                        <p
                          className={`font-bold uppercase px-2 py-1 text-[12px] bg-[#00000010] rounded-full ${
                            move.m_tarjeta ? "block" : "hidden"
                          }`}
                        >
                          {move.m_tarjeta}: S/. {formatPrice(move.q_tar)}
                        </p>
                        <p
                          className={`font-bold uppercase px-2 py-1 text-[12px] bg-[#00000010] rounded-full ${
                            move.reason ? "block" : "hidden"
                          }`}
                        >
                          {move.reason}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col items-end">
                      <p
                        className={`font-[900] text-[20px] ${
                          move.ing_eg === true
                            ? "text-[#26ce6c]"
                            : "text-[#ff3333]"
                        }`}
                      >
                        {move.ing_eg === true ? "+" : "-"} S/.{" "}
                        {formatPrice(move.monto_pagado)}
                      </p>
                      <p className="font-bold text-[15px] text-[#00000050]">
                        {horaLegible}
                      </p>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        <button
        onClick={() => saveGanancias()}
        className="font-bold text-[16px] px-3 py-2 bg-[#ff3333] text-white rounded-full bottom-[200px] right-4 md:bottom-22 md:text-[16px] cursor-pointer border-3 border-[#ff3333] hover:bg-white hover:text-[#ff3333] transition-all duration-200"
      >
        Cerrar Turno
      </button>
      </div>
    </div>
  );
}
