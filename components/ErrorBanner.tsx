export default function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="bg-red-950 border border-red-800 text-red-300 rounded-lg px-4 py-3 text-[13px] mb-4">
      {message}
    </div>
  );
}
