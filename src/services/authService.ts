import { supabase } from './supabase';

export const ensureAnonymousSession = async (): Promise<string> => {
  // Check whether an inspector session already exists.
  const { data: sessionData, error: sessionError } =
    await supabase.auth.getSession();

  if (sessionError) {
    throw sessionError;
  }

  // Reuse the existing inspector account.
  if (sessionData.session?.user) {
    return sessionData.session.user.id;
  }

  // Create a new anonymous inspector account.
  const { data, error } = await supabase.auth.signInAnonymously();

  if (error) {
    throw error;
  }

  if (!data.user) {
    throw new Error('Unable to create anonymous inspector account.');
  }

  return data.user.id;
};
