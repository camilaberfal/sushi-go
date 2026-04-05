"use client";

import Image from "next/image";
import type { StaticImageData } from "next/image";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Star } from "lucide-react";

import { CreateRoomModal } from "@/components/landing/create-room-modal";
import { JoinRoomModal } from "@/components/landing/join-room-modal";
import { Button } from "@/components/ui";
import { FloatingBackground } from "@/components/landing/floating-background";
import { playSfx } from "@/lib/audio";

import gyozaIllustration from "@/app/assets/illustrations/gyoza-illustration.png";
import makiIllustrationX1 from "@/app/assets/illustrations/maki-illustration-x1.png";
import makiIllustrationX3 from "@/app/assets/illustrations/maki-illustration-x3.png";
import nigiriIllustration from "@/app/assets/illustrations/nigiri-salmon-illustration.png";
import palillosIllustration from "@/app/assets/illustrations/palillos-illustration.png";
import wasabiIllustration from "@/app/assets/illustrations/wasabi-illustration.png";
import pudinIllustration from "@/app/assets/illustrations/pudin-illustration.png";
import gyozaCard from "@/app/assets/cards/gyoza.png";
import makiCardX1 from "@/app/assets/cards/makis-x1.png";
import makiCardX2 from "@/app/assets/cards/makis-x2.png";
import makiCardX3 from "@/app/assets/cards/makis-x3.png";
import nigiriSalmonCard from "@/app/assets/cards/nigiri-de-salmon.png";
import nigiriSquidCard from "@/app/assets/cards/nigiri-de-calamar.png";
import nigiriEggCard from "@/app/assets/cards/nigiri-de-huevo.png";
import palillosCard from "@/app/assets/cards/palillos.png";
import puddingCard from "@/app/assets/cards/pudin.png";
import sashimiCard from "@/app/assets/cards/sashimi.png";
import tempuraCard from "@/app/assets/cards/tempura.png";
import wasabiCard from "@/app/assets/cards/wasabi.png";

type StepItem = {
  title: string;
  description: string;
  accent: string;
  image?: StaticImageData;
  icon?: React.ReactNode;
};

type CardGuideItem = {
  title: string;
  points: string;
  insight: string;
  chipClassName: string;
  image: StaticImageData;
};

const gameplaySteps: StepItem[] = [
  {
    title: "1. Entra a la sala",
    description:
      "Crea una sala privada o usa un código para unirte. Cuando todos estén listos, empieza la ronda.",
    accent: "from-rose-500/25 to-transparent",
    icon: <span className="text-4xl drop-shadow-sm">🎮</span>,
  },
  {
    title: "2. Elige una carta",
    description:
      "Todos seleccionan una carta en secreto al mismo tiempo. La decisión importa mucho por los combos.",
    accent: "from-indigo-500/25 to-transparent",
    image: makiCardX1,
  },
  {
    title: "3. Pasa la mano",
    description:
      "Después de revelar, cada jugador pasa el resto de cartas al siguiente. Cada turno cambia tus opciones.",
    accent: "from-amber-400/20 to-transparent",
    icon: <span className="text-4xl drop-shadow-sm">🔄</span>,
  },
  {
    title: "4. Puntúa y repite",
    description:
      "Al final de cada ronda se calculan puntos automáticamente. Tras 3 rondas, gana quien más puntos tenga.",
    accent: "from-emerald-400/20 to-transparent",
    icon: <Star className="h-9 w-9 fill-amber-400 text-amber-500 drop-shadow-sm" />,
  },
];

const cardGuide: CardGuideItem[] = [
  {
    title: "Sashimi",
    points: "10 pts por trío",
    insight: "Una o dos no valen nada: necesitas 3 para puntuar.",
    chipClassName: "bg-rose-500/20 text-rose-200",
    image: sashimiCard,
  },
  {
    title: "Tempura",
    points: "5 pts por pareja",
    insight: "Ideal para ir a lo seguro. Junta 2 iguales para sumar puntos rápidos.",
    chipClassName: "bg-orange-500/20 text-orange-200",
    image: tempuraCard,
  },
  {
    title: "Wasabi",
    points: "x3 al próximo Nigiri",
    insight: "Triplica el valor del siguiente nigiri que coloques encima. ¡Combo letal!",
    chipClassName: "bg-emerald-500/20 text-emerald-200",
    image: wasabiCard,
  },
  {
    title: "Niguri de Calamar",
    points: "3 pts (9 con Wasabi)",
    insight: "La carta más fuerte de nigiri. Prioridad absoluta con un wasabi listo.",
    chipClassName: "bg-slate-200/20 text-slate-100",
    image: nigiriSquidCard,
  },
  {
    title: "Nigiri de Salmón",
    points: "2 pts (6 con Wasabi)",
    insight: "Puntos consistentes y fáciles de obtener durante toda la partida.",
    chipClassName: "bg-orange-400/20 text-orange-100",
    image: nigiriSalmonCard,
  },
  {
    title: "Nigiri de Huevo",
    points: "1 pt (3 con Wasabi)",
    insight: "Útil para cerrar un wasabi si no hay mejores opciones disponibles.",
    chipClassName: "bg-yellow-400/20 text-yellow-100",
    image: nigiriEggCard,
  },
  {
    title: "Makis",
    points: "Mayorías al final",
    insight: "No puntúa por unidad; compites por tener la mayor cantidad de iconos.",
    chipClassName: "bg-violet-500/20 text-violet-200",
    image: makiCardX3,
  },
  {
    title: "Gyoza",
    points: "Escala por cantidad",
    insight: "Cada gyoza extra vale más que la anterior (1, 3, 6, 10, 15).",
    chipClassName: "bg-amber-500/20 text-amber-200",
    image: gyozaCard,
  },
  {
    title: "Pudín",
    points: "Se define al final",
    insight: "Guárdalo toda la partida: te da 6 pts si tienes más, o te quita si tienes menos.",
    chipClassName: "bg-fuchsia-500/20 text-fuchsia-200",
    image: puddingCard,
  },
  {
    title: "Palillos",
    points: "Doble acción",
    insight: "Permite jugar dos cartas en un turno clave; útil para cerrar combos.",
    chipClassName: "bg-lime-500/20 text-lime-200",
    image: palillosCard,
  },
];


export default function Home() {
  const [createOpen, setCreateOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const [joinCodeParam, setJoinCodeParam] = useState("");

  useEffect(() => {
    const joinParam = new URLSearchParams(window.location.search).get("join") ?? "";
    setJoinCodeParam(joinParam.trim().toUpperCase());
  }, []);

  useEffect(() => {
    if (joinCodeParam.length < 4) return;
    setJoinOpen(true);
  }, [joinCodeParam]);

  const handleCreate = () => {
    playSfx("select");
    setCreateOpen(true);
  };

  const handleJoin = () => {
    playSfx("select");
    setJoinOpen(true);
  };

  return (
    <main className="w-full select-none bg-[#09040f] text-white">
      <section className="relative min-h-[100dvh] overflow-hidden bg-[#1a0f14]">
        <FloatingBackground />
        <div
          className="pointer-events-none absolute inset-0 z-0 opacity-20"
          style={{
            backgroundImage: "radial-gradient(circle, #fbbf24 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
        <div className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(circle_at_50%_30%,rgba(225,29,72,0.35),transparent_55%)]" />

        <div className="relative z-10 mx-auto flex min-h-[100dvh] w-full max-w-5xl flex-col items-center justify-center gap-7 px-4 py-14 text-center sm:gap-8 sm:py-16 lg:py-18">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 120, damping: 12 }}
            className="relative"
          >
            <div className="absolute inset-0 scale-105 rounded-full bg-rose-500/20 blur-3xl" />
            <Image
              src="/sushigo-logo.png"
              alt="Sushi Go logo"
              width={420}
              height={140}
              className="relative w-[min(82vw,420px)] drop-shadow-[0_10px_18px_rgba(0,0,0,0.78)]"
              priority
            />
          </motion.div>

          <motion.div
            initial={{ y: 28, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: "spring", bounce: 0.25, delay: 0.15 }}
            className="w-full max-w-xl rounded-3xl border border-white/10 bg-[#1c0d12]/95 p-6 shadow-[inset_0_2px_4px_rgba(255,255,255,0.05),0_20px_34px_rgba(0,0,0,0.74)] backdrop-blur-sm sm:p-8"
          >
            <p className="mx-auto max-w-lg text-base font-bold uppercase tracking-[0.16em] text-rose-100 sm:text-lg">
              El juego de comer cartas.
            </p>

            <div className="mt-7 grid gap-4 sm:grid-cols-2 sm:gap-5">
              <Button
                className="h-14 rounded-xl border-b-4 border-rose-900 bg-rose-600 text-lg font-black uppercase tracking-widest text-white shadow-[inset_0_2px_4px_rgba(255,255,255,0.3),0_8px_16px_rgba(225,29,72,0.4)] transition-all hover:-translate-y-1 hover:bg-rose-500 hover:shadow-[inset_0_2px_4px_rgba(255,255,255,0.4),0_12px_20px_rgba(225,29,72,0.58)] active:translate-y-1 active:mt-1 active:border-b-0 focus-visible:ring-rose-500"
                onClick={handleCreate}
              >
                Crear sala
              </Button>
              <Button
                className="h-14 rounded-xl border-b-4 border-indigo-900 bg-indigo-600 text-lg font-black uppercase tracking-widest text-white shadow-[inset_0_2px_4px_rgba(255,255,255,0.3),0_8px_16px_rgba(79,70,229,0.4)] transition-all hover:-translate-y-1 hover:bg-indigo-500 hover:shadow-[inset_0_2px_4px_rgba(255,255,255,0.4),0_12px_20px_rgba(79,70,229,0.58)] active:translate-y-1 active:mt-1 active:border-b-0 focus-visible:ring-indigo-500"
                onClick={handleJoin}
                style={{ backgroundColor: "#4f46e5", borderColor: "#312e81" }}
              >
                Unirse
              </Button>
            </div>

            <p className="mt-5 text-sm text-rose-200/85">
              Elige tus cartas sabiamente y compite en partidas de 2 a 5 jugadores.
            </p>
          </motion.div>
        </div>

        <div className="relative z-10 w-full">
          <svg className="absolute bottom-0 left-0 w-full h-24 text-[#1a0b12] translate-y-px" viewBox="0 0 1440 320" fill="currentColor" preserveAspectRatio="none">
            <path d="M0,160L48,144C96,128,192,96,288,106.7C384,117,480,171,576,186.7C672,203,768,181,864,154.7C960,128,1056,96,1152,96C1248,96,1344,128,1392,144L1440,160V320H1392C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320H0Z"></path>
          </svg>
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-32 bg-gradient-to-b from-transparent to-[#1a0b12]/50" />
        </div>
      </section>

      {/* SECCIÓN DE EXPLORACIÓN DE GAMEPLAY - Unified Dark Wood Theme */}
      <section className="relative overflow-hidden bg-[#1a0b12] pt-24 sm:pt-32">
        
        {/* INTRODUCCIÓN A SUSHI GO */}
        <div className="container relative z-20 mx-auto mb-32 max-w-4xl px-4 md:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex flex-col items-center"
          >
            <div className="mb-6 inline-flex rotate-1 items-center justify-center border-2 border-rose-900 bg-rose-950/40 px-6 py-2 shadow-sm">
              <span className="font-heading text-lg font-black uppercase tracking-widest text-rose-400">¿Qué es Sushi Go?</span>
            </div>
            <h2 className="font-heading text-4xl font-black uppercase tracking-tight text-white sm:text-5xl md:text-6xl">
              Arma tu menú,<br/>
              <span className="text-amber-500">supera a tus rivales</span>
            </h2>
            <p className="mx-auto mt-8 max-w-2xl text-xl leading-relaxed font-medium text-white/70">
              En Sushi Go!, el objetivo es conseguir la mejor combinación de platillos a lo largo de 3 rondas. 
              El truco está en que las cartas están en constante movimiento: eliges una, la juegas, y pasas el resto de tu mano al siguiente jugador. 
              ¡Tendrás que adaptarte rápido a lo que te dejen!
            </p>
          </motion.div>
        </div>

        <div className="container relative z-20 mx-auto px-6 md:px-12 xl:px-24">
          
          {/* 1. La Experiencia 3D */}
          <div className="mb-40 flex flex-col items-center lg:items-center gap-12 lg:gap-16 lg:flex-row">
            <motion.div 
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="lg:w-2/5"
            >
              <div className="inline-block -rotate-2 bg-[#fdf8f0] px-4 py-2 font-bold uppercase tracking-widest text-[#594334] shadow-[2px_4px_8px_rgba(0,0,0,0.5),inset_0_0_10px_rgba(182,156,120,0.3)] border border-[#e0d5ba] mb-6 relative">
                 <div className="absolute -top-2 left-1/2 h-4 w-12 -translate-x-1/2 bg-white/50 shadow-[0_2px_4px_rgba(0,0,0,0.1)] backdrop-blur-sm border-x border-[#c9c5ba] rotate-3" />
                 ¿Cómo funciona la mesa?
              </div>
              <h2 className="font-heading text-5xl font-black uppercase text-white tracking-tight leading-[1.1]">Mira tus <br/><span className="text-amber-500 underline decoration-amber-500/30 underline-offset-8">colecciones</span></h2>
              <p className="mt-8 text-xl text-white/60 leading-relaxed font-medium">
                En la mesa verás lo que todos han jugado. Observa las colecciones completarse progresivamente; no pierdas de vista los pudines de los demás, ¡te quitarán puntos al final si te descuidas!
              </p>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="relative lg:w-3/5 w-full flex justify-center py-10"
            >
              <div className="relative z-10 w-full max-w-[800px] aspect-[16/10] overflow-hidden rounded-[2rem] border-[8px] border-[#2a141d] bg-[#0c0508] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.8)] sm:rounded-[3rem] sm:border-[12px] flex items-center justify-center bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.05),transparent_50%)]">
                <Image 
                  src="/gameplay-table-clean.png" 
                  alt="Mesa de Juego 3D" 
                  width={1400}
                  height={800}
                  className="w-full h-full object-cover object-[center_58%] scale-[1.32]" 
                />
              </div>
              {/* Decorative Floating Asset */}
              <motion.div 
                animate={{ y: [0, -15, 0], rotate: [5, 8, 5] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -right-4 -top-8 z-20 w-24 drop-shadow-2xl sm:-right-6 sm:-top-6 sm:w-32"
              >
                <Image src={makiCardX3} alt="" className="rounded-xl border-2 border-white/10" />
              </motion.div>
            </motion.div>
          </div>

          {/* 2. La Mano de Cartas */}
          <div className="mb-40 flex flex-col-reverse items-center lg:items-center gap-12 lg:gap-16 lg:flex-row">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="relative lg:w-3/5 w-full flex justify-center py-10"
            >
              <div className="relative z-10 w-full max-w-[700px] aspect-[16/10] overflow-hidden rounded-[2rem] border-[8px] border-[#2a141d] bg-[#0c0508] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.8)] sm:rounded-[3rem] sm:border-[12px] flex items-center justify-center bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.05),transparent_50%)]">
                <Image 
                  src="/gameplay-hand-clean.png" 
                  alt="Mano de Cartas" 
                  width={1400}
                  height={800}
                  className="w-full h-full object-cover object-[center_52%] scale-[1.22]" 
                />
              </div>
              <motion.div 
                animate={{ x: [0, 10, 0], y: [0, 5, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -bottom-6 -left-6 z-20 w-32 drop-shadow-2xl rotate-[-12deg] sm:-bottom-10 sm:-left-10 sm:w-44"
              >
                <Image src={palillosIllustration} alt="" />
              </motion.div>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="lg:w-2/5"
            >
              <div className="inline-block rotate-2 bg-[#fdf8f0] px-4 py-2 font-bold uppercase tracking-widest text-[#594334] shadow-[2px_4px_8px_rgba(0,0,0,0.5),inset_0_0_10px_rgba(182,156,120,0.3)] border border-[#e0d5ba] mb-6 relative">
                 <div className="absolute -top-2 left-1/2 h-4 w-12 -translate-x-1/2 bg-white/50 shadow-[0_2px_4px_rgba(0,0,0,0.1)] backdrop-blur-sm border-x border-[#c9c5ba] -rotate-3" />
                 ¿Qué haces con tus cartas?
              </div>
              <h2 className="font-heading text-5xl font-black uppercase text-white tracking-tight leading-[1.1]">Elige una, <br/><span className="text-rose-500 underline decoration-rose-500/30 underline-offset-8">pasa el resto</span></h2>
              <p className="mt-8 text-xl text-white/60 leading-relaxed font-medium">
                En cada turno, seleccionas en secreto la carta que jugarás, ¡y le pasas el resto al siguiente jugador! Analiza tus opciones, haz combos y evita que tus rivales consigan lo que necesitan.
              </p>
            </motion.div>
          </div>

          {/* 3. El Scoreboard */}
          <div className="flex flex-col items-center lg:items-center gap-12 lg:gap-16 lg:flex-row pb-24">
            <motion.div 
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="lg:w-1/2 xl:w-2/5"
            >
              <div className="inline-block -rotate-1 bg-[#fdf8f0] px-4 py-2 font-bold uppercase tracking-widest text-[#594334] shadow-[2px_4px_8px_rgba(0,0,0,0.5),inset_0_0_10px_rgba(182,156,120,0.3)] border border-[#e0d5ba] mb-6 relative">
                 <div className="absolute -top-2 left-1/2 h-4 w-12 -translate-x-1/2 bg-white/50 shadow-[0_2px_4px_rgba(0,0,0,0.1)] backdrop-blur-sm border-x border-[#c9c5ba] rotate-2" />
                 Resultados automáticos
              </div>
              <h2 className="font-heading text-5xl font-black uppercase text-white tracking-tight leading-[1.1]">Cuentas <br/><span className="text-indigo-400 underline decoration-indigo-400/30 underline-offset-8">claras</span></h2>
              <p className="mt-8 mb-6 text-xl text-white/60 leading-relaxed font-medium">
                Al terminar cada ronda te mostraremos los puntajes calculados al instante y el desglose de combos. Así sabrás rápidamente quién ganó con ese trío de sashimis y a quién culpar.
              </p>
              <p className="text-xl text-white/60 leading-relaxed font-medium italic">
                ¿Curioso por ver exactamente cuánto vale cada carta? Desliza abajo y conoce las reglas...
              </p>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="relative flex justify-center lg:w-1/2 xl:w-3/5 py-10"
            >
              <div className="relative z-10 w-full max-w-[360px] aspect-[9/16] sm:aspect-[10/16] overflow-hidden rounded-[2rem] border-[8px] border-[#2a141d] bg-[#0c0508] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.8)] sm:rounded-[3rem] sm:border-[12px] flex items-center justify-center bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.05),transparent_50%)]">
                <Image 
                  src="/gameplay-scoreboard-clean.png" 
                  alt="Panel de Puntos" 
                  width={1400}
                  height={800}
                  className="w-full h-full object-cover object-[52%_80%] scale-[1.02]"
                  priority
                />
              </div>
              <motion.div 
                animate={{ rotate: [-5, 5, -5] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -right-8 -top-8 z-20 w-32 drop-shadow-2xl"
              >
                <Image src={wasabiIllustration} alt="" className="rotate-12" />
              </motion.div>
            </motion.div>
          </div>

        </div>
        
        {/* Background Textures */}
        <div className="pointer-events-none absolute inset-0 z-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/dark-wood.png')]" />

        {/* Transition SVG directly connecting smoothly */}
        <div className="absolute bottom-0 left-0 right-0 z-10 w-full translate-y-px">
          <svg className="w-full h-16 sm:h-24 text-[#391c11]" viewBox="0 0 1440 320" fill="currentColor" preserveAspectRatio="none">
             <path d="M0,64L80,106.7C160,149,320,235,480,245.3C640,256,800,181,960,165.3C1120,149,1280,192,1360,213.3L1440,235V320H1360C1280,320,1120,320,960,320C800,320,640,320,480,320C320,320,160,320,80,320H0Z"></path>
          </svg>
        </div>
      </section>

      <section 
        className="relative min-h-screen pb-16 sm:pb-24 pt-10"
        style={{
          backgroundColor: "#391c11",
          backgroundImage: `
            repeating-linear-gradient(90deg, transparent 0, transparent 60px, rgba(0,0,0,0.03) 60px, rgba(0,0,0,0.03) 62px),
            linear-gradient(to bottom, #361a0f, transparent 200px),
            repeating-linear-gradient(0deg, rgba(82,47,27,0.9), rgba(99,57,32,0.9) 15px, rgba(78,44,24,0.9) 30px)
          `,
        }}
      >
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
          {/* Menú de Reglas (Papel sobre la madera) */}
          <motion.div
            initial={{ y: 30, opacity: 0, rotate: -2 }}
            whileInView={{ y: 0, opacity: 1, rotate: -1.5 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ type: "spring", stiffness: 90 }}
            className="relative mx-auto max-w-4xl rounded-sm bg-[#fdf8f0] px-6 py-12 text-slate-800 shadow-[4px_25px_30px_rgba(0,0,0,0.7),inset_0_0_80px_rgba(182,156,120,0.2)] md:p-14"
            style={{
              backgroundImage: "radial-gradient(#e3dbc9 1.5px, transparent 1.5px)",
              backgroundSize: "24px 24px",
              backgroundPosition: "0 0",
              border: "1px solid #e0d5ba"
            }}
          >
            {/* Cintas adhesivas simuladas */}
            <div className="absolute -top-4 left-1/4 h-8 w-28 rotate-3 bg-white/50 shadow-[0_2px_4px_rgba(0,0,0,0.15)] backdrop-blur-sm border-x border-[#c9c5ba]" />
            <div className="absolute -top-4 right-1/4 h-8 w-28 -rotate-6 bg-white/50 shadow-[0_2px_4px_rgba(0,0,0,0.15)] backdrop-blur-sm border-x border-[#c9c5ba]" />
            
            <div className="text-center">
              <h2 className="font-heading text-4xl font-black uppercase tracking-widest text-[#2c1d11] drop-shadow-sm sm:text-5xl">
                Manual del Chef
              </h2>
              <p className="mx-auto mt-4 max-w-2xl font-body text-lg font-bold italic text-[#594334]">
                "Preparación rápida, estrategia picante."
              </p>
            </div>

            <div className="mt-14 grid gap-8 md:grid-cols-2">
              {gameplaySteps.map((step, index) => (
                <div key={index} className="flex gap-5 border-b-[3px] border-dotted border-[#d6ccb8] pb-8">
                  <div className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-rose-50 shadow-[inset_0_4px_12px_rgba(159,18,57,0.15),0_4px_8px_rgba(0,0,0,0.1)] border-4 border-white overflow-hidden">
                    {step.icon ? step.icon : (step.image && <Image src={step.image} alt={step.title} className="h-10 w-10 object-contain drop-shadow-md scale-125" />)}
                  </div>
                  <div>
                    <h3 className="font-heading text-2xl font-black text-[#38271d]">{step.title}</h3>
                    <p className="mt-2 text-base font-semibold leading-relaxed text-[#634e3e]">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Cartas distribuidas fisicamente sobre la mesa */}
          <div className="mt-32">
            <motion.h2 
              initial={{ y: 20, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true, amount: 0.8 }}
              className="mb-16 text-center font-heading text-4xl font-black uppercase tracking-wider text-[#fff4e6] drop-shadow-[0_8px_12px_rgba(0,0,0,0.9)]" 
              style={{ textShadow: "0 4px 0 #2b160d" }}
            >
              Menú de Cartas
            </motion.h2>
            <div className="grid gap-x-8 gap-y-16 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4">
              {cardGuide.map((item, index) => {
                const baseRot = (index % 2 === 0 ? 1 : -1) * (2 + (index % 3) * 2);
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 60, scale: 0.9, rotate: baseRot - 15 }}
                    whileInView={{ opacity: 1, y: 0, scale: 1, rotate: baseRot }}
                    viewport={{ once: true, amount: 0.2 }}
                    transition={{ type: "spring", bounce: 0.45, delay: index * 0.1 }}
                    className="relative flex w-full flex-col items-center justify-center group"
                  >
                    {/* Shadow de la carta exagerado al hacer hover */}
                    <div className="relative z-10 w-full overflow-hidden rounded-xl border-[6px] border-white bg-white shadow-[0_15px_35px_rgba(0,0,0,0.6),inset_0_0_2px_rgba(0,0,0,0.2)] transition-all duration-300 group-hover:-translate-y-8 group-hover:scale-110 group-hover:rotate-0 group-hover:shadow-[0_30px_60px_rgba(0,0,0,0.8)]">
                      <Image
                        src={item.image}
                        alt={item.title}
                        className="h-auto w-full object-contain transition-transform duration-700 group-hover:scale-105"
                      />
                    </div>
                    {/* Etiqueta de madera con chincheta */}
                    <div className="relative z-20 -mt-8 flex w-11/12 flex-col items-center rounded-md border-y-4 border-[#301c11] bg-[#e6c193] px-4 py-4 text-center shadow-[0_10px_20px_rgba(0,0,0,0.6)] transition-transform duration-300 group-hover:-translate-y-3" style={{ backgroundImage: "linear-gradient(180deg, rgba(255,255,255,0.1), transparent)" }}>
                      <div className="absolute -top-3 h-4 w-4 rounded-full border-2 border-[#1c1a17] bg-zinc-400 shadow-[2px_4px_6px_rgba(0,0,0,0.5),inset_-2px_-2px_4px_rgba(0,0,0,0.4)]" />
                      <h4 className="font-heading text-xl font-black uppercase text-[#2e1d13] drop-shadow-sm">{item.title}</h4>
                      <div className="mt-2 inline-block rounded border-2 border-dashed border-[#8d5b36] bg-[#f8efcd] px-3 py-1 text-xs font-black uppercase tracking-widest text-[#9f1239]">
                        {item.points}
                      </div>
                      <p className="mt-3 text-sm font-bold leading-tight text-[#4a2e1d]">{item.insight}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>


          {/* Sección de Tácticas / Combos */}
          <div className="mt-32">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="relative overflow-hidden rounded-3xl border-4 border-[#3d2216] bg-[#2a1810] p-8 shadow-2xl md:p-12"
            >
              <div className="absolute top-0 right-0 -translate-y-12 translate-x-12 opacity-10">
                <Image src={wasabiIllustration} alt="" width={400} height={400} />
              </div>
              
              <div className="relative z-10 grid gap-12 lg:grid-cols-2 lg:items-center">
                <div>
                  <h2 className="font-heading text-4xl font-black uppercase text-amber-500">Tácticas del Chef</h2>
                  <p className="mt-4 text-xl font-bold text-amber-100/80">
                    Domina el arte del combo. La diferencia entre un aprendiz y un maestro está en cómo apilas tus sabores.
                  </p>
                  
                  <ul className="mt-8 space-y-6">
                    <li className="flex gap-4">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                      </div>
                      <p className="text-lg font-semibold text-white/90">
                        <span className="text-emerald-400">Combo Wasabi:</span> Juega el wasabi primero. Cualquier Nigiri que pongas encima triplica su valor automáticamente.
                      </p>
                    </li>
                    <li className="flex gap-4">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-amber-400">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                      </div>
                      <p className="text-lg font-semibold text-white/90">
                        <span className="text-amber-400">Estrategia Gyoza:</span> No te detengas. Una es poco, pero cinco son una fortuna. ¡Ve a por todas!
                      </p>
                    </li>
                  </ul>
                </div>

                <div className="relative flex items-center justify-center py-10">
                  <div className="relative flex scale-90 sm:scale-100">
                    {/* Visualización del combo Wasabi + Nigiri */}
                    <motion.div 
                      animate={{ rotate: -5, y: [0, -5, 0] }}
                      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                      className="relative z-10 w-48 rounded-xl border-4 border-white bg-white shadow-2xl"
                    >
                      <Image src={wasabiCard} alt="Wasabi" className="w-full" />
                    </motion.div>
                    
                    <motion.div 
                      initial={{ x: 100, opacity: 0, rotate: 15 }}
                      whileInView={{ x: 40, opacity: 1, rotate: 5 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.5, type: "spring" }}
                      className="absolute left-1/2 top-4 z-20 w-48 rounded-xl border-4 border-white bg-white shadow-2xl"
                    >
                      <Image src={nigiriSquidCard} alt="Nigiri Squid" className="w-full" />
                    </motion.div>

                    <motion.div 
                      initial={{ scale: 0, opacity: 0 }}
                      whileInView={{ scale: 1, opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: 1, type: "spring" }}
                      className="absolute -right-4 -top-8 z-30 flex h-24 w-24 items-center justify-center rounded-full border-4 border-amber-400 bg-rose-600 font-heading text-4xl font-black text-white shadow-2xl outline outline-8 outline-rose-600/30"
                    >
                      x3
                    </motion.div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* CTA inferior en estilo Letrero Grueso de Madera */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 30 }}
            whileInView={{ opacity: 1, scale: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ type: "spring", stiffness: 100 }}
            className="mx-auto mt-32 mb-16 max-w-2xl rounded-2xl border-[12px] border-[#29140a] bg-[#915c32] p-4 text-center shadow-[0_30px_50px_rgba(0,0,0,0.8),inset_0_4px_15px_rgba(255,255,255,0.2)]"
            style={{ 
              backgroundImage: `repeating-linear-gradient(0deg, rgba(82,47,27,0.4), rgba(99,57,32,0.4) 10px, transparent 10px, transparent 20px)` 
            }}
          >
            <div className="rounded-xl border-[4px] border-[#381c0c] bg-[#1a0b05] px-6 py-10 shadow-[inset_0_15px_30px_rgba(0,0,0,0.7)] sm:px-10">
              <h3 className="font-heading text-4xl font-black uppercase tracking-wide text-amber-500 drop-shadow-[0_2px_2px_#000]">
                ¿Listo para la ronda?
              </h3>
              <p className="mx-auto mt-4 mb-10 max-w-lg font-body text-xl font-bold text-amber-100/90 drop-shadow-md">
                Reparte las cartas, haz tus combos y gana la partida.
              </p>
              <div className="grid gap-5 sm:grid-cols-2">
                <Button
                  className="h-16 rounded-xl border-b-[6px] border-rose-950 bg-rose-600 font-heading text-xl font-black uppercase tracking-widest text-white shadow-[0_8px_15px_rgba(0,0,0,0.6),inset_0_2px_4px_rgba(255,255,255,0.4)] transition-all hover:-translate-y-1 hover:bg-rose-500 hover:shadow-[0_12px_20px_rgba(0,0,0,0.7)] active:translate-y-1 active:border-b-[0px] active:mt-1.5 focus-visible:ring-rose-500"
                  onClick={handleCreate}
                >
                  Crear sala
                </Button>
                <Button
                  className="h-16 rounded-xl border-b-[6px] border-[#2e2671] bg-indigo-600 font-heading text-xl font-black uppercase tracking-widest text-white shadow-[0_8px_15px_rgba(0,0,0,0.6),inset_0_2px_4px_rgba(255,255,255,0.4)] transition-all hover:-translate-y-1 hover:bg-indigo-500 hover:shadow-[0_12px_20px_rgba(0,0,0,0.7)] active:translate-y-1 active:border-b-[0px] active:mt-1.5 focus-visible:ring-indigo-500"
                  style={{ backgroundColor: "#4f46e5", borderColor: "#312e81" }}
                  onClick={handleJoin}
                >
                  Unirse
                </Button>
              </div>
            </div>
          </motion.div>

        </div>
      </section>

      <CreateRoomModal open={createOpen} onOpenChange={setCreateOpen} />
      <JoinRoomModal open={joinOpen} onOpenChange={setJoinOpen} initialRoomCode={joinCodeParam} />
    </main>
  );
}
