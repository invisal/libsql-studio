export default function ErrorMessage({ message }: { message: string }) {
  return <div className="text-xs text-red-500">{message}</div>;
}
