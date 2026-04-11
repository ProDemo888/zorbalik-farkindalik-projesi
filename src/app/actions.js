"use server";

import { supabaseAdmin } from "@/lib/supabase-admin";

export async function validateAndUseCode(code, firstName, lastName) {
  if (!code || !firstName || !lastName) {
    return { error: "Tüm alanları doldurun." };
  }

  const fullName = `${firstName.trim()} ${lastName.trim()}`;

  // Call atomic RPC function — eliminates race condition
  const { data, error } = await supabaseAdmin.rpc("use_access_code", {
    p_code: code.trim().toUpperCase(),
    p_student_name: fullName,
  });

  if (error) {
    console.error("RPC error:", error);
    return { error: "Bir hata oluştu." };
  }

  // RPC returns an array with one row: { id, success }
  const result = Array.isArray(data) ? data[0] : data;

  if (!result || !result.success) {
    return { error: "Geçersiz veya kullanılmış erişim kodu." };
  }

  return { success: true, codeId: result.id };
}
