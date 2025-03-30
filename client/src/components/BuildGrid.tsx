import BuildCard from "./BuildCard";
import type { SelectBuild } from "@db/schema";

interface BuildGridProps {
  builds: SelectBuild[];
}

export default function BuildGrid({ builds }: BuildGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {builds.map(build => (
        <BuildCard key={build.id} build={build} />
      ))}
    </div>
  );
}
