import { useQuery } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import StarField from "@/components/StarField";
import ReviewForm from "@/components/ReviewForm";
import Reviews from "@/components/Reviews";
import ShareButtons from "@/components/ShareButtons";
import TouchImageViewer from "@/components/TouchImageViewer";
import type { SelectBuild } from "@db/schema";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/hooks/use-user";

export default function BuildDetails() {
  const [, params] = useRoute("/build/:id");
  const id = params?.id;
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useUser();

  // Update share URL to use the new domain
  const shareUrl = `https://astrobuilds.shop/build/${id}`;

  const { data: build, isLoading } = useQuery<SelectBuild>({
    queryKey: [`/api/builds/${id}`],
    enabled: !!id
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="rounded-full h-32 w-32 border-b-2 border-primary"
        />
      </div>
    );
  }

  if (!build) {
    return <div>Build not found</div>;
  }

  const formattedPrice = (build.price / 100).toFixed(2);

  const handlePurchaseClick = () => {
    if (!user) {
      setLocation('/auth');
      return;
    }

    toast({
      title: "Discord Server Opening",
      description: "Please join our Discord server and open a ticket to complete your purchase.",
    });

    setTimeout(() => {
      window.open('https://discord.gg/FnvKkBqveE', '_blank');
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-background relative">
      <StarField />

      <main className="container mx-auto px-4 py-6 md:py-12 relative z-10">
        <Button
          variant="ghost"
          onClick={() => setLocation('/')}
          className="mb-4 hover:bg-background/80"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Home
        </Button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-3xl mx-auto"
        >
          <Card className="mb-6 md:mb-8 rounded-xl overflow-hidden">
            <div className="aspect-video relative w-full mx-auto overflow-hidden rounded-t-xl">
              <TouchImageViewer src={build.image} alt={build.name} />
            </div>
            <CardContent className="p-4 md:p-6">
              <div className="flex flex-col gap-4">
                <div className="space-y-2">
                  <motion.h1
                    className="text-2xl md:text-3xl font-bold"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    {build.name}
                  </motion.h1>
                  <motion.div
                    className="text-xl md:text-2xl font-bold text-primary"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    ${formattedPrice}
                  </motion.div>
                </div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="space-y-4"
                >
                  <p className="text-muted-foreground">
                    {build.description}
                  </p>
                  <div className="flex flex-wrap gap-4 items-center">
                    <ShareButtons
                      url={shareUrl}
                      title={`Check out this amazing Minecraft build: ${build.name}`}
                      description={build.description}
                    />
                  </div>
                </motion.div>

                <motion.div
                  whileTap={{ scale: 0.95 }}
                  className="mt-4"
                >
                  <Button
                    size="lg"
                    className="w-full"
                    onClick={handlePurchaseClick}
                  >
                    {user ? "Contact to Purchase" : "Sign in to Purchase"}
                  </Button>
                </motion.div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          className="w-full max-w-3xl mx-auto space-y-4 md:space-y-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Reviews buildId={build.id} />
          <ReviewForm buildId={build.id} />
        </motion.div>
      </main>
    </div>
  );
}