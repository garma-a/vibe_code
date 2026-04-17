'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export async function managerApproveBooking(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('bookings')
    .update({ 
      branch_manager_status: 'approved',
      branch_manager_feedback: null 
    })
    .eq('id', id);

  if (error) return { error: error.message };
  revalidatePath('/manager');
  return { success: true };
}

export async function managerRejectBooking(id: string, reason: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('bookings')
    .update({ 
      branch_manager_status: 'rejected', 
      branch_manager_feedback: reason 
    })
    .eq('id', id);

  if (error) return { error: error.message };
  revalidatePath('/manager');
  return { success: true };
}
