import { Link } from "react-router-dom";
import { IconChevronLeft } from "@tabler/icons-react";
import { supabase } from "../../supabaseClient"
import { useEffect, useState } from "react";

export default function Sucursales() {
  const [sucursales, setSucursales] = useState([]);
  const fetchSucursales = async () => {
    const { data, error } = await supabase
      .from('sucursales')
      .select('*');

    if (error) {
      console.error("Error fetching sucursales:", error);
    } else {
      setSucursales(data);
    }
  };
  useEffect(() => {
    fetchSucursales();
  }, []);

  const [nombreSucursal, setNombreSucursal] = useState("");
  const [message, setMessage] = useState("");
  const agregarSucursal = async () => {
    if (nombreSucursal === "") {
      setMessage("Por favor, ingresa un nombre para la sucursal.");
      return;
    }

    const { data, error } = await supabase
      .from('sucursales')
      .insert([{ nombre_suc: nombreSucursal }]);

    if (error) {
      console.error("Error al agregar sucursal:", error);
      setMessage("Error al agregar la sucursal. Inténtalo de nuevo.");
    } else {
      setMessage("Sucursal agregada exitosamente.");
      setNombreSucursal("");
      fetchSucursales(); // Actualizar la lista de sucursales
    }
  }
  return (
    <div className="p-4 md:pl-[300px]">
      <div className="flex items-center gap-4 mb-4">
        <Link to="/mas-opciones" className="cursor-pointer">
          <IconChevronLeft stroke={2} size={35} />
        </Link>
        <h2 className="font-bold text-[30px]">Sucursales</h2>
      </div>

      <div className="flex flex-col ">
        <p className="font-bold text-[20px] mb-1">Agregar Sucursal</p>
        <p className={`mb-2 w-full py-2 text-center ${message !== '' ? 'bg-[#e0e0e0]' : ''} rounded-full font-bold transition-all ease-in-out duration-300`}>{message}</p>

        <input value={nombreSucursal} onChange={(e) => setNombreSucursal(e.target.value)} className="text-[18px] outline-none rounded-[10px] p-3 font-bold bg-[#e0e0e0] mb-2" type="text" placeholder="Nombre Sucursal"/>
        <button onClick={agregarSucursal} className={`py-2 font-bold text-[20px] rounded-[10px] ${nombreSucursal !== '' ? 'bg-[#ffa600] text-white' : 'bg-[#e0e0e0] text-[#70707050]'} transition-all duration-200`}>Agregar</button>
      </div>
      <br />
      <div>
        <p className="mb-3 text-[20px] font-bold">Lista de Sucursales</p>
        {sucursales.map((sucursal) => {
          return (
            <div key={sucursal.id} className="p-3 mb-3 bg-[#fafafa] rounded-[10px] shadow-[0_10px_30px_#00000010]">
              <h3 className="text-[20px] font-bold">{sucursal.nombre_suc}</h3>
            </div>
          );
        })}
      </div>
    </div>
  );
}
