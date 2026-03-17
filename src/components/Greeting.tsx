"use client";

import { useEffect, useState } from "react";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 14) return "Buenos días";
  if (hour >= 14 && hour < 21) return "Buenas tardes";
  return "Buenas noches";
}

export function Greeting({ name }: { name: string }) {
  const [greeting, setGreeting] = useState("Hola");

  useEffect(() => {
    setGreeting(getGreeting());
  }, []);

  return (
    <h2 className="text-3xl md:text-4xl font-headline font-extrabold text-on-surface tracking-tight">
      {greeting}, {name}
    </h2>
  );
}
