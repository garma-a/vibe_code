'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export async function loginWithEmployeeId(formData: FormData) {
  const employeeId = (formData.get('employeeId') as string)?.trim();
  const password = (formData.get('password') as string)?.trim();

  if (!employeeId || !password) {
    return { error: 'Employee ID and password are required' };
  }

  // Look up the profile in the database by employee_id
  const supabase = await createClient();
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('id, role, employee_id, full_name')
    .eq('employee_id', employeeId)
    .single();

  if (error || !profile) {
    return { error: 'Invalid Employee ID or password.' };
  }

  // For now, we validate password as "password123" for all users (until Supabase Auth is wired)
  // TODO: Replace with Supabase Auth signInWithPassword when ready
  if (password !== 'password123') {
    return { error: 'Invalid Employee ID or password.' };
  }

  // Set a session cookie with the real role and user ID from DB
  const cookieStore = await cookies();
  cookieStore.set('mock-role', profile.role, { httpOnly: true, secure: process.env.NODE_ENV === 'production', path: '/' });
  cookieStore.set('mock-user-id', profile.id, { httpOnly: true, secure: process.env.NODE_ENV === 'production', path: '/' });
  cookieStore.set('mock-employee-id', profile.employee_id, { httpOnly: true, secure: process.env.NODE_ENV === 'production', path: '/' });

  // Redirect to role-based dashboard
  if (profile.role === 'admin') redirect('/admin');
  if (profile.role === 'branch_manager') redirect('/manager');
  if (profile.role === 'secretary') redirect('/secretary');
  redirect('/employee');
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete('mock-role');
  cookieStore.delete('mock-user-id');
  cookieStore.delete('mock-employee-id');
  redirect('/login');
}

// Helper: get current logged-in user profile from cookies
export async function getCurrentUserProfile() {
  const cookieStore = await cookies();
  const userId = cookieStore.get('mock-user-id')?.value;
  if (!userId) return null;

  const supabase = await createClient();
  const { data } = await supabase
    .from('profiles')
    .select('id, employee_id, full_name, role')
    .eq('id', userId)
    .single();

  return data;
}
