"use server";

import { supabaseAdmin } from "@/lib/supabase-admin";

export async function fetchInitialStats() {
  try {
    // Fetch responses data in parallel
    const [studentRows, recentResponses] = await Promise.all([
      // All (access_code_id, student_name, scenario_number) for computing student stats
      supabaseAdmin
        .from("responses")
        .select("access_code_id, student_name, scenario_number, class_name"),

      // Recent responses for the feed
      supabaseAdmin
        .from("responses")
        .select(`
          id,
          access_code_id,
          student_name,
          class_name,
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

    // Compute student stats client-side (avoids dependency on materialized view)
    const studentScenarios = {};
    (studentRows.data || []).forEach((row) => {
      const key = `${row.access_code_id}:${row.student_name}`;
      if (!studentScenarios[key]) studentScenarios[key] = new Set();
      studentScenarios[key].add(row.scenario_number);
    });

    const scenarioCounts = Object.values(studentScenarios);
    const totalAnswers = studentRows.data?.length || 0;
    const completedStudents = scenarioCounts.filter((s) => s.size === 5).length;
    const totalStudents = scenarioCounts.length;

    return {
      totalAnswers,
      completedStudents,
      totalStudents,
      recentResponses: recentResponses.data || [],
      error: null,
    };
  } catch (error) {
    console.error("Error fetching initial stats:", error);
    return {
      totalAnswers: 0,
      completedStudents: 0,
      totalStudents: 0,
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