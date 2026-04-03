
import os
files = [
    "src/app/page.tsx",
    "src/components/landing/create-room-modal.tsx",
    "src/components/landing/join-room-modal.tsx",
    "src/app/lobby/[roomCode]/page.tsx",
    "src/components/lobby/player-list.tsx",
    "src/components/lobby/room-code.tsx"
]

for f in files:
    with open(f, "r", encoding="utf-8") as file:
        content = file.read()
    
    content = content.replace("playSfx(\"click\")", "playSfx(\"select\")")
    content = content.replace("playSfx(\"error\")", "playSfx(\"reveal\")")
    content = content.replace("playSfx(\"alert\")", "playSfx(\"whoosh\")")

    with open(f, "w", encoding="utf-8") as file:
        file.write(content)

print("Fixed sounds")

