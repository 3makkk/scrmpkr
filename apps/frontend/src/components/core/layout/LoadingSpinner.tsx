import Card from "../../poker/shared/Card";

export default function LoadingSpinner({
  message = "Loading...",
}: {
  readonly message?: string;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Card className="text-center">
        <div className="animate-pulse">
          <div className="w-10 h-10 border-3 border-gray-700 border-t-blue-500 rounded-full animate-spin mx-auto mb-6"></div>
          <div className="text-white text-lg font-medium">{message}</div>
        </div>
      </Card>
    </div>
  );
}
