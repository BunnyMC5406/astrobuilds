import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import type { SelectBuild } from "@db/schema";

interface BuildCardProps {
  build: SelectBuild;
}

export default function BuildCard({ build }: BuildCardProps) {
  // Format price from cents to dollars
  const formattedPrice = (build.price / 100).toFixed(2);

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
      <div className="aspect-video relative">
        <img 
          src={build.image} 
          alt={build.name}
          className="absolute inset-0 w-full h-full object-cover"
        />
      </div>
      <CardContent className="p-4">
        <h3 className="text-xl font-bold mb-2">{build.name}</h3>
        <p className="text-muted-foreground line-clamp-2">{build.description}</p>
      </CardContent>
      <CardFooter className="p-4 pt-0 flex justify-between items-center">
        <span className="text-lg font-bold text-primary">${formattedPrice}</span>
        <Link href={`/build/${build.id}`}>
          <Button variant="outline">View Details</Button>
        </Link>
      </CardFooter>
    </Card>
  );
}