import Card from "./Card";

export default function LoadingSpinner({
  message = "Loading...",
}: {
  message?: string;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Card className="text-center">
        <div className="animate-pulse">
          <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-white text-lg font-light">{message}</div>
        </div>
      </Card>
    </div>
  );
}
