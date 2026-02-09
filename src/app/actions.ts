'use server';

import { createServiceClient } from '@/lib/supabase/server';

export async function subscribeEmail(formData: FormData) {
    const email = formData.get('email') as string;

    if (!email || !email.includes('@')) {
        return { success: false, error: 'Please provide a valid email address' };
    }

    try {
        const supabase = createServiceClient();

        const { error } = await supabase
            .from('email_signups')
            .upsert({ email }, { onConflict: 'email' });

        if (error) {
            console.error('Email signup error:', error);
            return { success: false, error: 'Something went wrong. Please try again.' };
        }

        return { success: true };
    } catch (err) {
        console.error('Email signup exception:', err);
        return { success: false, error: 'Something went wrong. Please try again.' };
    }
}
