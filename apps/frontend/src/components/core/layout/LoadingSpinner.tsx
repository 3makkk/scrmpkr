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
          <div className="border-line border-t-fg mx-auto mb-6 h-10 w-10 animate-spin rounded-full border-3"></div>
          <div className="text-fg text-lg font-medium">{message}</div>
        </div>
      </Card>
    </div>
  );
}
