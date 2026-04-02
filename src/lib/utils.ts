type ClassToken = string | false | null | undefined;

export function cn(...inputs: ClassToken[]): string {
  return inputs.filter(Boolean).join(" ");
}
