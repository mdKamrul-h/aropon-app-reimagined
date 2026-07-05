import { supabase } from '@/lib/supabase';
import { uuid } from '@/utils/bn-numerals';

export async function uploadBusinessLogo(
  ownerId: string,
  localUri: string,
): Promise<string | null> {
  const ext = localUri.split('.').pop()?.split('?')[0] ?? 'jpg';
  const path = `${ownerId}/${uuid()}.${ext}`;
  const response = await fetch(localUri);
  const arrayBuffer = await response.arrayBuffer();
  const contentType = ext === 'png' ? 'image/png' : 'image/jpeg';

  const { error } = await supabase.storage.from('business-logos').upload(path, arrayBuffer, {
    contentType,
    upsert: true,
  });
  if (error) return null;

  const { data } = supabase.storage.from('business-logos').getPublicUrl(path);
  return data.publicUrl;
}
