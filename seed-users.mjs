import pkg from '@next/env';
const { loadEnvConfig } = pkg;
import { createClient } from "@supabase/supabase-js";

const projectDir = process.cwd();
loadEnvConfig(projectDir);

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const users = [
  { employee_id: "EMP001", full_name: "Employee User", role: "employee" },
  { employee_id: "SEC001", full_name: "Secretary User", role: "secretary" },
  { employee_id: "ADM001", full_name: "Admin User", role: "admin" },
  { employee_id: "MGR001", full_name: "Manager User", role: "branch_manager" }
];

async function seed() {
  for (const u of users) {
    const email = `${u.employee_id.toLowerCase()}@aastmt.com`;
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password: "Password123!",
    });
    
    if (authError) {
      console.log("Auth error:", u.employee_id, authError.message);
      // Wait, if user already exists, let's login instead to get auth ID
      if (authError.message.includes("User already registered")) {
        console.log("User already exists, attempting to update profile anyway...");
        const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
          email,
          password: "Password123!"
        });
        if (loginData?.user) {
          await upsertProfile(loginData.user.id, u);
        }
      }
      continue;
    }
    await upsertProfile(authData.user.id, u);
  }
}

async function upsertProfile(userId, u) {
    const { error: profileError } = await supabase
      .from("profiles")
      .upsert({
        id: userId,
        employee_id: u.employee_id,
        full_name: u.full_name,
        role: u.role
      });
      
    if (profileError) {
      console.log("Profile error:", u.employee_id, profileError.message);
    } else {
      console.log("Created/Updated", u.employee_id);
    }
}

seed();
