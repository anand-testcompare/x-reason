import { MouseEventHandler } from "react";

interface ErrorProps {
    onClick?: MouseEventHandler<HTMLButtonElement>;
    message?: string;
}

export default function Error({ onClick, message }: ErrorProps) {
    return(
        <div className="p-4 border border-red-300 bg-red-50 rounded-md">
            <h2 className="text-lg font-semibold text-red-800 mb-2">Error</h2>
            {message && <p className="text-red-700 mb-3">{message}</p>}
            {onClick && (
                <button 
                    onClick={onClick}
                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                >
                    Retry
                </button>
            )}
        </div>
    );
}