import Card from "../ds/Card/Card";
import UsernameForm from "./UsernameForm";

type Props = {
  readonly title: string;
  readonly subtitle?: string;
  readonly onLogin: (name: string) => void;
  readonly primaryButtonText?: string;
  readonly secondaryButton?: React.ReactNode;
};

export default function LoginForm({
  title,
  subtitle,
  onLogin,
  primaryButtonText = "Enter",
  secondaryButton: _secondaryButton = null,
}: Props) {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-md text-center">
        <div className="mb-12">
          <h1 className="mb-4 text-4xl font-light text-white">{title}</h1>
          <p className="text-lg text-gray-400">{subtitle}</p>
        </div>

        <div className="space-y-8">
          <UsernameForm onSubmit={onLogin} submitText={primaryButtonText} />
        </div>
      </Card>
    </div>
  );
}
