import { useState, useEffect, useCallback } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Gamepad2 } from "lucide-react";
import type { SelectBuild } from "@db/schema";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";

interface BuildCarouselProps {
  builds: SelectBuild[];
}

export default function BuildCarousel({ builds }: BuildCarouselProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ 
    loop: true,
  });

  const [currentIndex, setCurrentIndex] = useState(0);

  // Navigation controls
  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  // Auto-scroll functionality
  useEffect(() => {
    if (!emblaApi) return;

    emblaApi.on('select', () => {
      setCurrentIndex(emblaApi.selectedScrollSnap());
    });

    const autoplay = setInterval(() => {
      if (!document.hidden) {
        emblaApi.scrollNext();
      }
    }, 5000); // Auto-scroll every 5 seconds

    return () => {
      clearInterval(autoplay);
      emblaApi.off('select');
    };
  }, [emblaApi]);

  if (builds.length === 0) {
    return (
      <div className="w-full h-[500px] bg-black/20 backdrop-blur-sm rounded-xl border border-border/50 flex items-center justify-center">
        <p className="text-muted-foreground">No builds available</p>
      </div>
    );
  }

  return (
    <div className="relative w-full max-w-7xl mx-auto px-4">
      <div className="overflow-hidden rounded-xl bg-black/20 backdrop-blur-sm border border-border/50" ref={emblaRef}>
        <div className="flex">
          {builds.map((build, index) => (
            <div
              key={build.id}
              className="flex-[0_0_100%] min-w-0 relative"
              style={{ opacity: index === currentIndex ? 1 : 0.3 }}
            >
              <div className="relative aspect-[21/9]">
                <img
                  src={build.image}
                  alt={build.name}
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />

                <div className="absolute inset-x-0 bottom-0 p-8">
                  <div className="max-w-4xl mx-auto">
                    <div className="flex flex-wrap items-center gap-3 mb-4">
                      <Badge variant="secondary" className="bg-primary/20 text-primary-foreground">
                        Featured Build
                      </Badge>
                      <Badge variant="outline" className="border-primary/30">
                        <Gamepad2 className="w-3 h-3 mr-1" />
                        {new Date(build.createdAt).toLocaleDateString()}
                      </Badge>
                    </div>

                    <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
                      {build.name}
                    </h2>

                    <p className="text-white/90 mb-6 line-clamp-2 text-base lg:text-lg max-w-3xl">
                      {build.description}
                    </p>

                    <div className="flex items-center justify-between flex-wrap gap-4">
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl lg:text-3xl font-bold text-primary">
                          ${(build.price / 100).toFixed(2)}
                        </span>
                        <span className="text-white/60">One-time purchase</span>
                      </div>

                      <Link href={`/build/${build.id}`}>
                        <Button 
                          size="lg"
                          className="bg-primary hover:bg-primary/90 text-primary-foreground"
                        >
                          View Details
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Button
        variant="outline"
        size="icon"
        className="absolute left-8 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background/90 backdrop-blur-sm transition-all duration-200"
        onClick={scrollPrev}
      >
        <ChevronLeft className="h-6 w-6" />
      </Button>

      <Button
        variant="outline"
        size="icon"
        className="absolute right-8 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background/90 backdrop-blur-sm transition-all duration-200"
        onClick={scrollNext}
      >
        <ChevronRight className="h-6 w-6" />
      </Button>

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
        {builds.map((_, index) => (
          <button
            key={index}
            className={`w-2 h-2 rounded-full transition-all duration-200 ${
              index === currentIndex
                ? "bg-primary"
                : "bg-primary/20 hover:bg-primary/30"
            }`}
            onClick={() => emblaApi?.scrollTo(index)}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}