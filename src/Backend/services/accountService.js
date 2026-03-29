import supabase from "../lib/supabaseClient";

export const getAccount = async () => {

  const { data: user } =
    await supabase.auth.getUser();

  const { data } = await supabase
    .from("main_accounts")
    .select("*")
    .eq("user_id", user.user.id)
    .single();

  return data;
};