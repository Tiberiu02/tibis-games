import { Suspense } from "react";
import AirHokey from "~/components/AirHockey";

export default async function HomePage() {
  return (
    <Suspense>
      <AirHokey />
    </Suspense>
  );
}
