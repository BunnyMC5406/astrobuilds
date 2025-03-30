import { useQuery } from "@tanstack/react-query";
import { motion, Variants } from "framer-motion";
import StarField from "@/components/StarField";
import BuildGrid from "@/components/BuildGrid";
import BuildCarousel from "@/components/BuildCarousel";
import Footer from "@/components/Footer";
import type { SelectBuild } from "@db/schema";

export default function Home() {
  const { data: builds = [], isLoading } = useQuery<SelectBuild[]>({
    queryKey: ['/api/builds'],
  });

  const titleText = "Astro Builds";

  const letterVariants: Variants = {
    initial: { 
      opacity: 0, 
      y: 50,
      scale: 0.5
    },
    animate: {
      opacity: [0, 1, 1, 1, 1, 1],
      y: [50, 0, 0, 0, -20, 0],
      scale: [0.5, 1, 1.2, 1, 1.2, 1],
      rotateX: [0, 0, -180, 0, 0, 0],
      rotateY: [0, 0, 0, 360, 0, 0],
      transition: {
        duration: 4,
        times: [0, 0.2, 0.4, 0.6, 0.8, 1],
        ease: "easeInOut"
      }
    }
  };

  const subtitleVariants: Variants = {
    initial: {
      opacity: 0,
      y: 20,
    },
    animate: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 1,
        delay: 4,
        ease: "easeOut"
      }
    }
  };

  return (
    <div className="min-h-screen bg-background relative">
      <StarField />

      <style>{`
        :root {
          --viewport-scale: min(1, max(0.5, calc(100vw / 1920)));
          --animation-y-offset: calc(50px * var(--viewport-scale));
          --animation-bounce: calc(-20px * var(--viewport-scale));
          --animation-duration: calc(4s * var(--viewport-scale));
          --stagger-delay: calc(0.1s * var(--viewport-scale));
        }
      `}</style>

      <main className="container mx-auto px-4 pt-8 pb-16 relative z-10 sm:pt-16">
        <div className="text-center mb-8 sm:mb-16">
          <div className="perspective-[1000px] inline-flex flex-wrap justify-center gap-x-[0.1em] px-2">
            {titleText.split("").map((letter, index) => (
              <motion.span
                key={index}
                variants={letterVariants}
                initial="initial"
                animate="animate"
                transition={{
                  delay: index * 0.1,
                }}
                style={{ 
                  display: 'inline-block',
                  fontSize: 'clamp(2rem, 8vw, 4rem)',
                  fontWeight: 'bold',
                  background: 'linear-gradient(to right, #a78bfa, #ec4899)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  perspective: 'min(1000px, 60vw)',
                  transformStyle: 'preserve-3d',
                }}
              >
                {letter === " " ? "\u00A0" : letter}
              </motion.span>
            ))}
          </div>
          <motion.p 
            className="text-base sm:text-lg text-muted-foreground mt-4 px-4"
            variants={subtitleVariants}
            initial="initial"
            animate="animate"
          >
            Our build showcase. Discover builds for your Minecraft server!
          </motion.p>
        </div>

        {isLoading ? (
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
          </div>
        ) : (
          <>
            <div className="mb-8 sm:mb-16">
              <BuildCarousel builds={builds} />
            </div>
            <div className="mt-8 sm:mt-16">
              <h2 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-8 text-center">All Builds</h2>
              <BuildGrid builds={builds} />
            </div>
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}