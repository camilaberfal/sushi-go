import re

with open('src/app/scoreboard/[roomCode]/page.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

# Replace lucide imports
lucide_pattern = r'import\s+\{\s*BarChart3,\s*Clock3,\s*Crown,\s*Star,\s*Timer,\s*Trophy,\s*Zap\s*\}\s*from\s*"lucide-react";'
imgs_import = '''import gyozaImg from "@/app/assets/illustrations/gyoza-illustration.png";
import makisX3Img from "@/app/assets/illustrations/maki-illustration-x3.png";
import palillosImg from "@/app/assets/illustrations/palillos-illustration.png";
import pudinImg from "@/app/assets/illustrations/pudin-illustration.png";
import sashimiImg from "@/app/assets/illustrations/sashimi-illustration.png";
import tempuraImg from "@/app/assets/illustrations/tempura-illustration.png";
import wasabiImg from "@/app/assets/illustrations/wasabi-illustration.png";
import nigiriHuevoImg from "@/app/assets/illustrations/nigiri-huevo-illustration.png";
import nigiriSalmonImg from "@/app/assets/illustrations/nigiri-salmon-illustration.png";'''

text = re.sub(lucide_pattern, imgs_import, text)

# Replace Trophy -> makisX3Img
text = text.replace('<Trophy className="h-7 w-7" />', 'makisX3Img')
text = text.replace('<Star className="h-7 w-7" />', 'pudinImg')
text = text.replace('<Zap className="h-7 w-7" />', 'nigiriSalmonImg')
text = text.replace('<Clock3 className="h-7 w-7" />', 'tempuraImg')
text = text.replace('<Timer className="h-7 w-7" />', 'palillosImg')
text = text.replace('wasabiImg,\\n      winnerPlayerName: resolveWinnerName(highlights, ["sashimiCollector", "sashimi_collector"])', 'sashimiImg,\\n      winnerPlayerName: resolveWinnerName(highlights, ["sashimiCollector", "sashimi_collector"])')

# Handle BarChart3 (First one replaces with wasabiImg, second requires sashimiImg)
text = text.replace('<BarChart3 className="h-7 w-7" />', 'wasabiImg') 

# Handle Crown
text = text.replace('<Crown className="h-7 w-7" />', '"👑"')

with open('src/app/scoreboard/[roomCode]/page.tsx', 'w', encoding='utf-8') as f:
    f.write(text)