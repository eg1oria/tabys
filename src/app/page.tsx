import { Hero } from "@/components/home/hero";
import { FeatureStrip } from "@/components/home/feature-strip";
import { EquipmentGrid } from "@/components/home/equipment-grid";
import { TzBlock } from "@/components/home/tz-block";
import { Solutions } from "@/components/home/solutions";
import { Lines } from "@/components/home/lines";
import { Projects } from "@/components/home/projects";
import { Seals } from "@/components/home/seals";
import { WhyUs } from "@/components/home/why-us";
import { CtaBand } from "@/components/home/cta-band";

export default function HomePage() {
  return (
    <>
      <Hero />
      <FeatureStrip />
      <EquipmentGrid />
      <TzBlock />
      <Solutions />
      <Lines />
      <Projects />
      <Seals />
      <WhyUs />
      <CtaBand />
    </>
  );
}
