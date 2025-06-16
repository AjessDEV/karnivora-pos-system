import { supabase } from "../../supabaseClient";

export async function getUserProfile(userId) {
  const { data, error } = await supabase
    .from("perfiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error) {
    throw new Error("Error al obtener el perfil del usuario: " + error.message);
  }

  return data;
}
