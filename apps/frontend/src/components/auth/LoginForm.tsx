import UsernameForm from "./UsernameForm";
import Card from "../ds/Card/Card";

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
  secondaryButton = null,
}: Props) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <Card className="max-w-md w-full text-center">
        <div className="mb-12">
          <h1 className="text-4xl font-light text-white mb-4">{title}</h1>
          <p className="text-gray-400 text-lg">{subtitle}</p>
        </div>

        <div className="space-y-8">
          <UsernameForm onSubmit={onLogin} submitText={primaryButtonText} />
        </div>
      </Card>
    </div>
  );
}
