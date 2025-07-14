import Link from 'next/link';

export default function LandingPage() {
  return (
    <div
      className="relative min-h-screen w-full flex items-center justify-center text-center bg-cover bg-center overflow-auto"
      style={{ backgroundImage: "url('/nature-bg.jpeg')" }}
    >
      <div className="absolute inset-0 bg-black opacity-50"></div>
      <div className="relative z-10">
        <h1 className="text-5xl md:text-7xl font-bold text-white mb-4">Welcome to CarbonGuard</h1>
        <p className="text-lg md:text-xl text-white mb-8">Your partner in navigating the complexities of carbon compliance.</p>
        <Link href="/dashboard">
          <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg text-lg transition duration-300 cursor-pointer">
            Get Started
          </button>
        </Link>
      </div>
    </div>
  );
}