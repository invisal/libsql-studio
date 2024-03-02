export default function CodePreview({ code }: { code: string }) {
  return (
    <code className="p-2 bg-gray-200 dark:bg-gray-900 block overflow-x-auto w-full text-sm">
      <pre>{code}</pre>
    </code>
  );
}
