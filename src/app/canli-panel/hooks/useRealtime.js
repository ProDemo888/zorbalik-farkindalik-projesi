import { useState, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Supabase credentials not configured for realtime");
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export function useRealtime() {
  const [newResponses, setNewResponses] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState("connecting");
  const channelRef = useRef(null);
  const debounceTimerRef = useRef(null);
  const pendingResponsesRef = useRef([]);

  useEffect(() => {
    // Create channel for real-time subscriptions
    const channel = supabase
      .channel("responses-changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "responses",
          // Select only necessary columns to reduce payload
          select: "access_code_id,student_name,class_name,scenario_number,answer_1,answer_2,answer_3,ai_feedback,created_at",
        },
        (payload) => {
          // Add to pending responses for debouncing
          pendingResponsesRef.current.push(payload.new);

          // Clear existing timer and set new one
          if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
          }

          // Debounce updates to prevent UI flash during rapid submissions
          debounceTimerRef.current = setTimeout(() => {
            // Process all pending responses at once
            if (pendingResponsesRef.current.length > 0) {
              setNewResponses((prev) => [
                ...pendingResponsesRef.current.reverse(),
                ...prev,
              ]);
              pendingResponsesRef.current = [];
            }
          }, 500); // 500ms debounce delay
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          setConnectionStatus("subscribed");
          console.log("Real-time subscription active");
        } else if (status === "CLOSED" || status === "CHANNEL_ERROR") {
          setConnectionStatus("error");
          console.error("Real-time subscription error:", status);
        } else if (status === "TIMED_OUT") {
          setConnectionStatus("error");
          console.error("Real-time subscription timed out");
        }
      });

    channelRef.current = channel;

    // Cleanup on unmount
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      if (channel) {
        supabase.removeChannel(channel);
        console.log("Real-time subscription removed");
      }
    };
  }, []);

  return {
    newResponses,
    clearNewResponses: () => setNewResponses([]),
    connectionStatus,
  };
}