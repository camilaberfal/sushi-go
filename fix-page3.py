import re

file_path = "src/app/page.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    text = f.read()

# Eliminar las motion.svg que había insertado
text = re.sub(r"\{\/\*\s*Ilustraciones sutiles de fondo.*?</motion\.svg>\s*</motion\.svg>\s*</motion\.svg>\s*", "", text, flags=re.DOTALL)

# Add FloatingBackground component implementation
if "FloatingBackground" not in text:
    text = text.replace("import { Button } from \"@/components/ui\";\n", "import { Button } from \"@/components/ui\";\nimport { FloatingBackground } from \"@/components/landing/floating-background\";\n")
    text = text.replace("{/* Textura radial */}", "<FloatingBackground />\n      {/* Textura radial */}")

with open(file_path, "w", encoding="utf-8") as f:
    f.write(text)
print("Restored original floating-background illustrations to the landing page")
