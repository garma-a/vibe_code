'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

// ─── ROOMS ───────────────────────────────────────────────────
export async function addRoom(formData: FormData) {
  const supabase = await createClient();
  const name = (formData.get('name') as string)?.trim();
  const type = formData.get('type') as string;
  const capacity = parseInt(formData.get('capacity') as string) || 50;

  if (!name || !type) return { error: 'Name and type are required' };

  const { error } = await supabase
    .from('rooms')
    .insert({ name, type, capacity, is_active: true });

  if (error) return { error: error.message };
  revalidatePath('/admin/settings');
  return { success: true };
}

export async function deleteRoom(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('rooms').delete().eq('id', id);
  if (error) return { error: error.message };
  revalidatePath('/admin/settings');
  return { success: true };
}

export async function toggleRoomActive(id: string, is_active: boolean) {
  const supabase = await createClient();
  const { error } = await supabase.from('rooms').update({ is_active }).eq('id', id);
  if (error) return { error: error.message };
  revalidatePath('/admin/settings');
  return { success: true };
}

// ─── TIME SLOTS ──────────────────────────────────────────────
export async function addSlot(formData: FormData) {
  const supabase = await createClient();
  const slot_name = (formData.get('slot_name') as string)?.trim();
  const start_time = formData.get('start_time') as string;
  const end_time = formData.get('end_time') as string;

  if (!slot_name || !start_time || !end_time) return { error: 'All fields required' };
  if (start_time >= end_time) return { error: 'Start time must be before end time' };

  const { error } = await supabase
    .from('time_slots')
    .insert({ slot_name, start_time, end_time, is_active: true });

  if (error) return { error: error.message };
  revalidatePath('/admin/settings');
  return { success: true };
}

export async function deleteSlot(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('time_slots').delete().eq('id', id);
  if (error) return { error: error.message };
  revalidatePath('/admin/settings');
  return { success: true };
}

// ─── BOOKINGS ────────────────────────────────────────────────
export async function approveBooking(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('bookings')
    .update({ status: 'approved', admin_feedback: null })
    .eq('id', id);
  if (error) return { error: error.message };
  revalidatePath('/admin');
  return { success: true };
}

export async function rejectBooking(id: string, reason: string, alternative?: string) {
  const supabase = await createClient();
  const feedback = alternative ? `${reason}\n\nSuggested Alternative: ${alternative}` : reason;
  const { error } = await supabase
    .from('bookings')
    .update({ status: 'rejected', admin_feedback: feedback })
    .eq('id', id);
  if (error) return { error: error.message };
  revalidatePath('/admin');
  return { success: true };
}

// ─── USER MANAGEMENT ─────────────────────────────────────────
export async function toggleViewAllOverride(userId: string, value: boolean) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('profiles')
    .update({ override_view_all: value })
    .eq('id', userId);
  if (error) return { error: error.message };
  revalidatePath('/admin/users');
  return { success: true };
}

export async function addDelegation(formData: FormData) {
  const supabase = await createClient();
  const delegator_id = formData.get('delegator_id') as string;
  const substitute_id = formData.get('substitute_id') as string;
  const start_date = formData.get('start_date') as string;
  const end_date = formData.get('end_date') as string;

  if (!delegator_id || !substitute_id || !start_date || !end_date)
    return { error: 'All fields required' };
  if (start_date > end_date) return { error: 'Start must be before end date' };

  const { error } = await supabase
    .from('delegations')
    .insert({ delegator_id, substitute_id, start_date, end_date });

  if (error) return { error: error.message };
  revalidatePath('/admin/users');
  return { success: true };
}

// ─── ADMIN SELF-BOOKING (Multi-Purpose → Branch Manager) ─────
export async function bookMultiPurposeRoomAsAdmin(formData: FormData) {
  const supabase = await createClient();
  const cookieStore = await cookies();

  // Get the current admin user ID from the mock session cookie
  const adminUserId = cookieStore.get('mock-user-id')?.value;
  if (!adminUserId) return { error: 'Not authenticated' };

  const room_id = formData.get('room_id') as string;
  const time_slot_id = formData.get('time_slot_id') as string;
  const date = formData.get('date') as string;
  const reason = (formData.get('reason') as string)?.trim();
  const manager_name = (formData.get('manager_name') as string)?.trim();
  const manager_job_title = (formData.get('manager_job_title') as string)?.trim();
  const manager_mobile = (formData.get('manager_mobile') as string)?.trim();
  const has_laptop = formData.get('has_laptop') === 'on';
  const has_video_conf = formData.get('has_video_conf') === 'on';
  const mics_count = parseInt(formData.get('mics_count') as string) || 0;

  if (!room_id || !date || !reason || !manager_name) {
    return { error: 'Room, date, reason, and responsible name are required' };
  }

  // Check for booking conflict - no two approved bookings for same room+date+slot
  const conflictQuery = supabase
    .from('bookings')
    .select('id')
    .eq('room_id', room_id)
    .eq('date', date)
    .eq('status', 'approved');

  if (time_slot_id) conflictQuery.eq('time_slot_id', time_slot_id);

  const { data: conflicts } = await conflictQuery;
  if (conflicts && conflicts.length > 0) {
    return { error: 'This room is already booked at the selected time. Please choose another slot or room.' };
  }

  // Insert booking with status=approved (Admin bypasses their own approval)
  // branch_manager_status=pending so Branch Manager must give final sign-off
  const { error } = await supabase.from('bookings').insert({
    user_id: adminUserId,
    room_id: room_id || null,
    time_slot_id: time_slot_id || null,
    room_type: 'multi-purpose',
    date,
    reason,
    status: 'approved',          // Admin self-approves
    branch_manager_status: 'pending', // Still needs Branch Manager final sign-off
    manager_name,
    manager_job_title,
    manager_mobile,
    has_laptop,
    has_video_conf,
    mics_count,
  });

  if (error) return { error: error.message };
  revalidatePath('/admin');
  return { success: true };
}
