"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function loginWithEmployeeId(formData: FormData) {
  const employeeId = formData.get("employeeId") as string;
  const password = formData.get("password") as string;

  if (!employeeId || !password) {
    return { error: "Employee ID and password are required" };
  }

  const supabase = await createClient();

  // Create a pseudo-email from the employee ID for Supabase auth
  const email = `${employeeId.toLowerCase().trim()}@aastmt.system.local`;

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: "Invalid Employee ID or Password." };
  }

  // Fetch the custom user profile to determine their role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .single();

  const role = profile?.role || "employee";

  // Redirect to respective dashboard
  if (role === "admin") redirect("/admin");
  if (role === "branch_manager") redirect("/manager");
  if (role === "secretary") redirect("/secretary");
  redirect("/employee");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
