import { Spinner } from "@/app/components/ui/spinner";

export default function DefaultComponent({ message }: { message: string }) {
    return (
        <div className="flex items-center space-x-2">
            <Spinner size="md" />
            <p>{message}</p>
        </div>
    );
}