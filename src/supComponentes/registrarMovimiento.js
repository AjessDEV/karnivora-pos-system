import { supabase } from "../../supabaseClient";

export async function registrarMovimiento({ nombre, sucursal, accion, detalles }) {
  const fecha_hora = new Date().toISOString();

  const { error } = await supabase.from("movimientos").insert([
    {
      nombre,
      sucursal,
      fecha_hora,
      accion,
      detalles,
    },
  ]);

  if (error) {
    console.error("Error al registrar movimiento:", error);
    return false;
  } else {
    console.log('movimiento registrado exitosamente')
  }

  return true;
}