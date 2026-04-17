'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function loginWithEmployeeId(formData: FormData) {
  const employeeId = formData.get('employeeId') as string;
  const password = formData.get('password') as string;

  if (!employeeId || !password) {
    return { error: 'Employee ID and password are required' };
  }

  // MOCK LOGIN FOR FAST TESTING
  // We'll determine the theoretical role based on the employeeId prefix
  let role = 'employee';
  if (employeeId.startsWith('admin')) role = 'admin';
  else if (employeeId.startsWith('manager')) role = 'branch_manager';
  else if (employeeId.startsWith('secretary')) role = 'secretary';

  // Issue a mock session cookie
  const cookieStore = await cookies();
  cookieStore.set('mock-role', role, { 
    httpOnly: true, 
    secure: process.env.NODE_ENV === 'production',
    path: '/'
  });

  // Redirect to respective dashboard
  if (role === 'admin') redirect('/admin');
  if (role === 'branch_manager') redirect('/manager');
  if (role === 'secretary') redirect('/secretary');
  redirect('/employee');
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete('mock-role');
  redirect('/login');
}
