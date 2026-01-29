import Card from "../../poker/shared/Card";

export default function LoadingSpinner({
  message = "Loading...",
}: {
  readonly message?: string;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Card className="text-center">
        <div className="animate-pulse">
          <div className="mx-auto mb-6 h-10 w-10 animate-spin rounded-full border-3 border-gray-700 border-t-blue-500"></div>
          <div className="font-medium text-lg text-white">{message}</div>
        </div>
      </Card>
    </div>
  );
}
