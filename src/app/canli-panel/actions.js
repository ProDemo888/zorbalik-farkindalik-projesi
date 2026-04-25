"use server";

import { supabaseAdmin } from "@/lib/supabase-admin";

export async function fetchInitialStats() {
  try {
    // Fetch statistics in parallel for efficiency
    const [totalAnswers, completedStudents, activeStudents, recentResponses] = await Promise.all([
      // Total answers count
      supabaseAdmin
        .from("responses")
        .select("*", { count: "exact", head: true }),

      // Completed students (from materialized view)
      supabaseAdmin
        .from("mv_student_status")
        .select("*", { count: "exact", head: true })
        .eq("status", "completed"),

      // Active students (from materialized view)
      supabaseAdmin
        .from("mv_student_status")
        .select("*", { count: "exact", head: true })
        .eq("status", "active"),

      // Recent responses (limited to 50 for performance)
      supabaseAdmin
        .from("responses")
        .select(`
          id,
          access_code_id,
          student_name,
          scenario_number,
          answer_1,
          answer_2,
          answer_3,
          ai_feedback,
          created_at
        `)
        .order("created_at", { ascending: false })
        .limit(50),
    ]);

    return {
      totalAnswers: totalAnswers.count || 0,
      completedStudents: completedStudents.count || 0,
      activeStudents: activeStudents.count || 0,
      recentResponses: recentResponses.data || [],
      error: null,
    };
  } catch (error) {
    console.error("Error fetching initial stats:", error);
    return {
      totalAnswers: 0,
      completedStudents: 0,
      activeStudents: 0,
      recentResponses: [],
      error: "Veriler yüklenirken bir hata oluştu.",
    };
  }
}

export async function verifyCompletion(codeId) {
  try {
    const { count, error } = await supabaseAdmin
      .from("responses")
      .select("*", { count: "exact", head: true })
      .eq("access_code_id", codeId);

    if (error) {
      console.error("Error verifying completion:", error);
      return { completed: false, error: "Tamamlama durumu kontrol edilemedi." };
    }

    // Only allow dashboard access if all 5 scenarios completed
    return {
      completed: count === 5,
      error: null,
    };
  } catch (error) {
    console.error("Error verifying completion:", error);
    return {
      completed: false,
      error: "Bir hata oluştu.",
    };
  }
}