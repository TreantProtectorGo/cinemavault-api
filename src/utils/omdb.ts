export function normaliseOmdbApiKey(value: string | undefined) {
  const trimmedValue = value?.trim();

  if (!trimmedValue) {
    return undefined;
  }

  try {
    const url = new URL(trimmedValue);
    const apiKey = url.searchParams.get("apikey")?.trim();

    return apiKey || trimmedValue;
  } catch {
    return trimmedValue;
  }
}
