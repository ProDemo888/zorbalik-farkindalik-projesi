"use server";

export async function verifyTeacherPassword(password) {
  // Check against env var, default to something generic if not provided
  const correctPassword = process.env.TEACHER_PASSWORD || "rehberlik123";
  
  if (password === correctPassword) {
    return { success: true };
  }
  return { success: false, error: "Hatalı şifre." };
}
