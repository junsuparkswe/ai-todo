import { ModeToggle } from "@/components/mode-toggle";

export default function Home() {
  return (
    <div className="w-full min-h-screen flex flex-col items-center justify-center gap-2">
      <p>Hello world</p>
      <ModeToggle />
    </div>
  );
}
