"use server";

import { supabaseAdmin } from "@/lib/supabase-admin";

export async function validateAndUseCode(code, firstName, lastName) {
  if (!code || !firstName || !lastName) {
    return { error: "Tüm alanları doldurun." };
  }

  const fullName = `${firstName.trim()} ${lastName.trim()}`;
  const normalizedCode = code.trim().toUpperCase();

  // Try atomic RPC first (fresh start — marks code as used)
  const { data, error } = await supabaseAdmin.rpc("use_access_code", {
    p_code: normalizedCode,
    p_student_name: fullName,
  });

  const result = Array.isArray(data) ? data[0] : data;

  if (!error && result?.success) {
    return { success: true, codeId: result.id };
  }

  // RPC failed — code may already be used. Check for resume.
  const { data: codeData, error: codeError } = await supabaseAdmin
    .from("access_codes")
    .select("id, used")
    .eq("code", normalizedCode)
    .single();

  if (codeError || !codeData) {
    return { error: "Geçersiz erişim kodu." };
  }

  if (!codeData.used) {
    return { error: "Bir hata oluştu. Lütfen tekrar deneyin." };
  }

  // Code is used — check if this student already submitted responses
  const { data: existingResponses, error: responsesError } = await supabaseAdmin
    .from("responses")
    .select("scenario_number, answer_1, answer_2, answer_3, ai_feedback, category_1, category_2, category_3")
    .eq("access_code_id", codeData.id)
    .eq("student_name", fullName)
    .order("scenario_number");

  if (responsesError) {
    return { error: "Bir hata oluştu." };
  }

  if (!existingResponses || existingResponses.length === 0) {
    return { error: "Bu erişim kodu başka bir öğrenci tarafından kullanılmış." };
  }

  // Return codeId + previous responses so client can resume
  return {
    success: true,
    codeId: codeData.id,
    resume: existingResponses,
  };
}
