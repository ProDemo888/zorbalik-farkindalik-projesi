"use server";

import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase-admin";

const COOKIE_NAME = "teacher_auth";

export async function verifyTeacherPassword(password) {
  const correctPassword = process.env.TEACHER_PASSWORD;

  if (!correctPassword) {
    console.error("TEACHER_PASSWORD env var not set");
    return { success: false, error: "Sunucu yapılandırma hatası." };
  }

  if (password === correctPassword) {
    const cookieStore = await cookies();
    cookieStore.set(COOKIE_NAME, "authenticated", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 8, // 8 hours
      path: "/",
    });
    return { success: true };
  }

  return { success: false, error: "Hatalı şifre." };
}

export async function checkTeacherAuth() {
  try {
    const cookieStore = await cookies();
    return cookieStore.get(COOKIE_NAME)?.value === "authenticated";
  } catch {
    return false;
  }
}

export async function logoutTeacher() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function fetchTeacherResponses() {
  const cookieStore = await cookies();
  if (cookieStore.get(COOKIE_NAME)?.value !== "authenticated") {
    return { error: "Yetkisiz erişim." };
  }

  const { data, error } = await supabaseAdmin
    .from("responses")
    .select("*, access_codes(code)")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Fetch responses error:", error);
    return { error: "Veriler yüklenemedi." };
  }

  return { data };
}
