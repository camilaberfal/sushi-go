import re

file_path = "src/app/page.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    text = f.read()

# Eliminate old image imports
text = re.sub(r"import\s+pudinImg[^\n]+\n", "", text)
text = re.sub(r"import\s+sashimiImg[^\n]+\n", "", text)
text = re.sub(r"import\s+makiImg[^\n]+\n", "", text)


# Build the SVG background art string
background_svgs = """
      {/* Ilustraciones sutiles de fondo (Maki, Dumpling, y Nigiri) */}
      <motion.svg
        viewBox="0 0 100 100"
        className="absolute top-[10%] left-[10%] w-48 h-48 text-rose-100 opacity-10 drop-shadow-xl"
        animate={{ y: [0, -30, 0], x: [0, 15, 0], rotate: [0, 360] }}
        transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
      >
        <path d="M50 30 C30 30 20 40 20 50 C20 60 30 70 50 70 C70 70 80 60 80 50 C80 40 70 30 50 30 Z M50 40 C60 40 65 45 65 50 C65 55 60 60 50 60 C40 60 35 55 35 50 C35 45 40 40 50 40 Z" fill="currentColor"/>
        <circle cx="50" cy="50" r="4" fill="currentColor"/>
      </motion.svg>

      <motion.svg
        viewBox="0 0 100 100"
        className="absolute bottom-[10%] left-[15%] w-64 h-64 text-rose-50 opacity-5 drop-shadow-xl hidden md:block"
        animate={{ y: [0, 40, 0], x: [0, -20, 0], rotate: [360, 0] }}
        transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
      >
        <path d="M20 70 L30 30 C30 30 50 20 70 30 L80 70 C80 90 20 90 20 70 Z M30 35 C40 30 60 30 70 35 L75 65 C75 80 25 80 25 65 Z" fill="currentColor"/>
      </motion.svg>

      <motion.svg
        viewBox="0 0 100 100"
        className="absolute top-[20%] right-[8%] w-56 h-56 text-rose-200 opacity-10 drop-shadow-xl"
        animate={{ y: [0, 20, 0], x: [0, 20, 0], rotate: [0, -360] }}
        transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
      >
        <path d="M40 20 C20 20 20 40 20 40 L20 60 C20 80 80 80 80 60 L80 40 C80 40 80 20 60 20 Z M30 40 L70 40 M30 60 L70 60 M50 20 L50 80 M35 30 L65 30" stroke="currentColor" strokeWidth="3" fill="none" />
      </motion.svg>
"""

# Replace the floating game assets block
text = re.sub(r"\{\/\*\s*Floating game assets.*?hidden md:block\">\s*.*?<\/motion\.div>\s*<motion\.div.*?<\/motion\.div>", background_svgs, text, flags=re.DOTALL)


with open(file_path, "w", encoding="utf-8") as f:
    f.write(text)
print("Updated landing page vectors")
