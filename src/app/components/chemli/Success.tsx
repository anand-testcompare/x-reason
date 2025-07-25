interface SuccessProps {
    message?: string;
}

export default function Success({ message }: SuccessProps) {
    return (<div className="space-y-4">
        <h1 className="text-2xl font-bold text-primary">Process Complete</h1>
        <p>{message || "TODO add logs"}</p>
    </div>)
}